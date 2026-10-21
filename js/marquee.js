/* KarcisParkir — marquee: 2 band berlawanan arah + skew mengikuti velocity scroll.
   Tiap band punya tombol jeda sendiri.
   Mode ringan: kedua band TETAP berjalan sebagai strip horizontal via animasi
   CSS murni (compositor-only, tanpa rAF/skew — murah di HP). Bukan list
   vertikal statis.
   Mode tenang/mati: band statis (aksesibilitas). */
let raf = 0, state = [], lepas = [];

function mode() { return document.documentElement.dataset.mode || 'penuh'; }

function bangun(mq) {
  const track = mq.querySelector('.marquee-track');
  if (!track || !track.children.length) return null;
  const seg = track.children[0];
  const klon = seg.cloneNode(true);
  klon.setAttribute('aria-hidden', 'true');
  track.appendChild(klon);
  return {
    mq, track, segW: seg.offsetWidth, dir: mq.id === 'marquee-b' ? 1 : -1,
    speed: mq.id === 'marquee-b' ? 55 : 70, x: 0, skew: 0,
    jalan: true, off: false
  };
}

function pasangJeda(s, pakaiCss) {
  const btn = s.mq.querySelector('.marquee-jeda');
  if (!btn) return;
  const klik = () => {
    s.jalan = !s.jalan;
    btn.setAttribute('aria-pressed', String(!s.jalan));
    btn.querySelector('.label').textContent = s.jalan ? 'Jeda' : 'Jalan';
    if (pakaiCss) s.mq.classList.toggle('jeda-css', !s.jalan);
  };
  btn.addEventListener('click', klik);
  lepas.push(() => btn.removeEventListener('click', klik));
}

function loop() {
  state.forEach((s) => {
    if (!s.jalan || s.off || document.hidden) return;
    s.x -= s.dir * s.speed / 60;
    const w = s.segW / 2;
    if (s.x <= -w) s.x += w;
    if (s.x > 0) s.x -= w;
    s.skew *= 0.92;
    s.track.style.transform = 'translate3d(' + s.x + 'px,0,0) skewX(' + s.skew.toFixed(2) + 'deg)';
  });
  raf = requestAnimationFrame(loop);
}

export function init() {
  destroy();
  const m = mode();
  const mqs = Array.from(document.querySelectorAll('.marquee'));

  if (m === 'mati' || m === 'tenang') {
    // Layout statis dikunci via CSS dari html[data-mode]
    // (diset inline sebelum first paint) — tanpa manipulasi class di sini.
    return;
  }

  state = mqs.map(bangun).filter(Boolean);
  if (!state.length) return;

  if (m === 'ringan') {
    // Animasi CSS murni: murah (compositor), kecepatan konsisten px/detik.
    state.forEach((s) => {
      s.track.classList.add('anim-css');
      s.track.style.animationDuration = Math.max(8, Math.round(s.segW / s.speed)) + 's';
      pasangJeda(s, true);
    });
    return;
  }

  // Mode penuh: rAF loop + skew velocity + pause offscreen.

  // Skew dari velocity scroll
  let lastY = window.scrollY, tSkew = 0;
  const onScroll = () => {
    const dy = window.scrollY - lastY; lastY = window.scrollY;
    const k = Math.max(-12, Math.min(12, dy * 0.35));
    state.forEach((s) => { s.skew = k; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  lepas.push(() => window.removeEventListener('scroll', onScroll));

  // Pause saat offscreen
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      const s = state.find((x) => x.mq === e.target);
      if (s) s.off = !e.isIntersecting;
    });
  });
  state.forEach((s) => io.observe(s.mq));
  lepas.push(() => io.disconnect());

  // Tombol jeda per band
  state.forEach((s) => pasangJeda(s, false));

  raf = requestAnimationFrame(loop);
}

export function destroy() {
  cancelAnimationFrame(raf); raf = 0;
  lepas.forEach((f) => { try { f(); } catch (_) { /* diam */ } });
  lepas = [];
  state.forEach((s) => {
    const klon = s.track.children[1];
    if (klon) klon.remove();
    s.track.style.transform = '';
    s.track.style.animationDuration = '';
    s.track.classList.remove('anim-css');
    s.mq.classList.remove('jeda-css');
  });
  state = [];
  document.querySelectorAll('.marquee').forEach((mq) => {
    const btn = mq.querySelector('.marquee-jeda');
    if (btn) {
      btn.setAttribute('aria-pressed', 'false');
      const l = btn.querySelector('.label');
      if (l) l.textContent = 'Jeda';
    }
  });
}
