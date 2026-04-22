// flashapp.js - Bulletproof 2026 Version
let flashcards = [];
let currentIndex = 0;
let isListening = false;

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const difficulty = localStorage.getItem('billy_level') || 'NORMAL';
    const dobValue = localStorage.getItem('billy_dob') || '2016-01-01';
    
    if (!apiKey) {
        safeSetText('target-sentence', "ERROR: No API Key");
        return;
    }

    // Verified 2026 Model
    const model = "gemini-3.1-flash-lite-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un Director de Primaria. Genera 20 tarjetas JSON para un alumno nacido en ${dobValue}. 
    Dificultad: ${difficulty}. 
    Formato: [{"es": "frase", "val": "traducción", "cat": "TEMA", "keywords": ["palabra"]}]`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // Clean JSON
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
        }
        
        flashcards = JSON.parse(rawText);
        loadCard();
    } catch (err) {
        safeSetText('target-sentence', "ERROR DE CONEXIÓN");
        console.error(err);
    }
}

function loadCard() {
    if (flashcards.length === 0) return;
    if (currentIndex >= flashcards.length) {
        safeSetText('target-sentence', "¡MISIÓN COMPLETADA!");
        return;
    }
    
    const card = flashcards[currentIndex];
    safeSetText('target-sentence', card.es);
    safeSetText('subject-tag', card.cat);
    safeSetText('val-translation', card.val);
    
    const bar = document.getElementById('energy-bar');
    if (bar) {
        bar.style.width = ((currentIndex / flashcards.length) * 100) + '%';
    }
}

function playAudio() {
    if (!flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceName = localStorage.getItem('billy_voice');
    const selectedVoice = voices.find(v => v.name === savedVoiceName);
    
    if (selectedVoice) msg.voice = selectedVoice;
    msg.rate = parseFloat(localStorage.getItem('billy_rate') || 1.0);
    msg.pitch = parseFloat(localStorage.getItem('billy_pitch') || 1.0);
    msg.lang = 'es-ES';
    window.speechSynthesis.speak(msg);
}

// Simple Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;

    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
        recordBtn.onclick = () => {
            if (!isListening) {
                recognition.start();
                isListening = true;
                recordBtn.style.boxShadow = "0 0 20px red";
            } else {
                recognition.stop();
                isListening = false;
                recordBtn.style.boxShadow = "none";
            }
        };

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const text = result[0].transcript;
            safeSetText('live-transcript', text.toUpperCase());
            
            if (result.isFinal) {
                const card = flashcards[currentIndex];
                const match = card.keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));
                if (match) {
                    currentIndex++;
                    setTimeout(loadCard, 500);
                }
            }
        };

        recognition.onend = () => {
            isListening = false;
            if (recordBtn) recordBtn.style.boxShadow = "none";
        };
    }
}

// Run immediately
fetchJourneyCards();
