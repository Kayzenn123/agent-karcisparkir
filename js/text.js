/* KarcisParkir — teks: (1) Manuale wght denyut terikat scroll,
   (2) split per-kata reveal dari mask, (3) scramble angka/teks via MutationObserver
   pada [data-scramble] — app.js cukup mengubah textContent. */
const GLYPHS = '!<>-_\\/[]{}=+*^?#';
let raf = 0, io = null, mo = null, denyutEls = [];

function mode() { return document.documentElement.dataset.mode || 'penuh'; }

function scrambleJalan(el) {
  const target = el.textContent;
  if (el._scrTarget === target || el._anim) return;
  el._scrTarget = target;
  const m = mode();
  if (m === 'mati' || m === 'tenang' || m === 'ringan') return; // biarkan teks final
  el._anim = true;
  const mulai = performance.now(), dur = 650;
  const asal = (el._scrAsal || '').padEnd(target.length, ' ');
  (function frame(now) {
    const p = Math.min(1, (now - mulai) / dur);
    const n = Math.floor(p * target.length);
    let out = '';
    for (let i = 0; i < target.length; i++) {
      if (i < n) out += target[i];
      else if (target[i] === ' ' || target[i] === '.') out += target[i];
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else { el.textContent = target; el._anim = false; el._scrAsal = target; }
  })(mulai);
}

function denyutLoop() {
  const doc = document.documentElement;
  const maks = Math.max(1, doc.scrollHeight - window.innerHeight);
  const p = Math.min(1, Math.max(0, window.scrollY / maks));
  const w = Math.round(300 + p * 500);
  denyutEls.forEach((el) => {
    el.style.fontVariationSettings = "'wght' " + w;
  });
  raf = requestAnimationFrame(denyutLoop);
}

export function init() {
  destroy();
  const m = mode();

  // 1) wght denyut — hanya mode penuh
  denyutEls = Array.from(document.querySelectorAll('.denyut'));
  if (m === 'penuh' && denyutEls.length) {
    raf = requestAnimationFrame(denyutLoop);
  } else {
    denyutEls.forEach((el) => { el.style.fontVariationSettings = "'wght' 500"; });
  }

  // 2) split per kata
  const splits = Array.from(document.querySelectorAll('[data-split]'));
  splits.forEach((el) => {
    if (el._split) return;
    el._split = true;
    const kata = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = kata.map((k, i) =>
      '<span class="kata" aria-hidden="true"><span class="kata-dlm" style="--i:' + i + '">' + k + '</span></span>'
    ).join(' ');
  });
  if (m === 'penuh' || m === 'ringan') {
    io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    splits.forEach((el) => io.observe(el));
  } else {
    splits.forEach((el) => el.classList.add('on'));
  }

  // 3) scramble otomatis saat teks berubah
  mo = new MutationObserver((muts) => {
    muts.forEach((mu) => {
      let el = null;
      if (mu.target.nodeType === 3) el = mu.target.parentElement;
      else if (mu.target.nodeType === 1) el = mu.target;
      if (el && el.closest) el = el.closest('[data-scramble]');
      if (el && !el._anim) scrambleJalan(el);
    });
  });
  mo.observe(document.body, { childList: true, characterData: true, subtree: true });
}

export function destroy() {
  cancelAnimationFrame(raf); raf = 0;
  if (io) io.disconnect();
  if (mo) mo.disconnect();
  io = null; mo = null;
  denyutEls.forEach((el) => { el.style.fontVariationSettings = ''; });
  denyutEls = [];
}
