/* KarcisParkir — logika: kalkulator tarif, karcis bernomor, deep-link,
   salin WA, unduh JSON, riwayat localStorage, easter egg, mode gerak. */
import { KOTA, FAKTA, SANKSI_LIAR, EASTER_EGG } from './data.js';
import * as camera from './camera.js';
import * as marquee from './marquee.js';
import * as teks from './text.js';
import * as masukan from './input.js';
import * as reveal from './reveal.js';

const LS_KEY = 'karcisparkir.v1';
const MODUL = [camera, marquee, teks, masukan, reveal];

const state = { kota: null, zonaIdx: 0, kendaraan: 'motor', jam: 2 };
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

/* ---------- tarif ---------- */
export function hitungTarif(zona, kend, jam) {
  const t = zona[kend];
  const rincian = [];
  if (t.satuan === 'parkir') {
    rincian.push({ label: 'Sekali parkir (flat)', nilai: t.jam1 });
    return { total: t.jam1, rincian };
  }
  const d = t.jam1Durasi || 1;
  let total;
  if (jam <= d) {
    total = t.jam1;
    rincian.push({ label: d + ' jam pertama', nilai: t.jam1 });
  } else {
    total = t.jam1;
    rincian.push({ label: d + ' jam pertama', nilai: t.jam1 });
    const mulai = d + 1;
    let sisa = 0;
    for (let i = mulai; i <= jam; i++) {
      let r = t.berikut + (t.progresif || 0) * (i - mulai);
      if (t.maksPerJam) r = Math.min(r, t.maksPerJam);
      sisa += r;
    }
    let label = 'Jam ' + mulai + '–' + jam + ' (' + (jam - d) + ' jam)';
    if (t.maksPerJam) label += ' · progresif maks ' + rupiah(t.maksPerJam) + '/jam';
    rincian.push({ label, nilai: sisa });
    total += sisa;
  }
  return { total, rincian };
}

function tarifRingkas(kota) {
  const z = kota.zona[0];
  const mk = (t) => t.satuan === 'parkir' ? rupiah(t.jam1) + '/parkir' : rupiah(t.jam1) + '/jam';
  return 'Motor ' + mk(z.motor) + ' · Mobil ' + mk(z.mobil);
}

/* ---------- toast ---------- */
let toastT = 0;
function toast(pesan) {
  const el = $('#toast');
  el.textContent = '';
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.textContent = pesan; }, 60);
}

/* ---------- render kota ---------- */
function renderKota() {
  const grid = $('#kota-grid');
  if (grid.children.length) {
    // Kartu sudah pre-render statis di HTML (anti-CLS) — pasang listener saja.
    $$('.kota-card', grid).forEach((b) => {
      if (!b._terpasang) { b._terpasang = true; b.addEventListener('click', () => pilihKota(b.dataset.kota)); }
    });
    return;
  }
  grid.innerHTML = '';
  KOTA.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kota-card tilt';
    b.dataset.kota = k.slug;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Pilih kota ' + k.nama + '. ' + tarifRingkas(k) + '. Sumber: ' + k.sumber);
    b.innerHTML =
      '<span class="kota-word" aria-hidden="true">' + k.nama + '</span>' +
      '<span class="kota-tarif">' + tarifRingkas(k) + '</span>' +
      '<span class="kota-zona">' + k.zona[0].nama + (k.zona.length > 1 ? ' · +' + (k.zona.length - 1) + ' zona' : '') + '</span>';
    b.addEventListener('click', () => pilihKota(k.slug));
    grid.appendChild(b);
  });
}

function pilihKota(slug, zonaIdx) {
  const k = KOTA.find((x) => x.slug === slug);
  if (!k) return;
  state.kota = k;
  state.zonaIdx = Math.min(zonaIdx || 0, k.zona.length - 1);
  $$('.kota-card').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.kota === slug)));
  renderZona();
  perbaruiEstimasi();
  toast(k.nama + ' dipilih, Mas. Lanjut atur durasi.');
  const d = $('#durasi');
  if (d && !pilihKota._dariLink) d.scrollIntoView({ behavior: gerakAktif() ? 'smooth' : 'auto', block: 'start' });
}

