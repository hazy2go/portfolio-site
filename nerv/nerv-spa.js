/* ═══════════════════════════════════════════════════════════════════════════
   OPERATOR CONSOLE — client-side navigation (no full reload)
   Fetches internal .html pages and swaps <main> + page chrome in place, so the
   persistent shell (topbar, ticker, HUD frame, CRT, and the CCTV feed monitor)
   never reloads. The YouTube feed therefore plays UNINTERRUPTED across pages.
   Uses the View Transitions API for a soft crossfade when available.
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  if (!window.fetch || !window.history.pushState) return; // very old browser: native nav
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cache = new Map();

  const seg = (u) => u.split('?')[0].split('#')[0].split('/').pop() || 'index.html';

  async function getDoc(url) {
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url, { headers: { 'X-SPA': '1' } });
    if (!res.ok) throw new Error('fetch ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    cache.set(url, doc);
    return doc;
  }

  function apply(doc, url) {
    const newMain = doc.querySelector('main.page');
    const curMain = document.querySelector('main.page');
    if (!newMain || !curMain) { window.location.href = url; return; }

    document.title = doc.title;
    document.adoptNode(newMain);
    curMain.replaceWith(newMain);

    // swap page-specific <style> blocks (they live in <body>)
    document.querySelectorAll('body > style').forEach(s => s.remove());
    doc.querySelectorAll('body > style').forEach(s => document.body.appendChild(s.cloneNode(true)));

    // ticker content can differ per page
    const nt = doc.querySelector('.ticker__track'), ct = document.querySelector('.ticker__track');
    if (nt && ct) ct.innerHTML = nt.innerHTML;

    // HUD frame corner tag
    const ntag = doc.querySelector('.hud-frame .corner-tag.tl'), ctag = document.querySelector('.hud-frame .corner-tag.tl');
    if (ntag && ctag) ctag.textContent = ntag.textContent;

    // active nav state
    const target = seg(url);
    document.querySelectorAll('.topbar__nav a').forEach(a => {
      if (seg(a.getAttribute('href')) === target) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    window.scrollTo(0, 0);
    if (window.NERV) window.NERV.mountPage();
    if (window.NERV_MOTION) window.NERV_MOTION.mountMotion();
  }

  async function navigate(url, push) {
    let doc;
    try { doc = await getDoc(url); }
    catch (e) { window.location.href = url; return; }
    const run = () => apply(doc, url);
    if (!RM && document.startViewTransition) {
      const t = document.startViewTransition(run);
      t.finished.finally(() => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
    } else run();
    if (push) history.pushState({ spa: true }, '', url);
  }

  // intercept internal link clicks
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
    if (!/\.html(\?|#|$)/.test(href)) return;
    e.preventDefault();
    if (seg(href) === seg(location.href)) { window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); return; }
    navigate(href, true);
  });

  window.addEventListener('popstate', () => navigate(seg(location.href), false));

  // warm the cache: prefetch the other terminals on idle
  const prefetch = () => document.querySelectorAll('.topbar__nav a').forEach(a => {
    const u = a.getAttribute('href'); if (u && /\.html$/.test(u) && seg(u) !== seg(location.href)) getDoc(u).catch(() => {});
  });
  if ('requestIdleCallback' in window) requestIdleCallback(prefetch); else setTimeout(prefetch, 1500);
})();
