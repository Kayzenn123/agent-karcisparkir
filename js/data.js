/* KarcisParkir — data tarif CONTOH sesuai perda (per 21 Okt 2026).
   Angka-angka di bawah ini contoh untuk demo; yang di lapangan bisa beda. */
export const EASTER_EGG = 'nuthuk';

export const KOTA = [
  {
    slug: 'jakarta', nama: 'Jakarta',
    zona: [
      { nama: 'TJU on-street',
        motor: { jam1: 2000, berikut: 2000, satuan: 'jam' },
        mobil: { jam1: 5000, berikut: 5000, satuan: 'jam' } }
    ],
    sumber: 'Pergub 31/2017 + Perda 1/2024',
    catatan: 'Contoh — flat per jam.'
  },
  {
    slug: 'surabaya', nama: 'Surabaya',
    zona: [
      { nama: 'TJU',
        motor: { jam1: 2000, berikut: 0, satuan: 'parkir' },
        mobil: { jam1: 5000, berikut: 0, satuan: 'parkir' } }
    ],
    sumber: 'Dishub Surabaya',
    catatan: 'Contoh — flat sekali parkir.'
  },
  {
    slug: 'bandung', nama: 'Bandung',
    zona: [
      { nama: 'Pusat',
        motor: { jam1: 3000, berikut: 3000, satuan: 'jam' },
        mobil: { jam1: 5000, berikut: 5000, satuan: 'jam' } },
      { nama: 'Penyangga',
        motor: { jam1: 2000, berikut: 2000, satuan: 'jam' },
        mobil: { jam1: 4000, berikut: 4000, satuan: 'jam' } }
    ],
    sumber: 'Perwal 66/2021',
    catatan: 'Contoh — pilih zona dulu, Mas.'
  },
  {
    slug: 'yogyakarta', nama: 'Yogyakarta',
    zona: [
      { nama: 'Kawasan 1 (Malioboro)',
        motor: { jam1: 2000, jam1Durasi: 2, berikut: 1500, satuan: 'jam' },
        mobil: { jam1: 5000, jam1Durasi: 2, berikut: 2500, satuan: 'jam' } },
      { nama: 'Kawasan 2/3',
        motor: { jam1: 2000, berikut: 0, satuan: 'parkir' },
        mobil: { jam1: 5000, berikut: 0, satuan: 'parkir' } }
    ],
    sumber: 'Sumber tunggal — label contoh',
    catatan: 'Contoh — Kawasan 1: tarif 2 jam pertama, selebihnya per jam.'
  },
  {
    slug: 'semarang', nama: 'Semarang',
    zona: [
      { nama: 'Zona A',
        motor: { jam1: 2000, berikut: 2000, satuan: 'jam' },
        mobil: { jam1: 3000, berikut: 3000, satuan: 'jam', progresif: 1000, maksPerJam: 4000 } }
    ],
    sumber: 'Dishub Semarang',
    catatan: 'Contoh — mobil progresif s.d. Rp4.000/jam.'
  },
  {
    slug: 'medan', nama: 'Medan',
    zona: [
      { nama: 'TJU',
        motor: { jam1: 2000, berikut: 0, satuan: 'parkir' },
        mobil: { jam1: 4000, berikut: 0, satuan: 'parkir' } }
    ],
    sumber: 'Perwal 9/2026',
    catatan: 'Contoh — flat sekali parkir, tarif turun 2026.'
  }
];

export const FAKTA = [
  'Wacana tarif Rp60.000/jam di Jakarta batal — jangan percaya broadcast WA.',
  'Medan menurunkan tarif parkir 2026 lewat Perwal 9/2026.',
  'Viral: ada yang bayar Rp350.000 untuk parkir 1,5 jam di Jogja.',
  'Sanksi parkir liar di Jogja: kurungan maks 3 bulan atau denda s.d. Rp50 juta.',
  'Tarif bus resmi Bandung Rp7.000/jam — pungli Rp50–65 ribu itu liar.'
];

export const SANKSI_LIAR = [
  'Kurungan maks 3 bulan (contoh: aturan Jogja).',
  'Denda s.d. Rp50 juta (contoh: aturan Jogja).',
  'Juru parkir liar bisa ditertibkan Dishub + Satpol PP.',
  'Selalu minta karcis resmi bernomor — tanpa karcis, jangan bayar.'
];
