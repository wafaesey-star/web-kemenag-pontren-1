# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Sistem Pendataan Pondok Pesantren Tingkat Kabupaten**

| Atribut | Detail |
|---|---|
| Versi Dokumen | 1.0 |
| Tanggal | 24 September 2026 |
| Status | Draft untuk Diskusi |
| Sumber | Draft Kebutuhan Awal Sistem Pendataan Pesantren |
| Pemilik Produk | Kementerian Agama (Kemenag) Kabupaten |

---

## 1. Ringkasan Produk

Sistem web terpusat untuk pendataan pondok pesantren di tingkat kabupaten. Sistem ini menjadi pusat data pesantren yang rapi, update, aman, dan mudah diverifikasi — mencakup profil kelembagaan, legalitas/IJOP, data santri, tenaga pendidik, sarpras, verifikasi, dashboard, laporan, dan peta sebaran.

**Masalah yang dipecahkan:**
- Data pesantren tersebar dan sulit diverifikasi
- Legalitas pesantren sulit dipantau
- Rekapitulasi santri, ustadz, dan sarpras memakan waktu
- Penyusunan laporan resmi Kemenag manual
- Penyaluran bantuan kurang basis data akurat

---

## 2. Tujuan Produk

1. Menyimpan data profil pesantren secara terpusat
2. Membantu Kemenag memverifikasi dan memvalidasi data pesantren
3. Menyediakan rekap data jumlah pesantren, santri, ustadz, dan sarpras
4. Menampilkan pemetaan lokasi pesantren
5. Mempermudah penyusunan laporan resmi
6. Memberikan akses operator pesantren untuk memperbarui data sesuai kewenangan
7. Memungkinkan Kemenag mengelola akun operator secara penuh

**Metrik Keberhasilan (Usulan):**
- 100% pesantren terdata dengan profil lengkap
- Rata-rata waktu verifikasi data < 3 hari kerja
- Laporan resmi dapat dihasilkan dalam < 5 menit
- Data legalitas selalu up-to-date dengan notifikasi kedaluwarsa

---

## 3. Ruang Lingkup

**Termasuk (In Scope):**
- Pengelolaan data pesantren (profil, legalitas, santri, pendidik, sarpras)
- Proses verifikasi oleh Kemenag (draft → diajukan → diverifikasi → disetujui/ditolak)
- Dashboard dan laporan (Excel/PDF)
- Peta sebaran pesantren
- Manajemen pengguna, role, dan operator pesantren

**Tidak Termasuk (Out of Scope) — MVP:**
- Integrasi dengan EMIS pusat (belum dikonfirmasi)
- Notifikasi email/WhatsApp (prioritas rendah)
- Mobile app native (prioritas rendah)
- Direktori publik (opsional)

---

## 4. Pengguna & Peran

### 4.1 Super Admin / Kemenag Kabupaten
Mengelola seluruh data pesantren; membuat & mengatur akun operator; menetapkan operator ke pesantren; memverifikasi data; memantau legalitas; melihat rekap, laporan, dan peta; mengelola seluruh akun pengguna.

### 4.2 Operator Pesantren
Mengisi dan memperbarui data pesantren yang **ditugaskan kepadanya**; upload dokumen legalitas; mengirim data untuk verifikasi; melihat status pengajuan; memperbaiki data jika ditolak.

**Keterbatasan wajib:**
- Hanya dapat mengakses pesantren yang ditugaskan oleh Kemenag
- Tidak dapat membuat pesantren baru secara mandiri
- Tidak dapat mengakses data pesantren lain

### 4.3 Public / Pengunjung (Opsional)
Melihat direktori pesantren resmi, mencari pesantren, melihat lokasi di peta.

---

## 5. Kebutuhan Fungsional

### F-01 Autentikasi & User Management
- Login/logout
- CRUD akun pengguna
- Role-based access control (RBAC)
- Aktivasi/nonaktifkan akun
- Reset password

### F-02 Manajemen Operator Pesantren (Kemenag)
- Membuat akun operator; menetapkan operator ke pesantren tertentu
- Ubah data operator; nonaktifkan akun; reset password
- Daftar seluruh operator (aktif & nonaktif)
- Pembatasan akses operator hanya pada pesantren terkait
- Satu pesantren dapat memiliki satu atau lebih operator
- Perubahan penugasan operator tercatat di sistem

### F-03 Profil Pesantren
Field: nama pesantren, NSPP (jika ada), alamat lengkap, kecamatan, desa, kontak telepon/email, nama pimpinan, tahun berdiri, tipe pesantren, status keaktifan, koordinat lokasi.

### F-04 Legalitas/IJOP
Field: nomor IJOP, tanggal terbit, tanggal berakhir, status legalitas, upload dokumen pendukung, riwayat perubahan legalitas. Notifikasi izin akan kedaluwarsa (prioritas menengah).

### F-05 Data Santri (ringkasan)
Jumlah santri laki-laki, perempuan; santri mukim & non-mukim; santri asal lokal kabupaten & luar kabupaten; tahun ajaran/semester data.

