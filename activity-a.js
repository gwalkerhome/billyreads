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
recognition.lang = 'es-ES';
recognition.continuous = true; // Allows it to keep listening until we manually stop
recognition.interimResults = false;

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
        // START LISTENING
        try {
            recognition.start();
            isListening = true;
            recordBtn.classList.add('recording');
            recordBtn.querySelector('.label').innerText = "DETENER";
            transcriptDisplay.innerText = "Escuchando...";
        } catch (err) {
            console.error("Speech Error:", err);
        }
    } else {
        // STOP MANUALLY
        recognition.stop();
        isListening = false;
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('.label').innerText = "HABLAR";
    }
};

// 5. Handle the Result
recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript;
    transcriptDisplay.innerText = `Dijiste: "${text}"`;
    
    // Final state cleanup
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
};

// 6. Handle Errors (like if the mic is blocked)
recognition.onerror = (event) => {
    console.error("Recognition Error:", event.error);
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "HABLAR";
    transcriptDisplay.innerText = "Error: Intenta de nuevo";
};
