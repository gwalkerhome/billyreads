// flashapp.js - Fixed Speech Logic for iPad
const flashcards = [
    { es: "El esqueleto protege los órganos internos.", val: "L'esquelet protegeix els òrgans interns.", cat: "CIENCIAS", keywords: ["esqueleto", "protege"] },
    { es: "Las plantas necesitan luz para crecer.", val: "Les plantes necessiten llum per a créixer.", cat: "CIENCIAS", keywords: ["plantas", "crecer"] },
    { es: "Dénia tiene un castillo muy antiguo.", val: "Dénia té un castell molt antic.", cat: "HISTORIA", keywords: ["castillo", "antiguo"] },
    { es: "El agua se evapora con el calor.", val: "L'aigua s'evapora amb la calor.", cat: "GEOGRAFÍA", keywords: ["agua", "evapora"] },
    { es: "Dos por dos son cuatro.", val: "Dos per dos són quatre.", cat: "MATES", keywords: ["dos", "cuatro"] }
];

let currentCard = null;
let isListening = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.interimResults = true;

const recordBtn = document.getElementById('record-btn');
const transcriptDisplay = document.getElementById('live-transcript');
const energyBar = document.getElementById('energy-bar');
const sentenceDisplay = document.getElementById('target-sentence');
const categoryTag = document.getElementById('subject-tag');
const valencianoText = document.getElementById('val-translation');

function loadNextCard() {
    transcriptDisplay.innerText = "ESPERANDO SEÑAL...";
    transcriptDisplay.style.color = "#38BDF8";
    energyBar.style.width = "15%";

    const randomIdx = Math.floor(Math.random() * flashcards.length);
    currentCard = flashcards[randomIdx];

    sentenceDisplay.innerText = currentCard.es;
    categoryTag.innerText = currentCard.cat;
    valencianoText.innerText = currentCard.val;
}

loadNextCard();

// --- CRITICAL FIX FOR PITCH ---
function playAudio() {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(currentCard.es);
    
    // 1. Find the voice first
    const preferredVoiceName = localStorage.getItem('preferred_voice');
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === preferredVoiceName);
    
    if (selectedVoice) {
        msg.voice = selectedVoice;
    }
    
    // 2. Set lang as backup
    msg.lang = 'es-ES';

    // 3. APPLY SETTINGS LAST (Important for iPad Safari)
    const savedRate = localStorage.getItem('speech_rate') || 1.0;
    const savedPitch = localStorage.getItem('speech_pitch') || 1.0;
    
    msg.rate = parseFloat(savedRate);
    msg.pitch = parseFloat(savedPitch);

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
    } catch (err) { console.error(err); }
}

function stopListening() {
    recognition.stop();
    isListening = false;
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.label').innerText = "COMUNICAR";
}

recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else transcriptDisplay.innerText = event.results[i][0].transcript;
    }
    if (finalTranscript) processResult(finalTranscript.toLowerCase());
};

function processResult(spokenText) {
    transcriptDisplay.innerText = `"${spokenText}"`;
    const isSuccess = currentCard.keywords.some(keyword => spokenText.includes(keyword));

    if (isSuccess) {
        transcriptDisplay.style.color = "#4ADE80"; // Neon Green
        energyBar.style.width = "100%";
        
        // Success feedback with child-like pitch
        const shout = new SpeechSynthesisUtterance("¡Excelente!");
        
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === localStorage.getItem('preferred_voice'));
        if (selectedVoice) shout.voice = selectedVoice;
        
        shout.pitch = parseFloat(localStorage.getItem('speech_pitch') || 1.0);
        shout.rate = parseFloat(localStorage.getItem('speech_rate') || 1.0);
        shout.lang = 'es-ES';
        
        window.speechSynthesis.speak(shout);

        setTimeout(loadNextCard, 2500);
    } else {
        transcriptDisplay.style.color = "#F87171"; // Neon Red
    }
    stopListening();
}

recognition.onerror = () => stopListening();