function renderZona() {
  const wrap = $('#zona-wrap'), sel = $('#zona');
  if (!state.kota) { wrap.hidden = true; return; }
  if (state.kota.zona.length < 2) { wrap.hidden = true; return; }
  wrap.hidden = false;
  sel.innerHTML = '';
  state.kota.zona.forEach((z, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = z.nama;
    sel.appendChild(o);
  });
  sel.value = String(state.zonaIdx);
}

/* ---------- durasi & jam ---------- */
function bacaDurasi() {
  const jm = $('#jam-masuk').value, jk = $('#jam-keluar').value;
  if (jm && jk) {
    const [h1, m1] = jm.split(':').map(Number);
    const [h2, m2] = jk.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) return { ok: false, pesan: 'Jam keluarnya jangan ngarang, Mas — harus setelah jam masuk.' };
    const jam = Math.ceil(diff / 60);
    if (jam > 24) return { ok: false, pesan: 'Maksimal 24 jam, Mas. Lebih dari itu nginep namanya.' };
    return { ok: true, jam, dariJam: true };
  }
  return { ok: true, jam: state.jam, dariJam: false };
}

function perbaruiEstimasi() {
  const el = $('.estimasi-live');
  if (!state.kota) {
    el.textContent = 'Pilih kota dulu, Mas — jangan asal gas.';
    return;
  }
  const baca = bacaDurasi();
  if (!baca.ok) { el.textContent = baca.pesan; return; }
  const z = state.kota.zona[state.zonaIdx];
  const { total } = hitungTarif(z, state.kendaraan, baca.jam);
  const kend = state.kendaraan === 'motor' ? 'Motor' : 'Mobil';
  el.textContent = 'Estimasi: ' + rupiah(total) + ' · ' + kend + ' · ' + baca.jam + ' jam · ' + state.kota.nama;
}

/* ---------- karcis ---------- */
function nomorSeri() {
  const ada = new Set(riwayatBaca().map((r) => r.seri));
  for (let i = 0; i < 20; i++) {
    const s = 'KP-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    if (!ada.has(s)) return s;
  }
  return 'KP-2026-' + String(Math.floor(1000 + Math.random() * 9000));
}

function validasi() {
  if (!state.kota) return 'Kota-nya pilih dulu, jangan asal gas.';
  const baca = bacaDurasi();
  if (!baca.ok) return baca.pesan;
  if (baca.jam < 1 || baca.jam > 24) return 'Durasi 1–24 jam, Mas.';
  return null;
}

function cetak() {
  const salah = validasi();
  if (salah) { toast(salah); return; }
  const baca = bacaDurasi();
  const z = state.kota.zona[state.zonaIdx];
  const { total, rincian } = hitungTarif(z, state.kendaraan, baca.jam);
  const seri = nomorSeri();
  const rec = {
    v: 1, seri, kota: state.kota.nama, zona: z.nama,
    kendaraan: state.kendaraan, jam: baca.jam, total,
    tgl: new Date().toISOString()
  };
  // isi karcis
  const kartu = $('.karcis-cetak');
  kartu.querySelector('.karcis-kota').textContent = state.kota.nama + ' — ' + z.nama;
  kartu.querySelector('.karcis-meta').textContent =
    (state.kendaraan === 'motor' ? 'Motor' : 'Mobil') + ' · ' + baca.jam + ' jam';
  const dl = kartu.querySelector('.rincian');
  dl.innerHTML = '';
  rincian.forEach((r) => {
    const dt = document.createElement('dt'); dt.textContent = r.label;
    const dd = document.createElement('dd'); dd.textContent = rupiah(r.nilai);
    dl.append(dt, dd);
  });
  const cat = document.createElement('dt'); cat.textContent = 'Sumber';
  const catv = document.createElement('dd'); catv.textContent = state.kota.sumber;
  dl.append(cat, catv);
  kartu.querySelector('.nomor-seri').textContent = seri; // scramble via text.js
  kartu.querySelector('.total').textContent = rupiah(total); // scramble via text.js
  kartu.querySelector('.cap-contoh').classList.remove('tercap');
  kartu.classList.remove('mencetak');
  void kartu.offsetWidth;
  kartu.classList.add('mencetak'); // reveal.js menonton class ini
  // deep-link
  const url = new URL(location.href);
  url.searchParams.set('kota', state.kota.slug);
  url.searchParams.set('kendaraan', state.kendaraan);
  url.searchParams.set('jam', String(baca.jam));
  history.replaceState(null, '', url);
  simpanRiwayat(rec);
  renderRiwayat();
  toast('Karcis ' + seri + ' tercetak, Mas. Total ' + rupiah(total) + '.');
  kartu.scrollIntoView({ behavior: gerakAktif() ? 'smooth' : 'auto', block: 'center' });
}

