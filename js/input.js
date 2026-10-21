/* KarcisParkir — input: tilt 3D pointer pada .tilt, tombol magnetic,
   kursor cap-stempel custom, deviceorientation di HP. */
let lepas = [], rafMap = new WeakMap();

function mode() { return document.documentElement.dataset.mode || 'penuh'; }
function halus() { return window.matchMedia('(pointer:fine)').matches; }

export function init() {
  destroy();
  const m = mode();
  if (m !== 'penuh') return; // mode ringan/tenang/mati: tanpa tilt & kursor

  // --- Tilt 3D ---
  document.querySelectorAll('.tilt').forEach((el) => {
    if (!halus()) return;
    el.style.transformStyle = 'preserve-3d';
    const gerak = (ev) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(rafMap.get(el));
      rafMap.set(el, requestAnimationFrame(() => {
        el.style.transform = 'perspective(700px) rotateX(' + (-py * 10).toFixed(2) +
          'deg) rotateY(' + (px * 12).toFixed(2) + 'deg)';
      }));
    };
    const lepasEl = () => {
      cancelAnimationFrame(rafMap.get(el));
      el.style.transition = 'transform .45s ease';
      el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)';
      setTimeout(() => { el.style.transition = ''; }, 480);
    };
    el.addEventListener('pointermove', gerak);
    el.addEventListener('pointerleave', lepasEl);
    lepas.push(() => { el.removeEventListener('pointermove', gerak); el.removeEventListener('pointerleave', lepasEl); });
  });

  // --- Tombol magnetic ---
  document.querySelectorAll('.magnet').forEach((btn) => {
    if (!halus()) return;
    const tarik = (ev) => {
      const r = btn.getBoundingClientRect();
      const dx = ev.clientX - (r.left + r.width / 2);
      const dy = ev.clientY - (r.top + r.height / 2);
      btn.style.transform = 'translate(' + (dx * 0.12).toFixed(1) + 'px,' + (dy * 0.18).toFixed(1) + 'px)';
    };
    const pulih = () => { btn.style.transform = ''; };
    btn.addEventListener('pointermove', tarik);
    btn.addEventListener('pointerleave', pulih);
    lepas.push(() => { btn.removeEventListener('pointermove', tarik); btn.removeEventListener('pointerleave', pulih); });
  });

  // --- Kursor cap stempel ---
  if (halus()) {
    const k = document.createElement('div');
    k.className = 'kursor-cap';
    k.setAttribute('aria-hidden', 'true');
    document.body.appendChild(k);
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
    const ikut = (ev) => { tx = ev.clientX; ty = ev.clientY; };
    const putar = () => {
      x += (tx - x) * 0.25; y += (ty - y) * 0.25;
      k.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      raf = requestAnimationFrame(putar);
    };
    document.addEventListener('pointermove', ikut);
    raf = requestAnimationFrame(putar);
    lepas.push(() => { document.removeEventListener('pointermove', ikut); cancelAnimationFrame(raf); k.remove(); });
  }

  // --- Gyro di HP ---
  if (!halus() && 'DeviceOrientationEvent' in window) {
    const kartu = document.querySelector('.karcis-cetak');
    if (kartu) {
      const miring = (ev) => {
        if (ev.gamma == null || ev.beta == null) return;
        const rx = Math.max(-8, Math.min(8, (ev.beta - 45) * 0.25));
        const ry = Math.max(-10, Math.min(10, ev.gamma * 0.35));
        kartu.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
      };
      window.addEventListener('deviceorientation', miring);
      lepas.push(() => window.removeEventListener('deviceorientation', miring));
    }
  }
}

export function destroy() {
  lepas.forEach((f) => { try { f(); } catch (_) { /* diam */ } });
  lepas = [];
  document.querySelectorAll('.tilt').forEach((el) => { el.style.transform = ''; });
  document.querySelectorAll('.magnet').forEach((el) => { el.style.transform = ''; });
  const k = document.querySelector('.kursor-cap');
  if (k) k.remove();
}
