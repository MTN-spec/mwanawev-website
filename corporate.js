/* ==========================================================================
   MTN-SPEC Corporate Website — Interactive Telemetry & UI Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavbarAndScrollSpy();
    initHeroTypewriter();
    initHeroShowcasePane();
    initTeamFromConfig();
    initOrbitalCanvas();
    initScrollReveal();
    initPlatformFilterTabs();
    initAgriShieldConsole();
    initChangeItSimulator();
    initMineralHubConsole();
    initContactPrefillAndForm();
});

/* 1. Sticky Navbar, Dropdown Menus, Mobile Accordion & Scroll Spy */
function initNavbarAndScrollSpy() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const topNavLinks = document.querySelectorAll('.nav-links > li > a');
    const dropdownParents = document.querySelectorAll('.nav-links > li.has-dropdown');
    const dropdownItems = document.querySelectorAll('.nav-dropdown a');
    const sections = document.querySelectorAll('section[id]');

    function closeMobileMenu() {
        if (!navMenu) return;
        navMenu.classList.remove('open');
        dropdownParents.forEach((li) => li.classList.remove('mobile-open'));
        if (mobileToggle) {
            const icon = mobileToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        }
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        let currentId = 'hero';
        sections.forEach((sec) => {
            const top = sec.offsetTop - 140;
            if (window.scrollY >= top) {
                currentId = sec.getAttribute('id');
            }
        });

        topNavLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
        });
    });

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = navMenu.classList.contains('open') ? 'fas fa-xmark' : 'fas fa-bars';
            }
        });

        topNavLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                const parentLi = link.parentElement;
                if (window.innerWidth <= 960 && parentLi && parentLi.classList.contains('has-dropdown')) {
                    if (!parentLi.classList.contains('mobile-open')) {
                        e.preventDefault();
                        dropdownParents.forEach((other) => {
                            if (other !== parentLi) other.classList.remove('mobile-open');
                        });
                        parentLi.classList.add('mobile-open');
                        return;
                    }
                }
                closeMobileMenu();
            });
        });

        dropdownItems.forEach((item) => {
            item.addEventListener('click', () => {
                const href = item.getAttribute('href') || '';
                if (href.startsWith('#platform-')) {
                    const allTab = document.querySelector('.p-tab[data-filter="all"]');
                    if (allTab && !allTab.classList.contains('active')) {
                        allTab.click();
                    }
                }
                if (href.startsWith('#') && href.length > 1) {
                    const targetEl = document.querySelector(href);
                    if (targetEl && !targetEl.matches('section')) {
                        targetEl.classList.add('card-spotlight-pulse');
                        setTimeout(() => targetEl.classList.remove('card-spotlight-pulse'), 1900);
                    }
                }
                item.blur();
                closeMobileMenu();
            });
        });
    }
}

/* 2. Hero Rotating Sector Typewriter */
function initHeroTypewriter() {
    const target = document.getElementById('typing-sector');
    if (!target) return;

    const phrases = [
        'Orbital Mineral Mapping & GDSS',
        'Deep-Learning Crop & Drought Monitoring',
        'Urban Spatial Mobility & Digital Change',
        'Enterprise GIS & Drone LiDAR Engineering'
    ];

    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let isDeleting = true;

    function tick() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            charIndex--;
            target.textContent = currentPhrase.substring(0, charIndex);
        } else {
            charIndex++;
            target.textContent = currentPhrase.substring(0, charIndex);
        }

        let delay = isDeleting ? 35 : 65;

        if (!isDeleting && charIndex === currentPhrase.length) {
            delay = 2400;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 320;
        }

        setTimeout(tick, delay);
    }

    setTimeout(tick, 2400);
}

