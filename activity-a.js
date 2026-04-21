// activity-a.js
const sentences = [
    { es: "El esqueleto protege los órganos internos.", val: "L'esquelet protegeix els òrgans interns.", cat: "CIENCIAS" },
    { es: "Dénia tiene un castillo muy antiguo.", val: "Dénia té un castell molt antic.", cat: "HISTORIA" }
];

let currentIdx = 0;

function playAudio() {
    const msg = new SpeechSynthesisUtterance(sentences[currentIdx].es);
    msg.lang = 'es-ES';
    msg.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(msg);
}

// Logic for Speech Recognition (Simplified for now)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';

document.getElementById('record-btn').onclick = () => {
    recognition.start();
    document.getElementById('live-transcript').innerText = "Escuchando...";
};

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById('live-transcript').innerText = `Dijiste: ${text}`;
    
    // Here we will eventually add the "Strictness Scale" logic
    // and trigger the "Success" animation.
};