/* ---------- WA & JSON ---------- */
function teksWA(rec) {
  const z = state.kota.zona[state.zonaIdx];
  const { rincian } = hitungTarif(z, state.kendaraan, rec.jam);
  const baris = rincian.map((r) => '- ' + r.label + ': ' + rupiah(r.nilai)).join('\n');
  return '*KARCIS PARKIR ' + rec.seri + '*\n' +
    'Kota: ' + rec.kota + ' (' + rec.zona + ')\n' +
    'Kendaraan: ' + (rec.kendaraan === 'motor' ? 'Motor' : 'Mobil') + ' · ' + rec.jam + ' jam\n' +
    baris + '\n' +
    '*Total: ' + rupiah(rec.total) + '*\n' +
    '_Tarif contoh sesuai perda — yang di lapangan bisa beda, tanya juru parkir resminya._';
}

function salinWA() {
  const seri = $('.nomor-seri').textContent.trim();
  if (!seri || !state.kota) { toast('Cetak karcisnya dulu, Mas.'); return; }
  const rec = riwayatBaca().find((r) => r.seri === seri) ||
    { seri, kota: state.kota.nama, zona: state.kota.zona[state.zonaIdx].nama,
      kendaraan: state.kendaraan, jam: bacaDurasi().jam, total: hitungTarif(state.kota.zona[state.zonaIdx], state.kendaraan, bacaDurasi().jam).total };
  const teks = teksWA(rec);
  const done = () => toast('Ringkasan tersalin — tinggal tempel di WA, Mas.');
  const gagal = () => toast('Gagal menyalin — salin manual ya, Mas.');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(teks).then(done, () => cadanganSalin(teks, done, gagal));
  } else cadanganSalin(teks, done, gagal);
}

function cadanganSalin(teks, done, gagal) {
  const ta = document.createElement('textarea');
  ta.value = teks;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy') ? done() : gagal(); }
  catch (_) { gagal(); }
  ta.remove();
}

function unduhJSON() {
  const seri = $('.nomor-seri').textContent.trim();
  if (!seri) { toast('Cetak karcisnya dulu, Mas.'); return; }
  const rec = riwayatBaca().find((r) => r.seri === seri) || { seri };
  const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = seri + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Karcis ' + seri + ' diunduh.');
}

/* ---------- riwayat ---------- */
function riwayatBaca() {
  try {
    const mentah = localStorage.getItem(LS_KEY);
    if (!mentah) return [];
    const data = JSON.parse(mentah);
    if (!data || data.v !== 1 || !Array.isArray(data.items)) return [];
    return data.items.filter((r) =>
      r && typeof r.seri === 'string' && typeof r.kota === 'string' &&
      typeof r.total === 'number' && typeof r.jam === 'number' &&
      (r.kendaraan === 'motor' || r.kendaraan === 'mobil'));
  } catch (_) { return []; }
}

function simpanRiwayat(rec) {
  const items = riwayatBaca();
  items.unshift(rec);
  try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, items: items.slice(0, 20) })); }
  catch (_) { toast('Riwayat penuh / penyimpanan diblokir — karcis tetap tercetak.'); }
}

