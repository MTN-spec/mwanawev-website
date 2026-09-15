// Firebase Configuration
// 1. Go to console.firebase.google.com
// 2. Create a new project "Paywega"
// 3. Register a Web App
// 4. Copy the "firebaseConfig" object here

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6tru7K2Ij0e8sn9H6chPx-LXsBeIg978",
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

    // Expose Phone Auth for genuine carrier SMS verification (Option B)
    window.paywegaPhoneAuth = {
        resetRecaptcha: (containerId = 'recaptcha-container') => {
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch(e) {}
                window.recaptchaVerifier = null;
            }
            let container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        },
        setupRecaptcha: (containerId = 'recaptcha-container') => {
            if (!auth) throw new Error("Firebase Auth is not ready yet.");
            let container = document.getElementById(containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                document.body.appendChild(container);
            }
            if (window.recaptchaVerifier) {
                return window.recaptchaVerifier;
            }
            container.innerHTML = '';
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                    'size': 'invisible',
                    'callback': () => {
                        console.log("reCAPTCHA solved for Phone Auth ✅");
                    },
                    'expired-callback': () => {
                        console.warn("reCAPTCHA expired, resetting...");
                        window.paywegaPhoneAuth.resetRecaptcha(containerId);
                    }
                });
            } catch (err) {
                console.warn("reCAPTCHA creation error, resetting and retrying:", err);
                window.paywegaPhoneAuth.resetRecaptcha(containerId);
                window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                    'size': 'invisible',
                    'callback': () => console.log("reCAPTCHA solved for Phone Auth ✅")
                });
            }
            return window.recaptchaVerifier;
        },
        sendVerificationCode: async (phoneNumber) => {
            if (!auth) throw new Error("Authentication service is initializing. Please try again.");
            window.paywegaPhoneAuth.resetRecaptcha('recaptcha-container');
            try {
                const verifier = window.paywegaPhoneAuth.setupRecaptcha('recaptcha-container');
                const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
                window.paywegaConfirmationResult = confirmationResult;
                return confirmationResult;
            } catch (error) {
                window.paywegaPhoneAuth.resetRecaptcha('recaptcha-container');
                throw error;
            }
        },
        verifyCode: async (code) => {
            if (!window.paywegaConfirmationResult) {
                throw new Error("No pending verification request found. Please request a new code.");
            }
            const userCredential = await window.paywegaConfirmationResult.confirm(code);
            return userCredential.user;
        }
    };

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

    console.log("Firebase & Phone Auth Initialized Successfully ✅");
} catch (e) {
    console.error("Firebase Initialization Failed - check firebase-config.js keys", e);
    // Provide a no-op promise so app.js doesn't crash on await
    window.paywegaFirebaseReady = Promise.resolve();
}