/* 2b. Hero Interactive Widescreen Media & Platform Theater */
function initHeroShowcasePane() {
    const pane = document.getElementById('hero-showcase-pane');
    if (!pane) return;

    const fallbackVentures = [
        {
            key: 'nmih',
            tabLabel: 'Mineral Hub',
            tabIcon: 'fas fa-gem',
            sector: 'Geospatial Decision Support System',
            domainText: 'nationalmineralintelligencehub.co.zw',
            launchHref: 'https://nationalmineralintelligencehub.co.zw',
            external: true,
            detailsHref: '#platform-nmih',
            title: 'The National Mineral Intelligence Hub',
            desc: 'Maps Iron Oxide, Hydrothermal Clay, and Gossan mineral alteration zones at 10m–20m Sentinel-2 resolution with GPS ground-truthing.',
            metrics: [
                { val: '10m–20m', lbl: 'Spatial Scale' },
                { val: '5 Ratios', lbl: 'Spectral Bands' },
                { val: 'GDSS', lbl: 'Target Mapping' }
            ],
            media: [
                { type: 'image', src: 'bg/bg-satellite-earth.jpg', caption: 'Copernicus Sentinel-2 Orbital Mineral Targeting (10m–20m)' }
            ]
        },
        {
            key: 'agrishield',
            tabLabel: 'AgriShield',
            tabIcon: 'fas fa-seedling',
            sector: 'Remote Sensing & Deep-Learning Crop Monitoring',
            domainText: 'agrishield.co.zw',
            launchHref: 'https://agrishield.co.zw',
            external: true,
            detailsHref: '#platform-agrishield',
            title: 'AgriShield Crop & Drought Intelligence',
            desc: 'Monitors parcel-level crop vigour, root-zone soil moisture, and drought stress across 12+ satellite indices with Deep Learning & automated payouts.',
            metrics: [
                { val: '12+ Indices', lbl: 'Multi-Sensor EO' },
                { val: 'Deep Learning', lbl: 'Stress Detection' },
                { val: 'Parametric', lbl: 'Risk Triggers' }
            ],
            media: [
                { type: 'image', src: 'bg/bg-dji-mavic3.jpg', caption: 'DJI Aerial Survey & Multi-Sensor Crop Health Telemetry' }
            ]
        },
        {
            key: 'changeit',
            tabLabel: 'Change It',
            tabIcon: 'fas fa-qrcode',
            sector: 'Urban Spatial Mobility & FinTech',
            domainText: 'changeit.co.zw • mtnspec.co.zw/changeit',
            launchHref: 'changeit.html',
            external: false,
            detailsHref: '#platform-changeit',
            title: 'Change It Urban Transit & Digital Change',
            desc: 'Analyzes urban commuter corridors while powering sub-second QR fare micro-payments that permanently eliminate cash change shortages.',
            metrics: [
                { val: 'Sub-Second', lbl: 'QR Checkout' },
                { val: 'Corridors', lbl: 'Urban Analytics' },
                { val: 'Zero Cash', lbl: 'Digital Change' }
            ],
            media: [
                { type: 'video', src: 'hero_video.mp4', poster: 'hero_transport.png', caption: 'Cashless Urban Mobility & Instant P2P Digital Change' }
            ]
        }
    ];

    const ventures =
        window.MTNSPEC_CONFIG &&
        Array.isArray(window.MTNSPEC_CONFIG.showcaseVentures) &&
        window.MTNSPEC_CONFIG.showcaseVentures.length > 0
            ? window.MTNSPEC_CONFIG.showcaseVentures
            : fallbackVentures;

    const tabs = pane.querySelectorAll('.showcase-tab');
    const dots = pane.querySelectorAll('.s-dot');
    const stage = document.getElementById('showcase-stage');
    const mediaImg = document.getElementById('showcase-media-img');
    const mediaVideo = document.getElementById('showcase-media-video');
    const mediaBadge = document.getElementById('showcase-media-badge');
    const slideCaptionEl = document.getElementById('showcase-slide-caption');
    const slidePillsEl = document.getElementById('showcase-slide-pills');
    const prevBtn = document.getElementById('showcase-prev-slide');
    const nextBtn = document.getElementById('showcase-next-slide');
    const expandBtn = document.getElementById('showcase-expand-btn');

    const body = document.getElementById('showcase-body');
    const sectorEl = document.getElementById('showcase-sector');
    const domainLink = document.getElementById('showcase-domain-link');
    const domainText = document.getElementById('showcase-domain-text');
    const titleEl = document.getElementById('showcase-title');
    const descEl = document.getElementById('showcase-desc');
    const m1Val = document.getElementById('showcase-m1-val');
    const m1Lbl = document.getElementById('showcase-m1-lbl');
    const m2Val = document.getElementById('showcase-m2-val');
    const m2Lbl = document.getElementById('showcase-m2-lbl');
    const m3Val = document.getElementById('showcase-m3-val');
    const m3Lbl = document.getElementById('showcase-m3-lbl');
    const launchBtn = document.getElementById('showcase-launch-btn');
    const detailsBtn = document.getElementById('showcase-details-btn');
    const progressEl = document.getElementById('showcase-progress');

    // Lightbox elements
    const lightbox = document.getElementById('showcase-lightbox');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxOpenLink = document.getElementById('lightbox-open-link');

    let currentVentureIdx = 0;
    let currentSlideIdx = 0;
    let progress = 0;
    let isHovered = false;
    let isLightboxOpen = false;
    const stepMs = 50;

    // Sync custom tab labels if defined in site-config.js
    tabs.forEach((tab, idx) => {
        const v = ventures[idx];
        if (v && v.tabLabel) {
            const iconClass = v.tabIcon || 'fas fa-layer-group';
            tab.innerHTML = `<i class="${iconClass}"></i> ${v.tabLabel}`;
        }
    });

    function getSlides(v) {
        if (Array.isArray(v.media) && v.media.length > 0) return v.media;
        if (v.photo) return [{ type: 'image', src: v.photo, caption: v.title || '' }];
        return [{ type: 'image', src: 'bg/bg-satellite-earth.jpg', caption: v.title || '' }];
    }

    function isVideoSlide(slide) {
        if (!slide) return false;
        return slide.type === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(slide.src || '');
    }

    function getCycleDuration() {
        const v = ventures[currentVentureIdx];
        const slides = getSlides(v);
        const slide = slides[currentSlideIdx];
        return isVideoSlide(slide) ? 8000 : 6200;
    }

    function renderSlide() {
        const v = ventures[currentVentureIdx];
        const slides = getSlides(v);
        currentSlideIdx = ((currentSlideIdx % slides.length) + slides.length) % slides.length;
        const slide = slides[currentSlideIdx];
        const videoMode = isVideoSlide(slide);

        if (videoMode && mediaVideo) {
            if (mediaImg) mediaImg.classList.remove('active');
            if (mediaVideo.getAttribute('data-active-src') !== slide.src) {
                mediaVideo.setAttribute('data-active-src', slide.src);
                mediaVideo.src = slide.src;
            }
            if (slide.poster) {
                mediaVideo.poster = slide.poster;
            } else {
                mediaVideo.removeAttribute('poster');
            }
            mediaVideo.classList.add('active');
            mediaVideo.currentTime = 0;
            const playPromise = mediaVideo.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } else if (mediaImg) {
            if (mediaVideo) {
                mediaVideo.classList.remove('active');
                try { mediaVideo.pause(); } catch (_) {}
            }
            mediaImg.classList.remove('active');
            mediaImg.src = slide.src;
            mediaImg.alt = slide.caption || v.title || 'MTN-SPEC Visual';
            // Trigger subtle smooth crossfade + Ken Burns
            requestAnimationFrame(() => {
                mediaImg.classList.add('active');
            });
        }

        if (mediaBadge) {
            const icon = videoMode ? 'fa-circle-play' : 'fa-camera';
            const prefix = videoMode ? 'Video ' : '';
            mediaBadge.innerHTML = `<i class="fas ${icon}"></i> ${prefix}${currentSlideIdx + 1} / ${slides.length}`;
        }

        if (slideCaptionEl) {
            slideCaptionEl.textContent = slide.caption || v.sector || '';
        }

        if (slidePillsEl) {
            slidePillsEl.innerHTML = '';
            if (slides.length > 1) {
                slides.forEach((_, idx) => {
                    const pill = document.createElement('button');
                    pill.type = 'button';
                    pill.className = `slide-mini-pill${idx === currentSlideIdx ? ' active' : ''}`;
                    pill.setAttribute('aria-label', `Show visual ${idx + 1}`);
                    pill.addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentSlideIdx = idx;
                        progress = 0;
                        if (progressEl) progressEl.style.width = '0%';
                        renderSlide();
                    });
                    slidePillsEl.appendChild(pill);
                });
            }
        }

        if (prevBtn) prevBtn.style.display = slides.length > 1 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = slides.length > 1 ? 'flex' : 'none';
    }

    function selectVenture(index, initialSlide = 0) {
        currentVentureIdx = ((index % ventures.length) + ventures.length) % ventures.length;
        currentSlideIdx = initialSlide;
        const v = ventures[currentVentureIdx];
        progress = 0;
        if (progressEl) progressEl.style.width = '0%';

        tabs.forEach((t, i) => {
            const active = i === currentVentureIdx;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === currentVentureIdx));

        renderSlide();

        if (body) body.classList.add('switching');

        setTimeout(() => {
            if (sectorEl) sectorEl.textContent = v.sector || '';
            if (domainText) domainText.textContent = v.domainText || '';
            if (domainLink) {
                domainLink.href = v.launchHref || '#platforms';
                if (v.external) {
                    domainLink.setAttribute('target', '_blank');
                    domainLink.setAttribute('rel', 'noopener');
                } else {
                    domainLink.removeAttribute('target');
                }
            }
            if (titleEl) titleEl.textContent = v.title || '';
            if (descEl) descEl.textContent = v.desc || '';

            const metrics = Array.isArray(v.metrics) ? v.metrics : [];
            const m1 = metrics[0] || { val: v.m1Val || '', lbl: v.m1Lbl || '' };
            const m2 = metrics[1] || { val: v.m2Val || '', lbl: v.m2Lbl || '' };
            const m3 = metrics[2] || { val: v.m3Val || '', lbl: v.m3Lbl || '' };

            if (m1Val) m1Val.textContent = m1.val;
            if (m1Lbl) m1Lbl.textContent = m1.lbl;
            if (m2Val) m2Val.textContent = m2.val;
            if (m2Lbl) m2Lbl.textContent = m2.lbl;
            if (m3Val) m3Val.textContent = m3.val;
            if (m3Lbl) m3Lbl.textContent = m3.lbl;

            if (launchBtn) {
                launchBtn.href = v.launchHref || '#platforms';
                if (v.external) {
                    launchBtn.setAttribute('target', '_blank');
                    launchBtn.setAttribute('rel', 'noopener');
                    launchBtn.innerHTML = 'Open Platform <i class="fas fa-arrow-up-right-from-square"></i>';
                } else {
                    launchBtn.removeAttribute('target');
                    launchBtn.innerHTML = 'Open Portal <i class="fas fa-arrow-right"></i>';
                }
            }
            if (detailsBtn) detailsBtn.href = v.detailsHref || '#platforms';
            if (body) body.classList.remove('switching');
        }, 120);
    }

    function stepSlide(delta) {
        const v = ventures[currentVentureIdx];
        const slides = getSlides(v);
        currentSlideIdx = ((currentSlideIdx + delta) % slides.length + slides.length) % slides.length;
        progress = 0;
        if (progressEl) progressEl.style.width = '0%';
        renderSlide();
    }

    function openLightbox() {
        if (!lightbox) return;
        const v = ventures[currentVentureIdx];
        const slides = getSlides(v);
        const slide = slides[currentSlideIdx];
        const videoMode = isVideoSlide(slide);

        isLightboxOpen = true;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');

        if (videoMode && lightboxVideo) {
            if (lightboxImg) lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = slide.src;
            if (slide.poster) lightboxVideo.poster = slide.poster;
            lightboxVideo.play().catch(() => {});
        } else if (lightboxImg) {
            if (lightboxVideo) {
                try { lightboxVideo.pause(); } catch (_) {}
                lightboxVideo.style.display = 'none';
            }
            lightboxImg.style.display = 'block';
            lightboxImg.src = slide.src;
            lightboxImg.alt = slide.caption || v.title || 'Expanded Preview';
        }

        if (lightboxCaption) {
            lightboxCaption.textContent = `${v.title} — ${slide.caption || v.sector}`;
        }
        if (lightboxOpenLink) {
            lightboxOpenLink.href = v.launchHref || '#platforms';
            if (v.external) {
                lightboxOpenLink.setAttribute('target', '_blank');
                lightboxOpenLink.setAttribute('rel', 'noopener');
            } else {
                lightboxOpenLink.removeAttribute('target');
            }
        }
    }

    function closeLightbox() {
        if (!lightbox) return;
        isLightboxOpen = false;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        if (lightboxVideo) {
            try { lightboxVideo.pause(); } catch (_) {}
            lightboxVideo.removeAttribute('src');
        }
    }

    tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => selectVenture(idx, 0));
    });
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => selectVenture(idx, 0));
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stepSlide(-1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stepSlide(1);
        });
    }
    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLightbox();
        });
    }
    if (stage) {
        stage.addEventListener('click', (e) => {
            if (e.target.closest('a, button')) return;
            openLightbox();
        });
    }
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isLightboxOpen) closeLightbox();
    });

    pane.addEventListener('mouseenter', () => { isHovered = true; });
    pane.addEventListener('mouseleave', () => { isHovered = false; });

    // Initialize first venture & slide immediately
    selectVenture(0, 0);

    setInterval(() => {
        if (isHovered || isLightboxOpen) return;
        const cycleMs = getCycleDuration();
        progress += stepMs;
        if (progressEl) {
            progressEl.style.width = `${Math.min(100, (progress / cycleMs) * 100)}%`;
        }
        if (progress >= cycleMs) {
            const v = ventures[currentVentureIdx];
            const slides = getSlides(v);
            if (currentSlideIdx + 1 < slides.length) {
                currentSlideIdx += 1;
                progress = 0;
                if (progressEl) progressEl.style.width = '0%';
                renderSlide();
            } else {
                selectVenture(currentVentureIdx + 1, 0);
            }
        }
    }, stepMs);
}