### F-06 Tenaga Pendidik
Jumlah ustadz, ustadzah, kualifikasi pendidikan, status tenaga pendidik.

### F-07 Sarpras
Luas tanah, luas bangunan, jumlah asrama, ruang belajar, mushola/masjid, toilet/sanitasi, status kepemilikan tanah, kelayakan bangunan.

### F-08 Verifikasi (workflow)
```
Draft → Diajukan → Diverifikasi → Disetujui
                              ↘ Ditolak (dengan catatan revisi) → kembali ke Draft
```
Kemenag dapat: melihat data masuk, memeriksa kelengkapan, menyetujui, menolak, memberi catatan revisi.

### F-09 Dashboard
Total pesantren, total santri, total tenaga pendidik, pesantren per kecamatan, status legalitas, grafik sederhana, notifikasi penting.

### F-10 Laporan
Rekap data, filter berdasarkan wilayah, export ke Excel dan PDF.

### F-11 Peta
Tampilkan lokasi pesantren di peta, filter kecamatan, klik marker untuk detail singkat. Menggunakan open-source map (mis. OpenStreetMap/Leaflet).

---

## 6. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Keamanan** | Autentikasi pengguna, RBAC, pembatasan akses operator per pesantren, audit log, proteksi data sensitif, backup berkala |
| **Kemudahan** | Tampilan sederhana, responsif HP & laptop, form input tidak rumit, status progres pengisian, pesan error jelas |
| **Kinerja** | Pencarian cepat, filter cepat, dashboard ringan, export stabil |
| **Ketersediaan** | Berbasis web, akses user terotorisasi, stabil untuk penggunaan dinas |

---

## 7. Prioritas Fitur

| Prioritas | Fitur |
|---|---|
| **Tinggi (MVP)** | Login multi-role; manajemen operator; profil pesantren; legalitas; data santri; tenaga pendidik; sarpras; verifikasi Kemenag; dashboard rekap; export Excel/PDF |
| **Menengah** | Peta sebaran; notifikasi kedaluwarsa IJOP; audit log detail; filter lanjutan |
| **Rendah (Opsional)** | Direktori publik; notifikasi email/WhatsApp; integrasi sistem lain; mobile app |

---

## 8. Asumsi Awal

- Data dikelola di tingkat kabupaten
- Akun operator dibuat dan dikelola oleh Kemenag
- Operator hanya mengelola pesantren yang ditugaskan kepadanya
- Kemenag adalah verifier utama
- Sistem berbasis web
- Data dapat diperbarui berkala
- Peta menggunakan open-source map

---

## 9. Risiko & Kendala

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Belum jelas integrasi dengan EMIS pusat | Arsitektur bisa berubah total | Konfirmasi ke client sebelum fase desain |
| Field wajib belum ditentukan | Validasi form bisa berubah | Buat field konfigurabel dari awal |
| Operator minim literasi digital | Data tidak lengkap/telat | Form sederhana, ada status progres, training |
| Data historis per tahun ajaran belum pasti | Skema DB perlu desain ulang | Desain tabel data dengan kolom periode sejak awal |
| Kemenag mungkin perlu edit setelah disetujui | Alur verifikasi jadi bingung | Definisikan status "revisi pasca-approval" eksplisit |

---

## 10. Open Questions (Perlu Konfirmasi Client)

1. Apakah sistem terintegrasi dengan EMIS pusat atau berdiri sendiri?
2. Data apa saja yang wajib diisi pesantren?
3. Apakah satu pesantren boleh memiliki lebih dari satu operator?
4. Apakah satu operator boleh mengelola lebih dari satu pesantren?
5. Apakah perlu upload dokumen legalitas?
6. Apakah perlu direktori publik?
7. Apakah perlu notifikasi otomatis?
8. Format laporan apa yang biasa dipakai Kemenag?
9. Apakah data historis perlu disimpan per tahun ajaran?
10. Apakah Kemenag ingin tetap bisa mengedit data pesantren setelah disetujui?

---

## 11. User Story Ringkas (MVP)

**Sebagai Kemenag, saya ingin...**
- membuat akun operator dan menugaskannya ke pesantren, agar data diisi langsung oleh pihak pesantren
- memverifikasi data yang diajukan dengan catatan revisi, agar data valid dan terdokumentasi
- melihat dashboard rekap per kecamatan, agar bisa memantau sebaran dan legalitas
- export laporan Excel/PDF, agar penyusunan laporan resmi cepat

**Sebagai Operator Pesantren, saya ingin...**
- mengisi data santri, pendidik, dan sarpras dengan form sederhana, agar tidak kesulitan
- melihat status progres pengisian, agar tahu bagian mana yang belum lengkap
- mengetahui alasan penolakan dengan jelas, agar bisa memperbaiki dengan cepat
- mendapat notifikasi IJOP akan kedaluwarsa, agar legalitas tetap terjaga
