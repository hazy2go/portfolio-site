/* ═══════════════════════════════════════════════════════════════════════════
   OPERATOR CONSOLE — motion engine (GSAP)
   Loads AFTER gsap + ScrollTrigger. Exposes window.NERV_MOTION.mountMotion()
   so it can be re-run after a client-side page swap (nerv-spa.js).
   Degrades fully: no GSAP / reduced-motion -> content stays visible, static.
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hasGSAP = typeof window.gsap !== 'undefined';

  // graceful fallback: just make everything visible, no animation
  if (RM || !hasGSAP) {
    const showAll = () => {
      $$('.scramble').forEach(e => { if (e.dataset.final) e.textContent = e.dataset.final; });
      $$('.reveal').forEach(e => e.classList.add('in'));
    };
    window.NERV_MOTION = { mountMotion: showAll };
    showAll();
    return;
  }

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;
  const pointerFine = matchMedia('(pointer:fine)').matches;

  /* ── TEXT SCRAMBLE (adapted from 21st.dev TextScramble) ── */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#01XΞ◆▸█';
  function scramble(el, text, dur = 1) {
    const old = el.textContent;
    const len = Math.max(old.length, text.length);
    let frame = 0; const queue = [];
    const span = Math.round(40 * dur);
    for (let i = 0; i < len; i++) {
      queue.push({ from: old[i] || '', to: text[i] || '',
        start: Math.floor(Math.random() * span), end: 0, char: null });
      queue[i].end = queue[i].start + Math.floor(Math.random() * span);
    }
    let raf;
    const tick = () => {
      let out = '', done = 0;
      for (const q of queue) {
        if (frame >= q.end) { done++; out += q.to; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.28) q.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          out += '<span class="dud">' + q.char + '</span>';
        } else out += q.from;
      }
      el.innerHTML = out;
      if (done === queue.length) return;
      frame++; raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf); tick();
  }

  /* ── MOUNT (idempotent per page) ── */
  function mountMotion() {
    // tear down triggers from the previous page so they don't pile up
    if (ST) ST.getAll().forEach(t => t.kill());

    // scramble titles (visible by default; scramble in on view)
    $$('.scramble').forEach(el => {
      const final = el.dataset.final || el.textContent.trim();
      el.dataset.final = final; el.textContent = final;
      if (ST) ST.create({ trigger: el, start: 'top 90%', once: true,
        onEnter: () => scramble(el, final, 1.0) });
    });

    // hero choreography
    const hero = document.querySelector('[data-hero]');
    if (hero) {
      delete hero.dataset.ran;
      let bits = $$('[data-hero] .reveal');
      if (!bits.length) bits = [...hero.children];
      bits.forEach(b => b.classList.add('in'));
      gsap.fromTo(bits, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85,
        ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity,visibility' });
    }

    // NOTE: non-hero .reveal is driven by the CSS + IntersectionObserver path in
    // nerv.js (mountPage -> reveal()). That is timing-robust across client-side page
    // swaps; a GSAP ScrollTrigger reveal here would create triggers before layout
    // settles during a View Transition and leave swapped sections stuck hidden.

    // parallax backdrops
    if (ST) $$('.bg-canvas, .bg-video').forEach(node => {
      gsap.to(node, { yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: node.closest('.bg-host') || node, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // magnetic buttons
    if (pointerFine) $$('.btn').forEach(btn => {
      if (btn._mag) return; btn._mag = true; const str = 0.28;
      btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * str, y: (e.clientY - r.top - r.height / 2) * str, duration: 0.4, ease: 'expo.out' }); });
      btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
    });

    // safety: nothing stays hidden if a tween stalls
    setTimeout(() => $$('.reveal').forEach(n => {
      const cs = getComputedStyle(n);
      if (parseFloat(cs.opacity) < 0.5 || cs.visibility === 'hidden') {
        n.classList.add('in'); gsap.set(n, { clearProps: 'opacity,visibility,transform' });
      }
    }), 2400);

    if (ST) ST.refresh();
  }

  window.NERV_MOTION = { mountMotion };

  // first load: run after boot finishes (so hero animates post-boot)
  document.body.addEventListener('boot:done', mountMotion);
  if (document.querySelector('#boot[hidden]') || !document.querySelector('#boot')) mountMotion();

  if (ST) { window.addEventListener('load', () => ST.refresh());
    if (document.fonts) document.fonts.ready.then(() => ST.refresh()); }
})();