/* 2c. Hydrate Founder & Team Profiles From site-config.js (Supports Custom Photos & Added Members) */
function initTeamFromConfig() {
    const cfg = window.MTNSPEC_CONFIG;
    if (!cfg) return;

    if (cfg.founder) {
        const f = cfg.founder;
        const avatarSlot = document.getElementById('founder-avatar-slot');
        const roleEl = document.getElementById('founder-role-pill');
        const nameEl = document.getElementById('founder-name');
        const qualEl = document.getElementById('founder-qual');
        const bioEl = document.getElementById('founder-bio');

        if (avatarSlot && f.photo && f.photo.trim() !== '') {
            avatarSlot.innerHTML = `<img src="${f.photo}" alt="${f.name || 'Founder'}">`;
        }
        if (roleEl && f.rolePill) roleEl.textContent = f.rolePill;
        if (nameEl && f.name) nameEl.textContent = f.name;
        if (qualEl && f.qualification) qualEl.textContent = f.qualification;
        if (bioEl && f.bio) bioEl.textContent = f.bio;
    }

    const teamGrid = document.getElementById('team-members-grid');
    if (teamGrid && Array.isArray(cfg.teamMembers) && cfg.teamMembers.length > 0) {
        teamGrid.innerHTML = '';
        cfg.teamMembers.forEach((m) => {
            const card = document.createElement('div');
            card.className = 'exec-card reveal visible';

            const badgeHtml =
                m.photo && m.photo.trim() !== ''
                    ? `<div class="exec-avatar-badge"><img src="${m.photo}" alt="${m.name || ''}"></div>`
                    : `<div class="exec-avatar-badge">${m.initials || 'MTN'}</div>`;

            const bodyWrap = document.createElement('div');
            const h4 = document.createElement('h4');
            h4.textContent = m.name || '';
            const roleDiv = document.createElement('div');
            roleDiv.className = 'exec-role';
            roleDiv.textContent = m.role || '';
            const p = document.createElement('p');
            p.textContent = m.bio || '';

            bodyWrap.appendChild(h4);
            bodyWrap.appendChild(roleDiv);
            bodyWrap.appendChild(p);

            card.innerHTML = badgeHtml;
            card.appendChild(bodyWrap);
            teamGrid.appendChild(card);
        });
    }
}

