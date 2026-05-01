// firebase-bridge.js - The Unified Cloud Link
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAwysHSBZTEwZ8IrmgzrTnJwv9nEv6QJPo",
    authDomain: "billyreads.firebaseapp.com",
    projectId: "billyreads",
    storageBucket: "billyreads.firebasestorage.app",
    messagingSenderId: "106394773429",
    appId: "1:106394773429:web:465bf15be58552cfd677dc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Saves the active theme and layout to the global settings document.
 * This function is used by WinAdjust and Themes, but is ignored by Magic Books.
 */
async function saveGlobalTheme(themeId, themeUrl, layout) {
    try {
        const themeRef = doc(db, "settings", "global_theme");
        await setDoc(themeRef, {
            activeThemeId: themeId,
            activeThemeUrl: themeUrl,
            layout: layout,
            lastUpdated: Date.now()
        }, { merge: true });
        
        // Redundant fallback for immediate UI feedback
        localStorage.setItem('bg_url_cloud', themeUrl);
        localStorage.setItem('ui_positions', JSON.stringify(layout));
        return true;
    } catch (error) {
        console.error("Cloud Sync Error:", error);
        return false;
    }
}

/**
 * Retrieves the current global theme and layout.
 * Used by flashapp.js to ensure the curriculum engine stays aligned.
 */
async function getGlobalTheme() {
    try {
        const themeRef = doc(db, "settings", "global_theme");
        const docSnap = await getDoc(themeRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Cloud Retrieval Error:", error);
        return null;
    }
}

/**
 * BillyReads AI Bridge
 * Handles OCR and Translation using Gemini 1.5-Flash
 */
window.callgemini = async function(file, prompt) {
    const API_KEY = firebaseConfig.apiKey;
    const MODEL = "gemini-1.5-flash"; 
    
    const toBase64 = f => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
    });

    const base64Data = await toBase64(file);

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: file.type, data: base64Data } }
            ]
        }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("AI could not read the page. Check image quality.");
    }
};

// STAMP OF INTEGRITY: These exports match the requirements of your working Magic Book scripts.
export { 
    db, 
    storage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    setDoc,
    query, 
    orderBy, 
    saveGlobalTheme, 
    getGlobalTheme 
};
