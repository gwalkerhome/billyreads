// flashapp.js - Transitioned to OpenAI GPT-5.4-mini
let flashcards = [];
let currentIndex = 0;
let isListening = false;

async function fetchJourneyCards() {
    // Variable Sync: Pulling from 'gemini_key' as saved in Command Center
    const apiKey = localStorage.getItem('gemini_key');
    const dob = localStorage.getItem('billy_dob') || '2016-01-01';
    const difficulty = localStorage.getItem('billy_level') || 'NORMAL';
    const target = document.getElementById('target-sentence');

    if (!apiKey) {
        if (target) target.innerText = "Error: Falta API Key";
        return;
    }

    // UPDATED: Using GPT-5.4-mini for the best balance of speed and cost
    const model = "gpt-5.4-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    const prompt = `Actúa como un profesor de primaria. Genera 20 tarjetas JSON para un alumno nacido en ${dob}.
    Dificultad: ${difficulty}. 
    FORMATO JSON PURO: [{"es": "frase", "val": "traducción", "cat": "TEMA", "keywords": ["palabra"]}]`;

    if (target) target.innerText = "Cargando misión...";

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
                    { role: "system", content: "Eres un experto profesor de primaria que solo responde en JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error ? data.error.message : "Error desconocido");
        }

        let rawText = data.choices[0].message.content;
        
        // Clean the text to ensure only JSON is parsed
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
        }
        
        flashcards = JSON.parse(rawText);
        loadCard();

    } catch (err) {
        console.error("Fetch Error:", err);
        if (target) target.innerText = "Error: OpenAI no pudo cargar.";
    }
}

function loadCard() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    
    const sentenceEl = document.getElementById('target-sentence');
    const tagEl = document.getElementById('subject-tag');
    const transEl = document.getElementById('val-translation');
    const bar = document.getElementById('energy-bar');

    if (sentenceEl) sentenceEl.innerText = card.es;
    if (tagEl) tagEl.innerText = card.cat;
    if (transEl) transEl.innerText = card.val;
    if (bar) bar.style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

function playAudio() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    const savedVoice = localStorage.getItem('billy_voice');
    msg.voice = window.speechSynthesis.getVoices().find(v => v.name === savedVoice);
    msg.rate = parseFloat(localStorage.getItem('billy_rate') || 1.0);
    msg.pitch = parseFloat(localStorage.getItem('billy_pitch') || 1.0);
    msg.lang = 'es-ES';
    window.speechSynthesis.speak(msg);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const liveDisplay = document.getElementById('live-transcript');
        if (liveDisplay) liveDisplay.innerText = text.toUpperCase();
        
        if (result.isFinal && flashcards[currentIndex]) {
            const match = flashcards[currentIndex].keywords.some(k => 
                text.toLowerCase().includes(k.toLowerCase())
            );
            if (match) {
                currentIndex++;
                if (currentIndex < flashcards.length) {
                    setTimeout(loadCard, 500);
                } else {
                    if (liveDisplay) liveDisplay.innerText = "¡MISIÓN COMPLETADA!";
                }
            }
        }
    };

    const btn = document.getElementById('record-btn');
    if (btn) {
        btn.onclick = () => {
            if (!isListening) { 
                recognition.start(); 
                isListening = true; 
                btn.style.background = "rgba(255,0,0,0.4)"; 
            } else { 
                recognition.stop(); 
                isListening = false; 
                btn.style.background = "none"; 
            }
        };
    }
}

// Start the sequence
fetchJourneyCards();
