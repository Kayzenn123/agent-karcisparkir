# BUILD-NOTES — KarcisParkir (Hari 12, 30 Days of Code) — 2026-10-21

## Ringkasan
Site selesai dibangun di `site/`, lolos 34/34 uji fungsional Playwright
(headless Chromium) + 13/13 uji unit tarif + cek statis larangan.
Tidak di-deploy — hanya build lokal (`python3 -m http.server 8123`).

## Aset & budget
| Kelompok | File | Ukuran |
|---|---|---|
| Font | stylish-400.woff2 15.188 B, manuale-variable.woff2 43.256 B, plaster-400.woff2 8.772 B | total 67.216 B (≤250KB ✓, target kontrak ≤120KB ✓) |
| CSS | styles.css | 15.251 B mentah / 4.021 B gzip (≤60KB ✓) |
| JS app | data.js + app.js + 5 modul | 36.095 B mentah / 12.412 B gzip |
| JS vendor | gsap.min.js 72.214 B + ScrollTrigger.min.js 43.380 B | gzip ±36KB; total JS gzip ±48KB (≤250KB ✓) |

Font Manuale variable: pola URL fontsource `fonts/manuale:ital,wght@latest/...`
mengembalikan HTTP 400 ("Invalid font tag: unsupported variable suffix") —
2 varian dicoba lalu dipakai `@fontsource-variable/manuale` via jsDelivr npm
(`files/manuale-latin-wght-normal.woff2`), terverifikasi magic `wOF2`.
Ketiga font + kedua file GSAP terverifikasi valid (file magic / parse JS).

## Penyimpangan dari BRIEF (dicatat, bukan diam-diam)
1. **ID `#durasi` duplikat di kontrak** — kontrak memberi `section#durasi` DAN
   `input#durasi`. ID duplikat tidak valid dan menimbulkan BUG NYATA saat uji:
   listener `input` terpasang ke section (querySelector mengembalikan section),
   lalu event `input` dari `select#zona` menggelembung ke section hingga
   `state.jam` tertimpa nilai zona ("1 jam" palsu). Putusan: section tetap
   `#durasi`; input diganti `#durasi-range` (label `for`, CSS, JS disesuaikan).
