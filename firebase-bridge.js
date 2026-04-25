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
    apiKey: "AIzaSyAwysHSBZTEwZ8IrmgzrTnJwv9nEv6QJPo",
    authDomain: "billyreads.firebaseapp.com",
    projectId: "billyreads",
    storageBucket: "billyreads.firebasestorage.app",
    messagingSenderId: "106394773429",
    appId: "1:106394773429:web:465bf15be58552cfd677dc"
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
