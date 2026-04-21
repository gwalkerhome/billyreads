// activity-a.js - Full Replacement Code (Success Logic Version)
const sentences = [
    { es: "El esqueleto protege los órganos internos.", val: "L'esquelet protegeix els òrgans interns.", cat: "CIENCIAS" },
    { es: "Dénia tiene un castillo muy antiguo.", val: "Dénia té un castell molt antic.", cat: "HISTORIA" }
];

let currentIdx = 0;
let isListening = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = false; 
recognition.interimResults = true;

const recordBtn = document.getElementById('record-btn');
const transcriptDisplay = document.getElementById('live-transcript');
const energyBar = document.getElementById('energy-bar');

function playAudio() {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(sentences[currentIdx].es);
    msg.lang = 'es-ES';
    msg.rate = 0.85; 
    window.speechSynthesis.speak(msg);
}

recordBtn.onclick = () => {
    if (!isListening) {
        startListening();
    } else {
        stopListening();
    }
};

function startListening() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();
        recognition.start();
        isListening = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('.label').innerText = "DETENER";
        transcriptDisplay.innerText = "Escuchando...";
    } catch (err) {
        console.error(err);
    }
}

function stopListening() {
    recognition.stop();
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
}

recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            transcriptDisplay.innerText = event.results[i][0].transcript;
        }
    }

    if (finalTranscript) {
        processResult(finalTranscript.toLowerCase());
    }
};

function processResult(spokenText) {
    const targetText = sentences[currentIdx].es.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    transcriptDisplay.innerText = `"${spokenText}"`;
    
    // Simple check: Does his speech contain the main keywords?
    if (spokenText.includes("esqueleto") || spokenText.includes("protege")) {
        transcriptDisplay.style.color = "#48BB78"; // Success Green
        transcriptDisplay.style.fontSize = "1.8rem";
        
        // Move the energy bar
        energyBar.style.width = "100%";
        
        // Celebration sound (iPad internal)
        const shout = new SpeechSynthesisUtterance("¡Excelente!");
        shout.lang = 'es-ES';
        window.speechSynthesis.speak(shout);
    } else {
        transcriptDisplay.style.color = "#F6AD55"; // Try Again Orange
    }
    stopListening();
}

recognition.onerror = () => stopListening();
