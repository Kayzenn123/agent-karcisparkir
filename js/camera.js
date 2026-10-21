/* KarcisParkir — kamera: zoom-through kata kota raksasa jadi pintu.
   Mode penuh + GSAP: scale 1→3 + opacity→0 (scrub). Selain itu: fade lembut. */
let bersih = [];

export function init() {
  destroy();
  const mode = document.documentElement.dataset.mode || 'penuh';
  const kata = Array.from(document.querySelectorAll('.kota-word'));
  if (!kata.length) return;

  if (mode === 'penuh' && window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    kata.forEach((w) => {
      const card = w.closest('.kota-card') || w;
      const tw = window.gsap.fromTo(
        w,
        { scale: 1, opacity: 1 },
        { scale: 3, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 60%', end: 'bottom -20%', scrub: true } }
      );
      bersih.push(() => {
        if (tw.scrollTrigger) tw.scrollTrigger.kill();
        tw.kill();
        window.gsap.set(w, { clearProps: 'all' });
      });
    });
    return;
  }

  // Fallback / mode hemat / gerak mati: TANPA zoom-through, TANPA fade yang
  // menyembunyikan. Nama kota adalah konten penting — selalu terlihat,
  // tidak bergantung pada IntersectionObserver (robustness: screenshot
  // full-page & perangkat apa pun tetap menampilkan semua nama kota).
  return;
}

export function destroy() {
  bersih.forEach((f) => { try { f(); } catch (_) { /* diam */ } });
  bersih = [];
}
