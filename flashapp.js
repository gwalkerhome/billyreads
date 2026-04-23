// flashapp.js - English logic for Spanish Curriculum Reading Engine
let flashcards = [];
let currentIndex = 0;
let isListening = false;

/**
 * Calculates the student's school year in the Spanish system for 2026.
 * Age 6 = Year 1, Age 11 = Year 6.
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

    // Mapping UI tiers to specific linguistic constraints for the AI
    const difficultyMap = {
        "1": "Tier 1 (Phonetic): Short words, simple Subject+Verb+Object phrases, max 6 words, no complex clusters like 'tr' or 'bl'.",
        "2": "Tier 2 (Fluency): Sentences of 8-10 words, basic adjectives and conjunctions included.",
        "3": "Tier 3 (Advanced): Compound sentences, technical curriculum vocabulary, use of commas.",
        "4": "Tier 4 (Expert): Full academic language, sophisticated syntax, precise professional terminology."
    };
    
    const selectedDifficulty = difficultyMap[readingLevel] || difficultyMap["2"];

    // Prompt logic in English, instructing Spanish output
    const prompt = `Act as a Primary School Encyclopedia for students in Spain.
    YOUR OBJECTIVE: Generate 20 JSON objects containing REAL ACADEMIC FACTS from the Spanish school curriculum.
    
    CONTENT DISTRIBUTION:
    - 70%: Facts from Year ${currentYear} of Primary (Primaria).
    - 10%: Facts from Year ${currentYear + 1 > 6 ? 6 : currentYear + 1} of Primary.
    - 20%: Review facts from Years 1 to ${currentYear > 1 ? currentYear - 1 : 1}.

    READING DIFFICULTY (Syntax Constraint): ${selectedDifficulty}
    
    CRITICAL RULES:
    1. OUTPUT LANGUAGE: All content ('es', 'val', 'cat') MUST be in Spanish/Valenciano.
    2. FACTUAL ONLY: Do not use classroom descriptions (e.g., Avoid "Students learn...", "We observe...").
    3. DIRECT STATEMENTS: Only provide direct facts (e.g., "The Earth has a satellite called the Moon").
    4. NO QUESTIONS: Provide statements only.
    5. 'cat' field must be the Subject Title in Spanish (e.g., CIENCIAS, MATEMÁTICAS, HISTORIA).
    
    JSON FORMAT: [{"es": "Direct Spanish fact", "val": "Valencian translation", "cat": "SUBJECT", "keywords": ["keyword"]}]`;

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
                    { role: "system", content: "You are an expert in the Spanish Primary School curriculum. You only respond in valid, pure JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "API Error");

        let rawText = data.choices[0].message.content;
        const startBracket = rawText.indexOf('[');
        const endBracket = rawText.lastIndexOf(']');
        if (startBracket !== -1 && endBracket !== -1) {
            rawText = rawText.substring(startBracket, endBracket + 1);
        }
        
        flashcards = JSON.parse(rawText);
        displayCurrentCard();

    } catch (err) {
        console.error("Fetch Error:", err);
        if (targetDisplay) targetDisplay.innerText = "Connection Error with Mission.";
    }
}

function displayCurrentCard() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    
    const sentenceEl = document.getElementById('target-sentence');
    const subjectEl = document.getElementById('subject-tag');
    const translationEl = document.getElementById('val-translation');
    const progressBar = document.getElementById('energy-bar');

    if (sentenceEl) sentenceEl.innerText = card.es;
    if (subjectEl) subjectEl.innerText = card.cat.toUpperCase();
    if (translationEl) translationEl.innerText = card.val;
    if (progressBar) progressBar.style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

function playSpeech() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    const savedVoice = localStorage.getItem('billy_voice');
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name === savedVoice);
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
            const isMatch = flashcards[currentIndex].keywords.some(k => 
                spokenText.toLowerCase().includes(k.toLowerCase())
            );
            if (isMatch) {
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

// Initial Call
fetchJourneyCards();
