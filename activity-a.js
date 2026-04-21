// activity-a.js - Full Replacement Code
const sentences = [
    { es: "El esqueleto protege los órganos internos.", val: "L'esquelet protegeix els òrgans interns.", cat: "CIENCIAS" },
    { es: "Dénia tiene un castillo muy antiguo.", val: "Dénia té un castell molt antic.", cat: "HISTORIA" }
];

let currentIdx = 0;
let isListening = false;

// 1. Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// iPad/Safari specific settings
recognition.lang = 'es-ES';
recognition.continuous = false; // Set to false for better iPad reliability
recognition.interimResults = true; // Show text as he speaks

// 2. Audio Playback Logic
function playAudio() {
    const msg = new SpeechSynthesisUtterance(sentences[currentIdx].es);
    msg.lang = 'es-ES';
    msg.rate = 0.9; 
    window.speechSynthesis.speak(msg);
}

// 3. UI Element References
const recordBtn = document.getElementById('record-btn');
const transcriptDisplay = document.getElementById('live-transcript');

// 4. Toggle Microphone Logic
recordBtn.onclick = () => {
    if (!isListening) {
        startRecognition();
    } else {
        stopRecognition();
    }
};

function startRecognition() {
    try {
        recognition.start();
        isListening = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.label').innerText = "DETENER";
        transcriptDisplay.innerText = "Escuchando...";
    } catch (err) {
        console.error("Mic error:", err);
    }
}

function stopRecognition() {
    recognition.stop();
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
}

// 5. Handle the Result (Improved for iPad)
recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            // Show interim results so he knows it's working
            transcriptDisplay.innerText = `Escuchando: ${event.results[i][0].transcript}`;
        }
    }
    
    if (finalTranscript !== '') {
        transcriptDisplay.innerText = `Dijiste: "${finalTranscript}"`;
        // After success, we stop the recording UI
        stopRecognition();
    }
};

// 6. Handle Errors
recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    stopRecognition();
    if(event.error === 'no-speech') {
        transcriptDisplay.innerText = "No se escuchó nada. ¡Intenta de nuevo!";
    } else {
        transcriptDisplay.innerText = "Error de micrófono. Revisa los permisos.";
    }
};

// Auto-cleanup if it ends by itself
recognition.onend = () => {
    if (isListening) {
        stopRecognition();
    }
};
