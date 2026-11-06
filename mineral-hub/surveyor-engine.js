/**
 * ==========================================================================
 * NATIONAL MINERAL INTELLIGENCE HUB — CADASTRAL CLAIM SURVEYOR ENGINE 2026
 * Arc 1950 UTM Reprojection • Geometric Intelligence (Auto-Untangle)
 * Sovereign Claims Database Ledger • Spatial Clash & ZimParks Guardrail
 * MTN-SPEC (Pvt) Ltd — mtnspec.co.zw
 * ==========================================================================
 */

(function () {
    console.log("📐 [Cadastral Surveyor Engine] Initializing Arc 1950 UTM, Geometric Intelligence & Claims DB...");

    // 1. Configure Proj4 Projections for Zimbabwe National Cadastre
    function initProjections() {
        if (typeof window.proj4 === "undefined") {
            console.warn("Proj4 not yet loaded. Ingesting CDN fallback...");
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.2/proj4.js";
            script.onload = () => configureProj4Defs();
            document.head.appendChild(script);
        } else {
            configureProj4Defs();
        }
    }

    function configureProj4Defs() {
        // Arc 1950 / UTM Zone 36S (Harare, Great Dyke, Midlands, Mashonaland, Masvingo)
        proj4.defs("EPSG:20936", "+proj=utm +zone=36 +south +a=6378249.145 +rf=293.4663077 +towgs84=-143,-90,-294,0,0,0,0 +units=m +no_defs");
        // Arc 1950 / UTM Zone 35S (Bulawayo, Gwanda, Matabeleland North/South)
        proj4.defs("EPSG:20935", "+proj=utm +zone=35 +south +a=6378249.145 +rf=293.4663077 +towgs84=-143,-90,-294,0,0,0,0 +units=m +no_defs");
        // WGS84 UTM Zone 36S
        proj4.defs("EPSG:32736", "+proj=utm +zone=36 +south +datum=WGS84 +units=m +no_defs");
        // WGS84 UTM Zone 35S
        proj4.defs("EPSG:32735", "+proj=utm +zone=35 +south +datum=WGS84 +units=m +no_defs");
        console.log("✅ [Cadastral Surveyor] Arc 1950 & WGS84 projections registered in Proj4.");
    }

    initProjections();

    // 2. Zimbabwe Protected Wildlife & Strict Zero-Mining Conservation Database
    const ZIMPARKS_RESERVES = [
        {
            name: "Hwange National Park (Strict Wildlife Sanctuary)",
            category: "National Park / Strict Nature Reserve",
            bounds: [[-18.45, 25.80], [-18.45, 27.50], [-19.55, 27.50], [-19.55, 25.80]],
            law: "Parks & Wildlife Act (Chap. 20:14) • Section 31 EMA Act",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Mana Pools National Park & Middle Zambezi Biosphere",
            category: "UNESCO World Heritage Biosphere",
            bounds: [[-15.55, 29.10], [-15.55, 30.00], [-16.20, 30.00], [-16.20, 29.10]],
            law: "UNESCO World Heritage Convention & Statutory Instrument 72",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Matobo Hills National Park & Sacred Granite Landscape",
            category: "UNESCO World Heritage Cultural & Wildlife Area",
            bounds: [[-20.40, 28.30], [-20.40, 28.75], [-20.80, 28.75], [-20.80, 28.30]],
            law: "UNESCO World Heritage & National Monuments Act",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Gonarezhou National Park (Great Limpopo Transfrontier)",
            category: "Transfrontier Wildlife Sanctuary",
            bounds: [[-21.20, 31.40], [-21.20, 32.40], [-22.30, 32.40], [-22.30, 31.40]],
            law: "International Transfrontier Conservation Treaty & Parks Act",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Nyanga National Park & Mount Nyangani",
            category: "Montane Catchment Reserve",
            bounds: [[-18.15, 32.70], [-18.15, 32.95], [-18.35, 32.95], [-18.35, 32.70]],
            law: "Water Catchment Protection Reserve & ZimParks Act",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Matusadona National Park (Lake Kariba)",
            category: "Lakeshore Wildlife Sanctuary",
            bounds: [[-16.65, 28.30], [-16.65, 28.80], [-17.00, 28.80], [-17.00, 28.30]],
            law: "ZimParks Aquatic & Wildlife Sanctuary",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Chizarira National Park",
            category: "Wilderness Sanctuary",
            bounds: [[-17.50, 27.70], [-17.50, 28.25], [-17.90, 28.25], [-17.90, 27.70]],
            law: "ZimParks Rugged Escarpment Sanctuary",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        },
        {
            name: "Victoria Falls National Park & Rainforest",
            category: "UNESCO World Heritage Wonder",
            bounds: [[-17.88, 25.75], [-17.88, 25.90], [-17.96, 25.90], [-17.96, 25.75]],
            law: "UNESCO World Heritage & Tourism Priority Zone",
            legalStatus: "STRICT ZERO-MINING PERMITTED"
        }
    ];

    // 3. Active Surveyor State
    const SURVEYOR = {
        isDrawing: false,
        drawBoundaryPoints: [], // array of [lat, lng] for outer perimeter
        discoveryPoint: null,    // [lat, lng] for interior Discovery Point (DP)
        drawMarkers: [],        // array of L.CircleMarker
        dpMarker: null,         // L.Marker or L.CircleMarker for DP
        dpTieLine: null,        // L.Polyline for DP -> B1 tie line
        tempPolyline: null,     // L.Polyline
        tempPolygon: null,      // L.Polygon
        selectedCRS: "EPSG:20936", // Default: Arc 1950 UTM Zone 36S
        customConcessions: [],
        activeClash: null,      // holds collision info if boundary clashes
        previewLayer: null,
        previewDPLayer: null
    };

    function initEngine() {
        mountSurveyorModal();
        bindSurveyorButtons();
        loadCustomConcessionsFromStorage();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initEngine);
    } else {
        initEngine();
    }

    // Polling to sync with Leaflet map once available
    const checkStatePoll = setInterval(() => {
        if (window.STATE && window.STATE.map) {
            clearInterval(checkStatePoll);
            loadCustomConcessionsFromStorage();
            bindSurveyorButtons();
        }
    }, 250);

    // 4. Load & Persist Custom Concessions in Local Database Storage
    function loadCustomConcessionsFromStorage() {
        try {
            const raw = localStorage.getItem("nmih_custom_claims_db");
            if (raw && window.STATE && Array.isArray(window.STATE.concessions)) {
                const list = JSON.parse(raw);
                if (Array.isArray(list) && list.length > 0) {
                    SURVEYOR.customConcessions = list;
                    list.forEach(claim => {
                        if (!window.STATE.concessions.find(c => c.id === claim.id)) {
                            window.STATE.concessions.unshift(claim);
                        }
                    });
                    if (typeof window.renderConcessionsList === "function") {
                        window.renderConcessionsList(window.STATE.concessions);
                    }
                    if (typeof window.renderConcessionsOnMap === "function") {
                        window.renderConcessionsOnMap(window.STATE.concessions);
                    }
                    updateDBCountBadge();
                    console.log(`📦 Loaded ${list.length} persisted custom claims from database.`);
                }
            }
        } catch (e) {
            console.error("Error reading custom claims DB:", e);
        }
    }

    function saveClaimToDatabase(claim) {
        SURVEYOR.customConcessions.unshift(claim);
        if (window.STATE && Array.isArray(window.STATE.concessions)) {
            window.STATE.concessions.unshift(claim);
        }

        // Save to LocalStorage DB
        localStorage.setItem("nmih_custom_claims_db", JSON.stringify(SURVEYOR.customConcessions));

        // Attempt silent API sync if backend is connected
        fetch("/api/concessions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(claim)
        }).catch(() => {/* offline fallback */});

        // Re-render map and panel list
        if (typeof window.renderConcessionsList === "function" && window.STATE) {
            window.renderConcessionsList(window.STATE.concessions);
        }
        if (typeof window.renderConcessionsOnMap === "function" && window.STATE) {
            window.renderConcessionsOnMap(window.STATE.concessions);
        }

        updateDBCountBadge();

        // Fly to new claim and pulse highlight
        if (claim.bounds && window.STATE && window.STATE.map) {
            window.STATE.map.flyToBounds(claim.bounds, { padding: [60, 60], duration: 1.5 });
        }
    }

    function updateDBCountBadge() {
        const total = (window.STATE && Array.isArray(window.STATE.concessions)) ? window.STATE.concessions.length : SURVEYOR.customConcessions.length;
        const badge = document.getElementById("sm-db-count");
        if (badge) badge.textContent = total;
    }

    // 5. Bind Buttons to open Surveyor Modal & Claims DB
    function bindSurveyorButtons() {
        const btnBanner = document.getElementById("btn-open-surveyor-banner");
        if (btnBanner) {
            btnBanner.onclick = (e) => {
                e.preventDefault();
                openSurveyorModal("beacons");
            };
        }

        const btnTool = document.getElementById("btn-surveyor-tool");
        if (btnTool) {
            btnTool.onclick = (e) => {
                e.preventDefault();
                openSurveyorModal("beacons");
            };
        }

        const btnOpenDB = document.getElementById("btn-open-claims-db");
        if (btnOpenDB) {
            btnOpenDB.onclick = (e) => {
                e.preventDefault();
                openSurveyorModal("db");
            };
        }

        if (window.lucide) lucide.createIcons();
    }

    // 6. Mount Surveyor Modal HTML (with Beacons, Draw, and Claims Database Tabs)
    function mountSurveyorModal() {
        if (document.getElementById("modal-claim-surveyor")) return;

        const modalHtml = `
            <div class="surveyor-modal-overlay hidden" id="modal-claim-surveyor">
                <div class="surveyor-modal-card">
                    <div class="sm-header">
                        <div class="sm-title-row">
                            <i data-lucide="pentagon" style="width:20px;height:20px;color:#f59e0b;"></i>
                            <div>
                                <h3>Sovereign Cadastral Claim Surveyor</h3>
                                <span>Register &amp; Manage Mining Claims in Zimbabwe PostGIS Database</span>
                            </div>
                        </div>
                        <button type="button" class="sm-close-btn" id="close-surveyor-modal">&times;</button>
                    </div>

                    <div class="sm-body">
                        <!-- Mode Switcher Tabs (Beacons • Map Draw • Claims Database Ledger) -->
                        <div class="sm-mode-tabs">
                            <button type="button" class="sm-tab active" data-mode="beacons" id="tab-mode-beacons">
                                <i data-lucide="list-ordered" style="width:14px;height:14px;"></i>
                                <span>Input Corner Beacons (Coordinates)</span>
                            </button>
                            <button type="button" class="sm-tab" data-mode="draw" id="tab-mode-draw">
                                <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                                <span>Interactive Map Digitizer (Draw)</span>
                            </button>
                            <button type="button" class="sm-tab" data-mode="db" id="tab-mode-db">
                                <i data-lucide="database" style="width:14px;height:14px;color:#38bdf8;"></i>
                                <span>Claims Database Ledger (<strong id="sm-db-count">0</strong>)</span>
                            </button>
                        </div>

                        <!-- Mode 1: Beacon Coordinate Inputs Table -->
                        <div class="sm-mode-content" id="content-mode-beacons">
                            <!-- CRS / Datum Selector (Default: Arc 1950 UTM Zone 36S) -->
                            <div class="sm-field-group crs-highlight-box">
                                <div class="crs-label-row">
                                    <label for="sm-crs-select">
                                        <i data-lucide="compass" style="width:13px;height:13px;color:#38bdf8;"></i>
                                        <strong>Coordinate Reference System (CRS / Datum)</strong>
                                    </label>
                                    <span class="crs-badge-default">MINISTRY OF MINES DEFAULT</span>
                                </div>
                                <select id="sm-crs-select" class="sm-select crs-select-large">
                                    <option value="EPSG:20936" selected>Arc 1950 / UTM Zone 36S (EPSG:20936) — Great Dyke, Harare, Midlands [DEFAULT]</option>
                                    <option value="EPSG:20935">Arc 1950 / UTM Zone 35S (EPSG:20935) — Bulawayo, Gwanda, Matabeleland</option>
                                    <option value="EPSG:4326">WGS 84 Geographic (EPSG:4326) — Decimal Degrees (Lat / Lon)</option>
                                    <option value="EPSG:32736">WGS 84 / UTM Zone 36S (EPSG:32736)</option>
                                    <option value="EPSG:32735">WGS 84 / UTM Zone 35S (EPSG:32735)</option>
                                </select>
                                <div class="crs-helper-text">
                                    Converts Arc 1950 survey beacons into WGS84 with Geometric Intelligence for seamless satellite overlay.
                                </div>
                            </div>

                            <!-- Claim Metadata -->
                            <div class="sm-grid-2">
                                <div class="sm-field-group">
                                    <label for="sm-claim-name">Claim / Concession Name</label>
                                    <input type="text" id="sm-claim-name" class="sm-input" placeholder="e.g. Hartley West Lithium Syndicate">
                                </div>
                                <div class="sm-field-group">
                                    <label for="sm-claim-holder">Holder / Mining Syndicate</label>
                                    <input type="text" id="sm-claim-holder" class="sm-input" placeholder="e.g. Bikita Artisanal Mining Cooperative">
                                </div>
                            </div>

                            <div class="sm-grid-3">
                                <div class="sm-field-group">
                                    <label for="sm-mineral-target">Mineral Target</label>
                                    <select id="sm-mineral-target" class="sm-select">
                                        <option value="Lithium (Spodumene/Petalite)">Lithium (Spodumene/Petalite)</option>
                                        <option value="Gold (Au)">Gold (Au)</option>
                                        <option value="Chromite & PGM">Chromite & PGM</option>
                                        <option value="Platinum (PGM)">Platinum (PGM)</option>
                                        <option value="Copper & Base Metals">Copper & Base Metals</option>
                                        <option value="Nickel">Nickel</option>
                                    </select>
                                </div>
                                <div class="sm-field-group">
                                    <label for="sm-license-no">Cadastre License No.</label>
                                    <input type="text" id="sm-license-no" class="sm-input" placeholder="MC-HAR-2026-9081">
                                </div>
                                <div class="sm-field-group">
                                    <label for="sm-district">Mining District</label>
                                    <input type="text" id="sm-district" class="sm-input" placeholder="e.g. Chegutu, Mash West">
                                </div>
                            </div>

                            <!-- Beacons Header & Table -->
                            <div class="sm-table-header">
                                <span class="col-peg">Beacon #</span>
                                <span class="col-e" id="header-col-e">Easting (X / meters)</span>
                                <span class="col-n" id="header-col-n">Northing (Y / meters)</span>
                                <span class="col-act">Action</span>
                            </div>
                            <div class="sm-beacons-list" id="sm-beacons-list">
                                <!-- Beacons 1 to 4 generated by JS -->
                            </div>
                            <div class="sm-beacon-actions">
                                <button type="button" class="btn-sm-secondary" id="btn-add-beacon">
                                    <i data-lucide="plus" style="width:13px;height:13px;"></i>
                                    <span>Add Another Beacon</span>
                                </button>
                                <button type="button" class="btn-sm-secondary smart-untangle-btn" id="btn-auto-untangle" title="Automatically sort and untangle criss-crossed beacons into a clean simple perimeter">
                                    <i data-lucide="sparkles" style="width:13px;height:13px;color:#fbbf24;"></i>
                                    <span>Auto-Untangle Beacons</span>
                                </button>
                                <button type="button" class="btn-sm-secondary" id="btn-calc-preview">
                                    <i data-lucide="eye" style="width:13px;height:13px;"></i>
                                    <span>Calculate Geometry &amp; Preview</span>
                                </button>
                            </div>

                            <!-- Auto-untangle notification badge -->
                            <div class="untangle-status-msg hidden" id="untangle-status-msg">
                                <i data-lucide="sparkles" style="width:13px;height:13px;color:#10b981;"></i>
                                <span id="untangle-status-text">Geometric Intelligence: Scrambled corner beacons automatically ordered around centroid.</span>
                            </div>
                        </div>

                        <!-- Mode 2: Interactive Map Draw Mode -->
                        <div class="sm-mode-content hidden" id="content-mode-draw">
                            <div class="draw-instruction-box">
                                <i data-lucide="info" style="width:16px;height:16px;color:#38bdf8;"></i>
                                <div>
                                    <strong>Geometric Intelligence Active:</strong> Even if you click corner points in mixed or criss-cross order, the system automatically untangles them into a valid statutory perimeter. Real-time clash detection alerts you if you touch a ZimParks reserve.
                                </div>
                            </div>
                            <div class="draw-action-row">
                                <button type="button" class="btn-sm-primary" id="btn-start-drawing">
                                    <i data-lucide="mouse-pointer" style="width:14px;height:14px;"></i>
                                    <span>Start Drawing on Satellite Map</span>
                                </button>
                                <button type="button" class="btn-sm-danger hidden" id="btn-clear-drawing">
                                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                                    <span>Clear Points</span>
                                </button>
                            </div>
                        </div>

                        <!-- Mode 3: Claims Database Ledger Hub -->
                        <div class="sm-mode-content hidden" id="content-mode-db">
                            <div class="db-ledger-header">
                                <div class="db-search-bar">
                                    <i data-lucide="search" style="width:14px;height:14px;color:#94a3b8;"></i>
                                    <input type="text" id="sm-db-search-input" placeholder="Search database by claim name, mineral, or license...">
                                </div>
                                <div class="db-filter-chips">
                                    <button type="button" class="db-chip active" data-db-filter="all">All Claims</button>
                                    <button type="button" class="db-chip" data-db-filter="active">Active</button>
                                    <button type="button" class="db-chip" data-db-filter="custom">Custom Pegged</button>
                                </div>
                            </div>

                            <div class="db-table-container">
                                <table class="sm-db-table" id="sm-db-table">
                                    <thead>
                                        <tr>
                                            <th>Claim &amp; Syndicate</th>
                                            <th>License No</th>
                                            <th>Mineral</th>
                                            <th>Area (Ha)</th>
                                            <th>CRS / Datum</th>
                                            <th>Status</th>
                                            <th style="text-align:right;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="sm-db-table-body">
                                        <!-- Dynamically generated rows -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Calculated Geometry Summary (visible on beacons and draw modes) -->
                        <div class="sm-calculated-box" id="sm-calc-summary">
                            <div class="calc-metric">
                                <span class="cm-lbl">Calculated Area</span>
                                <strong class="cm-val" id="sm-calc-area">0.00 Ha</strong>
                            </div>
                            <div class="calc-metric">
                                <span class="cm-lbl">Perimeter</span>
                                <strong class="cm-val" id="sm-calc-perimeter">0.00 km</strong>
                            </div>
                            <div class="calc-metric">
                                <span class="cm-lbl">Beacons Count</span>
                                <strong class="cm-val" id="sm-calc-beacons">4 Corners</strong>
                            </div>
                            <div class="calc-metric">
                                <span class="cm-lbl">Centroid (WGS84)</span>
                                <strong class="cm-val" id="sm-calc-centroid">-19.20°S, 30.00°E</strong>
                            </div>
                        </div>

                        <!-- Automated Enterprise Spatial Guardrail & Conflict Pre-flight Banner -->
                        <div class="spatial-clash-alert-box hidden" id="spatial-clash-box">
                            <div class="sca-header">
                                <div class="sca-title-row">
                                    <span class="sca-pulse-dot" id="sca-pulse-icon"></span>
                                    <strong id="sca-title">SPATIAL CONFLICT DETECTED</strong>
                                </div>
                                <span class="sca-status-badge" id="sca-badge">STRICT PROHIBITION</span>
                            </div>
                            <div class="sca-body">
                                <div class="sca-entity" id="sca-entity-name">ZimParks Protected Wildlife Reserve</div>
                                <p class="sca-desc" id="sca-desc-text">
                                    The proposed boundary intersects with gazetted protected conservation land. Statutory pegging is strictly prohibited under the Parks & Wildlife Act and Section 31 of the Mines and Minerals Act.
                                </p>
                                <div class="sca-action-advice" id="sca-advice">
                                    <i data-lucide="alert-octagon" style="width:13px;height:13px;color:#ef4444;"></i>
                                    <span id="sca-advice-text">Boundary rejected for sovereign gazette. You may only test this in Sandbox Simulation mode.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="sm-footer">
                        <button type="button" class="btn-modal-cancel" id="btn-cancel-surveyor">Close</button>
                        <button type="button" class="btn-modal-submit" id="btn-save-claim-db">
                            <i data-lucide="database" style="width:16px;height:16px;"></i>
                            <span id="btn-save-text">Save &amp; Reflect in Sovereign Database</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating In-Progress Drawing HUD when modal is minimized -->
            <div class="floating-drawing-hud hidden" id="floating-draw-hud">
                <div class="fdh-info">
                    <span class="fdh-pulse" id="fdh-pulse-badge"></span>
                    <span>Digitizing Claim Boundary... (<strong id="fdh-pts-count">0</strong> points)</span>
                </div>
                <div class="fdh-alert-msg hidden" id="fdh-alert-msg">
                    <i data-lucide="alert-triangle" style="width:12px;height:12px;color:#ef4444;"></i>
                    <span id="fdh-alert-text">Overlaps Protected Reserve!</span>
                </div>
                <div class="fdh-actions">
                    <button type="button" class="fdh-btn finish" id="fdh-finish-btn">Finish Boundary</button>
                    <button type="button" class="fdh-btn cancel" id="fdh-cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);
        if (window.lucide) lucide.createIcons();

        initModalEvents();
    }

    function initModalEvents() {
        const modal = document.getElementById("modal-claim-surveyor");
        const closeBtn = document.getElementById("close-surveyor-modal");
        const cancelBtn = document.getElementById("btn-cancel-surveyor");
        const crsSelect = document.getElementById("sm-crs-select");
        const tabBeacons = document.getElementById("tab-mode-beacons");
        const tabDraw = document.getElementById("tab-mode-draw");
        const tabDB = document.getElementById("tab-mode-db");
        const contentBeacons = document.getElementById("content-mode-beacons");
        const contentDraw = document.getElementById("content-mode-draw");
        const contentDB = document.getElementById("content-mode-db");
        const calcSummary = document.getElementById("sm-calc-summary");
        const btnSaveClaim = document.getElementById("btn-save-claim-db");

        const btnAddBeacon = document.getElementById("btn-add-beacon");
        const btnAutoUntangle = document.getElementById("btn-auto-untangle");
        const btnCalcPreview = document.getElementById("btn-calc-preview");
        const btnStartDraw = document.getElementById("btn-start-drawing");

        // Close Modal
        closeBtn?.addEventListener("click", () => closeModal());
        cancelBtn?.addEventListener("click", () => closeModal());

        // CRS Switcher
        crsSelect?.addEventListener("change", (e) => {
            SURVEYOR.selectedCRS = e.target.value;
            updateBeaconHeadersForCRS();
        });

        // Tabs
        tabBeacons?.addEventListener("click", () => {
            tabBeacons.classList.add("active");
            tabDraw.classList.remove("active");
            tabDB.classList.remove("active");
            contentBeacons.classList.remove("hidden");
            contentDraw.classList.add("hidden");
            contentDB.classList.add("hidden");
            calcSummary.classList.remove("hidden");
            btnSaveClaim.classList.remove("hidden");
        });

        tabDraw?.addEventListener("click", () => {
            tabDraw.classList.add("active");
            tabBeacons.classList.remove("active");
            tabDB.classList.remove("active");
            contentDraw.classList.remove("hidden");
            contentBeacons.classList.add("hidden");
            contentDB.classList.add("hidden");
            calcSummary.classList.remove("hidden");
            btnSaveClaim.classList.remove("hidden");
        });

        tabDB?.addEventListener("click", () => {
            tabDB.classList.add("active");
            tabBeacons.classList.remove("active");
            tabDraw.classList.remove("active");
            contentDB.classList.remove("hidden");
            contentBeacons.classList.add("hidden");
            contentDraw.classList.add("hidden");
            calcSummary.classList.add("hidden");
            btnSaveClaim.classList.add("hidden");
            renderClaimsDatabaseTable();
        });

        // Add Beacon Row
        btnAddBeacon?.addEventListener("click", () => {
            addBeaconRow();
        });

        // Auto-Untangle Button
        btnAutoUntangle?.addEventListener("click", () => {
            autoUntangleBeacons(true);
        });

        // Calculate & Preview Button
        btnCalcPreview?.addEventListener("click", () => {
            calculateAndPreviewFromTable();
        });

        // Start Drawing on Map
        btnStartDraw?.addEventListener("click", () => {
            modal.classList.add("hidden");
            startInteractiveMapDrawing();
        });

        // Save & Reflect in DB
        btnSaveClaim?.addEventListener("click", () => {
            commitSurveyedClaim();
        });

        // Floating HUD actions
        document.getElementById("fdh-finish-btn")?.addEventListener("click", () => {
            finishInteractiveDrawing();
        });

        document.getElementById("fdh-cancel-btn")?.addEventListener("click", () => {
            cancelInteractiveDrawing();
        });

        // DB search and filter handlers
        document.getElementById("sm-db-search-input")?.addEventListener("input", (e) => {
            renderClaimsDatabaseTable(e.target.value.toLowerCase());
        });

        document.querySelectorAll(".db-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                document.querySelectorAll(".db-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                renderClaimsDatabaseTable();
            });
        });

        // Seed 4 initial beacon rows (Great Dyke Hartley region)
        populateDefaultBeacons();
    }

    function openSurveyorModal(initialTab = "beacons") {
        const modal = document.getElementById("modal-claim-surveyor");
        if (modal) {
            modal.classList.remove("hidden");
            updateDBCountBadge();
            if (initialTab === "db") {
                document.getElementById("tab-mode-db")?.click();
            } else if (initialTab === "draw") {
                document.getElementById("tab-mode-draw")?.click();
            } else {
                document.getElementById("tab-mode-beacons")?.click();
            }
            if (window.lucide) lucide.createIcons();
        }
    }

    function closeModal() {
        const modal = document.getElementById("modal-claim-surveyor");
        if (modal) modal.classList.add("hidden");
        cancelInteractiveDrawing();
    }

    function updateBeaconHeadersForCRS() {
        const headerE = document.getElementById("header-col-e");
        const headerN = document.getElementById("header-col-n");
        const crs = SURVEYOR.selectedCRS;

        if (crs === "EPSG:4326") {
            headerE.textContent = "Longitude (°E / WGS84)";
            headerN.textContent = "Latitude (°S / WGS84)";
        } else {
            headerE.textContent = "Easting (X / meters)";
            headerN.textContent = "Northing (Y / meters)";
        }
    }

    function populateDefaultBeacons() {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return;

        list.innerHTML = "";
        const defaultBeacons = [
            { e: 300000, n: 7820000 },
            { e: 302000, n: 7820000 },
            { e: 302000, n: 7818000 },
            { e: 300000, n: 7818000 }
        ];

        defaultBeacons.forEach((b, idx) => {
            addBeaconRow(idx + 1, b.e, b.n);
        });
    }

    function addBeaconRow(num, defaultE = "", defaultN = "") {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return;

        const currentCount = list.children.length;
        const beaconNumber = num || currentCount + 1;

        const row = document.createElement("div");
        row.className = "sm-beacon-row";
        row.innerHTML = `
            <span class="peg-tag">B-${beaconNumber}</span>
            <input type="number" step="any" class="sm-input-coord beacon-e" placeholder="e.g. 300000" value="${defaultE}">
            <input type="number" step="any" class="sm-input-coord beacon-n" placeholder="e.g. 7820000" value="${defaultN}">
            <button type="button" class="btn-del-beacon" title="Remove Beacon">&times;</button>
        `;

        row.querySelector(".btn-del-beacon").addEventListener("click", () => {
            if (list.children.length > 3) {
                row.remove();
                renumberBeacons();
            } else {
                alert("A spatial claim polygon requires at least 3 corner beacons.");
            }
        });

        list.appendChild(row);
    }

    function renumberBeacons() {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return;
        Array.from(list.children).forEach((row, idx) => {
            row.querySelector(".peg-tag").textContent = `B-${idx + 1}`;
        });
    }

        // =========================================================================
    // 7. GEOMETRIC INTELLIGENCE: 2-OPT UNTANGLING & DISCOVERY POINT (DP) ENGINE
    // =========================================================================
    function ccw(a, b, c) {
        return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
    }

    function doSegmentsIntersect(p1, p2, p3, p4) {
        return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
    }

    function checkPolygonSelfIntersection(points) {
        if (!points || points.length < 4) return false;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            for (let j = i + 2; j < n; j++) {
                if (i === 0 && j === n - 1) continue; // adjacent closing edge
                const p3 = points[j];
                const p4 = points[(j + 1) % n];
                if (doSegmentsIntersect(p1, p2, p3, p4)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 2-Opt Polygon Uncrossing Algorithm:
     * Iteratively removes edge intersections by reversing sub-paths until no edges cross.
     * Preserves genuine concave geometries without collapsing into a convex hull.
     */
    function uncrossPolygon2Opt(points) {
        if (!points || points.length < 4) return points.slice();
        let pts = points.slice();
        const n = pts.length;
        let improved = true;
        let iter = 0;
        const maxIter = 60;

        while (improved && iter < maxIter) {
            improved = false;
            iter++;
            for (let i = 0; i < n; i++) {
                for (let j = i + 2; j < n; j++) {
                    if (i === 0 && j === n - 1) continue;
                    const p1 = pts[i];
                    const p2 = pts[(i + 1) % n];
                    const p3 = pts[j];
                    const p4 = pts[(j + 1) % n];

                    if (doSegmentsIntersect(p1, p2, p3, p4)) {
                        // Reverse segment between i+1 and j
                        const sub = pts.slice(i + 1, j + 1).reverse();
                        pts.splice(i + 1, sub.length, ...sub);
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }

        // If 2-opt didn't fully resolve (e.g. collinear points), fallback to radial sort around centroid
        if (checkPolygonSelfIntersection(pts)) {
            return untanglePointsAroundCentroid(pts);
        }
        return pts;
    }

    function untanglePointsAroundCentroid(points) {
        if (!points || points.length < 3) return points;
        let sumX = 0, sumY = 0;
        points.forEach(p => { sumX += p[0]; sumY += p[1]; });
        const cX = sumX / points.length;
        const cY = sumY / points.length;

        const decorated = points.map(p => ({
            pt: p,
            angle: Math.atan2(p[1] - cY, p[0] - cX)
        }));
        decorated.sort((a, b) => a.angle - b.angle);
        return decorated.map(d => d.pt);
    }

    /**
     * Point in polygon ray-casting test
     */
    function pointInPolygon(pt, vs) {
        const x = pt[0], y = pt[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * Intelligent Classification:
     * Discovers which points are outer boundary beacons and which point is the Discovery Point (DP).
     * If an interior point exists, it is isolated as the DP so it NEVER twists the perimeter fence!
     */
    function classifyBoundaryAndDP(allPoints, manualDP = null) {
        if (!allPoints || allPoints.length < 3) {
            return { boundary: allPoints || [], dp: manualDP };
        }

        if (manualDP) {
            const boundaryOnly = allPoints.filter(p => !(p[0] === manualDP[0] && p[1] === manualDP[1]));
            return {
                boundary: uncrossPolygon2Opt(boundaryOnly),
                dp: manualDP
            };
        }

        if (allPoints.length < 4) {
            return { boundary: allPoints, dp: null };
        }

        // Test if any single point is inside the polygon formed by all other points
        for (let i = 0; i < allPoints.length; i++) {
            const candidate = allPoints[i];
            const others = allPoints.filter((_, idx) => idx !== i);
            const untangledOthers = uncrossPolygon2Opt(others);

            if (pointInPolygon(candidate, untangledOthers)) {
                console.log("🎯 [Geometric Intelligence] Auto-detected interior Discovery Point (DP):", candidate);
                return {
                    boundary: untangledOthers,
                    dp: candidate
                };
            }
        }

        // All points lie on boundary
        return {
            boundary: uncrossPolygon2Opt(allPoints),
            dp: null
        };
    }

    /**
     * Calculates the statutory survey tie line (Bearing & Distance) from DP to Beacon 1
     */
    function calculateDPTieMetrics(dpLatLng, b1LatLng, crs = "EPSG:20936") {
        if (!dpLatLng || !b1LatLng) return null;

        let dpE, dpN, b1E, b1N;
        if (crs === "EPSG:4326") {
            dpE = dpLatLng[1]; dpN = dpLatLng[0];
            b1E = b1LatLng[1]; b1N = b1LatLng[0];
        } else {
            try {
                const [e1, n1] = proj4("EPSG:4326", crs, [dpLatLng[1], dpLatLng[0]]);
                const [e2, n2] = proj4("EPSG:4326", crs, [b1LatLng[1], b1LatLng[0]]);
                dpE = e1; dpN = n1;
                b1E = e2; b1N = n2;
            } catch (e) {
                dpE = dpLatLng[1] * 105000; dpN = dpLatLng[0] * 111000;
                b1E = b1LatLng[1] * 105000; b1N = b1LatLng[0] * 111000;
            }
        }

        const deltaE = b1E - dpE;
        const deltaN = b1N - dpN;
        const distanceM = Math.sqrt(deltaE * deltaE + deltaN * deltaN);

        let rad = Math.atan2(deltaE, deltaN);
        let deg = (rad * 180 / Math.PI + 360) % 360;

        const d = Math.floor(deg);
        const m = Math.floor((deg - d) * 60);
        const s = Math.round(((deg - d) * 60 - m) * 60);

        const bearingStr = `${String(d).padStart(3, '0')}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;

        return {
            distanceM: Math.round(distanceM * 10) / 10,
            bearingDeg: Math.round(deg * 100) / 100,
            bearingStr: bearingStr,
            dpCoords: { easting: Math.round(dpE), northing: Math.round(dpN), lat: dpLatLng[0], lng: dpLatLng[1] },
            b1Coords: { easting: Math.round(b1E), northing: Math.round(b1N), lat: b1LatLng[0], lng: b1LatLng[1] }
        };
    }

    function autoUntangleBeacons(showFeedback = false) {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return;

        const rows = list.querySelectorAll(".sm-beacon-row");
        const rawCoords = [];

        for (let i = 0; i < rows.length; i++) {
            const eVal = parseFloat(rows[i].querySelector(".beacon-e").value);
            const nVal = parseFloat(rows[i].querySelector(".beacon-n").value);
            if (!isNaN(eVal) && !isNaN(nVal)) {
                rawCoords.push([eVal, nVal]);
            }
        }

        if (rawCoords.length < 3) return;

        const untangled = untanglePointsAroundCentroid(rawCoords);

        list.innerHTML = "";
        untangled.forEach((pt, idx) => {
            addBeaconRow(idx + 1, pt[0], pt[1]);
        });

        calculateAndPreviewFromTable();

        const badge = document.getElementById("untangle-status-msg");
        if (badge) {
            badge.classList.remove("hidden");
            document.getElementById("untangle-status-text").textContent = "✨ Geometric Intelligence: Beacons automatically sorted around centroid into an untangled perimeter.";
            setTimeout(() => badge.classList.add("hidden"), 4000);
        }
    }

    // =========================================================================
    // 8. SPATIAL COLLISION & CLASH DETECTION GUARDRAIL ENGINE
    // =========================================================================
    function pointInPolygon(pt, vs) {
        const x = pt[0], y = pt[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function getBoundsOfPoints(pts) {
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        pts.forEach(p => {
            if (p[0] < minLat) minLat = p[0];
            if (p[0] > maxLat) maxLat = p[0];
            if (p[1] < minLng) minLng = p[1];
            if (p[1] > maxLng) maxLng = p[1];
        });
        return { minLat, maxLat, minLng, maxLng };
    }

    function checkSpatialClashes(proposedPoints) {
        for (const park of ZIMPARKS_RESERVES) {
            const b = getBoundsOfPoints(park.bounds);
            const pb = getBoundsOfPoints(proposedPoints);
            const bboxOverlap = !(pb.maxLat < b.minLat || pb.minLat > b.maxLat || pb.maxLng < b.minLng || pb.minLng > b.maxLng);

            if (bboxOverlap) {
                let directOverlap = false;
                for (const p of proposedPoints) {
                    if (pointInPolygon(p, park.bounds)) {
                        directOverlap = true;
                        break;
                    }
                }

                if (directOverlap || (pb.minLat >= b.minLat && pb.maxLat <= b.maxLat && pb.minLng >= b.minLng && pb.maxLng <= b.maxLng)) {
                    return {
                        hasClash: true,
                        severity: "CRITICAL_PROHIBITED",
                        title: "ZIMPARKS PROTECTED RESERVE VIOLATION",
                        badgeText: "STRICT ZERO-MINING",
                        entityName: park.name,
                        desc: `Proposed boundary overlaps with gazetted ${park.category}. Mineral exploration, pegging, and shaft development are strictly illegal under ${park.law}.`,
                        advice: "Statutory pegging rejected. You may only test this parcel in Sandbox Simulation mode.",
                        color: "#ef4444"
                    };
                }
            }
        }

        if (window.STATE && Array.isArray(window.STATE.concessions)) {
            for (const conc of window.STATE.concessions) {
                if (conc.bounds && conc.bounds.length >= 3) {
                    const cb = getBoundsOfPoints(conc.bounds);
                    const pb = getBoundsOfPoints(proposedPoints);
                    const bboxOverlap = !(pb.maxLat < cb.minLat || pb.minLat > cb.maxLat || pb.maxLng < cb.minLng || pb.minLng > cb.maxLng);

                    if (bboxOverlap) {
                        for (const p of proposedPoints) {
                            if (pointInPolygon(p, conc.bounds)) {
                                return {
                                    hasClash: true,
                                    severity: "CONCESSION_OVERLAP",
                                    title: "EXISTING MINING LEASE CLASH",
                                    badgeText: "OVERLAPPING CLAIM",
                                    entityName: `${conc.name} (${conc.license_no || 'Gazetted Lease'})`,
                                    desc: `Proposed claim boundary intersects with an existing active concession operated by ${conc.operator || 'Registered Miner'}. Cadastre rules require a minimum 50m buffer.`,
                                    advice: "Overlapping coordinates detected. Adjust corner beacon pegs or file a Boundary Arbitration Request.",
                                    color: "#f59e0b"
                                };
                            }
                        }
                    }
                }
            }
        }

        return {
            hasClash: false,
            severity: "CLEARED",
            title: "CADASTRAL CLEARANCE VERIFIED",
            badgeText: "UNENCUMBERED GROUND",
            entityName: "Gazetted Unencumbered Mining Cadastre Zone",
            desc: "Proposed coordinates do not intersect any ZimParks conservation reserves or active mining concessions. Fully compliant with Ministry of Mines regulations.",
            advice: "Polygon cleared for official registration and PostGIS ledger commitment.",
            color: "#10b981"
        };
    }

    function renderClashAlertUI(clashResult) {
        const box = document.getElementById("spatial-clash-box");
        const title = document.getElementById("sca-title");
        const badge = document.getElementById("sca-badge");
        const entity = document.getElementById("sca-entity-name");
        const desc = document.getElementById("sca-desc-text");
        const advice = document.getElementById("sca-advice-text");
        const pulse = document.getElementById("sca-pulse-icon");
        const btnSaveText = document.getElementById("btn-save-text");
        const btnSave = document.getElementById("btn-save-claim-db");

        if (!box) return;

        SURVEYOR.activeClash = clashResult;
        box.classList.remove("hidden");

        title.textContent = clashResult.title;
        badge.textContent = clashResult.badgeText;
        entity.textContent = clashResult.entityName;
        desc.textContent = clashResult.desc;
        advice.textContent = clashResult.advice;

        if (clashResult.severity === "CRITICAL_PROHIBITED") {
            box.style.borderColor = "#ef4444";
            box.style.background = "rgba(239, 68, 68, 0.12)";
            badge.style.background = "rgba(239, 68, 68, 0.25)";
            badge.style.borderColor = "#ef4444";
            badge.style.color = "#f87171";
            pulse.style.background = "#ef4444";
            pulse.style.boxShadow = "0 0 10px #ef4444";
            if (btnSaveText) btnSaveText.textContent = "Save as Draft Sandbox Simulation (Demo Only)";
            if (btnSave) {
                btnSave.style.background = "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)";
                btnSave.style.borderColor = "#ef4444";
            }
        } else if (clashResult.severity === "CONCESSION_OVERLAP") {
            box.style.borderColor = "#f59e0b";
            box.style.background = "rgba(245, 158, 11, 0.12)";
            badge.style.background = "rgba(245, 158, 11, 0.25)";
            badge.style.borderColor = "#f59e0b";
            badge.style.color = "#fbbf24";
            pulse.style.background = "#f59e0b";
            pulse.style.boxShadow = "0 0 10px #f59e0b";
            if (btnSaveText) btnSaveText.textContent = "Proceed with Overlap Warning Flag";
            if (btnSave) {
                btnSave.style.background = "linear-gradient(135deg, #b45309 0%, #78350f 100%)";
                btnSave.style.borderColor = "#f59e0b";
            }
        } else {
            box.style.borderColor = "#10b981";
            box.style.background = "rgba(16, 185, 129, 0.12)";
            badge.style.background = "rgba(16, 185, 129, 0.25)";
            badge.style.borderColor = "#10b981";
            badge.style.color = "#34d399";
            pulse.style.background = "#10b981";
            pulse.style.boxShadow = "0 0 10px #10b981";
            if (btnSaveText) btnSaveText.textContent = "Save & Reflect in Sovereign Database";
            if (btnSave) {
                btnSave.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                btnSave.style.borderColor = "#fbbf24";
            }
        }

        if (window.lucide) lucide.createIcons();
    }

    // 9. Coordinate Conversion & Polygon Computation with Auto-Untangle Check
    function calculateAndPreviewFromTable() {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return null;

        const rows = list.querySelectorAll(".sm-beacon-row");
        let rawPoints = [];

        for (let i = 0; i < rows.length; i++) {
            const eVal = parseFloat(rows[i].querySelector(".beacon-e").value);
            const nVal = parseFloat(rows[i].querySelector(".beacon-n").value);

            if (isNaN(eVal) || isNaN(nVal)) {
                alert(`Please enter valid coordinates for Beacon #${i + 1}`);
                return null;
            }

            // Convert according to selected CRS
            if (SURVEYOR.selectedCRS === "EPSG:4326") {
                rawPoints.push([nVal, eVal]);
            } else {
                try {
                    const [lng, lat] = proj4(SURVEYOR.selectedCRS, "EPSG:4326", [eVal, nVal]);
                    rawPoints.push([lat, lng]);
                } catch (err) {
                    alert(`Coordinate reprojection error for Beacon #${i + 1}: ${err.message}`);
                    return null;
                }
            }
        }

        if (rawPoints.length < 3) {
            alert("A claim polygon must contain at least 3 corner beacons.");
            return null;
        }

        // INTELLIGENT TOPOLOGICAL CLASSIFICATION (Boundary vs DP):
        const classified = classifyBoundaryAndDP(rawPoints, SURVEYOR.discoveryPoint);
        const boundaryPoints = classified.boundary;
        const dpPoint = classified.dp;
        SURVEYOR.discoveryPoint = dpPoint;

        // Auto-untangle boundary if needed
        const untangledBoundary = uncrossPolygon2Opt(boundaryPoints);

        if (dpPoint) {
            renderDPUISection(dpPoint, untangledBoundary[0]);
        }

        // Calculate Area and Perimeter using untangled boundary
        const metrics = computePolygonMetrics(untangledBoundary);
        updateCalculationSummary(metrics.areaHa, metrics.perimeterKm, untangledBoundary.length, metrics.centroid);

        // Run Clash Detection Guardrail
        const clash = checkSpatialClashes(untangledBoundary);
        renderClashAlertUI(clash);

        // Preview untangled polygon and DP on map
        previewPolygonOnMap(untangledBoundary, clash, dpPoint);

        const badge = document.getElementById("untangle-status-msg");
        if (badge) {
            badge.classList.remove("hidden");
            const dpNotice = dpPoint ? " • 🎯 Discovery Point (DP) isolated inside boundary" : "";
            document.getElementById("untangle-status-text").textContent = `✨ Geometric Intelligence: Polygon untangled cleanly${dpNotice}.`;
            setTimeout(() => badge.classList.add("hidden"), 5000);
        }

        return untangledBoundary;
    }

    function computePolygonMetrics(latLngs) {
        let areaSqMeters = 0;
        let perimeterMeters = 0;

        const numPoints = latLngs.length;
        let sumLat = 0;
        let sumLng = 0;

        for (let i = 0; i < numPoints; i++) {
            sumLat += latLngs[i][0];
            sumLng += latLngs[i][1];

            const p1 = latLngs[i];
            const p2 = latLngs[(i + 1) % numPoints];

            perimeterMeters += haversineDistance(p1[0], p1[1], p2[0], p2[1]);

            const x1 = p1[1] * (Math.PI / 180) * 6378137 * Math.cos(p1[0] * (Math.PI / 180));
            const y1 = p1[0] * (Math.PI / 180) * 6378137;
            const x2 = p2[1] * (Math.PI / 180) * 6378137 * Math.cos(p2[0] * (Math.PI / 180));
            const y2 = p2[0] * (Math.PI / 180) * 6378137;

            areaSqMeters += (x1 * y2 - x2 * y1);
        }

        areaSqMeters = Math.abs(areaSqMeters / 2);
        const areaHa = areaSqMeters / 10000;
        const perimeterKm = perimeterMeters / 1000;
        const centroid = [sumLat / numPoints, sumLng / numPoints];

        return { areaHa, perimeterKm, centroid };
    }

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    function updateCalculationSummary(areaHa, perimKm, count, centroid) {
        document.getElementById("sm-calc-area").textContent = `${areaHa.toFixed(2)} Ha (${(areaHa * 2.471).toFixed(1)} Acres)`;
        document.getElementById("sm-calc-perimeter").textContent = `${perimKm.toFixed(2)} km`;
        document.getElementById("sm-calc-beacons").textContent = `${count} Corners`;
        document.getElementById("sm-calc-centroid").textContent = `${centroid[0].toFixed(4)}°S, ${centroid[1].toFixed(4)}°E`;
    }

    function previewPolygonOnMap(wgsPoints, clash) {
        if (!window.STATE || !window.STATE.map) return;
        if (SURVEYOR.previewLayer) {
            window.STATE.map.removeLayer(SURVEYOR.previewLayer);
        }

        const color = clash ? clash.color : "#f59e0b";
        SURVEYOR.previewLayer = L.polygon(wgsPoints, {
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: clash && clash.severity === "CRITICAL_PROHIBITED" ? 0.45 : 0.35,
            dashArray: "6, 4"
        }).addTo(window.STATE.map);

        window.STATE.map.flyToBounds(wgsPoints, { padding: [50, 50], duration: 1.2 });
    }

    // 10. Interactive Map Drawing Workflow
    function startInteractiveMapDrawing() {
        SURVEYOR.isDrawing = true;
        SURVEYOR.drawBoundaryPoints = [];
        SURVEYOR.discoveryPoint = null;
        clearDrawLayers();

        const map = window.STATE ? window.STATE.map : null;
        if (!map) return;

        map.getContainer().style.cursor = "crosshair";
        const hud = document.getElementById("floating-draw-hud");
        hud.classList.remove("hidden");
        document.getElementById("fdh-pts-count").textContent = "0";
        document.getElementById("fdh-alert-msg").classList.add("hidden");

        map.on("click", onMapDrawClick);
    }

    function createDPIcon() {
        return L.divIcon({
            className: "dp-custom-leaflet-icon",
            html: `<div class="dp-beacon-icon-wrap" title="Discovery Point (DP Beacon)">
                <div class="dp-radar-ring"></div>
                <div class="dp-inner-dot"></div>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    function onMapDrawClick(e) {
        if (!SURVEYOR.isDrawing) return;

        const map = window.STATE ? window.STATE.map : null;
        if (!map) return;

        const clickPt = [e.latlng.lat, e.latlng.lng];

        // Check if point falls inside protected ZimParks reserve
        let pointInsidePark = null;
        for (const park of ZIMPARKS_RESERVES) {
            if (pointInPolygon(clickPt, park.bounds)) {
                pointInsidePark = park;
                break;
            }
        }

        // INTELLIGENT DISCOVERY POINT (DP) DETECTION:
        // If we already have >= 3 boundary points and the clicked point is INSIDE the boundary,
        // it is automatically recognized as the interior Discovery Point (DP)!
        if (SURVEYOR.drawBoundaryPoints.length >= 3 && pointInPolygon(clickPt, SURVEYOR.drawBoundaryPoints)) {
            console.log("🎯 [Geometric Intelligence] Inside point detected -> Assigned as Discovery Point (DP):", clickPt);
            SURVEYOR.discoveryPoint = clickPt;

            if (SURVEYOR.dpMarker) {
                map.removeLayer(SURVEYOR.dpMarker);
            }
            if (SURVEYOR.dpTieLine) {
                map.removeLayer(SURVEYOR.dpTieLine);
            }

            // Place gold DP marker
            SURVEYOR.dpMarker = L.marker(clickPt, {
                icon: createDPIcon(),
                zIndexOffset: 1000
            }).addTo(map);

            const b1 = SURVEYOR.drawBoundaryPoints[0];
            const tie = calculateDPTieMetrics(clickPt, b1, SURVEYOR.selectedCRS);

            SURVEYOR.dpMarker.bindTooltip(`🎯 <strong>Discovery Point (DP)</strong><br><span style="font-size:10px;color:#fbbf24;">Tie to B1: ${tie.bearingStr} • ${tie.distanceM}m</span>`, {
                permanent: true,
                direction: "top",
                className: "dp-tie-tooltip"
            });

            // Draw dashed survey tie line from DP to Beacon 1
            SURVEYOR.dpTieLine = L.polyline([clickPt, b1], {
                color: "#fbbf24",
                weight: 2,
                dashArray: "4, 4",
                opacity: 0.95
            }).addTo(map);

            const alertMsg = document.getElementById("fdh-alert-msg");
            const alertText = document.getElementById("fdh-alert-text");
            alertMsg.classList.remove("hidden");
            alertMsg.style.borderColor = "#fbbf24";
            alertMsg.style.background = "rgba(245, 158, 11, 0.2)";
            alertText.innerHTML = `🎯 <strong>Discovery Point (DP)</strong> set &amp; tied to B1 (${tie.distanceM}m)!`;
            return;
        }

        // Otherwise: Add as outer boundary beacon
        SURVEYOR.drawBoundaryPoints.push(clickPt);

        // Untangle boundary in real time using 2-opt so it NEVER twists!
        if (SURVEYOR.drawBoundaryPoints.length >= 4) {
            SURVEYOR.drawBoundaryPoints = uncrossPolygon2Opt(SURVEYOR.drawBoundaryPoints);
        }

        // Render corner marker
        const markerColor = pointInsidePark ? "#ef4444" : "#f59e0b";
        const marker = L.circleMarker(clickPt, {
            radius: 6,
            color: markerColor,
            fillColor: "#ffffff",
            fillOpacity: 1,
            weight: 2
        }).addTo(map);

        SURVEYOR.drawMarkers.push(marker);

        const totalPts = SURVEYOR.drawBoundaryPoints.length + (SURVEYOR.discoveryPoint ? 1 : 0);
        document.getElementById("fdh-pts-count").textContent = `${SURVEYOR.drawBoundaryPoints.length} corners${SURVEYOR.discoveryPoint ? ' + 1 DP' : ''}`;

        const alertMsg = document.getElementById("fdh-alert-msg");
        const alertText = document.getElementById("fdh-alert-text");
        const pulse = document.getElementById("fdh-pulse-badge");

        if (pointInsidePark) {
            alertMsg.classList.remove("hidden");
            alertText.textContent = `Inside ${pointInsidePark.name}!`;
            pulse.style.background = "#ef4444";
        } else if (!SURVEYOR.discoveryPoint) {
            alertMsg.classList.add("hidden");
            pulse.style.background = "#f59e0b";
        }

        // Draw live untangled perimeter
        const polyColor = pointInsidePark ? "#ef4444" : "#f59e0b";

        if (SURVEYOR.drawBoundaryPoints.length === 2) {
            if (SURVEYOR.tempPolyline) map.removeLayer(SURVEYOR.tempPolyline);
            SURVEYOR.tempPolyline = L.polyline(SURVEYOR.drawBoundaryPoints, { color: polyColor, weight: 2.5 }).addTo(map);
        } else if (SURVEYOR.drawBoundaryPoints.length > 2) {
            if (SURVEYOR.tempPolyline) {
                map.removeLayer(SURVEYOR.tempPolyline);
                SURVEYOR.tempPolyline = null;
            }
            if (SURVEYOR.tempPolygon) {
                map.removeLayer(SURVEYOR.tempPolygon);
            }
            // Always draw the uncrossed, untangled polygon!
            SURVEYOR.tempPolygon = L.polygon(SURVEYOR.drawBoundaryPoints, {
                color: polyColor,
                weight: 2.5,
                fillColor: polyColor,
                fillOpacity: 0.25
            }).addTo(map);

            // If DP already exists, update the tie line to B1
            if (SURVEYOR.discoveryPoint && SURVEYOR.dpTieLine) {
                map.removeLayer(SURVEYOR.dpTieLine);
                const b1 = SURVEYOR.drawBoundaryPoints[0];
                SURVEYOR.dpTieLine = L.polyline([SURVEYOR.discoveryPoint, b1], {
                    color: "#fbbf24", weight: 2, dashArray: "4, 4", opacity: 0.95
                }).addTo(map);
            }
        }
    }

    function finishInteractiveDrawing() {
        if (SURVEYOR.drawBoundaryPoints.length < 3) {
            alert("Please click at least 3 points on the satellite map to close the claim boundary.");
            return;
        }

        const map = window.STATE ? window.STATE.map : null;
        if (map) {
            map.getContainer().style.cursor = "";
            map.off("click", onMapDrawClick);
        }

        SURVEYOR.isDrawing = false;
        document.getElementById("floating-draw-hud").classList.add("hidden");

        // Ensure 2-opt untangling
        SURVEYOR.drawBoundaryPoints = uncrossPolygon2Opt(SURVEYOR.drawBoundaryPoints);

        // Convert points to Beacon Table
        populateBeaconsFromLatLngs(SURVEYOR.drawBoundaryPoints, SURVEYOR.discoveryPoint);

        // Re-open surveyor modal and calculate metrics
        openSurveyorModal("beacons");
        calculateAndPreviewFromTable();
    }

    function cancelInteractiveDrawing() {
        const map = window.STATE ? window.STATE.map : null;
        if (map) {
            map.getContainer().style.cursor = "";
            map.off("click", onMapDrawClick);
        }
        SURVEYOR.isDrawing = false;
        document.getElementById("floating-draw-hud").classList.add("hidden");
        clearDrawLayers();
    }

    function clearDrawLayers() {
        const map = window.STATE ? window.STATE.map : null;
        if (!map) return;
        SURVEYOR.drawMarkers.forEach(m => map.removeLayer(m));
        SURVEYOR.drawMarkers = [];
        if (SURVEYOR.dpMarker) {
            map.removeLayer(SURVEYOR.dpMarker);
            SURVEYOR.dpMarker = null;
        }
        if (SURVEYOR.dpTieLine) {
            map.removeLayer(SURVEYOR.dpTieLine);
            SURVEYOR.dpTieLine = null;
        }
        if (SURVEYOR.tempPolyline) {
            map.removeLayer(SURVEYOR.tempPolyline);
            SURVEYOR.tempPolyline = null;
        }
        if (SURVEYOR.tempPolygon) {
            map.removeLayer(SURVEYOR.tempPolygon);
            SURVEYOR.tempPolygon = null;
        }
    }

    function populateBeaconsFromLatLngs(latLngs, dpPt = null) {
        const list = document.getElementById("sm-beacons-list");
        if (!list) return;
        list.innerHTML = "";

        latLngs.forEach((pt, idx) => {
            let eVal = pt[1];
            let nVal = pt[0];

            if (SURVEYOR.selectedCRS !== "EPSG:4326") {
                try {
                    const [easting, northing] = proj4("EPSG:4326", SURVEYOR.selectedCRS, [pt[1], pt[0]]);
                    eVal = Math.round(easting);
                    nVal = Math.round(northing);
                } catch (err) {}
            } else {
                eVal = pt[1].toFixed(5);
                nVal = pt[0].toFixed(5);
            }

            addBeaconRow(idx + 1, eVal, nVal);
        });

        if (dpPt) {
            renderDPUISection(dpPt, latLngs[0]);
        }
    }

    function renderDPUISection(dpPt, b1Pt) {
        let dpSec = document.getElementById("sm-dp-display-section");
        const container = document.getElementById("content-mode-beacons");
        if (!container) return;

        if (!dpSec) {
            dpSec = document.createElement("div");
            dpSec.id = "sm-dp-display-section";
            dpSec.className = "sm-dp-section";
            const actionsDiv = container.querySelector(".sm-beacon-actions");
            if (actionsDiv) {
                container.insertBefore(dpSec, actionsDiv);
            } else {
                container.appendChild(dpSec);
            }
        }

        const tie = calculateDPTieMetrics(dpPt, b1Pt, SURVEYOR.selectedCRS);
        if (!tie) return;

        dpSec.innerHTML = `
            <div class="sm-dp-header">
                <div class="sm-dp-title">
                    <span style="font-size:14px;">🎯</span>
                    <span>Discovery Point (DP) — Statutory Mineral Peg</span>
                </div>
                <span class="sm-dp-badge">AUTO-DETECTED INSIDE CLAIM</span>
            </div>
            <div class="sm-dp-grid">
                <div class="sm-dp-cell">
                    <span class="sm-dp-lbl">Arc 1950 (UTM 36S) Easting</span>
                    <span class="sm-dp-val">${tie.dpCoords.easting.toLocaleString()} m</span>
                </div>
                <div class="sm-dp-cell">
                    <span class="sm-dp-lbl">Arc 1950 (UTM 36S) Northing</span>
                    <span class="sm-dp-val">${tie.dpCoords.northing.toLocaleString()} m</span>
                </div>
                <div class="sm-dp-cell">
                    <span class="sm-dp-lbl">WGS 84 Coordinates</span>
                    <span class="sm-dp-val">${tie.dpCoords.lat.toFixed(5)}°S, ${tie.dpCoords.lng.toFixed(5)}°E</span>
                </div>
                <div class="sm-dp-cell" style="border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.12);">
                    <span class="sm-dp-lbl" style="color:#fbbf24;">Survey Tie to Beacon 1</span>
                    <span class="sm-dp-val" style="color:#fef08a;">${tie.bearingStr} • ${tie.distanceM} m</span>
                </div>
            </div>
        `;
    }

    function renderClaimsDatabaseTable(filterQuery = "") {
        const tbody = document.getElementById("sm-db-table-body");
        if (!tbody) return;

        const allClaims = (window.STATE && Array.isArray(window.STATE.concessions)) ? window.STATE.concessions : SURVEYOR.customConcessions;

        let filtered = allClaims;
        if (filterQuery) {
            filtered = filtered.filter(c =>
                (c.name && c.name.toLowerCase().includes(filterQuery)) ||
                (c.mineral && c.mineral.toLowerCase().includes(filterQuery)) ||
                (c.license_no && c.license_no.toLowerCase().includes(filterQuery)) ||
                (c.district && c.district.toLowerCase().includes(filterQuery))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#94a3b8; font-size:12px;">No matching claims in sovereign database.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(c => {
            const isCustom = SURVEYOR.customConcessions.some(cust => cust.id === c.id);
            const statusClass = c.status === "Active" ? "active" : (c.status.includes("Sandbox") ? "sandbox" : "warning");
            const areaAcres = c.area_hectares ? (c.area_hectares * 2.471).toFixed(1) : "–";

            return `
                <tr data-claim-id="${c.id}">
                    <td>
                        <strong class="db-claim-title">${c.name}</strong>
                        <span class="db-claim-sub">${c.operator || 'Mining Syndicate'} • ${c.district || 'Zimbabwe'}</span>
                    </td>
                    <td><code class="db-code">${c.license_no || c.id}</code></td>
                    <td><span class="db-mineral-pill">${c.mineral}</span></td>
                    <td><strong>${c.area_hectares || '–'} Ha</strong> <small style="color:#64748b;">(${areaAcres} Ac)</small></td>
                    <td><span class="db-crs-pill">${c.crs || 'Arc 1950 UTM'}</span></td>
                    <td><span class="db-status-badge ${statusClass}">${c.status}</span></td>
                    <td style="text-align:right;">
                        <div class="db-row-actions">
                            <button type="button" class="btn-db-fly" data-claim-id="${c.id}" title="Focus &amp; Fly to Claim on Satellite Map">
                                <i data-lucide="crosshair" style="width:12px;height:12px;"></i>
                                <span>Fly on Map</span>
                            </button>
                            <button type="button" class="btn-db-export" data-claim-id="${c.id}" title="Download GeoJSON Boundary Definition">
                                <i data-lucide="download" style="width:12px;height:12px;"></i>
                            </button>
                            ${isCustom ? `
                                <button type="button" class="btn-db-delete" data-claim-id="${c.id}" title="Delete Claim from Database">
                                    <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (window.lucide) lucide.createIcons();

        tbody.querySelectorAll(".btn-db-fly").forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute("data-claim-id");
                flyToClaimOnMap(id);
            };
        });

        tbody.querySelectorAll(".btn-db-export").forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute("data-claim-id");
                exportClaimAsGeoJSON(id);
            };
        });

        tbody.querySelectorAll(".btn-db-delete").forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute("data-claim-id");
                deleteClaimFromDatabase(id);
            };
        });
    }

    function flyToClaimOnMap(claimId) {
        closeModal();
        const allClaims = (window.STATE && Array.isArray(window.STATE.concessions)) ? window.STATE.concessions : SURVEYOR.customConcessions;
        const claim = allClaims.find(c => c.id === claimId);
        if (!claim) return;

        const navConcessions = document.getElementById("nav-concessions");
        navConcessions?.click();

        if (claim.bounds && window.STATE && window.STATE.map) {
            window.STATE.map.flyToBounds(claim.bounds, { padding: [80, 80], duration: 1.5 });
        } else if (claim.lat && claim.lng && window.STATE && window.STATE.map) {
            window.STATE.map.flyTo([claim.lat, claim.lng], 13, { duration: 1.5 });
        }

        if (typeof window.selectConcession === "function") {
            window.selectConcession(claimId, false);
        }
    }

    function exportClaimAsGeoJSON(claimId) {
        const allClaims = (window.STATE && Array.isArray(window.STATE.concessions)) ? window.STATE.concessions : SURVEYOR.customConcessions;
        const claim = allClaims.find(c => c.id === claimId);
        if (!claim || !claim.bounds) return;

        // Ensure closing ring for polygon
        const coordinates = claim.bounds.map(p => [p[1], p[0]]);
        if (coordinates.length > 0) {
            coordinates.push([coordinates[0][0], coordinates[0][1]]);
        }

        const features = [
            {
                type: "Feature",
                properties: {
                    feature_type: "Cadastral Boundary Perimeter",
                    id: claim.id,
                    name: claim.name,
                    operator: claim.operator,
                    mineral: claim.mineral,
                    license_no: claim.license_no,
                    district: claim.district,
                    area_hectares: claim.area_hectares,
                    crs: claim.crs || "Arc 1950 UTM Zone 36S",
                    status: claim.status,
                    compliance_score: claim.compliance_score
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates]
                }
            }
        ];

        // If Discovery Point (DP) exists, add DP Point feature & tie-line
        if (claim.dp && claim.dp.lat && claim.dp.lng) {
            features.push({
                type: "Feature",
                properties: {
                    feature_type: "Discovery Point (DP) Statutory Peg",
                    claim_id: claim.id,
                    name: `DP - ${claim.name}`,
                    role: "Primary Mineral Outcrop / Datum",
                    tie_bearing: claim.dp.metrics?.bearingStr || "N/A",
                    tie_distance_m: claim.dp.metrics?.distanceM || "N/A"
                },
                geometry: {
                    type: "Point",
                    coordinates: [claim.dp.lng, claim.dp.lat]
                }
            });

            if (claim.bounds.length > 0) {
                features.push({
                    type: "Feature",
                    properties: {
                        feature_type: "Statutory Survey Tie Line (DP to B1)",
                        bearing: claim.dp.metrics?.bearingStr || "N/A",
                        distance_m: claim.dp.metrics?.distanceM || "N/A"
                    },
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [claim.dp.lng, claim.dp.lat],
                            [claim.bounds[0][1], claim.bounds[0][0]]
                        ]
                    }
                });
            }
        }

        const geojson = {
            type: "FeatureCollection",
            crs: {
                type: "name",
                properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
            },
            features: features
        };

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${claim.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Cadastre_DP.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function deleteClaimFromDatabase(claimId) {
        if (!confirm(`Are you sure you want to remove this claim from your local database?`)) return;

        SURVEYOR.customConcessions = SURVEYOR.customConcessions.filter(c => c.id !== claimId);
        if (window.STATE && Array.isArray(window.STATE.concessions)) {
            window.STATE.concessions = window.STATE.concessions.filter(c => c.id !== claimId);
        }

        localStorage.setItem("nmih_custom_claims_db", JSON.stringify(SURVEYOR.customConcessions));

        if (typeof window.renderConcessionsList === "function" && window.STATE) {
            window.renderConcessionsList(window.STATE.concessions);
        }
        if (typeof window.renderConcessionsOnMap === "function" && window.STATE) {
            window.renderConcessionsOnMap(window.STATE.concessions);
        }

        renderClaimsDatabaseTable();
        updateDBCountBadge();
    }

    // 12. Commit and Save Claim to Database
    function commitSurveyedClaim() {
        const name = document.getElementById("sm-claim-name").value.trim();
        const holder = document.getElementById("sm-claim-holder").value.trim();
        const mineral = document.getElementById("sm-mineral-target").value;
        const license = document.getElementById("sm-license-no").value.trim() || `MC-ZW-${Math.floor(1000 + Math.random() * 9000)}`;
        const district = document.getElementById("sm-district").value.trim() || "Great Dyke Central";

        if (!name) {
            alert("Please enter a Claim / Concession Name.");
            document.getElementById("sm-claim-name").focus();
            return;
        }

        const wgsPoints = calculateAndPreviewFromTable();
        if (!wgsPoints) return;

        const metrics = computePolygonMetrics(wgsPoints);
        const clash = SURVEYOR.activeClash || checkSpatialClashes(wgsPoints);

        const isSandbox = clash.severity === "CRITICAL_PROHIBITED";
        const status = isSandbox ? "Draft / Sandbox Simulation" : "Active";
        const riskLevel = isSandbox ? "Critical Violation" : (clash.severity === "CONCESSION_OVERLAP" ? "High" : "Low");

        const b1 = wgsPoints[0];
        const dpMetrics = SURVEYOR.discoveryPoint ? calculateDPTieMetrics(SURVEYOR.discoveryPoint, b1, SURVEYOR.selectedCRS) : null;

        const newClaim = {
            id: `ZIM-CLAIM-${Math.floor(100 + Math.random() * 900)}`,
            name: isSandbox ? `[SANDBOX] ${name}` : name,
            district: district,
            mineral: mineral,
            status: status,
            risk_level: riskLevel,
            yield_rating: isSandbox ? "Restricted Zone" : "High Yield",
            lat: SURVEYOR.discoveryPoint ? SURVEYOR.discoveryPoint[0] : metrics.centroid[0],
            lng: SURVEYOR.discoveryPoint ? SURVEYOR.discoveryPoint[1] : metrics.centroid[1],
            dp: SURVEYOR.discoveryPoint ? {
                lat: SURVEYOR.discoveryPoint[0],
                lng: SURVEYOR.discoveryPoint[1],
                metrics: dpMetrics
            } : null,
            operator: holder || "Registered Mining Syndicate",
            license_no: isSandbox ? `DRAFT-AOI-${Math.floor(1000 + Math.random() * 9000)}` : license,
            area_hectares: parseFloat(metrics.areaHa.toFixed(2)),
            monthly_tonnage: Math.round(metrics.areaHa * 1.5),
            compliance_score: isSandbox ? 15 : 96,
            crs: SURVEYOR.selectedCRS,
            spectral_signature: isSandbox ? "Unverified Exploratory Polygon" : "Surveyed Groundtruth Concession",
            bounds: wgsPoints,
            clash_audit: clash,
            created_at: new Date().toISOString()
        };

        saveClaimToDatabase(newClaim);
        closeModal();

        if (isSandbox) {
            alert(`⚠️ NOTICE: Saved in Sandbox Simulation Mode!\n\nClaim "${newClaim.name}" has been placed in your private exploratory workspace.\n\nReason: Overlaps ${clash.entityName} (${clash.badgeText}).\nIt will NOT be committed to the official sovereign gazette.`);
        } else {
            alert(`✅ SUCCESS: Claim "${newClaim.name}" has been registered in the Sovereign Database!\n\nArea: ${newClaim.area_hectares} Ha\nCRS: ${SURVEYOR.selectedCRS}\nLicense: ${newClaim.license_no}\nClash Status: UNENCUMBERED\n\nBoundary polygon is now live on your Leaflet map.`);
        }
    }

})();
