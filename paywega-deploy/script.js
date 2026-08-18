function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('fade-out')) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            if (loader && loader.parentNode) {
                loader.remove();
            }
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initWebsiteInteractions();
    const loader = document.getElementById('loader');
    if (loader) {
        loader.addEventListener('click', hideLoader);
        setTimeout(hideLoader, 500);
    }
});

window.addEventListener('load', () => {
    hideLoader();
});

// Failsafe: guarantee loader is removed within 1 second max
setTimeout(hideLoader, 1000);

function initWebsiteInteractions() {
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Mobile Menu
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('nav');
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
            if (nav.style.display === 'block') {
                Object.assign(nav.style, {
                    position: 'absolute', top: '70px', left: '0', width: '100%',
                    background: 'white', padding: '20px', textAlign: 'center',
                    boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                });
            }
        });
    }

    // Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    document.querySelectorAll('.card').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    initTypingEffect();
    initTiltEffect();
    initAudio();
    initNarrative();
    initTeamModal();
}

function initTypingEffect() {
    const textElement = document.querySelector('.typing-text');
    if (!textElement) return;

    const phrases = ["Zimbabwean Transport", "Digital Payments", "Your Commute", "Cashless Travel"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        // Cursor logic
        textElement.classList.add('typing-line');

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
            textElement.classList.remove('typing-line'); // Blink during pause
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    type();
}

function initTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation (max 10deg)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
}

function initAudio() {
    const audio = document.getElementById('bg-audio');
    const toggleBtn = document.getElementById('audio-toggle');

    if (!audio || !toggleBtn) return;

    const icon = toggleBtn.querySelector('i');

    // Set volume to ambient level
    audio.volume = 0.5;

    toggleBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                icon.className = 'fas fa-volume-up';
            }).catch(err => {
                console.log("Audio play failed:", err);
            });
        } else {
            audio.pause();
            icon.className = 'fas fa-volume-mute';
        }
    });
}

function initNarrative() {
    const playBtn = document.getElementById('play-narrative');
    if (!playBtn) return;

    // Check if external audio file exists (simulated check by trying to load it)
    const audioPath = 'mission_narrative.mp3';
    const audio = new Audio(audioPath);
    let usingAudioFile = false; // We assume false until loaded
    let isPlaying = false;

    // Try to preload to see if it works
    audio.addEventListener('canplaythrough', () => {
        usingAudioFile = true;
    });
    audio.addEventListener('error', () => {
        usingAudioFile = false; // 404 Not Found, use TTS
    });

    const text = "In Zimbabwe, the shortage of small change is a daily struggle. Commuters lose money, and operators lose time. Enter Paywega. We are digitizing public transport payments to ensure every cent counts. No more disputes, no more delays. Just seamless, secure travel.";

    let synthesis = window.speechSynthesis;
    let utterance = new SpeechSynthesisUtterance(text);

    // Voice config for TTS fallback
    const setVoice = () => {
        const voices = synthesis.getVoices();
        utterance.voice = voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en')) || voices[0];
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
    };
    if (synthesis.onvoiceschanged !== undefined) synthesis.onvoiceschanged = setVoice;
    setVoice();

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            if (usingAudioFile) {
                audio.pause();
                audio.currentTime = 0;
            } else {
                synthesis.cancel();
            }
            isPlaying = false;
            resetBtn();
        } else {
            // Start Playing
            if (usingAudioFile) {
                audio.play().then(() => {
                    isPlaying = true;
                    setPlayingState();
                }).catch(e => {
                    console.log("File play failed, fallback to TTS", e);
                    usingAudioFile = false;
                    playTTS();
                });

                audio.onended = () => {
                    isPlaying = false;
                    resetBtn();
                };
            } else {
                playTTS();
            }
        }
    });

    function playTTS() {
        utterance = new SpeechSynthesisUtterance(text); // Refresh to avoid sticky state
        setVoice();
        utterance.onend = () => {
            isPlaying = false;
            resetBtn();
        };
        synthesis.speak(utterance);
        isPlaying = true;
        setPlayingState();
    }

    function setPlayingState() {
        playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Narration';
        playBtn.classList.remove('btn-primary');
        playBtn.classList.add('btn-secondary');
    }

    function resetBtn() {
        playBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Listen to our Mission';
        playBtn.classList.remove('btn-secondary');
        playBtn.classList.add('btn-primary');
    }
}

function initTeamModal() {
    const modal = document.getElementById('team-modal');
    if (!modal) return; // Exit if modal doesn't exist

    const closeBtn = document.querySelector('.close-modal');
    const teamCards = document.querySelectorAll('.team-card');

    // Elements to populate
    const mImgContainer = document.querySelector('.modal-img-container');
    const mName = document.getElementById('modal-name');
    const mRole = document.getElementById('modal-role');
    const mBio = document.getElementById('modal-bio');

    let typingInterval;

    function startTyping(text) {
        mBio.textContent = ''; // Clear
        mBio.classList.add('typing-line');
        let i = 0;
        clearInterval(typingInterval);

        typingInterval = setInterval(() => {
            if (i < text.length) {
                mBio.textContent += text.charAt(i);
                i++;
                // No auto-scroll as requested
            } else {
                clearInterval(typingInterval);
                mBio.classList.remove('typing-line');
            }
        }, 80); // Slower, comfortable reading speed
    }

    // Voice configuration helper
    const getVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        return voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en')) || voices[0];
    };

    teamCards.forEach(card => {
        card.addEventListener('click', () => {
            // Stop any current speech - CRITICAL for user experience
            window.speechSynthesis.cancel();
            // Get Data
            const name = card.getAttribute('data-name');
            const role = card.getAttribute('data-role');
            const bioLong = card.getAttribute('data-bio-long');

            // Get Image or Icon
            const imgElement = card.querySelector('img');
            mImgContainer.innerHTML = ''; // Clear container

            if (imgElement) {
                const newImg = document.createElement('img');
                newImg.src = imgElement.src;
                mImgContainer.appendChild(newImg);
            } else {
                const icon = document.createElement('i');
                icon.className = 'fas fa-user-circle';
                mImgContainer.appendChild(icon);
            }

            mName.textContent = name;
            mRole.textContent = role;

            // Open Modal
            modal.style.display = 'flex';
            // Slight delay for animation class
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });

            // Start Typing
            startTyping(bioLong);

            // Start Speaking (TTS)
            const utterance = new SpeechSynthesisUtterance(bioLong);
            utterance.voice = getVoice();
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        });
    });

    // Close Logic
    const closeModal = () => {
        window.speechSynthesis.cancel(); // Stop speaking immediately
        modal.classList.remove('active');
        clearInterval(typingInterval);
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
