# Catatan Asumsi & Keputusan Teknis (`docs/assumptions.md`)

Dokumen ini mencatat asumsi terhadap 10 *Open Questions* pada `prd.md` §10 dan batasan platform Firebase Spark agar arsitektur tetap fleksibel dan dapat dikonfigurasi Kemenag Kabupaten.

| # | Topik PRD (§10) | Asumsi & Implementasi | Cara Mengubah / Konfigurasi |
|---|---|---|---|
| 1 | Integrasi EMIS pusat | Berdiri sendiri (*standalone*) tanpa pemanggilan API EMIS eksternal pada tahap ini; struktur NSPP dan ekspor Excel disiapkan kompatibel untuk impor/rekonsiliasi manual. | Tambah adapter ekspor/API bila spesifikasi EMIS resmi tersedia. |
| 2 | Field wajib pesantren | Field inti minimal wajib: `nama`, `kecamatan`, `desa`, `alamat`, `namaPimpinan`, `tipe`, dan `statusKeaktifan`. Field pelengkap seperti NSPP atau dokumen IJOP dicatat progresnya per bagian. | Konfigurabel melalui dokumen `system_config/default` (`requiredProfileFields`). |
| 3 | Multi-operator per pesantren | Diizinkan secara default (hingga 10 operator aktif per pesantren, sesuai batas aman array Firestore Rules). | Atur `allowMultiOperatorPerPesantren` pada `system_config/default`. |
| 4 | Satu operator mengelola > 1 pesantren | Diizinkan secara default melalui penugasan berbasis relasi `operator_assignments` (`operatorEmail` ↔ `pesantrenId`), dan dapat dibatasi menjadi 1 pesantren per operator lewat pengaturan Kemenag. | Atur `allowMultiPesantrenPerOperator` pada `system_config/default`. |
| 5 | Upload dokumen legalitas (IJOP) | Karena paket **Firebase Spark** hanya menggunakan Firestore (batas 1 MiB/dokumen, tanpa Firebase Storage), dokumen IJOP disimpan sebagai metadata terstruktur + tautan URL arsip resmi (`https://`) yang disanitasi, disertai riwayat perubahan *append-only*. | Aktifkan bucket Firebase Storage (jika upgrade ke Blaze) untuk unggah biner langsung. |
| 6 | Direktori publik | Diaktifkan melalui koleksi proyeksi terpisah (`public_pesantren`) yang **hanya** memuat data non-sensitif pesantren berstatus `disetujui` dan `aktif`, sehingga kontak pribadi dan dokumen IJOP tetap tertutup. | Dapat dimatikan melalui `publicDirectoryEnabled` di `system_config/default`. |
| 7 | Notifikasi otomatis | Notifikasi kedaluwarsa IJOP (≤ 90 hari atau sudah habis) dihitung langsung pada dashboard Kemenag dan portal operator tanpa gateway email/WhatsApp berbayar. | Tambahkan Cloud Function/webhook jika nanti tersedia gateway email/WA. |
| 8 | Format laporan Kemenag | Menyediakan ekspor langsung **Excel (`.xlsx`)** dan **PDF siap cetak** dengan header resmi Kemenag Kabupaten serta filter berdasarkan kecamatan, periode/tahun ajaran, dan status legalitas. | Sesuaikan template kolom di modul ekspor sesuai format baku daerah. |
| 9 | Data historis per tahun ajaran | Data santri, tenaga pendidik, dan sarpras disimpan per kombinasi `(pesantrenId, tahunAjaran)` di koleksi `data_periodik` sejak awal agar histori tahunan tetap utuh. | Periode aktif default diatur di `system_config/default` (`activePeriode`). |
| 10 | Edit setelah disetujui Kemenag | Secara default Kemenag dapat mengembalikan status `disetujui` ke `draft` untuk revisi pasca-approval bila `allowPostApprovalEdit` aktif, dan seluruh perubahan tercatat di `verifikasi_logs` serta `audit_logs`. | Toggle `allowPostApprovalEdit` di `system_config/default`. |

## Catatan Autentikasi (Google Sign-In + Pra-Registrasi Email)

- Lingkungan Firebase di workspace ini mengaktifkan penyedia **Google Sign-In**.
- Untuk memenuhi syarat PRD §4.2 (operator **tidak dapat** mendaftar mandiri atau membuat pesantren baru), Kemenag mendaftarkan alamat email Google operator pada `operator_invites` dan menugaskannya ke pesantren tertentu. Saat operator login via Google Sign-In, sistem menghubungkan UID ke profil `users` dan penugasan aktif secara otomatis.
