// firebase-bridge.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit, 
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
 * GLOBAL THEME SYNC: Fetches the active theme and layout for the whole app.
 */
export async function getGlobalTheme() {
    try {
        const docRef = doc(db, "settings", "global_theme");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching global theme:", error);
        return null;
    }
}

/**
 * SAVES THEME SYNC: Used by WinAdjust and Themes pages.
 */
export async function saveGlobalTheme(themeId, themeUrl, layout) {
    try {
        await setDoc(doc(db, "settings", "global_theme"), {
            activeThemeId: themeId,
            activeThemeUrl: themeUrl,
            layout: layout,
            lastUpdated: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error saving global theme:", error);
        return false;
    }
}

/**
 * callgemini:
 * OCR and translation using gemini-2.5-flash.
 */
window.callgemini = async function(file, prompt) {
    const apikey = localStorage.getItem('gemini_key');
    if (!apikey) throw new Error("No Gemini API Key found in settings.");
    const gen_ai_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apikey}`;

    try {
        const base64data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: file.type, data: base64data } }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        };

        const response = await fetch(gen_ai_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error ? data.error.message : "AI Error");
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Bridge Error:", error);
        throw error;
    }
};

export { 
    db, storage, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
    query, orderBy, limit, where, ref, uploadBytes, getDownloadURL, deleteObject 
};