function hapusRiwayat(seri) {
  const items = riwayatBaca().filter((r) => r.seri !== seri);
  try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, items })); } catch (_) { /* diam */ }
  renderRiwayat();
}

function renderRiwayat() {
  const list = $('#riwayat-list'), kosong = $('#riwayat-kosong');
  const items = riwayatBaca();
  list.innerHTML = '';
  kosong.hidden = items.length > 0;
  items.forEach((r) => {
    const li = document.createElement('li');
    li.className = 'riwayat-item';
    const tgl = new Date(r.tgl);
    const kapan = isNaN(tgl) ? '' : tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    li.innerHTML =
      '<span class="riwayat-seri">' + r.seri + '</span>' +
      '<span class="riwayat-info">' + r.kota + ' · ' + (r.kendaraan === 'motor' ? 'Motor' : 'Mobil') +
      ' · ' + r.jam + ' jam · ' + rupiah(r.total) + (kapan ? ' · ' + kapan : '') + '</span>';
    const muat = document.createElement('button');
    muat.type = 'button'; muat.className = 'btn-kecil'; muat.textContent = 'Muat';
    muat.setAttribute('aria-label', 'Muat karcis ' + r.seri);
    muat.addEventListener('click', () => muatRiwayat(r));
    const hapus = document.createElement('button');
    hapus.type = 'button'; hapus.className = 'btn-kecil'; hapus.textContent = 'Hapus';
    hapus.setAttribute('aria-label', 'Hapus karcis ' + r.seri);
    hapus.addEventListener('click', () => { hapusRiwayat(r.seri); toast('Karcis ' + r.seri + ' dihapus.'); });
    li.append(muat, hapus);
    list.appendChild(li);
  });
}

function muatRiwayat(r) {
  pilihKota._dariLink = true;
  const k = KOTA.find((x) => x.nama === r.kota);
  if (k) {
    pilihKota(k.slug, k.zona.findIndex((z) => z.nama === r.zona));
    $('#kend-' + r.kendaraan).checked = true;
    state.kendaraan = r.kendaraan;
    state.jam = Math.min(12, Math.max(1, r.jam));
    $('#durasi-range').value = String(state.jam);
    $('#durasi-nilai').textContent = state.jam + ' jam';
    perbaruiEstimasi();
  }
  pilihKota._dariLink = false;
  $('#durasi').scrollIntoView({ block: 'start' });
}

/* ---------- deep-link ---------- */
function bacaDeepLink() {
  const q = new URLSearchParams(location.search);
  const slug = q.get('kota'), kend = q.get('kendaraan'), jam = parseInt(q.get('jam'), 10);
  if (!slug || !KOTA.some((k) => k.slug === slug)) return;
  pilihKota._dariLink = true;
  pilihKota(slug);
  if (kend === 'motor' || kend === 'mobil') {
    state.kendaraan = kend;
    $('#kend-' + kend).checked = true;
  }
  if (jam >= 1 && jam <= 24) {
    state.jam = Math.min(12, jam);
    $('#durasi-range').value = String(state.jam);
    $('#durasi-nilai').textContent = state.jam + ' jam';
  }
  perbaruiEstimasi();
  pilihKota._dariLink = false;
}

/* ---------- easter egg ---------- */
function pasangEasterEgg() {
  let buf = '';
  document.addEventListener('keydown', (ev) => {
    if (ev.key.length !== 1) return;
    buf = (buf + ev.key.toLowerCase()).slice(-EASTER_EGG.length);
    if (buf === EASTER_EGG) {
      buf = '';
      const ml = $('#mode-liar');
      const list = $('#sanksi-list');
      if (list && !list.children.length) {
        SANKSI_LIAR.forEach((s) => {
          const li = document.createElement('li');
          li.textContent = s;
          list.appendChild(li);
        });
      }
      ml.hidden = false;
      ml.scrollIntoView({ block: 'center' });
      toast('MODE LIAR aktif — awas parkir liar, Mas.');
    }
  });
}

/* ---------- mode gerak ---------- */
function gerakAktif() { return document.documentElement.dataset.mode === 'penuh'; }

function deteksiRingan() {
  try {
    if (navigator.connection && navigator.connection.saveData) return true;
    if ((navigator.hardwareConcurrency || 8) <= 4) return true;
    if ((navigator.deviceMemory || 8) <= 4) return true;
  } catch (_) { /* diam */ }
  return false;
}

function ukurFps() {
  let n = 0;
  const mulai = performance.now();
  (function hitung() {
    n++;
    if (performance.now() - mulai < 2000) requestAnimationFrame(hitung);
    else if (n / 2 < 40) terapkanMode('ringan', true);
  })();
}

let modeManual = null;
function terapkanMode(m, otomatis) {
  const root = document.documentElement;
  if (otomatis && modeManual) return; // pilihan manual menang
  root.dataset.mode = m;
  MODUL.forEach((md) => { try { md.destroy(); md.init(); } catch (_) { /* diam */ } });
}

function pasangToggleGerak() {
  const t = $('#gerak-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hitung = () => {
    if (!t.checked) return 'mati';
    if (reduced.matches) return 'tenang';
    if (deteksiRingan()) return 'ringan';
    return 'penuh';
  };
  const terapkan = (otomatis) => {
    if (!otomatis) modeManual = t.checked;
    terapkanMode(hitung(), otomatis);
    t.setAttribute('aria-checked', String(t.checked));
  };
  t.addEventListener('change', () => terapkan(false));
  reduced.addEventListener('change', () => terapkan(true));
  t.checked = !reduced.matches;
  terapkan(true);
  ukurFps(); // fps <40 selama 2 detik → mode ringan otomatis
}

/* ---------- fakta ---------- */
function renderFakta() {
  const ul = $('#fakta-list');
  FAKTA.forEach((f) => {
    const li = document.createElement('li');
    li.textContent = f;
    ul.appendChild(li);
  });
  const band = $('#marquee-b .marquee-seg');
  if (band) {
    band.innerHTML = '';
    KOTA.forEach((k) => {
      const s = document.createElement('span');
      s.className = 'mq-item';
      s.textContent = k.nama.toUpperCase();
      band.appendChild(s);
    });
    FAKTA.forEach((f) => {
      const s = document.createElement('span');
      s.className = 'mq-item mq-fakta';
      s.textContent = f;
      band.appendChild(s);
    });
  }
}

/* ---------- init ---------- */
function pasangEvent() {
  $('#durasi-range').addEventListener('input', (ev) => {
    state.jam = Number(ev.target.value);
    $('#durasi-nilai').textContent = state.jam + ' jam';
    perbaruiEstimasi();
  });
  ['#jam-masuk', '#jam-keluar'].forEach((s) => $(s).addEventListener('change', perbaruiEstimasi));
  $$('input[name="kendaraan"]').forEach((r) => r.addEventListener('change', (ev) => {
    state.kendaraan = ev.target.value;
    perbaruiEstimasi();
  }));
  $('#zona').addEventListener('change', (ev) => {
    state.zonaIdx = Number(ev.target.value);
    perbaruiEstimasi();
  });
  $('#cetak').addEventListener('click', cetak);
  $('#salin-wa').addEventListener('click', salinWA);
  $('#unduh-json').addEventListener('click', unduhJSON);
  $('#riwayat-hapus').addEventListener('click', () => {
    try { localStorage.removeItem(LS_KEY); } catch (_) { /* diam */ }
    renderRiwayat();
    toast('Riwayat dikosongkan, Mas.');
  });
  const lapor = $('#lapor-liar');
  if (lapor) lapor.addEventListener('click', () => toast('Laporan dicatat (contoh). Hubungi Dishub kota setempat, Mas.'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) MODUL.forEach((md) => { try { md.destroy(); } catch (_) { /* diam */ } });
    else terapkanMode(document.documentElement.dataset.mode || 'penuh', true);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderKota();
  renderFakta();
  renderRiwayat();
  pasangEvent();
  pasangEasterEgg();
  pasangToggleGerak(); // ini juga init semua modul gerak
  bacaDeepLink();
  perbaruiEstimasi();
});
