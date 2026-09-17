/**
 * Change It — Production API Client
 * Replaces firebase-helper.js
 * All calls go to: https://changeit-api.mhandutakunda.workers.dev
 */

const API_BASE = 'https://changeit-api.mhandutakunda.workers.dev';

// =====================================================
// SESSION STORAGE HELPERS
// =====================================================

function getSession() {
    try { return JSON.parse(localStorage.getItem('changeit_session') || 'null'); }
    catch { return null; }
}

function saveSession(session) {
    localStorage.setItem('changeit_session', JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem('changeit_session');
}

// =====================================================
// HTTP HELPERS
// =====================================================

async function apiCall(path, options = {}) {
    const session = getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(session?.sessionToken ? { 'Authorization': `Bearer ${session.sessionToken}` } : {}),
        ...(options.headers || {})
    };

    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
                signal: AbortSignal.timeout(12000) // 12s timeout
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            return data;
        } catch (err) {
            attempts++;
            if (attempts > maxRetries || err.name === 'AbortError') throw err;
            await new Promise(r => setTimeout(r, 1000 * attempts)); // backoff
        }
    }
}

// =====================================================
// AUTH API
// =====================================================

const AuthAPI = {
    /**
     * Register a new user or driver
     */
    async register({ phone, name, pin, txnPin, role, driverDetails }) {
        const apiRole = (role === 'commuter' || role === 'passenger') ? 'passenger' : role;
        const data = await apiCall('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ phone, name, pin, txnPin, role: apiRole, driverDetails })
        });

        const userRole = (data.role === 'passenger' || data.role === 'commuter') ? 'commuter' : (data.role || role);

        // Save session locally
        saveSession({
            userId: data.userId,
            name: data.name || name,
            role: userRole,
            sessionToken: data.sessionToken,
            tokenBalance: data.tokenBalance || 5.00,
            vehicleId: data.vehicleId || null,
            vehicleReg: null,
            qrSecret: data.qrSecret || null,
            driverId: data.driverId || null
        });

        return {
            ...data,
            role: userRole
        };
    },

    /**
     * Login with phone + PIN
     */
    async login({ phone, pin }) {
        const data = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, pin })
        });

        saveSession({
            userId: data.userId,
            name: data.name,
            role: data.role,
            sessionToken: data.sessionToken,
            tokenBalance: data.tokenBalance,
            vehicleId: data.vehicleId || null,
            vehicleReg: data.vehicleReg || null,
            qrSecret: data.qrSecret || null
        });

        return data;
    },

    /**
     * Verify transaction PIN (before a payment)
     */
    async verifyTxnPin(txnPin) {
        const data = await apiCall('/api/auth/verify-txn-pin', {
            method: 'POST',
            body: JSON.stringify({ txnPin })
        });
        return data.valid === true;
    },

    logout() {
        clearSession();
    }
};

// =====================================================
// TRANSACTIONS API
// =====================================================

const TransactionsAPI = {
    /**
     * Record a kombi fare payment (passenger pays driver)
     */
    async recordFare({ vehicleId, amount, hmacSignature, txnId, deviceCreatedAt }) {
        return apiCall('/api/transactions/fare', {
            method: 'POST',
            body: JSON.stringify({ vehicleId, amount, hmacSignature, txnId, deviceCreatedAt })
        });
    },

    /**
     * Record a change transfer (user-to-user)
     */
    async recordChange({ toUserId, toPhone, amount, txnId, deviceCreatedAt }) {
        return apiCall('/api/transactions/change', {
            method: 'POST',
            body: JSON.stringify({ toUserId, toPhone, amount, txnId, deviceCreatedAt })
        });
    },

    /**
     * Upload offline queue to server
     */
    async syncQueue(transactions) {
        return apiCall('/api/transactions/sync', {
            method: 'POST',
            body: JSON.stringify({ transactions })
        });
    },

    /**
     * Get transaction history for current user
     */
    async getHistory() {
        const data = await apiCall('/api/transactions/history');
        return data.transactions || [];
    }
};

// =====================================================
// USER API
// =====================================================

const UserAPI = {
    /**
     * Get current token balance from server
     */
    async getBalance(userId) {
        const data = await apiCall(`/api/users/${userId}/balance`);
        return data.tokenBalance;
    }
};

// =====================================================
// TOPUP API (v1.1.0)
// =====================================================

const TopupAPI = {
    /**
     * Submit a manual top-up request.
     * Admin will approve it and credit tokens.
     * @param {object} params
     * @param {number} params.amount       - Amount in USD tokens (e.g. 5.00)
     * @param {string} params.paymentRef   - EcoCash/Innbucks transaction reference
     * @param {string} params.paymentMethod - 'ecocash' | 'innbucks' | 'onemoney' | 'cash' | 'other'
     */
    async requestTopup({ amount, paymentRef, paymentMethod }) {
        return apiCall('/api/topup/request', {
            method: 'POST',
            body: JSON.stringify({ amount, paymentRef, paymentMethod })
        });
    }
};


// =====================================================
// OFFLINE QUEUE (IndexedDB)
// =====================================================

class OfflineQueue {
    constructor() {
        this.DB_NAME = 'changeit_offline_v1';
        this.STORE = 'queue';
        this.db = null;
    }

    async _getDb() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE)) {
                    const store = db.createObjectStore(this.STORE, { keyPath: 'id' });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
            req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
            req.onerror = () => reject(req.error);
        });
    }

    async add(txn) {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readwrite');
            tx.objectStore(this.STORE).add({ ...txn, synced: false, addedAt: new Date().toISOString() });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    async getPending() {
        const db = await this._getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).index('synced').getAll(false);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async markSynced(ids) {
        const db = await this._getDb();
        const tx = db.transaction(this.STORE, 'readwrite');
        const store = tx.objectStore(this.STORE);
        for (const id of ids) {
            const req = store.get(id);
            req.onsuccess = () => {
                if (req.result) { req.result.synced = true; store.put(req.result); }
            };
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }

    async count() {
        const pending = await this.getPending();
        return pending.length;
    }
}

// =====================================================
// CRYPTO SIGNER — HMAC-SHA256 (SubtleCrypto)
// =====================================================

const CryptoSigner = {
    /**
     * Sign a QR code payload using the vehicle's secret key
     * Data string: `vehicleId:amount:timestamp`
     */
    async sign(data, secretHex) {
        const enc = new TextEncoder();
        const keyBytes = CryptoSigner._hexToBytes(secretHex);
        const key = await crypto.subtle.importKey(
            'raw', keyBytes,
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
        return CryptoSigner._bytesToHex(new Uint8Array(sig));
    },

    /**
     * Verify a QR code signature
     */
    async verify(data, signatureHex, secretHex) {
        const expected = await CryptoSigner.sign(data, secretHex);
        return expected === signatureHex;
    },

    /**
     * Build the QR payload data string for a vehicle payment
     */
    buildQRData(vehicleId, amount, timestamp) {
        return `${vehicleId}:${amount}:${timestamp}`;
    },

    _bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    _hexToBytes(hex) {
        const arr = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.substr(i, 2), 16);
        return arr;
    }
};

// =====================================================
// SYNC ENGINE
// =====================================================

class SyncEngine {
    constructor() {
        this.queue = new OfflineQueue();
        this._syncing = false;
    }

    /**
     * Queue a transaction for offline sync
     */
    async queueTransaction(txn) {
        await this.queue.add(txn);
    }

    /**
     * Attempt to sync all pending transactions with the server
     */
    async sync() {
        if (!navigator.onLine || this._syncing) return { synced: 0 };
        this._syncing = true;

        try {
            const pending = await this.queue.getPending();
            if (!pending.length) return { synced: 0 };

            console.log(`[SyncEngine] Syncing ${pending.length} queued transactions...`);
            const result = await TransactionsAPI.syncQueue(pending);

            const syncedIds = result.results
                .filter(r => r.synced)
                .map(r => r.id);

            await this.queue.markSynced(syncedIds);
            console.log(`[SyncEngine] Synced ${syncedIds.length}/${pending.length} ✅`);
            return { synced: syncedIds.length, total: pending.length };
        } catch (e) {
            console.warn('[SyncEngine] Sync failed:', e.message);
            return { synced: 0, error: e.message };
        } finally {
            this._syncing = false;
        }
    }

    /**
     * Start auto-sync (every 15 seconds + on reconnect)
     */
    startAutoSync(onSync) {
        window.addEventListener('online', () => this.sync().then(onSync));
        setInterval(() => this.sync().then(onSync), 15000);
        // Initial attempt
        setTimeout(() => this.sync().then(onSync), 2000);
    }

    async pendingCount() {
        return this.queue.count();
    }
}

// =====================================================
// EXPORTS — available globally for app.js
// =====================================================

window.ChangeItAPI = {
    auth: AuthAPI,
    transactions: TransactionsAPI,
    user: UserAPI,
    topup: TopupAPI,
    getSession,
    saveSession,
    clearSession
};

window.ChangeItOfflineQueue = OfflineQueue;
window.ChangeItCrypto = CryptoSigner;
window.ChangeItSyncEngine = SyncEngine;
