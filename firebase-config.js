// Firebase Configuration
// 1. Go to console.firebase.google.com
// 2. Create a new project "Paywega"
// 3. Register a Web App
// 4. Copy the "firebaseConfig" object here

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

    // REQUIRED: Firestore security rules require an authenticated Firebase user.
    // This promise resolves or warns gracefully so offline operations continue.
    window.paywegaFirebaseReady = signInAnonymously(auth)
        .then(() => {
            console.log("Firebase anonymous sign-in successful ✅");
            window.paywegaDb = db;
            window.paywegaAuth = auth;
        })
        .catch((e) => {
            console.warn("Firebase anonymous sign-in unavailable (running in offline mode):", e);
            // Allow app to continue in offline mode without crashing startup
        });

    // Enable Offline Persistence (The "Hybrid" magic)
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support all of the features required to enable persistence');
        }
    });

    // Set db/auth immediately so FirebaseManager can reference them,
    // but Firestore writes must wait for paywegaFirebaseReady to resolve.
    window.paywegaDb = db;
    window.paywegaAuth = auth;

    console.log("Firebase Initialized Successfully ✅");
} catch (e) {
    console.error("Firebase Initialization Failed - check firebase-config.js keys", e);
    // Provide a no-op promise so app.js doesn't crash on await
    window.paywegaFirebaseReady = Promise.resolve();
}