/* 3. Subtle Blue-Fade Orbital & FinTech Network Canvas */
function initOrbitalCanvas() {
    const canvas = document.getElementById('orbital-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let nodes = [];

    function resize() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        const count = Math.min(52, Math.max(24, Math.floor((width * height) / 24000)));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            r: Math.random() * 2 + 1
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i++) {
            const p = nodes[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.55)';
            ctx.fill();

            for (let j = i + 1; j < nodes.length; j++) {
                const q = nodes[j];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 145) {
                    const alpha = (1 - dist / 145) * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
}

/* 4. IntersectionObserver Scroll Reveal */
function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));
}

/* 5. Ecosystem Platform Filter Tabs */
function initPlatformFilterTabs() {
    const tabs = document.querySelectorAll('.p-tab');
    const cards = document.querySelectorAll('.platform-showcase');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');
            cards.forEach((card) => {
                const match = filter === 'all' || card.getAttribute('data-platform') === filter;
                card.style.display = match ? 'grid' : 'none';
            });
        });
    });
}

/* 6. Interactive AgriShield Agro-Zone Console */
function initAgriShieldConsole() {
    const zoneData = {
        marondera: {
            ndvi: '0.74',
            spi: '+0.62',
            vci: '82%',
            smiPct: 76,
            smiText: '76% Optimal',
            mlPct: 91,
            mlText: '91% High Yield',
            triggerText: 'NO DEFICIT',
            triggerColor: '#34d399',
            bannerBg: 'rgba(16, 185, 129, 0.14)',
            bannerBorder: 'rgba(16, 185, 129, 0.35)'
        },
        midlands: {
            ndvi: '0.51',
            spi: '-0.48',
            vci: '58%',
            smiPct: 49,
            smiText: '49% Moderate Watch',
            mlPct: 74,
            mlText: '74% Advisory Issued',
            triggerText: 'WATCH STAGE 1',
            triggerColor: '#fbbf24',
            bannerBg: 'rgba(245, 158, 11, 0.14)',
            bannerBorder: 'rgba(245, 158, 11, 0.38)'
        },
        binga: {
            ndvi: '0.26',
            spi: '-1.64',
            vci: '27%',
            smiPct: 22,
            smiText: '22% Severe Deficit',
            mlPct: 95,
            mlText: '95% Drought Confirmed',
            triggerText: 'PAYOUT TRIGGERED',
            triggerColor: '#38bdf8',
            bannerBg: 'rgba(0, 168, 204, 0.22)',
            bannerBorder: 'rgba(0, 212, 255, 0.55)'
        }
    };

    const buttons = document.querySelectorAll('.zone-btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const d = zoneData[btn.getAttribute('data-zone')];
            if (!d) return;

            document.getElementById('agri-ndvi').textContent = d.ndvi;
            document.getElementById('agri-spi').textContent = d.spi;
            document.getElementById('agri-vci').textContent = d.vci;
            document.getElementById('agri-smi-label').textContent = d.smiText;
            document.getElementById('agri-smi-bar').style.width = `${d.smiPct}%`;
            document.getElementById('agri-ml-label').textContent = d.mlText;
            document.getElementById('agri-ml-bar').style.width = `${d.mlPct}%`;

            const pill = document.getElementById('agri-trigger-pill');
            const banner = document.getElementById('agri-payout-banner');
            pill.textContent = d.triggerText;
            pill.style.color = d.triggerColor;
            banner.style.background = d.bannerBg;
            banner.style.borderColor = d.bannerBorder;
        });
    });
}

