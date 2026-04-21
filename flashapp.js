// flashapp.js - Complete Gemini Learning Journey Engine
let flashcards = [];
let currentIndex = 0;
let isListening = false;

// 1. ACADEMIC CONTEXT LOGIC
function getSchoolYear() {
    const dobValue = localStorage.getItem('billy_dob');
    if (!dobValue) return "4º de Primaria"; 
    
    const dob = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    // Spanish Primary System approximation:
    // Age 6=1º, 7=2º, 8=3º, 9=4º, 10=5º, 11=6º
    const yearLevel = age - 5;
    if (yearLevel < 1) return "1º de Primaria";
    if (yearLevel > 6) return "6º de Primaria";
    return `${yearLevel}º de Primaria`;
}

// 2. GEMINI API INTEGRATION
async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    if (!apiKey) {
        document.getElementById('target-sentence').innerText = "Configura la API Key en Ajustes";
        return;
    }

    const schoolYear = getSchoolYear();
    const prompt = `Actúa como un Director de Primaria en España. Genera 20 tarjetas de aprendizaje para un alumno de ${schoolYear}.
    USA EL PROTOCOLO 'LEARNING JOURNEY':
    - 70% contenido de ${schoolYear} (Ciencias, Historia, Geografía).
    - 10% contenido 'Ancla' del año anterior (Repaso).
    - 20% contenido 'Teaser' del año siguiente (Avanzado).
    
    DEVUELVE ÚNICAMENTE un array JSON puro (sin markdown) con este formato:
    [{"es": "frase en español", "val": "traducción valenciano", "cat": "TEMA", "keywords": ["palabra1", "palabra2"]}]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        
        flashcards = JSON.parse(cleanJson);
        loadCard();
    } catch (err) {
        console.error("Error:", err);
        document.getElementById('target-sentence').innerText = "Error cargando la misión.";
    }
}

// 3. UI & DISPLAY LOGIC
function loadCard() {
    if (currentIndex >= flashcards.length) {
        document.getElementById('target-sentence').innerText = "¡MISIÓN COMPLETADA!";
        document.getElementById('live-transcript').innerText = "Excelente trabajo, Operador.";
        return;
    }

    const card = flashcards[currentIndex];
    document.getElementById('target-sentence').innerText = card.es;
    document.getElementById('subject-tag').innerText = card.cat;
    document.getElementById('val-translation').innerText = card.val;
    
    document.getElementById('live-transcript').innerText = "ESPERANDO SEÑAL...";
    document.getElementById('live-transcript').style.color = "#38BDF8";
    
    const progress = ((currentIndex) / flashcards.length) * 100;
    document.getElementById('energy-bar').style.width = `${progress}%`;
}

// 4. SPEECH SYNTHESIS (THE BOY VOICE)
function playAudio() {
    window.speechSynthesis.cancel();
    const card = flashcards[currentIndex];
    const msg = new SpeechSynthesisUtterance(card.es);
    
    const preferredVoiceName = localStorage.getItem('preferred_voice');
    const voices = window.speechSynthesis.getVoices();
    msg.voice = voices.find(v => v.name === preferredVoiceName);
    
    msg.pitch = parseFloat(localStorage.getItem('speech_pitch') || 1.0);
    msg.rate = parseFloat(localStorage.getItem('speech_rate') || 0.9);
    msg.lang = 'es-ES';

    window.speechSynthesis.speak(msg);
}

// 5. SPEECH RECOGNITION (LISTENING)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.interimResults = true;

const recordBtn = document.getElementById('record-btn');

recordBtn.onclick = () => {
    if (!isListening) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();
        recognition.start();
        isListening = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.label').innerText = "DETENER";
    } else {
        recognition.stop();
        isListening = false;
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('.label').innerText = "COMUNICAR";
    }
};

recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            processResult(event.results[i][0].transcript.toLowerCase());
        } else {
            document.getElementById('live-transcript').innerText = event.results[i][0].transcript;
        }
    }
};

function processResult(spokenText) {
    const card = flashcards[currentIndex];
    const isSuccess = card.keywords.some(k => spokenText.includes(k.toLowerCase()));

    if (isSuccess) {
        document.getElementById('live-transcript').innerText = `¡CORRECTO: "${spokenText}"!`;
        document.getElementById('live-transcript').style.color = "#4ADE80";
        
        // Success shout
        const praise = new SpeechSynthesisUtterance("¡Muy bien!");
        praise.pitch = parseFloat(localStorage.getItem('speech_pitch') || 1.0);
        praise.lang = 'es-ES';
        window.speechSynthesis.speak(praise);

        currentIndex++;
        setTimeout(loadCard, 2000);
    } else {
        document.getElementById('live-transcript').innerText = `REINTENTAR: "${spokenText}"`;
        document.getElementById('live-transcript').style.color = "#F87171";
    }
    
    // Auto-stop recording after a result
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "COMUNICAR";
}

// START MISSION
if (localStorage.getItem('gemini_key')) {
    fetchJourneyCards();
} else {
    document.getElementById('target-sentence').innerText = "VE A AJUSTES PARA EMPEZAR";
}
