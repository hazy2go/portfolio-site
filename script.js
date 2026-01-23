// ===== GSAP Animations =====

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ===== Typewriter Effect =====
const typewriter = document.querySelector('.typewriter');
if (typewriter) {
    const text = typewriter.dataset.text;
    let index = 0;

    function type() {
        if (index < text.length) {
            typewriter.textContent += text.charAt(index);
            index++;
            setTimeout(type, 120 + Math.random() * 60);
        }
    }

    // Start typing after page load animation
    setTimeout(type, 1200);
}

// ===== Mobile Navigation Toggle =====
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navOverlay = document.querySelector('.nav-overlay');

function closeMenu() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function openMenu() {
    navToggle.classList.add('active');
    navLinks.classList.add('active');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

if (navToggle) {
    navToggle.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close menu when clicking overlay
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ===== Mobile Carousels =====
function setupCarousel(gridSelector, dotsSelector, cardSelector) {
    const grid = document.querySelector(gridSelector);
    const dots = document.querySelectorAll(dotsSelector);

    if (grid && dots.length > 0) {
        grid.addEventListener('scroll', () => {
            const card = grid.querySelector(cardSelector);
            if (!card) return;
            const cardWidth = card.offsetWidth + 12;
            const activeIndex = Math.round(grid.scrollLeft / cardWidth);

            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === activeIndex);
            });
        }, { passive: true });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const card = grid.querySelector(cardSelector);
                if (!card) return;
                const cardWidth = card.offsetWidth + 12;
                grid.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
            });
        });
    }
}

// Initialize all carousels
setupCarousel('.skills-grid', '.skills-dots .dot', '.skill-category');
setupCarousel('.clients-grid', '.clients-dots .dot', '.client-card');
setupCarousel('.achievements-grid', '.achievements-dots .dot', '.achievement-card');

// ===== Discord Popup =====
const discordBtn = document.querySelector('.discord-btn');
const discordPopup = document.getElementById('discordPopup');
const copyBtn = document.getElementById('copyDiscord');

if (discordBtn && discordPopup) {
    discordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        discordPopup.classList.toggle('active');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!discordBtn.contains(e.target) && !discordPopup.contains(e.target)) {
            discordPopup.classList.remove('active');
        }
    });

    // Copy functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const username = discordBtn.dataset.discord || 'hazy0';
            try {
                await navigator.clipboard.writeText(username);
                copyBtn.classList.add('copied');
                copyBtn.querySelector('span').textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.querySelector('span').textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }
}

// ===== Mobile Scroll Progress =====
const scrollTrack = document.querySelector('.mobile-scroll-track');
const scrollThumb = document.querySelector('.mobile-scroll-thumb');
let scrollTimeout;
let isDragging = false;

function updateScrollThumb() {
    if (!scrollThumb) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = window.scrollY / scrollHeight;
    const trackHeight = scrollTrack.offsetHeight;
    const thumbHeight = scrollThumb.offsetHeight;
    const maxTop = trackHeight - thumbHeight;

    scrollThumb.style.top = (scrollPercent * maxTop) + 'px';
}

function showScrollTrack() {
    if (scrollTrack && window.innerWidth <= 768) {
        scrollTrack.classList.add('visible');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (!isDragging) {
                scrollTrack.classList.remove('visible');
            }
        }, 1500);
    }
}

if (scrollTrack && scrollThumb) {
    window.addEventListener('scroll', () => {
        updateScrollThumb();
        showScrollTrack();
    }, { passive: true });

    // Touch/drag to scroll
    scrollThumb.addEventListener('touchstart', (e) => {
        isDragging = true;
        scrollTrack.classList.add('visible');
    }, { passive: true });

    scrollTrack.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const trackRect = scrollTrack.getBoundingClientRect();
        const relativeY = touch.clientY - trackRect.top;
        const percent = Math.max(0, Math.min(1, relativeY / trackRect.height));

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, percent * scrollHeight);
    }, { passive: true });

    document.addEventListener('touchend', () => {
        isDragging = false;
        scrollTimeout = setTimeout(() => {
            scrollTrack.classList.remove('visible');
        }, 1500);
    });

    // Click on track to jump
    scrollTrack.addEventListener('click', (e) => {
        const trackRect = scrollTrack.getBoundingClientRect();
        const relativeY = e.clientY - trackRect.top;
        const percent = relativeY / trackRect.height;

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: percent * scrollHeight, behavior: 'smooth' });
    });
}