/* 7. Interactive Change It QR Transit Fare Simulator */
function initChangeItSimulator() {
    const btn = document.getElementById('ci-pay-btn');
    const balEl = document.getElementById('ci-balance');
    const ledger = document.getElementById('ci-ledger-list');
    if (!btn || !balEl || !ledger) return;

    let balance = 15.5;
    const routes = [
        { label: 'Copacabana → Warren Park', amt: -0.5 },
        { label: 'Bulawayo CBD → NUST Campus', amt: -0.5 },
        { label: 'Marondera CBD → Rusike Park', amt: -0.5 },
        { label: 'Vendor P2P Digital Change', amt: +1.0 },
        { label: 'Market Square → Borrowdale', amt: -0.5 }
    ];
    let idx = 0;

    btn.addEventListener('click', () => {
        const tx = routes[idx % routes.length];
        idx++;
        balance = Math.max(2.0, +(balance + tx.amt).toFixed(2));
        balEl.textContent = `$${balance.toFixed(2)}`;

        const row = document.createElement('div');
        row.className = 'ci-tx';
        const isCredit = tx.amt > 0;
        row.innerHTML = `
            <span>${tx.label}</span>
            <span class="amt" style="color: ${isCredit ? '#34d399' : '#38bdf8'};">
                ${isCredit ? '+' : '-'}$${Math.abs(tx.amt).toFixed(2)}
            </span>
        `;
        ledger.prepend(row);
        while (ledger.children.length > 3) {
            ledger.removeChild(ledger.lastElementChild);
        }
    });
}

