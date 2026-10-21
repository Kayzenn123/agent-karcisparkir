/* KarcisParkir — reveal: garis draw-on lalu isi (SVG pathLength=1),
   palang parkir terangkat, sekuens "mencetak karcis" via MutationObserver
   pada .karcis-cetak.mencetak. */
let io = null, mo = null, timer = [];

function mode() { return document.documentElement.dataset.mode || 'penuh'; }

function gambar(el) {
  const m = mode();
  if (m === 'mati') { el.classList.add('digambar', 'terisi'); return; }
  // gambar dulu, isi belakangan
  requestAnimationFrame(() => {
    el.classList.add('digambar');
    timer.push(setTimeout(() => el.classList.add('terisi'), 750));
  });
}

export function init() {
  destroy();
  const m = mode();

  // Draw-on generik untuk [data-gambar]
  const targets = Array.from(document.querySelectorAll('[data-gambar]'));
  if (m === 'mati') {
    targets.forEach((el) => el.classList.add('digambar', 'terisi'));
  } else {
    io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { gambar(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    targets.forEach((el) => io.observe(el));
  }

  // Sekuens cetak karcis
  const karcis = document.querySelector('.karcis-cetak');
  if (!karcis) return;
  mo = new MutationObserver(() => {
    if (!karcis.classList.contains('mencetak')) return;
    const mm = mode();
    const cap = karcis.querySelector('.cap-contoh');
    if (mm === 'mati' || mm === 'tenang') {
      karcis.querySelectorAll('[data-gambar]').forEach((el) => el.classList.add('digambar', 'terisi'));
      if (cap) cap.classList.add('tercap');
      return;
    }
    karcis.querySelectorAll('[data-gambar]').forEach((el) => {
      el.classList.remove('digambar', 'terisi');
      void el.getBoundingClientRect(); // paksa reflow agar animasi mengulang
      gambar(el);
    });
    timer.push(setTimeout(() => { if (cap) cap.classList.add('tercap'); }, 1400));
  });
  mo.observe(karcis, { attributes: true, attributeFilter: ['class'] });
}

export function destroy() {
  if (io) io.disconnect();
  if (mo) mo.disconnect();
  io = null; mo = null;
  timer.forEach(clearTimeout);
  timer = [];
}
