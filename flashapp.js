// flashapp.js - Gemini Learning Journey Engine
let flashcards = [];
let currentIndex = 0;
let isListening = false;

// 1. CALCULATE ACADEMIC CONTEXT
function getSchoolYear() {
    const dob = new Date(localStorage.getItem('billy_dob'));
    if (isNaN(dob)) return "4º de Primaria"; // Fallback
    const age = new Date().getFullYear() - dob.getFullYear();
    // Spanish system: age 8 = 3º, age 9 = 4º, etc.
    const year = age - 5; 
    return `${year}º de Primaria en España`;
}

// 2. FETCH FROM GEMINI
async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const schoolYear = getSchoolYear();
    
    const prompt = `Act as a Primary School Director. Generate 20 learning flashcards for a student in ${schoolYear}.
    FOLLOW THE LEARNING JOURNEY PROTOCOL:
    - 70% content from ${schoolYear} curriculum (Science, History, Geography, Math).
    - 10% 'Anchor' content from the previous year (Review).
    - 20% 'Teaser' content from the next year group (Advanced preview).
    
    OUTPUT ONLY a JSON array of objects:
    [{"es": "sentence in spanish", "val": "translation in valenciano", "cat": "SUBJECT", "keywords": ["key1", "key2"]}]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        // Clean JSON formatting if Gemini adds markdown blocks
        const cleanJson = text.replace(/```json|```/g, '');
        flashcards = JSON.parse(cleanJson);
        loadCard();
    } catch (err) {
        console.error("Gemini Error:", err);
        document.getElementById('target-sentence').innerText = "Error al conectar con la base de datos.";
    }
}

// 3. CORE LOGIC
const recordBtn = document.getElementById('record-btn');
const transcriptDisplay = document.getElementById('live-transcript');
const energyBar = document.getElementById('energy-bar');

function loadCard() {
    if (currentIndex >= flashcards.length) {
        document.getElementById('target-sentence').innerText = "¡Misión completada!";
        return;
    }
    const card = flashcards[currentIndex];
    document.getElementById('target-sentence').innerText = card.es;
    document.getElementById('subject-tag').innerText = card.cat;
    document.getElementById('val-translation').innerText = card.val;
    transcriptDisplay.innerText = "ESPERANDO SEÑAL...";
    energyBar.style.width = `${((currentIndex) / flashcards.length) * 100}%`;
}

function playAudio() {
    window.speechSynthesis.cancel();
    const card = flashcards[currentIndex];
    const msg = new SpeechSynthesisUtterance(card.es);
    msg.voice = window.speechSynthesis.getVoices().find(v => v.name === localStorage.getItem('preferred_voice'));
    msg.pitch = parseFloat(localStorage.getItem('speech_pitch') || 1.0);
    msg.rate = parseFloat(localStorage.getItem('speech_rate') || 0.9);
    window.speechSynthesis.speak(msg);
}

// Initialize
if (localStorage.getItem('gemini_key')) {
    fetchJourneyCards();
} else {
    alert("Por favor, introduce la API Key en Configuración.");
}

// ... Speech recognition logic remains the same (recognition.onresult calls processResult) ...

function processResult(spokenText) {
    const card = flashcards[currentIndex];
    const isSuccess = card.keywords.some(k => spokenText.toLowerCase().includes(k.toLowerCase()));

    if (isSuccess) {
        transcriptDisplay.style.color = "#4ADE80";
        energyBar.style.width = `${((currentIndex + 1) / flashcards.length) * 100}%`;
        currentIndex++;
        setTimeout(loadCard, 2000);
    } else {
        transcriptDisplay.style.color = "#F87171";
    }
}
