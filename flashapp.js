// flashapp.js - Integrated Curriculum & Assessment Engine (OpenAI Cloud Sync)
import { getGlobalTheme } from "./firebase-bridge.js";

let flashcards = [];
let currentIndex = 0;
let isListening = false;

/**
 * Applies the Cloud Theme and Layout coordinates to the UI
 * Optimized for the 16:9 Master Canvas system
 */
async function syncAppTheme() {
    const cloudState = await getGlobalTheme();
    
    // Fallback logic for Theme URL
    const themeUrl = cloudState?.activeThemeUrl || localStorage.getItem('bg_url_cloud');
    
    // Fallback logic for Layout
    const layout = cloudState?.layout || JSON.parse(localStorage.getItem('ui_positions')) || {
        "pane-birch": { t: 5, l: 30, w: 40, h: 10 },
        "pane-stone": { t: 25, l: 25, w: 50, h: 30 },
        "pane-back": { t: 2, l: 2, w: 10, h: 10 }
    };

    // AMENDED: Target the Master Canvas instead of the body
    const canvas = document.getElementById('master-canvas');
    if (canvas && themeUrl) {
        canvas.style.backgroundImage = `url('${themeUrl}')`;
    } else if (themeUrl) {
        // Ultimate fallback if HTML hasn't been updated to use #master-canvas
        document.body.style.backgroundImage = `url('${themeUrl}')`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
    }

    if (layout) {
        Object.keys(layout).forEach(paneId => {
            const element = document.getElementById(paneId.toLowerCase());
            if (element) {
                const pos = layout[paneId];
                // AMENDED: Use 'absolute' so buttons stay relative to the canvas
                element.style.position = 'absolute';
                element.style.top = pos.t + '%';
                element.style.left = pos.l + '%';
                element.style.width = pos.w + '%';
                element.style.height = pos.h + '%';
                element.style.border = "none";
                element.style.outline = "none";
                element.style.backgroundColor = "transparent";
            }
        });
    }
}

/**
 * Calculates the Spanish school year group based on DOB for 2026 context.
 */
function calculateYearGroup(dobString) {
    const dob = new Date(dobString);
    const now = new Date(); 
    const age = now.getFullYear() - dob.getFullYear();
    let year = age - 5; 
    if (year < 1) year = 1;
    if (year > 6) year = 6;
    return year;
}

/**
 * Assessment Logic
 */
function assessSpeech(spoken, target, keywords, strictness) {
    const s = spoken.toLowerCase().trim();
    const t = target.toLowerCase().trim();
    switch (strictness) {
        case '1': return keywords.some(k => s.includes(k.toLowerCase()));
        case '2': 
            const targetWords = t.split(' ');
            const matchedWords = targetWords.filter(word => s.includes(word));
            return matchedWords.length >= (targetWords.length / 2);
        case '3': 
            const words3 = t.split(' ');
            const matches3 = words3.filter(word => s.includes(word));
            return matches3.length >= (words3.length * 0.8);
        case '4': return s === t || t.split(' ').every(word => s.includes(word));
        default: return keywords.some(k => s.includes(k.toLowerCase()));
    }
}

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('openai_key');
    const dob = localStorage.getItem('billy_dob') || '2019-01-01';
    const readingLevel = localStorage.getItem('billy_level') || '2'; 
    const targetDisplay = document.getElementById('target-sentence');

    if (!apiKey) {
        if (targetDisplay) targetDisplay.innerText = "Error: Missing API Key";
        return;
    }

    const currentYear = calculateYearGroup(dob);
    const model = "gpt-4o-mini"; 
    const url = "https://api.openai.com/v1/chat/completions";

    const difficultyMap = {
        "1": "Tier 1 (Phonetic): Short words, simple S+V+O, max 6 words.",
        "2": "Tier 2 (Fluency): 8-10 words, basic adjectives.",
        "3": "Tier 3 (Advanced): Compound sentences, technical vocabulary.",
        "4": "Tier 4 (Expert): Full academic language."
    };
    
    const selectedDifficulty = difficultyMap[readingLevel] || difficultyMap["2"];

    const prompt = `Act as a Primary School Encyclopedia for students in Spain. Generate 20 JSON objects for Year ${currentYear}. Difficulty: ${selectedDifficulty}. Use Spanish (Spain). JSON FORMAT: [{"es": "Fact", "val": "Translation", "cat": "SUBJECT", "keywords": ["key"]}]`;

    if (targetDisplay) targetDisplay.innerText = "Syncing Curriculum...";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ 
                model: model,
                messages: [{ role: "system", content: "Output JSON only." }, { role: "user", content: prompt }],
                temperature: 0.7
            })
        });
        const data = await response.json();
        let rawText = data.choices[0].message.content;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        rawText = rawText.substring(start, end + 1);
        flashcards = JSON.parse(rawText);
        displayCurrentCard();
    } catch (err) {
        console.error(err);
        if (targetDisplay) targetDisplay.innerText = "Connection Error.";
    }
}

function displayCurrentCard() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    const targetEl = document.getElementById('target-sentence');
    const subjectEl = document.getElementById('subject-tag');
    const valEl = document.getElementById('val-translation');
    const energyEl = document.getElementById('energy-bar');

    if(targetEl) targetEl.innerText = card.es;
    if(subjectEl) subjectEl.innerText = card.cat.toUpperCase();
    if(valEl) valEl.innerText = card.val;
    if(energyEl) energyEl.style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

window.playSpeech = function() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.name === localStorage.getItem('billy_voice'));
    utterance.rate = parseFloat(localStorage.getItem('billy_rate') || 1.0);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const spokenText = result[0].transcript;
        const liveDisplay = document.getElementById('live-transcript');
        if (liveDisplay) liveDisplay.innerText = spokenText.toUpperCase();
        if (result.isFinal && flashcards[currentIndex]) {
            const currentStrictness = localStorage.getItem('billy_strictness') || '2';
            if (assessSpeech(spokenText, flashcards[currentIndex].es, flashcards[currentIndex].keywords, currentStrictness)) {
                currentIndex++;
                currentIndex < flashcards.length ? setTimeout(displayCurrentCard, 500) : (liveDisplay.innerText = "MISSION COMPLETE!");
            }
        }
    };
    
    // Explicit trigger for our pane-record button
    window.toggleMicModule = () => {
        if (!isListening) { 
            recognition.start(); 
            isListening = true; 
            document.getElementById('pane-record').style.background = "rgba(255,0,0,0.4)"; 
        } else { 
            recognition.stop(); 
            isListening = false; 
            document.getElementById('pane-record').style.background = "none"; 
        }
    };
}

syncAppTheme();
fetchJourneyCards();
