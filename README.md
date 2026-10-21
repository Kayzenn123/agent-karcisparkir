# KarcisParkir — 30 Days of Code, Hari 12 (2026-10-21)

Mesin karcis parkir digital ala cetakan **risograph 3 tinta**: pilih kota, atur durasi, terima karcis parkir bernomor dengan rincian tarif contoh sesuai perda. Dibangun untuk seri "30 Days of Code".

**Live:** https://kayzenn123.github.io/agent-karcisparkir/

## Fitur
- Kalkulator tarif parkir 6 kota (Jakarta, Surabaya, Bandung, Yogyakarta, Semarang, Medan) — motor/mobil, tarif per jam / per parkir / progresif, dengan zona (Bandung pusat vs penyangga, Yogya Kawasan 1 vs 2/3, Semarang Zona A). Semua tarif **berlabel contoh sesuai perda** + sumber di footer.
- Generator karcis digital bernomor (`KP-2026-XXXX`) dengan rincian, total, dan cap "CONTOH".
- Deep-link `?kota=&kendaraan=&jam=` — state bisa dibagikan lewat tautan.
- Salin ringkasan ke WhatsApp (dengan fallback), unduh JSON.
- Riwayat karcis di localStorage (key `karcisparkir.v1`, validasi skema + versi, maks 20).
- Easter egg: ketik **"nuthuk"** → mode karcis liar (peringatan parkir liar + sanksi).
- Validasi input jelas dengan suara "Mas Parkir"; empty/loading/error state didesain.

## Teknologi
- No-build: HTML + CSS + ESM vanilla (`js/`), GSAP 3.12.5 + ScrollTrigger (self-host di `vendor/`).
- Font self-host (OFL-1.1): Stylish 400 (display), Manuale variable 300–800 (body), Plaster 400 (aksen nomor karcis).
- Ikon: 14 SVG inline duotone — base Bootstrap Icons (MIT) + 4 custom hand-built (karcis parkir, palang parkir, helm, motor).
- 5 lapisan gerak (modul `js/camera.js`, `marquee.js`, `text.js`, `input.js`, `reveal.js`, masing-masing `init()`/`destroy()`): zoom-through kata-kota jadi pintu, 2 band marquee berlawanan + skew velocity, Manuale wght denyut + split reveal + scramble angka, tilt 3D pointer, draw-on garis palang.
- Toggle "Gerak: nyala/mati" + hormati `prefers-reduced-motion` + mode ringan otomatis (marquee CSS compositor-only, zoom→fade).

## Skor QA
- `tools/qa.js`: exit 0 (4 viewport, 0 overflow, 0 console error, tap target ≥44px, fps 4x CPU throttle **59.3**).
- Lighthouse (lokal, Chrome for Testing 156): mobile **92/91/100/100**, desktop **100/91/100/100** (performance/accessibility/best-practices/SEO), CLS 0.
- Budget: JS ±48KB gzip (≤250), CSS 4KB gzip (≤60), font 67KB (≤250).

## Kredit aset
- Font: Stylish, Manuale, Plaster — SIL Open Font License 1.1 (Google Fonts / Fontsource).
- Ikon dasar: Bootstrap Icons (MIT); ikon karcis/palang/helm/motor digambar sendiri.
- Data tarif: contoh sesuai perda tiap kota (Pergub DKI 31/2017, Perwal Bandung 66/2021, Perwal Medan 9/2026, dll) — detail sumber di footer situs. Bukan tarif resmi final; cek juru parkir resmi di lapangan.

## Cara jalanin lokal
`python3 -m http.server --directory site` → buka http://localhost:8000
