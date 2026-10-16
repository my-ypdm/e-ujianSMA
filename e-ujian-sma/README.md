# E-Ujian SMA Dua Mei — Portal GitHub Pages

Static multi-page prototype:
- `index.html`: beranda
- `kelas.html`: pilihan Kelas X, XI, XII
- `mapel.html`: daftar mata pelajaran berdasarkan kelas
- `kelas-spesifik.html`: pilihan kelas/kelompok yang membuka URL Web App
- `assets/style.css`: desain responsif
- `assets/app.js`: daftar mapel dan pemetaan URL Web App

## Sebelum dipublikasikan
1. Periksa dan sesuaikan daftar mata pelajaran pada `assets/app.js` dengan daftar resmi sekolah.
2. Isi objek `WEB_APP_URLS` dengan URL deployment Apps Script yang benar. Format kunci: `KELAS|MAPEL|KELAS_SPESIFIK`.
3. Untuk Kelas X contoh targetnya `X.1`, `X.2`, `X.3`. Untuk Kelas XI/XII, prototype menggunakan `Sains` dan `Sosial` sebagai target pilihan; sesuaikan jika struktur kelas sebenarnya berbeda.
4. Uji seluruh jalur sebelum dibagikan ke siswa. Link Web App sengaja belum diisi.
5. Publikasikan repository melalui Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

Tidak ada data siswa, token, atau rahasia yang disimpan di file portal. URL Web App yang dipasang di sini adalah tautan navigasi, bukan pengganti pengamanan di backend Apps Script.

## Aset gambar
Gambar yang disediakan untuk portal telah ditempatkan di `assets/images/` dan dioptimalkan ke format JPG:
- `hero-e-ujian.jpg` — banner beranda.
- `background-sekolah.jpg` — latar visual sekolah (tersedia untuk halaman lanjutan).
- `kelas-x.jpg`, `kelas-xi.jpg`, `kelas-xii.jpg` — kartu pilihan kelas.

Semua path gambar menggunakan path relatif agar dapat berjalan saat dipublikasikan melalui GitHub Pages.
