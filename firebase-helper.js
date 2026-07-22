// Firebase Logic Helper
// This bridges the existing app.js Logic with the new Firestore Database

import { doc, getDoc, setDoc, collection, runTransaction, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DB_COLLECTIONS = {
    USERS: 'users',
    DRIVERS: 'drivers',
    VEHICLES: 'vehicles',
    TRANSACTIONS: 'transactions',
    QR_CODES: 'qr_codes',
    CONFIG: 'system_config'
};

class FirebaseManager {
    constructor() {
        this.db = window.paywegaDb;
        this.auth = window.paywegaAuth;
        // Check if DB is ready
        if (!this.db) console.error("Firebase DB not initialized! Check config.");
    }

    // ================= USER MANAGEMENT =================

    async createUser(userData) {
        if (!this.db) return;
        try {
            // Create user document
            await setDoc(doc(this.db, DB_COLLECTIONS.USERS, userData.id), userData);
            console.log("Firebase: User created", userData.id);
            return true;
        } catch (e) {
            console.error("Firebase Error (createUser):", e);
            return false;
        }
    }

    async getUser(userId) {
        if (!this.db) return null;
        try {
            const docRef = doc(this.db, DB_COLLECTIONS.USERS, userId);
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

    // Real-time listener for user data (balance updates)
    listenToUser(userId, callback) {
        if (!this.db) return;
        const unsub = onSnapshot(doc(this.db, DB_COLLECTIONS.USERS, userId), (doc) => {
            if (doc.exists()) {
                callback(doc.data());
            }
        });
        return unsub; // Returns function to stop listening
    }

    // ================= DRIVER / FLEET =================

    async registerDriver(driverData, vehicleData) {
        if (!this.db) return;
        try {
            // atomic write for driver + vehicle
            await runTransaction(this.db, async (transaction) => {
                const driverRef = doc(this.db, DB_COLLECTIONS.DRIVERS, driverData.driverId);
                const vehicleRef = doc(this.db, DB_COLLECTIONS.VEHICLES, vehicleData.id);

                transaction.set(driverRef, driverData);
                transaction.set(vehicleRef, vehicleData);
            });
            console.log("Firebase: Driver & Vehicle Registered");
        } catch (e) {
            console.error("Firebase Error (registerDriver):", e);
        }
    }

    async getVehicleByReg(regNumber) {
        // This requires a query, simpler to just get by ID if we know it. 
        // For now, we'll assume we look up by ID or local cache for speed.
        // Implementation pending specific need
    }

    // ================= TRANSACTIONS (The Core) =================

    async recordTransaction(txnData) {
        if (!this.db) return;
        try {
            const txnRef = doc(collection(this.db, DB_COLLECTIONS.TRANSACTIONS)); // Auto-ID

            // Add server timestamp for security
            txnData.serverTimestamp = serverTimestamp();
            txnData.synced = true;

            // Add GPS Data (if provided)
            if (txnData.gps) {
                // Ensure it's stored as a clean object
                txnData.gps = {
                    lat: txnData.gps.lat || null,
                    lng: txnData.gps.lng || null,
                    accuracy: txnData.gps.accuracy || null
                };
            }

            await runTransaction(this.db, async (transaction) => {
                // 1. Read sender and receiver
                const senderRef = doc(this.db, DB_COLLECTIONS.USERS, txnData.fromUserId);
                const receiverRef = doc(this.db, DB_COLLECTIONS.USERS, txnData.toUserId);

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

    // ================= QR ACCOUNTABILITY =================

    async logQRGeneration(qrData) {
        if (!this.db) return;
        try {
            await setDoc(doc(this.db, DB_COLLECTIONS.QR_CODES, qrData.id), qrData);
            console.log("QR Logged to Cloud:", qrData.id);
        } catch (e) {
            console.log("Offline? QR will sync later.");
        }
    }

    async verifyAndUseQR(qrId, userId) {
        if (!this.db) return { valid: false, error: "Offline" };
        try {
            const qrRef = doc(this.db, DB_COLLECTIONS.QR_CODES, qrId);

            return await runTransaction(this.db, async (transaction) => {
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
