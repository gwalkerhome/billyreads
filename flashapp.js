// flashapp.js - Reverted to Verified 2.5 Model
let flashcards = [];
let currentIndex = 0;
let isListening = false;

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const dob = localStorage.getItem('billy_dob') || '2016-01-01';
    const difficulty = localStorage.getItem('billy_level') || 'NORMAL';
    const target = document.getElementById('target-sentence');

    if (!apiKey) {
        if (target) target.innerText = "Error: Falta API Key";
        return;
    }

    // USING GEMINI 2.5 FLASH AS VERIFIED LAST NIGHT
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un profesor de primaria. Genera 20 tarjetas JSON para un alumno nacido en ${dob}.
    Dificultad: ${difficulty}. 
    FORMATO JSON PURO: [{"es": "frase", "val": "traducción", "cat": "TEMA", "keywords": ["palabra"]}]`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // Ensure we only parse the JSON part
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
        }
        
        flashcards = JSON.parse(rawText);
        loadCard();
    } catch (err) {
        console.error(err);
        if (target) target.innerText = "Error de conexión con 2.5";
    }
}

function loadCard() {
    if (!flashcards[currentIndex]) return;
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
    if (!flashcards[currentIndex]) return;
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
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const liveDisplay = document.getElementById('live-transcript');
        if (liveDisplay) liveDisplay.innerText = text.toUpperCase();
        
        if (result.isFinal) {
            const match = flashcards[currentIndex].keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));
            if (match) {
                currentIndex++;
                setTimeout(loadCard, 500);
            }
        }
    };
    const btn = document.getElementById('record-btn');
    if (btn) {
        btn.onclick = () => {
            if (!isListening) { recognition.start(); isListening = true; btn.style.background = "rgba(255,0,0,0.4)"; }
            else { recognition.stop(); isListening = false; btn.style.background = "none"; }
        };
    }
}

fetchJourneyCards();
