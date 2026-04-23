// flashapp.js - Integrated Curriculum & Assessment Engine
let flashcards = [];
let currentIndex = 0;
let isListening = false;

/**
 * Calculates the Spanish school year group based on DOB for 2026 context.
 */
function calculateYearGroup(dobString) {
    const dob = new Date(dobString);
    const now = new Date(); 
    const age = now.getFullYear() - dob.getFullYear();
    let year = age - 5; 
    if (year < 1) year = 1;
    if (year > 6) year = 6;
    return year;
}

/**
 * Assessment Logic: Compares spoken text against target text based on Strictness Level.
 */
function assessSpeech(spoken, target, keywords, strictness) {
    const s = spoken.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    switch (strictness) {
        case '1': // PERMISIVO: Just needs one keyword to pass.
            return keywords.some(k => s.includes(k.toLowerCase()));
        
        case '2': // ESTÁNDAR: "Spaniard would understand" - Keyword + 50% word match.
            const targetWords = t.split(' ');
            const matchedWords = targetWords.filter(word => s.includes(word));
            return matchedWords.length >= (targetWords.length / 2);

        case '3': // PRECISO: Requires 80% accuracy of the full sentence.
            const words3 = t.split(' ');
            const matches3 = words3.filter(word => s.includes(word));
            return matches3.length >= (words3.length * 0.8);

        case '4': // MAESTRÍA: Near-perfect match required.
            return s === t || t.split(' ').every(word => s.includes(word));

        default:
            return keywords.some(k => s.includes(k.toLowerCase()));
    }
}

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const dob = localStorage.getItem('billy_dob') || '2019-01-01';
    const readingLevel = localStorage.getItem('billy_level') || '2'; 
    const targetDisplay = document.getElementById('target-sentence');

    if (!apiKey) {
        if (targetDisplay) targetDisplay.innerText = "Error: Missing API Key";
        return;
    }

    const currentYear = calculateYearGroup(dob);
    const model = "gpt-5.4-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    const difficultyMap = {
        "1": "Tier 1 (Phonetic): Short words, simple S+V+O, max 6 words, no complex clusters (tr, bl).",
        "2": "Tier 2 (Fluency): 8-10 words, basic adjectives and conjunctions.",
        "3": "Tier 3 (Advanced): Compound sentences, technical vocabulary, use of commas.",
        "4": "Tier 4 (Expert): Full academic language, sophisticated syntax, precise terminology."
    };
    
    const selectedDifficulty = difficultyMap[readingLevel] || difficultyMap["2"];

    const prompt = `Act as a Primary School Encyclopedia for students in Spain.
    YOUR OBJECTIVE: Generate 20 JSON objects containing REAL ACADEMIC FACTS from the Spanish school curriculum.
    
    CONTENT DISTRIBUTION:
    - 70%: Year ${currentYear} of Primaria.
    - 10%: Year ${currentYear + 1 > 6 ? 6 : currentYear + 1} of Primaria.
    - 20%: Years 1 to ${currentYear > 1 ? currentYear - 1 : 1}.

    READING DIFFICULTY: ${selectedDifficulty}
    
    CRITICAL RULES:
    1. OUTPUT LANGUAGE: Content must be in Spanish/Valencian.
    2. FACTUAL ONLY: No classroom descriptions or "Teacher talk".
    3. JSON FORMAT: [{"es": "Fact", "val": "Translation", "cat": "SUBJECT", "keywords": ["key"]}]`;

    if (targetDisplay) targetDisplay.innerText = "Syncing Curriculum...";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ 
                model: model,
                messages: [
                    { role: "system", content: "You are an expert in the Spanish Primary curriculum. Output JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        let rawText = data.choices[0].message.content;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        rawText = rawText.substring(start, end + 1);
        
        flashcards = JSON.parse(rawText);
        displayCurrentCard();

    } catch (err) {
        console.error(err);
        if (targetDisplay) targetDisplay.innerText = "Connection Error.";
    }
}

function displayCurrentCard() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    
    document.getElementById('target-sentence').innerText = card.es;
    document.getElementById('subject-tag').innerText = card.cat.toUpperCase();
    document.getElementById('val-translation').innerText = card.val;
    document.getElementById('energy-bar').style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

function playSpeech() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name === localStorage.getItem('billy_voice'));
    utterance.rate = parseFloat(localStorage.getItem('billy_rate') || 1.0);
    utterance.pitch = parseFloat(localStorage.getItem('billy_pitch') || 1.0);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const spokenText = result[0].transcript;
        const liveDisplay = document.getElementById('live-transcript');
        if (liveDisplay) liveDisplay.innerText = spokenText.toUpperCase();
        
        if (result.isFinal && flashcards[currentIndex]) {
            const currentStrictness = localStorage.getItem('billy_strictness') || '2';
            const isPass = assessSpeech(
                spokenText, 
                flashcards[currentIndex].es, 
                flashcards[currentIndex].keywords, 
                currentStrictness
            );

            if (isPass) {
                currentIndex++;
                if (currentIndex < flashcards.length) {
                    setTimeout(displayCurrentCard, 500);
                } else {
                    if (liveDisplay) liveDisplay.innerText = "MISSION COMPLETE!";
                }
            }
        }
    };

    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
        recordBtn.onclick = () => {
            if (!isListening) { 
                recognition.start(); 
                isListening = true; 
                recordBtn.style.background = "rgba(255,0,0,0.4)"; 
            } else { 
                recognition.stop(); 
                isListening = false; 
                recordBtn.style.background = "none"; 
            }
        };
    }
}

fetchJourneyCards();
