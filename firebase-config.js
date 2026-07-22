// Firebase Configuration
// 1. Go to console.firebase.google.com
// 2. Create a new project "Paywega"
// 3. Register a Web App
// 4. Copy the "firebaseConfig" object here

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6trJ7K2_j0e8sn9H6cnPx-LXs3eIg978",
    authDomain: "mwanawevtech.firebaseapp.com",
    projectId: "mwanawevtech",
    storageBucket: "mwanawevtech.firebasestorage.app",
    messagingSenderId: "309925280314",
    appId: "1:309925280314:web:919733195e4de773581303"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Enable Offline Persistence (The "Hybrid" magic)
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support all of the features required to enable persistence');
        }
    });

    console.log("Firebase Initialized Successfully");
} catch (e) {
    console.error("Firebase Initialization Failed - check firebase-config.js keys", e);
}

// Export for use in app.js
window.paywegaDb = db;
window.paywegaAuth = auth;
