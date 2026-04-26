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
    query, 
    orderBy, 
    saveGlobalTheme, 
    getGlobalTheme 
};
