// test-gemini.js - Connection Diagnostic
async function runDiagnostic() {
    const apiKey = localStorage.getItem('gemini_key');
    const display = document.getElementById('target-sentence');
    
    if (!apiKey) {
        display.innerText = "TEST FAILED: No API Key found in storage.";
        return;
    }

    display.innerText = "ESTABLISHING CONNECTION...";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const testPayload = {
        contents: [{
            parts: [{ text: "Respond with exactly the following words: CONNECTION SUCCESSFUL" }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const result = data.candidates[0].content.parts[0].text;
            display.innerText = result;
            display.style.color = "#4ADE80"; // Neon Green for success
            console.log("Full Data:", data);
        } else {
            // Handle API errors (like invalid keys)
            display.innerText = `ERROR: ${data.error ? data.error.message : 'Unknown response structure'}`;
            display.style.color = "#F87171";
            console.error("API Error Response:", data);
        }
    } catch (err) {
        display.innerText = "NETWORK ERROR: Check internet or API URL.";
        display.style.color = "#F87171";
        console.error("Fetch Error:", err);
    }
}

// Auto-run test on load
runDiagnostic();
