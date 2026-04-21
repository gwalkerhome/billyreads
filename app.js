// --- Core Logic ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = false;

// Handle OpenAI Vision & Logic
async function processBookImage(file) {
    const apiKey = localStorage.getItem('openai_key');
    if (!apiKey) return alert("Por favor, añade tu API Key en configuración.");

    // Convert image to base64
    const base64Image = await toBase64(file);

    // Call OpenAI GPT-4o
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful Spanish teacher for an 8-year-old. Extract the text from the image. Then, provide one simple reading task and one comprehension question in Spanish."
                },
                {
                    role: "user",
                    content: [{ type: "image_url", image_url: { url: base64Image } }]
                }
            ]
        })
    });
    
    const data = await response.json();
    displayInteraction(data.choices[0].message.content);
}

// Speech Recognition Feedback
recognition.onresult = (event) => {
    const result = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    const strictness = localStorage.getItem('strictness') || 5;

    // Logic to compare result with expected text
    // (We will refine this comparison logic in the next stage)
    document.getElementById('feedback-display').innerText = `Dijiste: "${result}"`;
};

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});
