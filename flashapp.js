// flashapp.js - Curriculum-Contextualized Reading Engine
let flashcards = [];
let currentIndex = 0;
let isListening = false;

// Helper to determine Spanish School Year (Primaria) based on 2026
function calculateYearGroup(dobString) {
    const dob = new Date(dobString);
    const now = new Date(); // April 2026
    const age = now.getFullYear() - dob.getFullYear();
    
    // Simplification: age 6 = 1º, age 7 = 2º, etc.
    let year = age - 5; 
    if (year < 1) year = 1;
    if (year > 6) year = 6;
    return year;
}

async function fetchJourneyCards() {
    const apiKey = localStorage.getItem('gemini_key');
    const dob = localStorage.getItem('billy_dob') || '2019-01-01';
    const readingLevel = localStorage.getItem('billy_level') || 'NORMAL'; // Levels 1-4
    const target = document.getElementById('target-sentence');

    if (!apiKey) {
        if (target) target.innerText = "Error: Falta API Key";
        return;
    }

    const currentYear = calculateYearGroup(dob);
    const model = "gpt-5.4-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    // Defining the 4-Level Difficulty Constraints
    const difficultyMap = {
        "1": "Nivel 1 (Fonético): Palabras cortas, frases simples S+V+P, máximo 6 palabras, sin sílabas trabadas (tr, bl).",
        "2": "Nivel 2 (Fluidez): Frases de 8-10 palabras, uso de adjetivos y conjunciones básicas.",
        "3": "Nivel 3 (Avanzado): Oraciones compuestas, vocabulario técnico curricular, uso de comas.",
        "4": "Nivel 4 (Experto): Lenguaje académico complejo, sintaxis sofisticada, términos técnicos precisos."
    };
    
    const selectedDiff = difficultyMap[readingLevel] || difficultyMap["2"];

    const prompt = `Actúa como un Diseñador de Currículo Español. Genera 20 tarjetas JSON de lectura.
    CONTENIDO (Distribución obligatoria):
    - 70%: Temas de ${currentYear}º de Primaria.
    - 10%: Temas de ${currentYear + 1 > 6 ? 6 : currentYear + 1}º de Primaria.
    - 20%: Temas de años anteriores (1º a ${currentYear > 1 ? currentYear - 1 : 1}º).

    DIFICULTAD DE LECTURA: ${selectedDiff}
    
    INSTRUCCIONES:
    - Cada frase debe ser una AFIRMACIÓN basada en el currículo (Ciencias, Mates, Geografía, etc.).
    - NO hagas preguntas.
    - No uses texto en las imágenes, solo el JSON.
    
    FORMATO JSON: [{"es": "afirmación curricular", "val": "traducción valenciano", "cat": "ASIGNATURA", "keywords": ["palabra_clave"]}]`;

    if (target) target.innerText = "Sincronizando Currículo...";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ 
                model: model,
                messages: [
                    { role: "system", content: "Eres un experto en el currículo de primaria de España. Solo respondes en JSON puro." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "Error API");

        let rawText = data.choices[0].message.content;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            rawText = rawText.substring(start, end + 1);
        }
        
        flashcards = JSON.parse(rawText);
        loadCard();

    } catch (err) {
        console.error("Fetch Error:", err);
        if (target) target.innerText = "Error de conexión con la misión.";
    }
}

function loadCard() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    const card = flashcards[currentIndex];
    
    const sentenceEl = document.getElementById('target-sentence');
    const tagEl = document.getElementById('subject-tag');
    const transEl = document.getElementById('val-translation');
    const bar = document.getElementById('energy-bar');

    if (sentenceEl) sentenceEl.innerText = card.es;
    if (tagEl) tagEl.innerText = card.cat.toUpperCase();
    if (transEl) transEl.innerText = card.val;
    if (bar) bar.style.width = ((currentIndex / flashcards.length) * 100) + '%';
}

function playAudio() {
    if (!flashcards.length || !flashcards[currentIndex]) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(flashcards[currentIndex].es);
    const savedVoice = localStorage.getItem('billy_voice');
    msg.voice = window.speechSynthesis.getVoices().find(v => v.name === savedVoice);
    msg.rate = parseFloat(localStorage.getItem('billy_rate') || 1.0);
    msg.pitch = parseFloat(localStorage.getItem('billy_pitch') || 1.0);
    msg.lang = 'es-ES';
    window.speechSynthesis.speak(msg);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        const liveDisplay = document.getElementById('live-transcript');
        if (liveDisplay) liveDisplay.innerText = text.toUpperCase();
        
        if (result.isFinal && flashcards[currentIndex]) {
            // Check if keywords are present in the speech
            const match = flashcards[currentIndex].keywords.some(k => 
                text.toLowerCase().includes(k.toLowerCase())
            );
            if (match) {
                currentIndex++;
                if (currentIndex < flashcards.length) {
                    setTimeout(loadCard, 500);
                } else {
                    if (liveDisplay) liveDisplay.innerText = "¡MISIÓN COMPLETADA!";
                }
            }
        }
    };

    const btn = document.getElementById('record-btn');
    if (btn) {
        btn.onclick = () => {
            if (!isListening) { 
                recognition.start(); 
                isListening = true; 
                btn.classList.add('recording-active');
            } else { 
                recognition.stop(); 
                isListening = false; 
                btn.classList.remove('recording-active');
            }
        };
    }
}

fetchJourneyCards();
