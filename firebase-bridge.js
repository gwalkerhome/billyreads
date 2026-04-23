// firebase-bridge.js - The Central Engine for BillyReads
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your verified Production Credentials
const firebaseConfig = {
    apiKey: "AIzaSyAwysHSBZTEwZ8IrmgzrTnJwv9nEv6QJPo",
    authDomain: "billyreads.firebaseapp.com",
    projectId: "billyreads",
    storageBucket: "billyreads.firebasestorage.app",
    messagingSenderId: "106394773429",
    appId: "1:106394773429:web:465bf15be58552cfd677dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/**
 * GLOBAL SYNC: Saves the active theme so all devices (iPad/Mac) update instantly.
 */
export async function saveGlobalTheme(id, url, layout) {
    try {
        await setDoc(doc(db, "app_state", "current_session"), {
            activeThemeId: id,
            activeThemeUrl: url,
            layout: layout,
            lastUpdated: Date.now()
        });
        // Also update local storage for fallback/speed
        localStorage.setItem('bg_url_cloud', url);
        localStorage.setItem('ui_positions', JSON.stringify(layout));
        return true;
    } catch (error) {
        console.error("Global Sync Error:", error);
        return false;
    }
}

/**
 * GLOBAL FETCH: Gets the current theme from the cloud.
 */
export async function getGlobalTheme() {
    try {
        const docSnap = await getDoc(doc(db, "app_state", "current_session"));
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Fetch Sync Error:", error);
        return null;
    }
}

// Export the core tools for use in other pages
export { db, storage, ref, uploadBytes, getDownloadURL, deleteObject, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy };
