document.addEventListener('DOMContentLoaded', () => {
    const app = new PaywegaApp();
    app.init();
});

class PaywegaApp {
    constructor() {
        this.root = document.getElementById('paywega-app-root');

        // Token Economics
        this.PURCHASE_FEE = 0.02;
        this.REDEEM_FEE = 0.01;
        this.MIN_FARE = 0.5;

        // Fare Presets
        this.FARE_PRESETS = [
            { label: 'Short Route', tokens: 0.50 },
            { label: 'Medium Route', tokens: 0.75 },
            { label: 'Long Route', tokens: 1.00 },
            { label: 'Cross-City', tokens: 1.50 }
        ];

        // Blocked weak PINs
        this.BLOCKED_PINS = ['0000', '1111', '1234', '4321', '0123', '9999', '1212', '2222', '3333', '4444', '5555', '6666', '7777', '8888'];

        // Session timeout (15 minutes)
        this.SESSION_TIMEOUT = 15 * 60 * 1000;

        this.state = this.getDefaultState();
    }

    getDefaultState() {
        return {
            currentUser: null,
            sessionStart: null,
            users: {},
            drivers: {},
            vehicles: {},
            transactions: [],
            pendingOTP: null,
            qrRegistry: [], // Track all generated QR codes for accountability
            // Driver registration codes - issued by Paywega offices after document verification
            driverRegistrationCodes: {
                // Demo codes for testing
                'PWG-DRV-2024-001': { vehicleReg: 'ADZ-1234', status: 'available', issuedAt: '2024-12-01', expiresAt: '2025-12-01' },
                'PWG-DRV-2024-002': { vehicleReg: 'ABC-5678', status: 'available', issuedAt: '2024-12-15', expiresAt: '2025-12-15' },
                'PWG-DRV-2024-003': { vehicleReg: null, status: 'available', issuedAt: '2024-12-20', expiresAt: '2025-12-20' }, // Any vehicle
                'DEMO-CODE-123': { vehicleReg: null, status: 'available', issuedAt: '2024-01-01', expiresAt: '2026-01-01' } // Demo code for testing
            }
        };
    }

    init() {
        this.loadState();
        this.checkSession();
    }

    // ============================
    // SESSION MANAGEMENT
    // ============================

    checkSession() {
        if (this.state.currentUser && this.state.sessionStart) {
            const elapsed = Date.now() - this.state.sessionStart;
            if (elapsed > this.SESSION_TIMEOUT) {
                // Session expired
                this.logout();
                this.showToast('Session expired. Please login again.');
                return;
            }
        }

        if (this.state.currentUser) {
            const user = this.state.users[this.state.currentUser];
            if (user) {
                this.routeToDashboard(user.role);
                return;
            }
        }

        this.renderWelcome();
    }

    refreshSession() {
        this.state.sessionStart = Date.now();
        this.saveState();
    }

    loadState() {
        const saved = localStorage.getItem('paywega_auth_v1');
        if (saved) {
            this.state = JSON.parse(saved);
        }

        // ALWAYS ensure demo vehicles exist (needed for cross-device scanning)
        this.ensureDemoVehicles();
    }

    ensureDemoVehicles() {
        // Always add demo driver and vehicle so scanning works across devices
        if (!this.state.drivers['DRV-DEMO-001']) {
            this.state.drivers['DRV-DEMO-001'] = {
                userId: 'USR-DEMO-002',
                driverId: 'DRV-DEMO-001',
                vehicleId: 'VH-DEMO-001',
                combiNickname: 'Bossbaby',
                route: 'City - Avondale',
                tokensEarned: 12.50
            };
        }

        if (!this.state.vehicles['VH-DEMO-001']) {
            this.state.vehicles['VH-DEMO-001'] = {
                id: 'VH-DEMO-001',
                regNumber: 'ADZ-1234',
                ownerId: 'USR-DEMO-002',
                nickname: 'Bossbaby',
                route: 'City - Avondale',
                qrCode: 'paywega://pay/vehicle/VH-DEMO-001'
            };
        }

        // Also ensure any dynamically registered vehicles are recognized
        // by adding their data to all devices that scan them
        this.saveState();
    }

    seedDemoData() {
        // Pre-registered demo user (MTN's number for testing)
        this.state.users['USR-DEMO-001'] = {
            id: 'USR-DEMO-001',
            phone: '+263779770395',
            name: 'Demo User',
            pinHash: this.hashPin('1357'), // Demo PIN: 1357
            txnPinHash: this.hashPin('2468'), // Demo TXN PIN: 2468
            tokenBalance: 25.00,
            role: 'commuter',
            verified: true,
            failedAttempts: 0,
            lockedUntil: null,
            createdAt: new Date().toISOString()
        };

        // Demo driver "Bossbaby"
        this.state.users['USR-DEMO-002'] = {
            id: 'USR-DEMO-002',
            phone: '+263771234567',
            name: 'Tino Driver',
            pinHash: this.hashPin('1234'),
            txnPinHash: this.hashPin('4321'),
            tokenBalance: 0,
            role: 'driver',
            verified: true,
            failedAttempts: 0,
            createdAt: new Date().toISOString()
        };

        this.state.drivers['DRV-DEMO-001'] = {
            userId: 'USR-DEMO-002',
            driverId: 'DRV-DEMO-001',
            vehicleId: 'VH-DEMO-001',
            combiNickname: 'Bossbaby',
            route: 'City - Avondale',
            tokensEarned: 12.50
        };

        this.state.vehicles['VH-DEMO-001'] = {
            id: 'VH-DEMO-001',
            regNumber: 'ADZ-1234',
            ownerId: 'USR-DEMO-002',
            nickname: 'Bossbaby',
            route: 'City - Avondale',
            qrCode: 'paywega://pay/vehicle/VH-DEMO-001'
        };

        // Welcome bonus transaction
        this.state.transactions.push({
            id: 'TXN-DEMO-001',
            type: 'bonus',
            userId: 'USR-DEMO-001',
            tokens: 25.00,
            description: 'Welcome Bonus 🎉',
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        this.saveState();
    }

    saveState() {
        localStorage.setItem('paywega_auth_v1', JSON.stringify(this.state));
    }

    generateId(prefix) {
        return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Generate unique QR ID with UUID-like format
    generateQRId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        return `QR-${timestamp}-${randomPart}`.toUpperCase();
    }

    // Log QR code to registry for accountability
    logQRCode(qrId, type, data) {
        const currentUser = this.state.users[this.state.currentUser];
        const qrRecord = {
            id: qrId,
            type: type, // 'user', 'vehicle', 'vehicle_fare'
            createdAt: new Date().toISOString(),
            createdBy: this.state.currentUser,
            creatorPhone: currentUser?.phone || 'Unknown',
            vehicleId: data.vehicleId || null,
            vehicleReg: data.vehicleReg || null,
            vehicleNickname: data.vehicleNickname || null,
            fareAmount: data.fareAmount || null,
            route: data.route || null,
            status: 'active', // 'active', 'used', 'expired'
            usedAt: null,
            usedBy: null,
            expiresAt: data.expiresAt || null
        };

        // Initialize qrRegistry if it doesn't exist (for backwards compatibility)
        if (!this.state.qrRegistry) {
            this.state.qrRegistry = [];
        }

        this.state.qrRegistry.push(qrRecord);
        this.saveState();

        console.log('[QR AUDIT] Generated:', qrRecord);
        return qrRecord;
    }

    // Mark QR as used when scanned
    markQRUsed(qrId, userId) {
        if (!this.state.qrRegistry) return;

        const qr = this.state.qrRegistry.find(q => q.id === qrId);
        if (qr) {
            qr.status = 'used';
            qr.usedAt = new Date().toISOString();
            qr.usedBy = userId;
            this.saveState();
            console.log('[QR AUDIT] Used:', qr);
        }
    }

    // Simple hash function for PIN (in production, use bcrypt on server)
    hashPin(pin) {
        let hash = 0;
        const salt = 'paywega_2024';
        const salted = salt + pin + salt;
        for (let i = 0; i < salted.length; i++) {
            const char = salted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    validatePhone(phone) {
        // TEMPORARILY DISABLED FOR TESTING - always return true
        console.log('Phone validation bypassed for testing. Input:', phone);
        return true;
    }

    formatPhone(phone) {
        let cleaned = phone.replace(/[\s\-]/g, '');

        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }

        // Remove 263 prefix if present (with or without +)
        if (cleaned.startsWith('+263')) {
            cleaned = cleaned.substring(4);
        } else if (cleaned.startsWith('263')) {
            cleaned = cleaned.substring(3);
        }

        // Now we should have 9 digits starting with 7
        return '+263' + cleaned;
    }

    validatePin(pin) {
        if (!/^\d{4}$/.test(pin)) {
            return { valid: false, error: 'PIN must be exactly 4 digits' };
        }
        if (this.BLOCKED_PINS.includes(pin)) {
            return { valid: false, error: 'This PIN is too easy to guess. Choose a stronger PIN.' };
        }
        return { valid: true };
    }

    // Validate driver registration code from Paywega offices
    validateDriverCode(code, vehicleReg) {
        const cleanCode = code.trim().toUpperCase();

        // Initialize codes if not exists (backwards compatibility)
        if (!this.state.driverRegistrationCodes) {
            this.state.driverRegistrationCodes = {};
        }

        const codeData = this.state.driverRegistrationCodes[cleanCode];

        if (!codeData) {
            return { valid: false, error: 'Invalid registration code. Please visit Paywega offices to obtain a valid code.' };
        }

        if (codeData.status === 'used') {
            return { valid: false, error: 'This code has already been used.' };
        }

        // Check expiry
        if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
            return { valid: false, error: 'This code has expired. Please obtain a new code from Paywega offices.' };
        }

        // Check if code is tied to a specific vehicle
        if (codeData.vehicleReg && codeData.vehicleReg.toUpperCase() !== vehicleReg.toUpperCase()) {
            return { valid: false, error: `This code is issued for vehicle ${codeData.vehicleReg}, not ${vehicleReg}.` };
        }

        return { valid: true, codeData: codeData };
    }

    // Mark driver registration code as used
    markDriverCodeUsed(code, userId, vehicleReg) {
        const cleanCode = code.trim().toUpperCase();
        const codeData = this.state.driverRegistrationCodes[cleanCode];

        if (codeData) {
            codeData.status = 'used';
            codeData.usedBy = userId;
            codeData.usedForVehicle = vehicleReg;
            codeData.usedAt = new Date().toISOString();
            this.saveState();
            console.log('[DRIVER REG] Code used:', cleanCode, codeData);
        }
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // ============================
    // SCREENS
    // ============================

    renderWelcome() {
        const tmpl = document.getElementById('tmpl-welcome').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.root.querySelector('.btn-register').addEventListener('click', () => {
            this.renderPhoneEntry('register');
        });

        this.root.querySelector('.btn-login').addEventListener('click', () => {
            this.renderPhoneEntry('login');
        });
    }

    renderPhoneEntry(mode) {
        const tmpl = document.getElementById('tmpl-phone-entry').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const title = mode === 'register' ? 'Create Account' : 'Login';
        this.root.querySelector('.screen-title').textContent = title;

        this.root.querySelector('.btn-back').addEventListener('click', () => this.renderWelcome());

        this.root.querySelector('#phone-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = this.root.querySelector('#phone-input').value;

            if (!this.validatePhone(phone)) {
                this.showToast('Please enter a valid Zimbabwe phone number');
                return;
            }

            const formattedPhone = this.formatPhone(phone);

            if (mode === 'register') {
                // Check if already registered
                const existing = Object.values(this.state.users).find(u => u.phone === formattedPhone);
                if (existing) {
                    this.showToast('This number is already registered. Please login.');
                    return;
                }
                this.startRegistration(formattedPhone);
            } else {
                // Login - check if exists
                const user = Object.values(this.state.users).find(u => u.phone === formattedPhone);
                if (!user) {
                    this.showToast('Account not found. Please register first.');
                    return;
                }
                this.renderPinLogin(user);
            }
        });
    }

    startRegistration(phone) {
        // Generate OTP
        const otp = this.generateOTP();
        this.state.pendingOTP = {
            phone: phone,
            code: otp,
            expires: Date.now() + (5 * 60 * 1000), // 5 minutes
            attempts: 0
        };
        this.saveState();

        // In production, send real SMS here
        console.log(`[DEMO] OTP for ${phone}: ${otp}`);

        this.renderOTPVerification(phone, otp);
    }

    renderOTPVerification(phone, demoOTP) {
        const tmpl = document.getElementById('tmpl-otp-verify').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.root.querySelector('.otp-phone').textContent = phone;

        // Show demo OTP (remove in production!)
        this.root.querySelector('.demo-otp').textContent = `Demo OTP: ${demoOTP}`;

        this.root.querySelector('.btn-back').addEventListener('click', () => this.renderWelcome());

        // Auto-focus first input
        const inputs = this.root.querySelectorAll('.otp-input');
        inputs[0].focus();

        // OTP input handling
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        this.root.querySelector('#otp-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredOTP = Array.from(inputs).map(i => i.value).join('');

            if (enteredOTP.length !== 6) {
                this.showToast('Please enter the 6-digit code');
                return;
            }

            this.verifyOTP(enteredOTP, phone);
        });

        // Resend OTP
        this.root.querySelector('.btn-resend').addEventListener('click', () => {
            this.startRegistration(phone);
            this.showToast('New code sent!');
        });
    }

    verifyOTP(enteredOTP, phone) {
        const pending = this.state.pendingOTP;

        if (!pending || pending.phone !== phone) {
            this.showToast('Session expired. Please try again.');
            this.renderWelcome();
            return;
        }

        if (Date.now() > pending.expires) {
            this.showToast('Code expired. Please request a new one.');
            return;
        }

        pending.attempts++;

        if (pending.attempts > 3) {
            this.showToast('Too many attempts. Please request a new code.');
            this.state.pendingOTP = null;
            this.saveState();
            this.renderWelcome();
            return;
        }

        if (enteredOTP !== pending.code) {
            this.showToast('Incorrect code. Please try again.');
            this.saveState();
            return;
        }

        // Success - proceed to role selection
        this.state.pendingOTP = null;
        this.saveState();
        this.renderRoleSelection(phone);
    }

    renderRoleSelection(phone) {
        const tmpl = document.getElementById('tmpl-role-select').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.root.querySelector('.btn-role-commuter').addEventListener('click', () => {
            this.renderCreatePin(phone, 'commuter');
        });

        this.root.querySelector('.btn-role-driver').addEventListener('click', () => {
            this.renderDriverDetails(phone);
        });
    }

    renderDriverDetails(phone) {
        const tmpl = document.getElementById('tmpl-driver-details').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.root.querySelector('.btn-back').addEventListener('click', () => this.renderRoleSelection(phone));

        this.root.querySelector('#driver-details-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const regCode = this.root.querySelector('#driver-reg-code').value.trim().toUpperCase();
            const name = this.root.querySelector('#driver-name').value.trim();
            const nickname = this.root.querySelector('#combi-nickname').value.trim();
            const regNumber = this.root.querySelector('#vehicle-reg').value.trim().toUpperCase();
            const route = this.root.querySelector('#vehicle-route').value.trim();

            // Validate registration code first
            if (!regCode) {
                this.showToast('Registration code is required!');
                return;
            }

            const codeValidation = this.validateDriverCode(regCode, regNumber);
            if (!codeValidation.valid) {
                this.showToast(codeValidation.error);
                return;
            }

            if (!nickname) {
                this.showToast('Combi nickname is required!');
                return;
            }

            if (!regNumber) {
                this.showToast('Vehicle registration is required!');
                return;
            }

            // Code is valid - proceed with registration
            this.showToast('Code verified! ✓');
            this.renderCreatePin(phone, 'driver', { name, nickname, regNumber, route, regCode });
        });
    }

    renderCreatePin(phone, role, driverDetails = null) {
        const tmpl = document.getElementById('tmpl-create-pin').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const inputs = this.root.querySelectorAll('.pin-input');
        inputs[0].focus();

        // PIN input handling
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        this.root.querySelector('#create-pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = Array.from(inputs).map(i => i.value).join('');

            const validation = this.validatePin(pin);
            if (!validation.valid) {
                this.showToast(validation.error);
                return;
            }

            this.renderConfirmPin(phone, role, pin, driverDetails);
        });
    }

    renderConfirmPin(phone, role, pin, driverDetails) {
        const tmpl = document.getElementById('tmpl-confirm-pin').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const inputs = this.root.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        this.root.querySelector('#confirm-pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const confirmPin = Array.from(inputs).map(i => i.value).join('');

            if (confirmPin !== pin) {
                this.showToast('PINs do not match. Please try again.');
                inputs.forEach(i => i.value = '');
                inputs[0].focus();
                return;
            }

            this.renderCreateTxnPin(phone, role, pin, driverDetails);
        });
    }

    renderCreateTxnPin(phone, role, loginPin, driverDetails) {
        const tmpl = document.getElementById('tmpl-create-txn-pin').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const inputs = this.root.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        this.root.querySelector('#txn-pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const txnPin = Array.from(inputs).map(i => i.value).join('');

            const validation = this.validatePin(txnPin);
            if (!validation.valid) {
                this.showToast(validation.error);
                return;
            }

            if (txnPin === loginPin) {
                this.showToast('Transaction PIN must be different from Login PIN');
                return;
            }

            this.completeRegistration(phone, role, loginPin, txnPin, driverDetails);
        });
    }

    completeRegistration(phone, role, loginPin, txnPin, driverDetails) {
        const userId = this.generateId('USR');

        // Create user
        this.state.users[userId] = {
            id: userId,
            phone: phone,
            name: driverDetails?.name || 'Commuter',
            pinHash: this.hashPin(loginPin),
            txnPinHash: this.hashPin(txnPin),
            tokenBalance: 5.00, // Welcome bonus
            role: role,
            verified: true,
            failedAttempts: 0,
            lockedUntil: null,
            createdAt: new Date().toISOString()
        };

        // Welcome bonus transaction
        this.state.transactions.push({
            id: this.generateId('TXN'),
            type: 'bonus',
            userId: userId,
            tokens: 5.00,
            description: 'Welcome Bonus 🎉',
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        // If driver, create driver and vehicle records
        if (role === 'driver' && driverDetails) {
            const driverId = this.generateId('DRV');
            const vehicleId = this.generateId('VH');

            this.state.drivers[driverId] = {
                userId: userId,
                driverId: driverId,
                vehicleId: vehicleId,
                combiNickname: driverDetails.nickname,
                route: driverDetails.route,
                tokensEarned: 0,
                registrationCode: driverDetails.regCode // Store the registration code used
            };

            this.state.vehicles[vehicleId] = {
                id: vehicleId,
                regNumber: driverDetails.regNumber,
                ownerId: userId,
                nickname: driverDetails.nickname,
                route: driverDetails.route,
                qrCode: `paywega://pay/vehicle/${vehicleId}`,
                registrationCode: driverDetails.regCode
            };

            // Mark the registration code as used
            if (driverDetails.regCode) {
                this.markDriverCodeUsed(driverDetails.regCode, userId, driverDetails.regNumber);
            }
        }

        // Log in
        this.state.currentUser = userId;
        this.state.sessionStart = Date.now();
        this.saveState();

        this.showSuccessScreen('Account Created!', 'You received 5 tokens as a welcome bonus.', () => {
            this.routeToDashboard(role);
        });
    }

    renderPinLogin(user) {
        // Check if account is locked
        if (user.lockedUntil && Date.now() < user.lockedUntil) {
            const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
            this.showToast(`Account locked. Try again in ${remaining} minutes.`);
            return;
        }

        const tmpl = document.getElementById('tmpl-pin-login').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.root.querySelector('.login-phone').textContent = user.phone;
        this.root.querySelector('.btn-back').addEventListener('click', () => this.renderWelcome());

        const inputs = this.root.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Auto-submit when 4 digits entered
                if (index === 3 && e.target.value) {
                    const pin = Array.from(inputs).map(i => i.value).join('');
                    this.verifyLoginPin(user, pin, inputs);
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }

    verifyLoginPin(user, pin, inputs) {
        if (this.hashPin(pin) !== user.pinHash) {
            user.failedAttempts = (user.failedAttempts || 0) + 1;

            if (user.failedAttempts >= 3) {
                user.lockedUntil = Date.now() + (15 * 60 * 1000); // Lock for 15 min
                user.failedAttempts = 0;
                this.saveState();
                this.showToast('Account locked for 15 minutes due to failed attempts.');
                this.renderWelcome();
                return;
            }

            this.saveState();
            this.showToast(`Incorrect PIN. ${3 - user.failedAttempts} attempts remaining.`);
            inputs.forEach(i => i.value = '');
            inputs[0].focus();
            return;
        }

        // Success
        user.failedAttempts = 0;
        this.state.currentUser = user.id;
        this.state.sessionStart = Date.now();
        this.saveState();

        this.routeToDashboard(user.role);
    }

    routeToDashboard(role) {
        this.refreshSession();
        if (role === 'driver') {
            this.renderDriverDashboard();
        } else if (role === 'owner') {
            this.renderOwnerDashboard();
        } else {
            this.renderCommuterDashboard();
        }
    }

    // ============================
    // DASHBOARDS
    // ============================

    renderCommuterDashboard() {
        const tmpl = document.getElementById('tmpl-commuter').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        this.updateCommuterUI();

        // Handlers
        this.root.querySelector('.btn-logout').addEventListener('click', () => this.logout());
        this.root.querySelector('.btn-ecocash').addEventListener('click', () => this.showTopupModal());
        this.root.querySelector('.btn-scan').addEventListener('click', () => this.launchScanner());
        this.root.querySelector('.btn-send-money').addEventListener('click', () => this.showSendModal());
        this.root.querySelector('.btn-my-qr').addEventListener('click', () => this.showMyQR());
    }

    renderDriverDashboard() {
        const tmpl = document.getElementById('tmpl-driver').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const user = this.state.users[this.state.currentUser];
        const driver = Object.values(this.state.drivers).find(d => d.userId === user.id);
        const vehicle = driver ? this.state.vehicles[driver.vehicleId] : null;

        if (driver && vehicle) {
            this.root.querySelector('.vehicle-nickname').textContent = `"${driver.combiNickname}"`;
            this.root.querySelector('.vehicle-reg').textContent = vehicle.regNumber;
            this.root.querySelector('.vehicle-route').textContent = driver.route;
        }

        this.updateDriverUI();

        // Handlers
        this.root.querySelector('.btn-logout').addEventListener('click', () => this.logout());
        this.root.querySelector('.btn-show-qr').addEventListener('click', () => this.showVehicleQR());
        this.root.querySelector('.btn-withdraw').addEventListener('click', () => this.showWithdrawModal());
    }

    renderOwnerDashboard() {
        const tmpl = document.getElementById('tmpl-owner').content.cloneNode(true);
        this.root.innerHTML = '';
        this.root.appendChild(tmpl);

        const totalEarnings = Object.values(this.state.drivers).reduce((sum, d) => sum + d.tokensEarned, 0);
        this.root.querySelector('#owner-total').textContent = totalEarnings.toFixed(2);

        const fleetList = this.root.querySelector('.fleet-list');
        Object.values(this.state.vehicles).forEach(v => {
            const driver = Object.values(this.state.drivers).find(d => d.vehicleId === v.id);
            if (driver) {
                const div = document.createElement('div');
                div.className = 'fleet-item';
                div.innerHTML = `
                    <div>
                        <strong>"${driver.combiNickname}"</strong>
                        <small>${v.regNumber} • ${driver.route}</small>
                    </div>
                    <span class="badge-earnings">${driver.tokensEarned.toFixed(2)} tokens</span>
                `;
                fleetList.appendChild(div);
            }
        });

        this.root.querySelector('.btn-logout').addEventListener('click', () => this.logout());
    }

    updateCommuterUI() {
        const user = this.state.users[this.state.currentUser];
        if (!user) return;

        const balEl = document.getElementById('commuter-balance');
        const nameEl = this.root.querySelector('.user-name');
        const listEl = document.getElementById('commuter-history');

        if (balEl) balEl.textContent = user.tokenBalance.toFixed(2);
        if (nameEl) nameEl.textContent = user.name || 'Commuter';

        if (listEl) {
            const userTxns = this.state.transactions
                .filter(t => t.userId === user.id || t.fromUserId === user.id)
                .slice(-10)
                .reverse();

            listEl.innerHTML = userTxns.map(t => {
                const isDebit = t.fromUserId === user.id;
                return `
                    <li class="trans-item">
                        <div>
                            <span>${t.description}</span>
                            ${t.vehicleNickname ? `<small class="nickname">"${t.vehicleNickname}"</small>` : ''}
                        </div>
                        <span class="${isDebit ? 'trans-minus' : 'trans-plus'}">
                            ${isDebit ? '-' : '+'}${t.tokens.toFixed(2)}
                        </span>
                    </li>
                `;
            }).join('') || '<li class="trans-item"><span>No transactions yet</span></li>';
        }
    }

    updateDriverUI() {
        const user = this.state.users[this.state.currentUser];
        const driver = Object.values(this.state.drivers).find(d => d.userId === user?.id);
        if (!driver) return;

        const balEl = document.getElementById('driver-balance');
        const listEl = document.getElementById('driver-history');

        if (balEl) balEl.textContent = driver.tokensEarned.toFixed(2);

        if (listEl) {
            const driverTxns = this.state.transactions
                .filter(t => t.toDriverId === driver.driverId)
                .slice(-10)
                .reverse();

            listEl.innerHTML = driverTxns.map(t => `
                <li class="trans-item">
                    <span>Fare Received</span>
                    <span class="trans-plus">+${t.tokens.toFixed(2)}</span>
                </li>
            `).join('') || '<li class="trans-item"><span>No fares yet</span></li>';
        }
    }

    logout() {
        this.state.currentUser = null;
        this.state.sessionStart = null;
        this.saveState();
        this.renderWelcome();
    }

    // ============================
    // QR SCANNER
    // ============================

    async launchScanner() {
        const tmpl = document.getElementById('tmpl-scanner').content.cloneNode(true);
        this.root.appendChild(tmpl);

        const overlay = this.root.querySelector('.scanner-overlay');
        const html5QrCode = new Html5Qrcode("reader");

        const stopScanner = async () => {
            try {
                if (html5QrCode.isScanning) await html5QrCode.stop();
                html5QrCode.clear();
            } catch (err) {
                console.error("Scanner stop error", err);
            }
            overlay.remove();
        };

        overlay.querySelector('.btn-close-scanner').addEventListener('click', stopScanner);

        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    stopScanner().then(() => this.handleScannedQR(decodedText));
                },
                () => { }
            );
        } catch (err) {
            console.error("Scanner start error", err);
            this.showToast("Camera access denied");
            overlay.remove();
        }
    }

    handleScannedQR(qrData) {
        // New format with unique ID: paywega://pay/vehicle/VH-001?fare=0.75&qrid=QR-ABC123
        // Old format: paywega://pay/vehicle/VH-001?fare=0.75
        // Legacy format: paywega://pay/vehicle/VH-001
        const match = qrData.match(/paywega:\/\/pay\/vehicle\/([^?]+)(\?fare=([^&]+))?(&qrid=(.+))?/);

        if (match) {
            const vehicleId = match[1];
            const fareFromQR = match[3] ? parseFloat(match[3]) : null;
            const qrId = match[5] || null;
            const vehicle = this.state.vehicles[vehicleId];

            if (vehicle) {
                const driver = Object.values(this.state.drivers).find(d => d.vehicleId === vehicleId);

                // Mark QR as used if it has a unique ID
                if (qrId) {
                    this.markQRUsed(qrId, this.state.currentUser);
                }

                this.showPaymentModal(vehicle, driver, fareFromQR, qrId);
            } else {
                this.showToast('Vehicle not found');
            }
        } else {
            this.showToast('Invalid QR code');
        }
    }

    // ============================
    // PAYMENT MODALS
    // ============================

    showPaymentModal(vehicle, driver, fareFromQR = null) {
        const user = this.state.users[this.state.currentUser];

        // If fare is set by driver, show simple confirmation
        if (fareFromQR !== null) {
            this.showFixedFareConfirmation(vehicle, driver, fareFromQR, user);
            return;
        }

        // Otherwise show fare selection (old QR codes without fare)
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal payment-modal">
                <div class="modal-header">
                    <h3>Pay Fare</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="vehicle-info-display">
                        <div class="nickname-large">"${driver?.combiNickname || vehicle.nickname}"</div>
                        <div class="vehicle-meta">
                            <span>${vehicle.regNumber}</span>
                            <span>${driver?.route || ''}</span>
                        </div>
                    </div>
                    
                    <div class="fare-presets">
                        ${this.FARE_PRESETS.map(f => `
                            <button class="btn-preset" data-tokens="${f.tokens}">
                                <span class="preset-label">${f.label}</span>
                                <span class="preset-amount">${f.tokens}</span>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="custom-amount">
                        <label>Custom Amount</label>
                        <input type="number" id="custom-fare" step="0.25" min="${this.MIN_FARE}" placeholder="${this.MIN_FARE}">
                    </div>
                    
                    <div class="balance-display">
                        Balance: <strong>${user.tokenBalance.toFixed(2)} tokens</strong>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-pay" disabled>Pay</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        let selectedAmount = 0;
        const payBtn = modal.querySelector('.btn-pay');
        const customInput = modal.querySelector('#custom-fare');

        modal.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAmount = parseFloat(btn.dataset.tokens);
                customInput.value = '';
                payBtn.disabled = false;
                payBtn.textContent = `Pay ${selectedAmount} tokens`;
            });
        });

        customInput.addEventListener('input', () => {
            modal.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('selected'));
            const val = parseFloat(customInput.value);
            if (val >= this.MIN_FARE) {
                selectedAmount = val;
                payBtn.disabled = false;
                payBtn.textContent = `Pay ${selectedAmount} tokens`;
            } else {
                payBtn.disabled = true;
                payBtn.textContent = 'Pay';
            }
        });

        payBtn.addEventListener('click', () => {
            if (selectedAmount > user.tokenBalance) {
                this.showToast('Insufficient balance');
                return;
            }
            modal.remove();
            this.showTxnPinModal(selectedAmount, vehicle, driver);
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    showFixedFareConfirmation(vehicle, driver, fareAmount, user) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal payment-modal fixed-fare">
                <div class="modal-header">
                    <h3>Confirm Payment</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="vehicle-info-display">
                        <div class="nickname-large">"${driver?.combiNickname || vehicle.nickname}"</div>
                        <div class="vehicle-meta">
                            <span>${vehicle.regNumber}</span>
                            <span>${driver?.route || ''}</span>
                        </div>
                    </div>
                    
                    <div class="fixed-fare-display">
                        <span class="fare-label">Fare</span>
                        <span class="fare-value">${fareAmount}</span>
                        <span class="fare-unit">tokens</span>
                    </div>
                    
                    <div class="balance-display">
                        Balance: <strong>${user.tokenBalance.toFixed(2)} tokens</strong>
                        ${fareAmount > user.tokenBalance ? '<span class="insufficient">Insufficient!</span>' : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-pay-now" ${fareAmount > user.tokenBalance ? 'disabled' : ''}>Pay ${fareAmount} tokens</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        modal.querySelector('.btn-pay-now')?.addEventListener('click', () => {
            modal.remove();
            this.showTxnPinModal(fareAmount, vehicle, driver);
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    showTxnPinModal(amount, vehicle, driver) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal txn-pin-modal">
                <div class="modal-header">
                    <h3>Enter Transaction PIN</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <p class="txn-summary">Pay <strong>${amount} tokens</strong> to "${driver?.combiNickname || vehicle.nickname}"</p>
                    <div class="pin-inputs">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                    </div>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        const inputs = modal.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                if (index === 3 && e.target.value) {
                    const pin = Array.from(inputs).map(i => i.value).join('');
                    this.verifyTxnPin(pin, amount, vehicle, driver, modal, inputs);
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    verifyTxnPin(pin, amount, vehicle, driver, modal, inputs) {
        const user = this.state.users[this.state.currentUser];

        if (this.hashPin(pin) !== user.txnPinHash) {
            this.showToast('Incorrect Transaction PIN');
            inputs.forEach(i => i.value = '');
            inputs[0].focus();
            return;
        }

        modal.remove();
        this.processPayment(amount, vehicle, driver);
    }

    processPayment(amount, vehicle, driver) {
        const user = this.state.users[this.state.currentUser];

        user.tokenBalance -= amount;
        if (driver) driver.tokensEarned += amount;

        this.state.transactions.push({
            id: this.generateId('TXN'),
            type: 'fare',
            userId: user.id,
            fromUserId: user.id,
            toDriverId: driver?.driverId,
            vehicleId: vehicle.id,
            vehicleNickname: driver?.combiNickname || vehicle.nickname,
            tokens: amount,
            description: `Fare to "${driver?.combiNickname || vehicle.nickname}"`,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        this.saveState();
        this.showPaymentSuccess(amount, driver?.combiNickname || vehicle.nickname);
    }

    showPaymentSuccess(amount, nickname) {
        const success = document.createElement('div');
        success.className = 'success-overlay';
        success.innerHTML = `
            <div class="success-content">
                <div class="success-icon"><i class="fas fa-check-circle"></i></div>
                <h2>Payment Successful!</h2>
                <div class="success-amount">${amount} tokens</div>
                <div class="success-to">Paid to "${nickname}"</div>
                <p>No change problems! 🎉</p>
            </div>
        `;

        this.root.appendChild(success);

        setTimeout(() => {
            success.remove();
            this.updateCommuterUI();
        }, 2500);
    }

    showTopupModal() {
        const user = this.state.users[this.state.currentUser];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal topup-modal">
                <div class="modal-header">
                    <h3>Buy Tokens</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <p>Purchase via EcoCash <small>(2% fee)</small></p>
                    
                    <div class="topup-presets">
                        <button class="btn-topup" data-usd="2">$2</button>
                        <button class="btn-topup" data-usd="5">$5</button>
                        <button class="btn-topup" data-usd="10">$10</button>
                        <button class="btn-topup" data-usd="20">$20</button>
                    </div>
                    
                    <div class="topup-calc" id="topup-calc"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-confirm-topup" disabled>Pay</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        let selectedUSD = 0;
        const confirmBtn = modal.querySelector('.btn-confirm-topup');
        const calcEl = modal.querySelector('#topup-calc');

        modal.querySelectorAll('.btn-topup').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.btn-topup').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedUSD = parseFloat(btn.dataset.usd);
                const tokens = selectedUSD * (1 - this.PURCHASE_FEE);
                calcEl.innerHTML = `You'll get <strong>${tokens.toFixed(2)} tokens</strong>`;
                confirmBtn.disabled = false;
            });
        });

        confirmBtn.addEventListener('click', () => {
            const tokens = selectedUSD * (1 - this.PURCHASE_FEE);
            user.tokenBalance += tokens;

            this.state.transactions.push({
                id: this.generateId('TXN'),
                type: 'topup',
                userId: user.id,
                tokens: tokens,
                description: 'EcoCash Top-up',
                timestamp: new Date().toISOString(),
                status: 'completed'
            });

            this.saveState();
            modal.remove();
            this.showToast(`Added ${tokens.toFixed(2)} tokens!`);
            this.updateCommuterUI();
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    showSendModal() {
        const user = this.state.users[this.state.currentUser];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal send-modal">
                <div class="modal-header">
                    <h3>Send Tokens</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Recipient Phone</label>
                        <input type="tel" id="send-phone" placeholder="+263 77...">
                    </div>
                    <div class="form-group">
                        <label>Amount</label>
                        <input type="number" id="send-amount" min="0.5" step="0.25" placeholder="1.00">
                    </div>
                    <div class="balance-display">Balance: ${user.tokenBalance.toFixed(2)} tokens</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-send-confirm">Send</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        modal.querySelector('.btn-send-confirm').addEventListener('click', () => {
            const phone = modal.querySelector('#send-phone').value;
            const amount = parseFloat(modal.querySelector('#send-amount').value);

            if (!phone || amount < 0.5 || amount > user.tokenBalance) {
                this.showToast('Invalid amount or insufficient balance');
                return;
            }

            modal.remove();
            // Show transaction PIN for sending
            this.showSendTxnPin(phone, amount);
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    showSendTxnPin(phone, amount) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal txn-pin-modal">
                <div class="modal-header">
                    <h3>Confirm with Transaction PIN</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <p class="txn-summary">Send <strong>${amount} tokens</strong> to ${phone}</p>
                    <div class="pin-inputs">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                    </div>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        const inputs = modal.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                if (index === 3 && e.target.value) {
                    const pin = Array.from(inputs).map(i => i.value).join('');
                    const user = this.state.users[this.state.currentUser];

                    if (this.hashPin(pin) !== user.txnPinHash) {
                        this.showToast('Incorrect PIN');
                        inputs.forEach(i => i.value = '');
                        inputs[0].focus();
                        return;
                    }

                    user.tokenBalance -= amount;
                    this.state.transactions.push({
                        id: this.generateId('TXN'),
                        type: 'transfer',
                        userId: user.id,
                        fromUserId: user.id,
                        toPhone: phone,
                        tokens: amount,
                        description: `Sent to ${phone}`,
                        timestamp: new Date().toISOString(),
                        status: 'completed'
                    });

                    this.saveState();
                    modal.remove();
                    this.showToast(`Sent ${amount} tokens to ${phone}`);
                    this.updateCommuterUI();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    showMyQR() {
        const user = this.state.users[this.state.currentUser];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal qr-modal">
                <div class="modal-header">
                    <h3>My QR Code</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div id="my-qr-code" class="qr-display"></div>
                    <p>Show to receive tokens</p>
                    <small>${user.phone}</small>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        new QRCode(modal.querySelector('#my-qr-code'), {
            text: `paywega://pay/user/${user.id}`,
            width: 200,
            height: 200,
            colorDark: "#0056b3"
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    showVehicleQR() {
        const user = this.state.users[this.state.currentUser];
        const driver = Object.values(this.state.drivers).find(d => d.userId === user.id);
        const vehicle = this.state.vehicles[driver?.vehicleId];

        if (!driver || !vehicle) return;

        // First, show fare selection modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal fare-select-modal">
                <div class="modal-header">
                    <h3>Set Fare Amount</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <p>Select fare for passengers</p>
                    
                    <div class="fare-presets">
                        ${this.FARE_PRESETS.map(f => `
                            <button class="btn-preset" data-tokens="${f.tokens}">
                                <span class="preset-label">${f.label}</span>
                                <span class="preset-amount">${f.tokens}</span>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="custom-amount">
                        <label>Custom Amount</label>
                        <input type="number" id="custom-fare" step="0.25" min="${this.MIN_FARE}" placeholder="${this.MIN_FARE}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-generate-qr" disabled>Generate QR</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        let selectedAmount = 0;
        const generateBtn = modal.querySelector('.btn-generate-qr');
        const customInput = modal.querySelector('#custom-fare');

        modal.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAmount = parseFloat(btn.dataset.tokens);
                customInput.value = '';
                generateBtn.disabled = false;
                generateBtn.textContent = `Generate QR (${selectedAmount} tokens)`;
            });
        });

        customInput.addEventListener('input', () => {
            modal.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('selected'));
            const val = parseFloat(customInput.value);
            if (val >= this.MIN_FARE) {
                selectedAmount = val;
                generateBtn.disabled = false;
                generateBtn.textContent = `Generate QR (${selectedAmount} tokens)`;
            } else {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate QR';
            }
        });

        generateBtn.addEventListener('click', () => {
            modal.remove();
            this.showQRWithFare(vehicle, driver, selectedAmount);
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    }

    showQRWithFare(vehicle, driver, fareAmount) {
        // Generate unique QR ID for tracking
        const qrId = this.generateQRId();

        // Log QR to registry for accountability
        this.logQRCode(qrId, 'vehicle_fare', {
            vehicleId: vehicle.id,
            vehicleReg: vehicle.regNumber,
            vehicleNickname: driver.combiNickname,
            fareAmount: fareAmount,
            route: driver.route
        });

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal qr-modal vehicle-qr">
                <div class="modal-header">
                    <h3>Show to Passengers</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="combi-title">"${driver.combiNickname}"</div>
                    <div class="fare-amount-display">${fareAmount} tokens</div>
                    <div id="vehicle-qr-code" class="qr-display"></div>
                    <p>Passenger scans to pay <strong>${fareAmount}</strong> tokens</p>
                    <small>${vehicle.regNumber} • ${driver.route}</small>
                    <div class="qr-id-display"><small>QR ID: ${qrId}</small></div>
                    <button class="btn-change-fare">Change Fare</button>
                    <button class="btn-qr-history"><i class="fas fa-history"></i> QR History</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        // Generate QR with unique ID encoded
        const qrData = `paywega://pay/vehicle/${vehicle.id}?fare=${fareAmount}&qrid=${qrId}`;
        new QRCode(modal.querySelector('#vehicle-qr-code'), {
            text: qrData,
            width: 250,
            height: 250,
            colorDark: "#0f172a"
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-change-fare').addEventListener('click', () => {
            modal.remove();
            this.showVehicleQR(); // Go back to fare selection
        });
        modal.querySelector('.btn-qr-history').addEventListener('click', () => {
            modal.remove();
            this.showQRHistory();
        });
    }

    showWithdrawModal() {
        const user = this.state.users[this.state.currentUser];
        const driver = Object.values(this.state.drivers).find(d => d.userId === user.id);

        if (!driver || driver.tokensEarned < 1) {
            this.showToast('Minimum withdrawal: 1 token');
            return;
        }

        const amount = driver.tokensEarned;
        const fee = amount * this.REDEEM_FEE;
        const payout = amount - fee;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal withdraw-modal">
                <div class="modal-header">
                    <h3>Withdraw to EcoCash</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="withdraw-summary">
                        <div class="row"><span>Tokens:</span><span>${amount.toFixed(2)}</span></div>
                        <div class="row"><span>Fee (1%):</span><span>-${fee.toFixed(2)}</span></div>
                        <div class="row total"><span>You'll receive:</span><span>$${payout.toFixed(2)}</span></div>
                    </div>
                    <p>Enter Transaction PIN to confirm</p>
                    <div class="pin-inputs">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                        <input type="password" inputmode="numeric" maxlength="1" class="pin-input">
                    </div>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        const inputs = modal.querySelectorAll('.pin-input');
        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                if (index === 3 && e.target.value) {
                    const pin = Array.from(inputs).map(i => i.value).join('');

                    if (this.hashPin(pin) !== user.txnPinHash) {
                        this.showToast('Incorrect PIN');
                        inputs.forEach(i => i.value = '');
                        inputs[0].focus();
                        return;
                    }

                    driver.tokensEarned = 0;
                    this.state.transactions.push({
                        id: this.generateId('TXN'),
                        type: 'withdrawal',
                        userId: user.id,
                        tokens: amount,
                        fee: fee,
                        payout: payout,
                        description: 'Withdrawal to EcoCash',
                        timestamp: new Date().toISOString(),
                        status: 'completed'
                    });

                    this.saveState();
                    modal.remove();
                    this.showToast(`$${payout.toFixed(2)} sent to EcoCash!`);
                    this.updateDriverUI();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    }

    // ============================
    // UTILITIES
    // ============================

    showToast(message) {
        const existing = this.root.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.root.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showSuccessScreen(title, message, callback) {
        const screen = document.createElement('div');
        screen.className = 'success-overlay';
        screen.innerHTML = `
            <div class="success-content">
                <div class="success-icon"><i class="fas fa-check-circle"></i></div>
                <h2>${title}</h2>
                <p>${message}</p>
            </div>
        `;

        this.root.appendChild(screen);

        setTimeout(() => {
            screen.remove();
            if (callback) callback();
        }, 2000);
    }

    // ============================
    // QR HISTORY / AUDIT TRAIL
    // ============================

    showQRHistory() {
        // Initialize if not exists
        if (!this.state.qrRegistry) {
            this.state.qrRegistry = [];
        }

        // Filter QRs created by current user
        const userQRs = this.state.qrRegistry
            .filter(qr => qr.createdBy === this.state.currentUser)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50); // Last 50 QRs

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal qr-history-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> QR Code History</h3>
                    <i class="fas fa-times btn-close-modal"></i>
                </div>
                <div class="modal-body">
                    <div class="qr-stats">
                        <div class="stat-item">
                            <span class="stat-value">${userQRs.length}</span>
                            <span class="stat-label">Total QRs</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${userQRs.filter(q => q.status === 'used').length}</span>
                            <span class="stat-label">Used</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${userQRs.filter(q => q.status === 'active').length}</span>
                            <span class="stat-label">Active</span>
                        </div>
                    </div>
                    <div class="qr-list">
                        ${userQRs.length === 0 ? '<p class="no-qrs">No QR codes generated yet</p>' :
                userQRs.map(qr => `
                                <div class="qr-item ${qr.status}">
                                    <div class="qr-item-header">
                                        <span class="qr-id">${qr.id}</span>
                                        <span class="qr-status qr-status-${qr.status}">${qr.status.toUpperCase()}</span>
                                    </div>
                                    <div class="qr-item-details">
                                        <div><i class="fas fa-bus"></i> ${qr.vehicleNickname || 'N/A'} (${qr.vehicleReg || 'N/A'})</div>
                                        <div><i class="fas fa-coins"></i> ${qr.fareAmount || 0} tokens</div>
                                        <div><i class="fas fa-route"></i> ${qr.route || 'N/A'}</div>
                                        <div><i class="fas fa-clock"></i> Created: ${new Date(qr.createdAt).toLocaleString()}</div>
                                        ${qr.usedAt ? `<div><i class="fas fa-check-circle"></i> Used: ${new Date(qr.usedAt).toLocaleString()}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')
            }
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary btn-export-qr"><i class="fas fa-download"></i> Export Report</button>
                </div>
            </div>
        `;

        this.root.appendChild(modal);

        modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.btn-export-qr').addEventListener('click', () => {
            this.exportQRReport(userQRs);
        });
    }

    exportQRReport(qrList) {
        // Create CSV report
        const headers = ['QR ID', 'Type', 'Vehicle', 'Registration', 'Fare', 'Route', 'Status', 'Created At', 'Used At', 'Used By'];
        const rows = qrList.map(qr => [
            qr.id,
            qr.type,
            qr.vehicleNickname || '',
            qr.vehicleReg || '',
            qr.fareAmount || '',
            qr.route || '',
            qr.status,
            qr.createdAt,
            qr.usedAt || '',
            qr.usedBy || ''
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paywega_qr_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showToast('Report exported!');
    }
}