// ===== Navbar Background on Scroll =====
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.style.background = 'rgba(10, 10, 10, 0.95)';
    } else {
        nav.style.background = 'rgba(10, 10, 10, 0.8)';
    }
});

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Number Counter Animation =====
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }

    updateCounter();
}

// ===== Hero Stats Counter =====
const heroStats = document.querySelectorAll('.hero .stat-number');
heroStats.forEach(stat => {
    const target = parseInt(stat.dataset.target);
    setTimeout(() => {
        animateCounter(stat, target, 1500);
    }, 1200);
});

// ===== Section Reveals =====
const sections = document.querySelectorAll('.section-header, .about-content, .about-details, .featured-card, .contact-content');

sections.forEach(section => {
    gsap.from(section, {
        scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });
});

// ===== Timeline Items Animation =====
// Now handled by CSS with expand/collapse toggle

// ===== Achievement Numbers Counter =====
const achievementNumbers = document.querySelectorAll('.achievement-number');

achievementNumbers.forEach(num => {
    const target = parseInt(num.dataset.target);

    gsap.to(num, {
        scrollTrigger: {
            trigger: num,
            start: 'top 80%',
            onEnter: () => animateCounter(num, target, 1500)
        }
    });
});

// ===== Client Cards Stagger Animation =====
const clientCards = document.querySelectorAll('.client-card');

gsap.set(clientCards, { y: 40, opacity: 0 });
ScrollTrigger.create({
    trigger: '.clients-grid',
    start: 'top 85%',
    onEnter: () => {
        gsap.to(clientCards, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out'
        });
    }
});

// ===== Skill Cards Stagger Animation =====
const skillCards = document.querySelectorAll('.skill-category');

gsap.set(skillCards, { y: 40, opacity: 0 });
ScrollTrigger.create({
    trigger: '.skills-grid',
    start: 'top 85%',
    onEnter: () => {
        gsap.to(skillCards, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        });
    }
});

// ===== Achievement Cards Stagger Animation =====
const achievementCards = document.querySelectorAll('.achievement-card');

gsap.set(achievementCards, { scale: 0.9, opacity: 0 });
ScrollTrigger.create({
    trigger: '.achievements-grid',
    start: 'top 85%',
    onEnter: () => {
        gsap.to(achievementCards, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out'
        });
    }
});

// ===== Parallax Effect for Hero =====
gsap.to('.hero-content', {
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
    },
    y: 100,
    opacity: 0.5
});

// ===== Detail Cards Hover Effect Enhancement =====
const detailCards = document.querySelectorAll('.detail-card');

detailCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            x: 8,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            x: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});

// ===== Featured Card Glow Animation =====
const visualGlow = document.querySelector('.visual-glow');
if (visualGlow) {
    gsap.to(visualGlow, {
        scale: 1.1,
        opacity: 0.8,
        duration: 2,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1
    });
}

// ===== Mouse Follow Effect for Hero =====
const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');

hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 50;
    const y = (e.clientY - rect.top - rect.height / 2) / 50;

    gsap.to(heroContent, {
        x: x,
        y: y,
        duration: 0.5,
        ease: 'power2.out'
    });
});

hero.addEventListener('mouseleave', () => {
    gsap.to(heroContent, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
    });
});

// ===== Magnetic Button Effect =====
const magneticButtons = document.querySelectorAll('.nav-cta, .contact-link');