/* 8. Interactive National Mineral Intelligence Hub Spectral Console */
function initMineralHubConsole() {
    const layers = {
        iron: {
            coords: 'ZVISHAVANE PILOT • 20.32°S, 30.06°E • B4/B2 RATIO',
            desc: 'Hematite / Goethite Sulfide Cap Halo Detected',
            score: '94.2% Match',
            bg: `radial-gradient(circle at 35% 45%, rgba(0, 229, 255, 0.58) 0%, rgba(0, 86, 179, 0.36) 34%, transparent 62%),
                 radial-gradient(circle at 72% 58%, rgba(255, 215, 0, 0.48) 0%, rgba(0, 168, 204, 0.3) 28%, transparent 55%),
                 linear-gradient(135deg, #041226 0%, #09264a 50%, #05162e 100%)`
        },
        clay: {
            coords: 'SHURUGWI GREENSTONE • 19.67°S, 30.00°E • SWIR B11/B12',
            desc: 'Al-OH Illite / Kaolinite Epithermal Gold Alteration',
            score: '91.8% Match',
            bg: `radial-gradient(circle at 62% 40%, rgba(56, 189, 248, 0.62) 0%, rgba(0, 119, 182, 0.4) 36%, transparent 64%),
                 radial-gradient(circle at 28% 65%, rgba(16, 185, 129, 0.42) 0%, transparent 52%),
                 linear-gradient(135deg, #04152d 0%, #002b59 55%, #041022 100%)`
        },
        gossan: {
            coords: 'GREAT DYKE CONTACT • 19.95°S, 30.18°E • (B11-B4)/(B11+B4)',
            desc: 'Oxidized Auriferous & Base-Metal Gossan Vein Cap',
            score: '96.1% Match',
            bg: `radial-gradient(circle at 48% 50%, rgba(255, 215, 0, 0.52) 0%, rgba(0, 168, 204, 0.42) 35%, transparent 65%),
                 linear-gradient(135deg, #061730 0%, #003566 52%, #040e1f 100%)`
        }
    };

    const buttons = document.querySelectorAll('.spec-btn');
    const viewport = document.getElementById('spectral-viewport');
    const coordsEl = document.getElementById('spec-coords');
    const descEl = document.getElementById('spec-target-desc');
    const scoreEl = document.getElementById('spec-score');

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const l = layers[btn.getAttribute('data-layer')];
            if (!l || !viewport) return;

            viewport.style.background = l.bg;
            coordsEl.textContent = l.coords;
            descEl.textContent = l.desc;
            scoreEl.textContent = l.score;
        });
    });
}

/* 9. Smart Contact Prefill & Mailto Dispatch */
function initContactPrefillAndForm() {
    const selectEl = document.getElementById('inq-service');
    const prefillBtns = document.querySelectorAll('[data-Prefill]');

    prefillBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-Prefill');
            if (selectEl && val) {
                selectEl.value = val;
            }
        });
    });

    const form = document.getElementById('corporate-inquiry-form');
    const feedback = document.getElementById('form-feedback');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const contactEl = document.getElementById('inq-email');
            const serviceEl = document.getElementById('inq-service');
            const msgEl = document.getElementById('inq-message');

            const contact = contactEl ? contactEl.value.trim() : '';
            const service = serviceEl ? serviceEl.value : 'General Inquiry';
            const message = msgEl ? msgEl.value.trim() : '';

            const subject = encodeURIComponent(`[MTN-SPEC] ${service}`);
            const body = encodeURIComponent(
                `From: ${contact}\nTopic: ${service}\n\nMessage / Feedback:\n${message}`
            );

            if (feedback) {
                feedback.style.display = 'block';
            }

            window.location.href = `mailto:mhandutakunda@gmail.com?subject=${subject}&body=${body}`;
        });
    }
}

