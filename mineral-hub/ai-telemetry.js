/**
 * ============================================================
 * THE NATIONAL MINERAL INTELLIGENCE HUB — AI TELEMETRY ENGINE
 * Deep Learning Architecture, Compute Footprint, Loss Curves,
 * and 10-PGE Geochemical Covariance Visualizer
 * ============================================================
 */

(function () {
    let telemetryData = null;

    async function loadTelemetryData() {
        if (telemetryData) return telemetryData;
        try {
            const res = await fetch("data/ai_telemetry.json");
            if (res.ok) {
                telemetryData = await res.json();
                return telemetryData;
            }
        } catch (e) {
            console.warn("Could not load ai_telemetry.json, using runtime fallback", e);
        }
        return null;
    }

    function initAITelemetry() {
        const btnPill = document.getElementById("btn-ai-telemetry");
        const btnNav = document.getElementById("nav-ai-telemetry");
        const modal = document.getElementById("ai-telemetry-modal");
        const closeBtn = document.getElementById("ai-telemetry-modal-close");

        function openModal() {
            if (!modal) return;
            modal.classList.remove("hidden");
            renderTelemetryDashboard();
            if (window.lucide) lucide.createIcons();
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add("hidden");
        }

        btnPill?.addEventListener("click", openModal);
        btnNav?.addEventListener("click", openModal);
        closeBtn?.addEventListener("click", closeModal);

        // Click outside to close
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        // Tab switching inside modal
        const tabs = modal?.querySelectorAll(".modal-tab-btn");
        tabs?.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                const targetId = tab.getAttribute("data-tab");
                const contents = modal.querySelectorAll(".modal-tab-content");
                contents.forEach((c) => {
                    if (c.id === targetId) {
                        c.classList.remove("hidden");
                    } else {
                        c.classList.add("hidden");
                    }
                });
            });
        });
    }

    async function renderTelemetryDashboard() {
        const data = await loadTelemetryData();
        if (!data) return;

        // Render Loss Convergence SVG Chart
        renderLossChart(data.curves);

        // Render Covariance Matrix Table
        renderCovarianceMatrix(data.geochemical_basket);
    }

    function renderLossChart(curves) {
        const container = document.getElementById("ai-loss-chart-container");
        if (!container || !curves) return;

        const epochs = curves.epochs;
        const train = curves.train_loss;
        const val = curves.val_loss;
        const n = epochs.length;
        if (n < 2) return;

        const w = 760;
        const h = 260;
        const padL = 55;
        const padR = 25;
        const padT = 30;
        const padB = 40;

        const maxLoss = Math.max(...train, ...val);
        const minLoss = 0;

        function getX(i) {
            return padL + (i / (n - 1)) * (w - padL - padR);
        }
        function getY(val) {
            return h - padB - ((val - minLoss) / (maxLoss - minLoss)) * (h - padT - padB);
        }

        let trainPoints = "";
        let valPoints = "";
        for (let i = 0; i < n; i++) {
            const x = getX(i).toFixed(1);
            const yt = getY(train[i]).toFixed(1);
            const yv = getY(val[i]).toFixed(1);
            trainPoints += (i === 0 ? "M" : "L") + `${x},${yt} `;
            valPoints += (i === 0 ? "M" : "L") + `${x},${yv} `;
        }

        let gridLines = "";
        for (let l = 0; l <= 1.0; l += 0.2) {
            if (l > maxLoss * 1.1) break;
            const y = getY(l);
            gridLines += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="4,4"/>`;
            gridLines += `<text x="${padL - 10}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end" font-family="monospace">${l.toFixed(2)}</text>`;
        }

        const svg = `
        <svg viewBox="0 0 ${w} ${h}" class="ai-svg-chart" style="width:100%; height:auto; overflow:visible;">
            <defs>
                <linearGradient id="trainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <!-- X Axis -->
            <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="rgba(255,255,255,0.15)"/>
            <text x="${padL}" y="${h - 15}" fill="#64748b" font-size="10" font-family="monospace">Epoch 1</text>
            <text x="${(padL + w - padR) / 2}" y="${h - 15}" fill="#64748b" font-size="10" text-anchor="middle" font-family="monospace">Epoch 250</text>
            <text x="${w - padR}" y="${h - 15}" fill="#10b981" font-size="10" font-weight="700" text-anchor="end" font-family="monospace">Epoch 420 (Early Stop)</text>

            <!-- Curves -->
            <path d="${trainPoints}" fill="none" stroke="#10b981" stroke-width="2.4" stroke-linecap="round"/>
            <path d="${valPoints}" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3,3"/>

            <!-- Current Final Point Marker -->
            <circle cx="${getX(n - 1)}" cy="${getY(train[n - 1])}" r="4" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="${getX(n - 1)}" cy="${getY(val[n - 1])}" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
        <div class="chart-legend-row" style="display:flex; gap:20px; justify-content:center; margin-top:8px; font-size:11.5px;">
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:3px; background:#10b981; border-radius:2px;"></span>
                <span style="color:#e2e8f0; font-weight:600;">Training Multi-Task Loss: <strong style="color:#10b981;">${train[n - 1].toFixed(4)}</strong></span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:12px; height:3px; background:#f59e0b; border-radius:2px; border:1px dashed #f59e0b;"></span>
                <span style="color:#e2e8f0; font-weight:600;">Validation (LODO North Hill & Fault): <strong style="color:#f59e0b;">${val[n - 1].toFixed(4)}</strong></span>
            </div>
        </div>
        `;
        container.innerHTML = svg;
    }

    function renderCovarianceMatrix(basket) {
        const tableContainer = document.getElementById("ai-covariance-table-container");
        if (!tableContainer || !basket || !basket.correlation_matrix) return;

        const elements = basket.elements;
        const matrix = basket.correlation_matrix;

        function getCellColor(val) {
            if (val >= 0.9) return "rgba(16, 185, 129, 0.45)"; // Deep emerald
            if (val >= 0.75) return "rgba(16, 185, 129, 0.28)"; // Emerald
            if (val >= 0.6) return "rgba(56, 189, 248, 0.22)";  // Cyan
            if (val >= 0.5) return "rgba(168, 85, 247, 0.18)";  // Purple
            return "rgba(255, 255, 255, 0.05)";
        }

        let html = `
        <table class="ai-cov-table" style="width:100%; border-collapse:collapse; font-size:11px; text-align:center;">
            <thead>
                <tr>
                    <th style="padding:6px; color:#94a3b8; border-bottom:1px solid rgba(255,255,255,0.1);">Elem</th>
                    ${elements.map(el => `<th style="padding:6px; color:#38bdf8; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.1);">${el}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
        `;

        matrix.forEach((row) => {
            html += `<tr><td style="padding:5px; font-weight:700; color:#38bdf8; border-right:1px solid rgba(255,255,255,0.08);">${row.element}</td>`;
            elements.forEach((colEl) => {
                const val = row[colEl];
                const bg = getCellColor(val);
                const isDiag = row.element === colEl;
                html += `<td style="padding:5px; background:${bg}; border:1px solid rgba(255,255,255,0.04); font-family:monospace; color:${isDiag ? '#10b981' : '#f1f5f9'}; font-weight:${val >= 0.7 ? '700' : '400'};">${val.toFixed(2)}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        tableContainer.innerHTML = html;
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAITelemetry);
    } else {
        initAITelemetry();
    }
})();
