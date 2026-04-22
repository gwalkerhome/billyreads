// flashapp.js - Synchronized Version
let flashcards = [];
let currentIndex = 0;
let isListening = false;

function getSchoolYear() {
    const dobValue = localStorage.getItem('billy_dob');
    if (!dobValue) return "4º de Primaria"; 
    const dob = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    const yearLevel = age - 5;
    if (yearLevel < 1) return "1º de Primaria";
    if (yearLevel > 6) return "6º de Primaria";
    return `${yearLevel}º de Primaria`;
}

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const difficulty = localStorage.getItem('billy_level') || 'NORMAL';
    const schoolYear = getSchoolYear();
    
    if (!apiKey) {
        document.getElementById('target-sentence').innerText = "Configura la API Key en Ajustes";
        return;
    }

    const difficultyInstruction = difficulty === 'EXPERTO' 
        ? "Usa vocabulario sofisticado y conceptos científicos detallados." 
        : "Usa un lenguaje claro y adecuado para su edad.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un Director de Primaria en España. Genera 20 tarjetas de aprendizaje para un alumno de ${schoolYear}.
    ${difficultyInstruction}
    USA EL PROTOCOLO 'LEARNING JOURNEY':
    - 70% contenido de ${schoolYear}.
    - 10% contenido 'Ancla' del año anterior.
    - 20% contenido 'Teaser' del año siguiente.
    FORMATO JSON PURO: [{"es": "frase", "val": "traducción", "cat": "TEMA", "keywords": ["palabra"]}]`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) rawText = rawText.substring(start, end + 1);
        
        flashcards = JSON.parse(rawText);
        currentIndex = 0;
        loadCard();
    } catch (err) {
        document.getElementById('target-sentence').innerText = "Error cargando la misión.";
    }
}

function loadCard() {
    if (currentIndex >= flashcards.length) {
        document.getElementById('target-sentence').innerText = "¡MISIÓN COMPLETADA!";
        return;
    }
    const card = flashcards[currentIndex];
    document.getElementById('target-sentence').innerText = card.es;
    document.getElementById('subject-tag').innerText = card.cat;
    document.getElementById('val-translation').innerText = card.val;
    
    const progress = ((currentIndex) / flashcards.length) * 100;
    document.getElementById('energy-bar').style.width = `${progress}%`;
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

// Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.interimResults = true;

const recordBtn = document.getElementById('record-btn');
recordBtn.onclick = () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        recordBtn.style.background = "rgba(255, 0, 0, 0.4)";
    } else {
        recognition.stop();
        isListening = false;
        recordBtn.style.background = "rgba(255, 255, 255, 0.1)";
    }
};

recognition.onresult = (event) => {
    let text = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        text = event.results[i][0].transcript;
        if (event.results[i].isFinal) processResult(text.toLowerCase());
    }
    document.getElementById('live-transcript').innerText = text.toUpperCase();
};

function processResult(spokenText) {
    const card = flashcards[currentIndex];
    const isSuccess = card.keywords.some(k => spokenText.includes(k.toLowerCase()));
    if (isSuccess) {
        currentIndex++;
        setTimeout(loadCard, 1000);
    }
    isListening = false;
    recordBtn.style.background = "rgba(255, 255, 255, 0.1)";
}

if (localStorage.getItem('gemini_key')) fetchJourneyCards();
