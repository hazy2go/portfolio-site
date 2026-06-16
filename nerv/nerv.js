/* ═══════════════════════════════════════════════════════════════════════════
   OPERATOR CONSOLE — runtime
   Boot, CRT flicker, clock, reveal, counters, and canvas diagnostic graphics.
   All graphics are procedural (canvas/SVG) — no raster assets.
   Respects prefers-reduced-motion throughout.
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.remove('no-js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ── color tokens for canvas ── */
  const C = { amber:'#f07a18', amberHi:'#ff9a22', red:'#c72618', green:'#27e88f',
    greenHi:'#74ff9e', cyan:'#62e6ea', bone:'#dde6d2', void:'#020403' };

  /* ───────────────────────── BOOT SEQUENCE ───────────────────────── */
  function boot() {
    const el = $('#boot');
    if (!el) return;
    const out = $('.boot__line', el);
    const bar = $('.boot__bar i', el);
    const finish = () => { el.classList.add('done'); setTimeout(() => el.setAttribute('hidden',''), 600);
      document.body.dispatchEvent(new Event('boot:done')); };
    if (RM || sessionStorage.getItem('booted')) { el.setAttribute('hidden',''); el.classList.add('done'); return finish(); }
    sessionStorage.setItem('booted','1');
    const lines = [
      '<span class="tag">[ OK ]</span> OPERATOR CONSOLE v5.2 — cold start',
      '<span class="tag">[ OK ]</span> mounting bio-neuron link ............ NOMINAL',
      '<span class="tag">[ OK ]</span> node array CASPER/BALTHASAR/MELCHIOR . SYNCED',
      '<span class="tag">[ OK ]</span> field integrity ..................... 99.7%',
      '<span class="crit">[WARN]</span> ego barrier .......... PERMEABLE',
      '<span class="tag">[ OK ]</span> operator: HASAN TOPRAK / COMMUNITY ARCHITECT',
      'establishing link <span class="green">█</span>',
    ];
    let i = 0;
    const tick = () => {
      if (i < lines.length) {
        out.innerHTML += (i ? '\n' : '') + lines[i];
        bar.style.transition = 'width .28s linear';
        bar.style.width = Math.round(((i + 1) / lines.length) * 100) + '%';
        i++;
        setTimeout(tick, rand(180, 320));
      } else { setTimeout(finish, 520); }
    };
    tick();
    // safety: never trap the user
    setTimeout(finish, 5200);
  }

  /* ───────────────────────── CRT FLICKER ───────────────────────── */
  function flicker() {
    if (RM) return;
    const root = document.documentElement;
    const loop = () => {
      if (Math.random() < 0.06) {
        root.style.setProperty('--flicker', rand(0.25, 0.6).toFixed(2));
        setTimeout(() => root.style.setProperty('--flicker', '0'), rand(40, 110));
      }
      setTimeout(loop, rand(160, 900));
    };
    loop();
  }

  /* ───────────────────────── CLOCK ───────────────────────── */
  function clock() {
    const el = $('#clock'); if (!el) return;
    const pad = n => String(n).padStart(2, '0');
    const upd = () => { const d = new Date();
      el.textContent = `T+${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    upd(); setInterval(upd, 1000);
  }

  /* ───────────────────────── REVEAL ───────────────────────── */
  function reveal() {
    const items = $$('.reveal');
    if (RM || !('IntersectionObserver' in window)) { items.forEach(n => n.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(n => io.observe(n));
  }

  /* ───────────────────────── COUNTERS ───────────────────────── */
  function counters() {
    const els = $$('[data-count]');
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1400; const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * e).toLocaleString();
        if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (RM || !('IntersectionObserver' in window)) { els.forEach(e => e.textContent = (+e.dataset.count).toLocaleString()); return; }
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.5 });
    els.forEach(e => io.observe(e));
  }

  /* ───────────────────────── CANVAS HELPERS ───────────────────────── */
  function fit(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }
  const animators = [];
  function register(cv, draw, animated) {
    let state = fit(cv);
    const redraw = () => { state = fit(cv); };
    window.addEventListener('resize', () => { redraw(); if (RM || !animated) draw(state.ctx, state.w, state.h, 0); });
    if (RM || !animated) { draw(state.ctx, state.w, state.h, 0); return; }
    animators.push({ cv, draw: (t) => draw(state.ctx, state.w, state.h, t) });
  }
  if (!RM) {
    let last = 0;
    const tick = (t) => {
      // throttle ~30fps for the soft analog feel + battery
      if (t - last > 33) { last = t;
        animators.forEach(a => {
          const r = a.cv.getBoundingClientRect();
          if (r.bottom > -200 && r.top < innerHeight + 200) a.draw(t / 1000);
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── WAVEFORM MONITOR (Screen 08) ── */
  function gWaveform(cv) {
    const seeds = [...Array(4)].map(() => Math.random() * 100);
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cols = 4, gw = w / cols;
      ctx.lineWidth = 1.4;
      for (let c = 0; c < cols; c++) {
        const x0 = c * gw, mid = x0 + gw / 2;
        // ruler
        ctx.strokeStyle = 'rgba(240,122,24,.18)';
        ctx.beginPath(); ctx.moveTo(mid, 8); ctx.lineTo(mid, h - 8); ctx.stroke();
        // trace
        ctx.strokeStyle = c % 2 ? C.greenHi : C.green;
        ctx.shadowColor = C.green; ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let y = 10; y < h - 10; y += 3) {
          const n = Math.sin(y * 0.06 + seeds[c] + t * 1.5) * 14
                  + Math.sin(y * 0.21 + seeds[c] * 2 + t * 3) * 7
                  + (Math.random() - .5) * 4;
          const x = mid + n;
          y === 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      // red threshold line + cursor
      const ty = h * 0.5 + Math.sin(t) * 6;
      ctx.strokeStyle = 'rgba(199,38,24,.8)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke();
      ctx.fillStyle = C.red; ctx.fillRect(w / 2 - 3, ty - 3, 6, 6);
    }, true);
  }

  /* ── TOPOGRAPHIC CONTOUR GRID (Screen 09) ── */
  function gContour(cv) {
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const rows = 16;
      for (let r = 0; r < rows; r++) {
        const baseY = (r / (rows - 1)) * h;
        const lower = r > rows * 0.55;
        ctx.strokeStyle = lower ? 'rgba(240,122,24,.5)' : 'rgba(116,255,158,.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          // hourglass pinch toward center column
          const dc = (x - w / 2) / (w / 2);
          const pinch = (1 - Math.abs(dc)) * 26 * Math.sin(r * .5 + t * .6);
          const wob = Math.sin(x * .02 + r + t * .5) * 4;
          const y = baseY - pinch + wob;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }, true);
  }

  /* ── CIRCULAR TARGET SCOPE (Screen 14) ── */
  function gScope(cv) {
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.46;
      // concentric broken rings
      for (let i = 1; i <= 6; i++) {
        const rr = (R / 6) * i;
        ctx.strokeStyle = i % 2 ? 'rgba(39,232,143,.5)' : 'rgba(39,232,143,.25)';
        ctx.lineWidth = 1;
        const gap = (t * (i % 2 ? 1 : -1) * 0.4) % (Math.PI * 2);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.arc(cx, cy, rr, a + gap, a + gap + Math.PI / 6 - 0.18);
          ctx.stroke();
        }
      }
      // crosshair
      ctx.strokeStyle = 'rgba(240,122,24,.35)';
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      // central marker (rotating angular reticle)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.5);
      ctx.strokeStyle = C.amberHi; ctx.lineWidth = 2; ctx.shadowColor = C.amber; ctx.shadowBlur = 8;
      ctx.strokeRect(-16, -16, 32, 32);
      ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(0,-16); ctx.moveTo(0,16); ctx.lineTo(0,26); ctx.stroke();
      ctx.restore();
      // lock pulse
      const p = (Math.sin(t * 2) + 1) / 2;
      ctx.strokeStyle = `rgba(240,122,24,${.5 - p * .4})`; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(cx, cy, 30 + p * 40, 0, Math.PI * 2); ctx.stroke();
    }, true);
  }

  /* ── NODE MAP (Screen 04) ── */
  function gNodes(cv) {
    const N = [
      { x: .2, y: .3, label: 'MELCHIOR' }, { x: .5, y: .18, label: 'CASPER' },
      { x: .78, y: .35, label: 'BALTHASAR' }, { x: .34, y: .68, label: 'LINK-A' },
      { x: .66, y: .72, label: 'FIELD-0' },
    ];
    const E = [[0,1],[1,2],[0,3],[3,4],[4,2],[1,4]];
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const P = N.map(n => ({ x: n.x * w, y: n.y * h, label: n.label }));
      ctx.lineWidth = 1.4;
      E.forEach(([a, b], i) => {
        ctx.strokeStyle = 'rgba(240,122,24,.4)';
        ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke();
        // travelling packet
        const f = ((t * 0.4 + i * 0.3) % 1);
        const px = P[a].x + (P[b].x - P[a].x) * f, py = P[a].y + (P[b].y - P[a].y) * f;
        ctx.fillStyle = C.greenHi; ctx.shadowColor = C.green; ctx.shadowBlur = 8;
        ctx.fillRect(px - 2, py - 2, 4, 4); ctx.shadowBlur = 0;
      });
      P.forEach((p, i) => {
        const s = 18 + (i % 3) * 6;
        ctx.fillStyle = 'rgba(199,38,24,.16)'; ctx.strokeStyle = 'rgba(240,122,24,.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x - s*.5, p.y - s*.7);
        ctx.lineTo(p.x + s*.7, p.y - s*.5); ctx.lineTo(p.x + s, p.y + s*.4);
        ctx.lineTo(p.x, p.y + s*.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.amber; ctx.font = '9px "Share Tech Mono", monospace';
        ctx.fillText(p.label, p.x - s, p.y + s + 12);
      });
    }, true);
  }

  /* ── PSYCHOGRAPHIC SCRIBBLE (Screen 13) ── */
  function gScribble(cv) {
    const cols = [C.amber, C.cyan, C.greenHi, C.red];
    const paths = [...Array(4)].map((_, i) => ({ c: cols[i], seed: Math.random() * 10, sp: rand(.3, .8) }));
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      // plus markers
      ctx.strokeStyle = 'rgba(221,230,210,.12)'; ctx.lineWidth = 1;
      for (let x = 20; x < w; x += 46) for (let y = 20; y < h; y += 46) {
        ctx.beginPath(); ctx.moveTo(x-3,y); ctx.lineTo(x+3,y); ctx.moveTo(x,y-3); ctx.lineTo(x,y+3); ctx.stroke();
      }
      paths.forEach(p => {
        ctx.strokeStyle = p.c; ctx.globalAlpha = .8; ctx.lineWidth = 1.3;
        ctx.shadowColor = p.c; ctx.shadowBlur = 5;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const a = i / 60 * Math.PI * 2;
          const r = (Math.min(w,h) * .32) * (0.4 + 0.5 * Math.sin(a * 3 + p.seed + t * p.sp));
          const x = w/2 + Math.cos(a * 2 + t * p.sp) * r;
          const y = h/2 + Math.sin(a * 3 + p.seed) * r * .6;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }, true);
  }

  /* ── BIO-NEURON SILHOUETTES (Screen 01) — hero backdrop ── */
  function gBioneuron(cv) {
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const draw = (cx, color, flip) => {
        ctx.save(); ctx.translate(cx, h * 0.5); if (flip) ctx.scale(-1, 1);
        ctx.strokeStyle = color; ctx.globalAlpha = .5; ctx.lineWidth = 1.2;
        ctx.shadowColor = color; ctx.shadowBlur = 10;
        const H = h * 0.7, head = H * 0.12;
        // simplified humanoid contour
        ctx.beginPath();
        ctx.arc(0, -H/2 + head, head, 0, Math.PI*2); // head
        ctx.moveTo(-head*0.9, -H/2 + head*2);
        ctx.quadraticCurveTo(-H*0.18, -H*0.1, -H*0.10, H*0.2); // left side down
        ctx.lineTo(-H*0.06, H/2);
        ctx.moveTo(head*0.9, -H/2 + head*2);
        ctx.quadraticCurveTo(H*0.18, -H*0.1, H*0.10, H*0.2);
        ctx.lineTo(H*0.06, H/2);
        ctx.stroke();
        // nerve texture
        ctx.globalAlpha = .3 + Math.sin(t*2)*.1;
        for (let i = 0; i < 14; i++) {
          ctx.beginPath();
          const yy = -H/2 + (i/14)*H;
          ctx.moveTo(0, yy);
          ctx.lineTo((Math.sin(i*1.7 + t)) * H*0.12, yy + 6);
          ctx.stroke();
        }
        ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      };
      draw(w * 0.32, C.red, false);
      draw(w * 0.68, C.cyan, true);
      // central data spine
      ctx.strokeStyle = 'rgba(240,122,24,.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
    }, true);
  }

  /* ── HEX FIELD canvas (Screen 11) with flickering cells ── */
  function gHex(cv) {
    register(cv, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const s = 26, hw = Math.sqrt(3) / 2 * s;
      for (let row = 0, y = 0; y < h + s; row++, y += s * 1.5) {
        for (let x = (row % 2 ? hw : 0); x < w + hw; x += hw * 2) {
          const flick = (Math.sin(x * .1 + y * .1 + t * 2) > .85);
          ctx.strokeStyle = flick ? 'rgba(255,154,34,.9)' : 'rgba(240,122,24,.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const ang = Math.PI / 3 * a - Math.PI / 6;
            const px = x + Math.cos(ang) * s * .56, py = y + Math.sin(ang) * s * .56;
            a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
    }, true);
  }

  const GRAPHS = { waveform: gWaveform, contour: gContour, scope: gScope,
    nodes: gNodes, scribble: gScribble, bioneuron: gBioneuron, hex: gHex };

  function mountGraphics() {
    $$('canvas[data-graph]').forEach(cv => { const g = GRAPHS[cv.dataset.graph]; if (g) g(cv); });
  }

  /* ───────────────────────── MODALS ───────────────────────── */
  function modals() {
    $$('[data-open]').forEach(btn => btn.addEventListener('click', () => {
      const m = $('#' + btn.dataset.open); if (!m) return; m.classList.add('active');
      const v = $('video', m); if (v) v.play().catch(()=>{});
    }));
    $$('.modal').forEach(m => {
      const close = () => { m.classList.remove('active'); const v = $('video', m); if (v) { v.pause(); v.currentTime = 0; } };
      $('.modal__close', m)?.addEventListener('click', close);
      $('.modal__back', m)?.addEventListener('click', close);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.active').forEach(m => m.classList.remove('active')); });
  }

  /* ───────────────────────── COPY (discord etc) ───────────────────────── */
  function copyBtns() {
    $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy);
        const o = btn.textContent; btn.textContent = 'COPIED ✓'; btn.classList.add('green');
        setTimeout(() => { btn.textContent = o; btn.classList.remove('green'); }, 1500);
      } catch {}
    }));
  }

  /* ───────────────────────── GLITCH CCTV FEED ───────────────────────── */
  function feedMonitor() {
    if (document.querySelector('.feed-monitor')) return;
    const VID = '0Uhh62MUEic';
    const wrap = document.createElement('div');
    wrap.className = 'feed-monitor';
    wrap.innerHTML =
      '<div class="feed-monitor__lbl">FEED 07 / CCTV</div>' +
      '<div class="feed-monitor__rec">● REC</div>' +
      '<div id="ytfeed"></div>' +
      '<div class="feed-monitor__rgb"></div>' +
      '<div class="feed-monitor__scan"></div>' +
      '<div class="feed-monitor__bar">' +
        '<button class="feed-monitor__pp" aria-label="Play or pause feed" title="Play / pause">❚❚</button>' +
        '<button class="feed-monitor__btn" aria-label="Toggle feed audio" title="Audio volume">♪ VOL 10</button>' +
        '<button class="feed-monitor__x" aria-label="Close feed" title="Close">✕</button>' +
      '</div>';
    document.body.appendChild(wrap);

    const btn = wrap.querySelector('.feed-monitor__btn');
    const pp = wrap.querySelector('.feed-monitor__pp');
    const VOL = 10;
    let player = null, ready = false, gestured = false, playing = true;
    // persist audio + playback position across page navigations
    const LS = window.localStorage;
    let audioOn = !LS || LS.getItem('feedAudio') !== '0'; // default on unless muted before
    const paint = () => { btn.textContent = audioOn ? ('♪ VOL ' + VOL) : '🔇 MUTED'; btn.classList.toggle('on', audioOn); };
    const paintPP = () => { pp.textContent = playing ? '❚❚' : '▶'; pp.classList.toggle('on', playing); };
    const apply = () => {
      if (!player || !player.setVolume) return;
      // autoplay-with-sound is blocked until the user interacts (gestured)
      if (audioOn && gestured) { player.unMute(); player.setVolume(VOL); } else { player.mute(); }
      paint();
    };
    const persist = () => { try { LS.setItem('feedAudio', audioOn ? '1' : '0'); } catch (e) {} };

    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('ytfeed', {
        videoId: VID, host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: VID,
          playsinline: 1, modestbranding: 1, rel: 0, disablekb: 1, fs: 0, iv_load_policy: 3 },
        events: { onReady: (e) => {
          ready = true; e.target.mute(); e.target.playVideo();
          const t = parseFloat((LS && LS.getItem('feedT')) || '0');
          const dur = e.target.getDuration && e.target.getDuration();
          if (t > 0.5 && (!dur || t < dur - 0.5)) e.target.seekTo(t, true);
          apply(); // if the user already interacted, bring audio up now
          playing = true; paintPP();
          setInterval(() => { try { LS.setItem('feedT', e.target.getCurrentTime()); } catch (er) {} }, 800);
        } },
      });
    };
    if (window.YT && window.YT.Player) window.onYouTubeIframeAPIReady();
    else if (!document.getElementById('yt-api')) {
      const s = document.createElement('script'); s.id = 'yt-api';
      s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
    }

    // ANY first interaction unlocks audio (handles clicking before the player is ready)
    const EVTS = ['pointerdown', 'keydown', 'touchstart', 'click', 'scroll'];
    const onGesture = () => { gestured = true; apply(); if (ready) detach(); };
    const detach = () => EVTS.forEach(ev => window.removeEventListener(ev, onGesture));
    EVTS.forEach(ev => window.addEventListener(ev, onGesture, { passive: true }));

    paint(); paintPP();
    btn.addEventListener('click', (e) => { e.stopPropagation(); gestured = true; audioOn = !audioOn; persist(); apply(); });
    pp.addEventListener('click', (e) => {
      e.stopPropagation(); if (!player || !player.playVideo) return;
      if (playing) { player.pauseVideo(); playing = false; } else { player.playVideo(); playing = true; }
      paintPP();
    });
    wrap.querySelector('.feed-monitor__x').addEventListener('click', (e) => {
      e.stopPropagation(); if (player && player.stopVideo) player.stopVideo(); wrap.remove(); detach();
    });
  }

  // re-start background videos after a client-side page swap (autoplay attr is not
  // honoured on script-inserted elements). Also retry on first touch for mobile,
  // where muted autoplay is sometimes deferred until interaction.
  function playBgVideos() {
    const go = () => $$('.bg-video').forEach(v => {
      v.muted = true; v.setAttribute('playsinline', ''); const p = v.play(); if (p && p.catch) p.catch(() => {});
    });
    go();
    const retry = () => { go(); window.removeEventListener('touchstart', retry); window.removeEventListener('pointerdown', retry); };
    window.addEventListener('touchstart', retry, { once: true, passive: true });
    window.addEventListener('pointerdown', retry, { once: true });
  }

  /* ───────────────────────── INIT / REMOUNT ───────────────────────── */
  // page-scoped init — safe to call again after a client-side page swap
  function mountPage() {
    animators.length = 0;        // drop graph loops from the previous page
    reveal(); counters(); mountGraphics(); modals(); copyBtns(); playBgVideos();
  }
  function init() {
    boot(); flicker(); clock(); feedMonitor(); mountPage();
  }
  window.NERV = { mountPage };   // exposed for nerv-spa.js
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
