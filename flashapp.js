// flashapp.js - Final Verified Version
let flashcards = [];
let currentIndex = 0;
let isListening = false;

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const dob = localStorage.getItem('billy_dob') || '2016-01-01';
    const difficulty = localStorage.getItem('billy_level') || 'NORMAL';
    const target = document.getElementById('target-sentence');

    if (!apiKey) {
        if (target) target.innerText = "Check Settings: No API Key";
        return;
    }

    // VERIFIED MODEL FROM YOUR DISCOVERY TEST
    const model = "gemini-3.1-flash-lite-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un Director de Primaria. Genera 20 tarjetas JSON para un alumno nacido en ${dob}.
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
        
        // Clean potential AI chatter
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
        }
        
        flashcards = JSON.parse(rawText);
        loadCard();
    } catch (err) {
        console.error("Critical Failure:", err);
        if (target) target.innerText = "Error: Misión fallida";
    }
}

function loadCard() {
    if (!flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    
    document.getElementById('target-sentence').innerText = card.es;
    document.getElementById('subject-tag').innerText = card.cat;
    document.getElementById('val-translation').innerText = card.val;
    
    const bar = document.getElementById('energy-bar');
    if (bar) bar.style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

function playAudio() {
    if (!flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    msg.voice = window.speechSynthesis.getVoices().find(v => v.name === localStorage.getItem('billy_voice'));
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
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
        document.getElementById('live-transcript').innerText = text.toUpperCase();
        if (event.results[event.results.length - 1].isFinal) {
            if (flashcards[currentIndex].keywords.some(k => text.includes(k.toLowerCase()))) {
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
