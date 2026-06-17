/* ═══════════════════════════════════════════════════════════════════════════
   WORKSHOP — easter-egg build showcase controller
   Transforms the page into a warm-dark showcase with no reload via a canvas
   "system boot" transition (GameCube / NieR:Automata energy): hard cut +
   amber flash, the page shatters into a directional pixel-dither dissolve with
   datamosh + chromatic-split + scanlines, a terse boot readout decodes behind
   the sealed screen, then the blocks clear in noise order to reveal the
   showcase. Falls back to an instant crossfade with no GSAP / reduced motion.
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    const trigger = document.getElementById('workshop-trigger');
    const overlay = document.getElementById('workshop');
    if (!trigger || !overlay) return;

    const closeBtn = document.getElementById('workshop-close');
    const fx = overlay.querySelector('.ws-fx');
    const boot = overlay.querySelector('.ws-boot');
    const bootBar = overlay.querySelector('.ws-boot__bar i');
    const bootPct = overlay.querySelector('.ws-boot__pct');
    const shell = overlay.querySelector('.ws-shell');
    const videos = [...overlay.querySelectorAll('.ws-vid')];

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined';
    const animate = !reduced && hasGSAP;

    let isOpen = false;
    let busy = false;               // guard against re-trigger mid-transition
    let lastFocus = null;

    /* ── canvas glitch / dither dissolve ──────────────────────────────────
       state.p   : 0 = clear (destination visible) … 1 = fully sealed (opaque)
       state.glitch : datamosh / chromatic-split intensity (0..1)
       state.flash  : white-amber bloom on the leading edge (0..1)            */
    const CELL = 18;
    const ctx = fx.getContext('2d', { alpha: true });
    const state = { p: 0, glitch: 0, flash: 0 };
    let cols = 0, rows = 0, thresh = [], W = 0, H = 0, dpr = 1, rafId = 0, looping = false;

    function buildFx() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = window.innerWidth; H = window.innerHeight;
        fx.width = Math.ceil(W * dpr); fx.height = Math.ceil(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
        thresh = new Array(cols * rows);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // diagonal sweep blended with noise = directional pixel dissolve
                const diag = (x / cols + y / rows) / 2;
                thresh[y * cols + x] = diag * 0.5 + Math.random() * 0.5;
            }
        }
    }

    const GLITCH_COLORS = ['#eaa05a', '#d8b56a', '#e07a55', '#62e6ea'];

    function render() {
        const p = state.p, g = state.glitch;
        ctx.clearRect(0, 0, W, H);
        if (p <= 0 && state.flash <= 0) return;

        // per-row horizontal datamosh offset, re-rolled each frame
        for (let y = 0; y < rows; y++) {
            const rowGlitch = g > 0 && Math.random() < 0.16 * g;
            const ox = rowGlitch ? (Math.random() - 0.5) * 42 * g : 0;
            for (let x = 0; x < cols; x++) {
                const t = thresh[y * cols + x];
                if (t > p) continue;
                const px = x * CELL + ox, py = y * CELL;
                if (p - t < 0.07) {                         // bright leading edge
                    ctx.fillStyle = GLITCH_COLORS[(x + y) & 3];
                    ctx.globalAlpha = 0.85;
                    ctx.fillRect(px, py, CELL + 1, CELL + 1);
                    ctx.globalAlpha = 1;
                } else {
                    const v = 8 + ((x * 7 + y * 13) % 9);   // faint per-cell texture
                    ctx.fillStyle = `rgb(${v + 6},${v},${v - 3})`;
                    ctx.fillRect(px, py, CELL + 1, CELL + 1);
                }
            }
        }

        // chromatic-split slabs
        if (g > 0.15) {
            const bands = 2 + ((Math.random() * 3) | 0);
            for (let b = 0; b < bands; b++) {
                const by = Math.random() * H, bh = 6 + Math.random() * 26;
                const sx = (Math.random() - 0.5) * 26 * g;
                ctx.globalAlpha = 0.16 * g;
                ctx.fillStyle = '#ff3b3b'; ctx.fillRect(sx, by, W, bh);
                ctx.fillStyle = '#37e6ff'; ctx.fillRect(-sx, by + 1.5, W, bh);
                ctx.globalAlpha = 1;
            }
        }

        // scanlines
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#000';
        for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
        ctx.globalAlpha = 1;

        // flash bloom
        if (state.flash > 0) {
            ctx.globalAlpha = state.flash * 0.55;
            ctx.fillStyle = '#f4b072';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
    }

    function startLoop() { if (looping) return; looping = true; const t = () => { render(); if (looping) rafId = requestAnimationFrame(t); }; rafId = requestAnimationFrame(t); }
    function stopLoop() { looping = false; cancelAnimationFrame(rafId); ctx.clearRect(0, 0, W, H); }

    // ── open ───────────────────────────────────────────────────────────────
    function open() {
        if (isOpen || busy) return;
        isOpen = true; busy = true;
        lastFocus = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('ws-locked');
        overlay.classList.add('is-open');
        const gsap = window.gsap;

        if (!animate) {
            overlay.style.opacity = '1';
            overlay.classList.add('is-revealed');
            shell.style.opacity = '1';
            busy = false;
            playVideos();
            focusFirst();
            return;
        }

        buildFx();
        gsap.set(overlay, { opacity: 1 });
        gsap.set(shell, { opacity: 0 });
        gsap.set(state, { p: 0, glitch: 1, flash: 0.7 });
        fx.classList.add('is-active');
        startLoop();

        const pct = { v: 0 };
        const tl = gsap.timeline({ onComplete: () => {
            stopLoop(); fx.classList.remove('is-active'); busy = false; focusFirst();
        } });

        // SEAL — page shatters into glitch blocks until opaque
        tl.to(state, { flash: 0, duration: 0.28, ease: 'power2.out' }, 0);
        tl.to(state, { p: 1, duration: 0.42, ease: 'power2.in' }, 0);
        // SWAP behind the wall + boot readout
        tl.add(() => {
            overlay.classList.add('is-revealed');
            gsap.set(shell, { opacity: 1 });
            playVideos();
            boot.classList.add('is-active');
        }, 0.44);
        tl.to(state, { glitch: 0.4, duration: 0.2 }, 0.44);
        tl.fromTo(bootBar, { width: '0%' }, { width: '100%', duration: 0.52, ease: 'power1.inOut' }, 0.5);
        tl.to(pct, { v: 100, duration: 0.52, ease: 'power1.inOut',
            onUpdate: () => { if (bootPct) bootPct.textContent = Math.round(pct.v) + '%'; } }, 0.5);
        tl.add(() => boot.classList.remove('is-active'), 1.04);
        // RESOLVE — blocks clear in noise order, showcase emerges
        tl.to(state, { glitch: 1, duration: 0.08 }, 1.04);
        tl.to(state, { p: 0, duration: 0.52, ease: 'power2.out' }, 1.12);
        tl.to(state, { glitch: 0, duration: 0.5, ease: 'power2.out' }, 1.18);
    }

    // ── close ────────────────────────────────────────────────────────────────
    function close() {
        if (!isOpen || busy) return;
        isOpen = false; busy = true;
        pauseVideos();
        const gsap = window.gsap;

        const finalize = () => {
            stopLoop();
            overlay.hidden = true;
            overlay.classList.remove('is-open', 'is-revealed');
            fx.classList.remove('is-active');
            overlay.style.opacity = '';
            shell.style.opacity = '';
            document.body.classList.remove('ws-locked');
            busy = false;
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };

        if (!animate) { finalize(); return; }

        buildFx();
        gsap.set(state, { p: 0, glitch: 1, flash: 0 });
        fx.classList.add('is-active');
        startLoop();

        const tl = gsap.timeline({ onComplete: finalize });
        tl.to(state, { p: 1, duration: 0.36, ease: 'power2.in' }, 0);
        tl.add(() => { gsap.set(shell, { opacity: 0 }); overlay.classList.remove('is-revealed'); }, 0.38);
        tl.to(state, { p: 0, duration: 0.46, ease: 'power2.out' }, 0.46);
        tl.to(state, { glitch: 0, duration: 0.4 }, 0.5);
    }

    // ── videos ───────────────────────────────────────────────────────────────
    function playVideos() {
        videos.forEach((v) => {
            if (v.classList.contains('ws-vid--missing')) return;
            const p = v.play();
            if (p && p.catch) p.catch(() => {});   // autoplay may be blocked; poster/fallback stays
        });
    }
    function pauseVideos() { videos.forEach((v) => { v.pause(); }); }

    // ── focus management ───────────────────────────────────────────────────
    function focusables() {
        return [...overlay.querySelectorAll('button, a[href], video[controls]')]
            .filter((el) => !el.disabled && el.offsetParent !== null);
    }
    function focusFirst() { (closeBtn || overlay).focus({ preventScroll: true }); }

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // ── wiring ───────────────────────────────────────────────────────────────
    trigger.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    // click on the dark canvas (outside the shell content) closes
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    // CTA jumps to #contact on the page behind: close, let the anchor run
    overlay.querySelectorAll('[data-ws-dismiss]').forEach((el) => {
        el.addEventListener('click', () => close());
    });

    closeBtn?.setAttribute('tabindex', '0');
})();