2. **Scroll-snap setelah zoom-through** (storyboard: "snap ke section
   berikutnya") — TIDAK diimplementasikan; scroll snap paksa dinilai merusak
   aksesibilitas keyboard/pembaca layar. Zoom scrub 1→3 + fade tetap jalan.
3. **"Fokus pindah ke heading tujuan"** (Gerak A) — TIDAK diimplementasikan;
   merebut fokus saat scroll adalah pola aksesibilitas yang buruk.
4. **DeviceOrientation tilt di HP** — diimplementasikan (guarded, hanya pointer
   coarse) tetapi BELUM terverifikasi di perangkat fisik (tidak ada HP saat build).
5. **Deteksi fps<40 → mode ringan** — terimplementasi; di headless mode sudah
   jadi 'ringan' via hardwareConcurrency sehingga jalur fps tidak terpicu
   dalam tes (jalur kode ada, belum teruji terpicu).
6. `#gerak-toggle` diimplementasikan sebagai checkbox + label (kontrak hanya
   menetapkan ID-nya). `aria-checked` diset redundan — tidak masalah.

## Hasil uji manual per fitur (Playwright, 2026-10-21)
- Tanpa console/page error: LULUS (bersih)
- Struktur: 1 h1, lang="id", skip link #lewati, landmark, #toast aria-live: LULUS
- 6 kartu kota ter-render dari data.js: LULUS
- 3 font termuat (document.fonts.check): LULUS
- Pilih Bandung → zona-wrap muncul; estimasi pusat motor 2j = Rp6.000: LULUS
- Ganti zona penyangga → motor 2j = Rp4.000: LULUS
- Mobil + slider 5j → Rp20.000: LULUS
- Cetak: nomor seri format KP-2026-XXXX, total benar, cap CONTOH tercap,
  rincian ≥3 baris, deep-link ?kota=bandung&kendaraan=mobil&jam=5: LULUS
- Riwayat: 1 item, persist setelah reload, skema korup tidak crash: LULUS
- Salin WA (clipboard + fallback textarea): LULUS (toast konfirmasi)
- Deep-link load baru (Yogyakarta/motor/4j → Rp5.000): LULUS
- Easter egg "nuthuk" → MODE LIAR + 4 sanksi: LULUS
- Validasi jam keluar < jam masuk → pesan "Jam keluarnya jangan ngarang": LULUS
- Toggle gerak mati → data-mode="mati"; nyala kembali: LULUS
- prefers-reduced-motion → mode tenang/mati, toggle tidak dicentang: LULUS
- Keyboard-only: Tab pertama → #lewati: LULUS
- Tarif unit (13 kasus: flat/jam/progresif Semarang/maksPerJam/Yogya 2-jam-pertama): LULUS semua
- Cek statis: tanpa console.log/TODO/lorem/emoji-ikon/box-shadow/linear-gradient: LULUS
  (satu-satunya kemunculan kata "box-shadow" adalah di komentar CSS)
- Visual (screenshot mobile+desktop): headline misregister 2 lapis ✓,
  kartu kota ✓, karcis + cap CONTOH ✓, palang terangkat ✓, marquee statis
  ringkas dalam mode ringan ✓. "Efek ganda" pada teks Plaster = gaya inline
  bawaan desain font Plaster (bukan bug) — diverifikasi via screenshot isolasi.

## Perbaikan QA 2026-10-21 (sesi fixer, 3 masalah)

### M1 — tap target <44px (4 buah) → 0 di semua viewport
Elemen: `a.logo` (163×38), `#gerak-toggle` (20×20), `#kend-motor`/`#kend-mobil` (20×20).
Fix `site/styles.css`: `.logo { min-height: 44px }`; `#gerak-toggle, .pilihan input { min-width:44px; min-height:44px }`.
Verifikasi: `tools/qa.js` → smallTapTargets=0 di 360/390/768/1280, exit 0.

### M2 — CLS 0.889 → 0 (Lighthouse mobile, 2 run)
Akar masalah (dari trace CDP): `renderKota()` di DOMContentLoaded menyisipkan
6 kartu SETELAH first paint pada kondisi Lighthouse → perforasi + konten bawah
terdorong 948px (0.1689, deterministik race). BUKAN font swap (line-height
eksplisit di semua teks membuat line box stabil).
Fix:
- `site/index.html`: 6 kartu kota PRE-RENDER statis di `#kota-grid` (digenerate
  dari `js/data.js` via `node /tmp/gen-cards.mjs` — jangan edit manual);
  `renderKota()` di `js/app.js` kini hanya memasang listener bila kartu sudah ada.
- `site/index.html`: preload 3 woff2 (`as=font`, crossorigin).
- `site/styles.css`: `@font-face` fallback `StylishFallback`/`ManualeFallback`/
  `PlasterFallback` (ascent/descent/line-gap-override dari metrik woff2 via
  fontTools; size-adjust dari rasio LEBAR aktual: Stylish 84.63%, Manuale 85.31%).
  Pelajaran: `local('Georgia')`/`local('Arial Black')` GAGAL di Chromium Linux
  (nama family tidak terinstal → face status error) — rantai local() kini
  `local('Georgia'), local('DejaVu Serif')` dst.
- Mode gerak diset via inline script di `<head>` SEBELUM first paint
  (`document.documentElement.dataset.mode`); CSS marquee (`#marquee-b` sembunyi,
  `.marquee-seg` grid statis, tombol jeda hilang) kini dikunci dari
  `html[data-mode]` — `js/marquee.js` tidak lagi manipulasi class saat init.
- min-height guard: `.karcis-top` 5.5rem, `.marquee` 3rem, mode statis 15rem.
- `blocking="render"` pada modul DICOBA lalu DI-REVERT: tidak deterministik
  menghilangkan race + menurunkan performance (TBT 1580ms).
Hasil Lighthouse mobile (simulate, 412×823): CLS 0.889 → 0.169 → **0** (2 run);
performance 78 → 93/81; accessibility 91; LCP 2.7–3.0s; TBT 180–350ms.

### M3 — unused JS vendor (~79 KiB)
`vendor/gsap.min.js` + `vendor/ScrollTrigger.min.js` kini `defer` (urutan eksekusi
tetap: vendor dulu, modul kemudian — modul sudah guard `window.gsap`).
Fungsi 100% jalan: pilih kota, estimasi, cetak (nomor seri + cap CONTOH +
deep-link), salin WA, unduh JSON, riwayat, easter egg, toggle gerak —
diverifikasi Playwright mode ringan & penuh, 0 console/page error.
Catatan: audit "unused-javascript" Lighthouse tetap mencatat 79 KiB (GSAP tidak
terpakai saat mode ringan) — sesuai scope tugas, yang diminta hanya `defer`.

## Catatan lain
- Mode gerak di headless terdeteksi 'ringan' (hardwareConcurrency kecil) —
  sesuai desain mode ringan otomatis.
- Server lokal port 8123 dimatikan setelah uji selesai.
