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

// YOUR FIREBASE CONFIG
// (Keep your existing apiKey, authDomain, etc. here)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "billyreads",
    storageBucket: "billyreads.firebasestorage.app",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const storage = getStorage(app);

// Export everything needed for the App
export { 
    db, 
    storage, 
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
    where,