magneticButtons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(button, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: 'power2.out'
        });
    });

    button.addEventListener('mouseleave', () => {
        gsap.to(button, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});

// ===== Scroll Progress Indicator =====
const scrollIndicator = document.querySelector('.scroll-indicator');

if (scrollIndicator) {
    let scrollIndicatorHidden = false;
    window.addEventListener('scroll', () => {
        if (!scrollIndicatorHidden && window.scrollY > 5) {
            scrollIndicatorHidden = true;
            gsap.to(scrollIndicator, {
                opacity: 0,
                y: -15,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    }, { passive: true });
}

// ===== Text Reveal for Section Titles =====
const sectionTitles = document.querySelectorAll('.section-title');

sectionTitles.forEach(title => {
    gsap.from(title, {
        scrollTrigger: {
            trigger: title,
            start: 'top 85%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });
});

// ===== Floating Animation for Visual Icon =====
const visualIcon = document.querySelector('.visual-icon');
if (visualIcon) {
    gsap.to(visualIcon, {
        y: -10,
        duration: 2,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1
    });
}

// ===== Social Links Stagger on Hover =====
const socialLinks = document.querySelector('.social-links');
const socialItems = document.querySelectorAll('.social-link');

if (socialLinks) {
    socialLinks.addEventListener('mouseenter', () => {
        gsap.to(socialItems, {
            y: -5,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.out'
        });
    });

    socialLinks.addEventListener('mouseleave', () => {
        gsap.to(socialItems, {
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.out'
        });
    });
}

// ===== Video Modal =====
const videoModal = document.getElementById('videoModal');
const openVideoBtn = document.getElementById('openVideoModal');
const closeVideoBtn = document.getElementById('closeVideoModal');
const modalOverlay = document.querySelector('.video-modal-overlay');
const modalVideos = document.querySelectorAll('.video-modal-grid video');

function openModal() {
    videoModal.style.display = 'flex';
    setTimeout(() => videoModal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    videoModal.classList.remove('active');
    setTimeout(() => videoModal.style.display = 'none', 300);
    document.body.style.overflow = '';
    // Pause all videos when closing
    modalVideos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
}

if (openVideoBtn) {
    openVideoBtn.addEventListener('click', openModal);
}

if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', closeModal);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
}

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal?.classList.contains('active')) {
        closeModal();
    }
});

// ===== Timeline Toggle =====
const timelineToggle = document.getElementById('timelineToggle');
const hiddenTimelineItems = document.querySelectorAll('.timeline-item.hidden-item');

if (timelineToggle && hiddenTimelineItems.length > 0) {
    timelineToggle.addEventListener('click', () => {
        const isExpanded = timelineToggle.classList.contains('active');

        if (isExpanded) {
            hiddenTimelineItems.forEach(item => item.classList.remove('show'));
            timelineToggle.classList.remove('active');
            timelineToggle.querySelector('.toggle-text').textContent = 'Show Full Timeline';
        } else {
            hiddenTimelineItems.forEach(item => item.classList.add('show'));
            timelineToggle.classList.add('active');
            timelineToggle.querySelector('.toggle-text').textContent = 'Hide Timeline';
        }

        // Refresh ScrollTrigger after expand/collapse animation
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 600);
    });
}

// ===== Calendly Modal =====
const calendlyModal = document.getElementById('calendlyModal');
const openCalendlyBtn = document.getElementById('openCalendlyModal');
const closeCalendlyBtn = document.getElementById('closeCalendlyModal');
const calendlyModalOverlay = document.querySelector('.calendly-modal-overlay');

function openCalendlyModal() {
    calendlyModal.style.display = 'flex';
    setTimeout(() => calendlyModal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function closeCalendlyModal() {
    calendlyModal.classList.remove('active');
    setTimeout(() => calendlyModal.style.display = 'none', 300);
    document.body.style.overflow = '';
}

if (openCalendlyBtn) {
    openCalendlyBtn.addEventListener('click', openCalendlyModal);
}

if (closeCalendlyBtn) {
    closeCalendlyBtn.addEventListener('click', closeCalendlyModal);
}

if (calendlyModalOverlay) {
    calendlyModalOverlay.addEventListener('click', closeCalendlyModal);
}

// Close Calendly modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && calendlyModal?.classList.contains('active')) {
        closeCalendlyModal();
    }
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Add loaded class to body for initial animations
    document.body.classList.add('loaded');

    // Refresh ScrollTrigger after all content is loaded
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 500);
});

// ===== Cursor Trail Effect (Optional - subtle) =====
const cursor = document.createElement('div');
cursor.className = 'cursor-glow';
cursor.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
`;
document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
});

document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
});
