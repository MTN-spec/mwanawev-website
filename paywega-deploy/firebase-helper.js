// Firebase Logic Helper
// This bridges the existing app.js Logic with the new Firestore Database

import { doc, getDoc, setDoc, collection, runTransaction, onSnapshot, serverTimestamp, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DB_COLLECTIONS = {
    USERS: 'users',
    DRIVERS: 'drivers',
    VEHICLES: 'vehicles',
    TRANSACTIONS: 'transactions',
    QR_CODES: 'qr_codes',
    CONFIG: 'system_config'
};

// Helper: wait for Firebase auth to be ready before any Firestore write
async function waitForFirebase() {
    if (window.paywegaFirebaseReady) {
        await window.paywegaFirebaseReady;
    }
    // Re-read db in case it was set after module loaded
    return window.paywegaDb;
}

class FirebaseManager {
    constructor() {
        this.db = window.paywegaDb;
        this.auth = window.paywegaAuth;
        this.isMock = false;
        // Note: db may be undefined at construction time if modules haven't finished loading.
        // All methods call waitForFirebase() to get a fresh reference when needed.
        if (!this.db) console.warn("Firebase DB not yet initialized — will retry on first operation.");
    }

    // ================= USER MANAGEMENT =================

    async createUser(userData) {
        try {
            const db = await waitForFirebase();
            if (!db) { console.error("Firebase DB unavailable (createUser)"); return false; }
            await setDoc(doc(db, DB_COLLECTIONS.USERS, userData.id), userData);
            console.log("Firebase: User created ✅", userData.id);
            return true;
        } catch (e) {
            console.error("Firebase Error (createUser):", e);
            return false;
        }
    }

    async updateUser(userId, data) {
        if (!userId) return false;
        try {
            const db = await waitForFirebase();
            if (!db) return false;
            const userRef = doc(db, DB_COLLECTIONS.USERS, userId);
            await setDoc(userRef, data, { merge: true });
            console.log("Firebase: User updated ✅", userId);
            return true;
        } catch (e) {
            console.error("Firebase Error (updateUser):", e);
            return false;
        }
    }

    async getUser(userId) {
        try {
            const db = await waitForFirebase();
            if (!db) return null;
            const docRef = doc(db, DB_COLLECTIONS.USERS, userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (e) {
            console.error("Firebase Error (getUser):", e);
            return null;
        }
    }

    async getAllUsers() {
        try {
            const db = await waitForFirebase();
            if (!db) return [];
            const querySnapshot = await getDocs(collection(db, DB_COLLECTIONS.USERS));
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return users;
        } catch (e) {
            console.error("Firebase Error (getAllUsers):", e);
            return [];
        }
    }

    // Real-time listener for user data (balance updates)
    listenToUser(userId, callback) {
        const db = window.paywegaDb;
        if (!db) {
            // Retry after auth is ready
            if (window.paywegaFirebaseReady) {
                window.paywegaFirebaseReady.then(() => {
                    const readyDb = window.paywegaDb;
                    if (readyDb) {
                        onSnapshot(doc(readyDb, DB_COLLECTIONS.USERS, userId), (snap) => {
                            if (snap.exists()) callback(snap.data());
                        });
                    }
                });
            }
            return () => { };
        }
        const unsub = onSnapshot(doc(db, DB_COLLECTIONS.USERS, userId), (snap) => {
            if (snap.exists()) {
                callback(snap.data());
            }
        });
        return unsub; // Returns function to stop listening
    }

    // ================= DRIVER / FLEET =================

    async registerDriver(driverData, vehicleData) {
        try {
            const db = await waitForFirebase();
            if (!db) return;
            // atomic write for driver + vehicle
            await runTransaction(db, async (transaction) => {
                const driverRef = doc(db, DB_COLLECTIONS.DRIVERS, driverData.driverId);
                const vehicleRef = doc(db, DB_COLLECTIONS.VEHICLES, vehicleData.id);
                transaction.set(driverRef, driverData);
                transaction.set(vehicleRef, vehicleData);
            });
            console.log("Firebase: Driver & Vehicle Registered ✅");
        } catch (e) {
            console.error("Firebase Error (registerDriver):", e);
        }
    }

    async getVehicleByReg(regNumber) {
        // This requires a query, simpler to just get by ID if we know it.
        // Implementation pending specific need
    }

    // ================= TRANSACTIONS (The Core) =================

    async recordTransaction(txnData) {
        try {
            const db = await waitForFirebase();
            if (!db) return;
            const txnRef = doc(collection(db, DB_COLLECTIONS.TRANSACTIONS)); // Auto-ID

            // Add server timestamp for security
            txnData.serverTimestamp = serverTimestamp();
            txnData.synced = true;

            // Add GPS Data (if provided)
            if (txnData.gps) {
                txnData.gps = {
                    lat: txnData.gps.lat || null,
                    lng: txnData.gps.lng || null,
                    accuracy: txnData.gps.accuracy || null
                };
            }

            await runTransaction(db, async (transaction) => {
                // 1. Read sender and receiver
                const senderRef = doc(db, DB_COLLECTIONS.USERS, txnData.fromUserId);
                const receiverRef = doc(db, DB_COLLECTIONS.USERS, txnData.toUserId);

                const senderDoc = await transaction.get(senderRef);
                const receiverDoc = await transaction.get(receiverRef);

                if (!senderDoc.exists() || !receiverDoc.exists()) {
                    throw "User not found!";
                }

                const senderBalance = senderDoc.data().tokenBalance || 0;
                const receiverBalance = receiverDoc.data().tokenBalance || 0;
                const amount = parseFloat(txnData.amount);

                if (senderBalance < amount) {
                    throw "Insufficient funds!";
                }

                // 2. Adjust balances
                transaction.update(senderRef, { tokenBalance: senderBalance - amount });
                transaction.update(receiverRef, { tokenBalance: receiverBalance + amount });

                // 3. Log transaction
                transaction.set(txnRef, txnData);
            });

            return { success: true, id: txnRef.id };

        } catch (e) {
            console.error("Transaction Failed:", e);
            return { success: false, error: e.toString() };
        }
    }

    async getTransactions(userId, limitCount = 20) {
        if (!userId) return [];
        try {
            const db = await waitForFirebase();
            if (!db) return [];
            const q1 = query(
                collection(db, DB_COLLECTIONS.TRANSACTIONS),
                where("fromUserId", "==", userId),
                orderBy("serverTimestamp", "desc"),
                limit(limitCount)
            );
            const q2 = query(
                collection(db, DB_COLLECTIONS.TRANSACTIONS),
                where("toUserId", "==", userId),
                orderBy("serverTimestamp", "desc"),
                limit(limitCount)
            );
            const [snap1, snap2] = await Promise.all([
                getDocs(q1).catch(() => null),
                getDocs(q2).catch(() => null)
            ]);
            const txns = [];
            if (snap1) snap1.forEach(d => txns.push({ id: d.id, ...d.data() }));
            if (snap2) snap2.forEach(d => txns.push({ id: d.id, ...d.data() }));
            return txns.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (e) {
            console.error("Firebase Error (getTransactions):", e);
            return [];
        }
    }

    // ================= QR ACCOUNTABILITY =================

    async logQRGeneration(qrData) {
        try {
            const db = await waitForFirebase();
            if (!db) return;
            await setDoc(doc(db, DB_COLLECTIONS.QR_CODES, qrData.id), qrData);
            console.log("QR Logged to Cloud:", qrData.id);
        } catch (e) {
            console.log("Offline? QR will sync later.");
        }
    }

    async verifyAndUseQR(qrId, userId) {
        try {
            const db = await waitForFirebase();
            if (!db) return { valid: false, error: "Offline" };
            const qrRef = doc(db, DB_COLLECTIONS.QR_CODES, qrId);

            return await runTransaction(db, async (transaction) => {
                const qrDoc = await transaction.get(qrRef);
                if (!qrDoc.exists()) throw "Invalid QR Code";

                const data = qrDoc.data();
                if (data.status === 'used') throw "QR Code already used!";
                if (data.expiresAt && new Date(data.expiresAt) < new Date()) throw "QR Code Expired";

                // Mark as used
                transaction.update(qrRef, {
                    status: 'used',
                    usedBy: userId,
                    usedAt: new Date().toISOString()
                });

                return { valid: true, data: data };
            });
        } catch (e) {
            return { valid: false, error: e.toString() };
        }
    }
}

// Attach to window for app.js to use
window.FirebaseManager = FirebaseManager;
