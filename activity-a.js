// activity-a.js - Full Replacement Code (iPad High-Stability Version)
const sentences = [
    { es: "El esqueleto protege los órganos internos.", val: "L'esquelet protegeix els òrgans interns.", cat: "CIENCIAS" },
    { es: "Dénia tiene un castillo muy antiguo.", val: "Dénia té un castell molt antic.", cat: "HISTORIA" }
];

let currentIdx = 0;
let isListening = false;

// 1. Setup Speech Recognition with Safari Prefixes
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'es-ES';
recognition.continuous = false; 
recognition.interimResults = true; // Essential for ADHD feedback

// 2. Audio Playback (Spanish Voice)
function playAudio() {
    // iPad Fix: Always cancel any pending speech before starting new speech
    window.speechSynthesis.cancel();
    
    const msg = new SpeechSynthesisUtterance(sentences[currentIdx].es);
    msg.lang = 'es-ES';
    msg.rate = 0.85; 
    window.speechSynthesis.speak(msg);
}

// 3. UI References
const recordBtn = document.getElementById('record-btn');
const transcriptDisplay = document.getElementById('live-transcript');

// 4. Enhanced Start/Stop Logic
recordBtn.onclick = () => {
    if (!isListening) {
        startListening();
    } else {
        stopListening();
    }
};

function startListening() {
    try {
        // iPad Fix: AudioContext must be resumed on a tap to "unlock" the mic
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();

        recognition.start();
        isListening = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.label').innerText = "DETENER";
        transcriptDisplay.innerText = "Escuchando...";
        transcriptDisplay.style.color = "#63B3ED";
    } catch (err) {
        transcriptDisplay.innerText = "Error al iniciar. Revisa los permisos.";
        console.error(err);
    }
}

function stopListening() {
    recognition.stop();
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
}

// 5. Results Handling
recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }

    // Show the words as they happen
    if (interimTranscript) {
        transcriptDisplay.innerText = `Escuchando: ${interimTranscript}`;
    }
    
    // Once we have a final result
    if (finalTranscript) {
        transcriptDisplay.innerText = `Dijiste: "${finalTranscript}"`;
        transcriptDisplay.style.color = "#48BB78"; // Change to green on success
        stopListening();
    }
};

// 6. Error & End Handling
recognition.onerror = (event) => {
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
    
    if (event.error === 'no-speech') {
        transcriptDisplay.innerText = "No se detectó voz. Intenta de nuevo.";
    } else {
        transcriptDisplay.innerText = "Microfóno ocupado o bloqueado.";
    }
};

recognition.onend = () => {
    if (isListening) {
        stopListening();
    }
};
