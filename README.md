# Absensi PT. CTi

Aplikasi Absensi Karyawan.

## Fitur
- Geolokasi untuk Absensi (Check-in/Check-out)
- Dashboard Kehadiran Karyawan
- Manajemen Permohonan & Notifikasi

## Tech Stack
- React
- TypeScript
- Tailwind CSS
- Vite

## Backend (Express + MySQL)

Backend baru ditambahkan di folder `server/` menggunakan Express dan MySQL (mysql2), lengkap dengan:
- Autentikasi JWT (`register`, `login`)
- Absensi (`check-in` / `check-out`) dengan **validasi akurasi GPS** dan **geofencing radius kantor**
- Pengajuan Cuti/Izin/Sakit/Lembur
- Notifikasi
- Profil pengguna
- Data lokasi kantor untuk digambar sebagai radius di peta frontend

### 1. Setup Database

Pastikan MySQL/MariaDB sudah terpasang dan berjalan, lalu jalankan skema:

```bash
mysql -u root -p < server/schema.sql
```

> **Sudah pernah setup database sebelumnya dan mengalami error `Data too long for column 'photo_url'`?**
> Jalankan migrasi berikut (tidak perlu drop database, aman untuk data yang sudah ada):
> ```bash
> mysql -u root -p absensi_cti < server/migrations/001_widen_photo_url.sql
> ```

Ini akan membuat database `absensi_cti` beserta seluruh tabel yang dibutuhkan
(`users`, `attendance_records`, `requests`, `notifications`, dan `offices` yang bersifat opsional -
lihat bagian "Mode Teknisi Lapangan" di bawah).

### 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu sesuaikan bagian berikut:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=absensi_cti
JWT_SECRET=ganti_dengan_string_acak_yang_panjang
MAX_ACCURACY_METERS=75
VITE_API_URL=http://localhost:4000/api
```

### 3. Install dependency & jalankan backend

```bash
npm install
npm run server        # jalankan sekali
# atau
npm run server:dev    # auto-restart saat file berubah
```

Server akan berjalan di `http://localhost:4000`, dan health-check tersedia di `GET /api/health`.

### 4. Jalankan frontend

```bash
npm run dev
```

Frontend (Vite) akan otomatis memanggil backend melalui `VITE_API_URL` di file `.env`.

### Mode Teknisi Lapangan (Tanpa Geofencing Kantor)

Secara default, aplikasi ini dikonfigurasi untuk **teknisi lapangan yang lokasi kerjanya berpindah-pindah**,
bukan absen dari satu kantor tetap. Artinya:

- `ENABLE_GEOFENCING=false` (default) → lokasi GPS teknisi (latitude, longitude, akurasi) **direkam apa adanya**,
  tidak dibatasi harus berada dalam radius kantor tertentu.
- Yang tetap divalidasi hanya **akurasi GPS** (`MAX_ACCURACY_METERS`), supaya titik koordinat yang tersimpan valid dan tidak melenceng jauh.
- Di setiap titik lokasi yang tersimpan, aplikasi menggambarkan **lingkaran radius akurasi GPS** (bukan radius kantor)
  langsung di peta halaman Absen maupun Riwayat, sehingga terlihat jelas seberapa presisi titik tersebut.

Jika suatu saat ingin mengaktifkan pembatasan radius dari satu titik referensi (mis. kantor pusat/gudang),
set `ENABLE_GEOFENCING=true` di `.env` dan isi data pada tabel `offices` (lihat `server/schema.sql`).

### Fitur Akurasi & Tampilan GPS

- Saat absen, aplikasi menggunakan `watchPosition` (bukan sekadar `getCurrentPosition` sekali saja)
  untuk terus menyempurnakan akurasi GPS hingga ±20 m atau maksimal 8 detik, mana yang lebih dulu tercapai.
- Backend menolak absen jika akurasi GPS lebih buruk dari `MAX_ACCURACY_METERS` (default 75 m).
  Pembatasan radius kantor bersifat opsional (lihat bagian "Mode Teknisi Lapangan" di atas).
- Halaman Absen menampilkan **peta langsung (live)** begitu lokasi ditemukan, dengan label kualitas akurasi
  (Akurat/Cukup Akurat/Kurang Akurat) dan **lingkaran radius akurasi GPS** di titik lokasi teknisi saat itu.
- Data lat/lng/akurasi tiap absen tersimpan permanen di tabel `attendance_records`, dan bisa dilihat kembali
  lengkap dengan peta radiusnya di halaman Riwayat.

### Struktur API

| Method | Endpoint                     | Keterangan                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/auth/register`          | Daftar akun baru                     |
| POST   | `/api/auth/login`             | Login, mengembalikan JWT             |
| GET    | `/api/auth/me`                | Data user dari token                 |
| GET    | `/api/attendance/today`       | Status absen hari ini                |
| GET    | `/api/attendance/history`     | Riwayat absensi                      |
| POST   | `/api/attendance/checkin`     | Absen masuk (lat, lng, accuracy, photoUrl) |
| POST   | `/api/attendance/checkout`    | Absen pulang                         |
| GET    | `/api/requests`               | Daftar pengajuan                     |
| POST   | `/api/requests`                | Kirim pengajuan baru                 |
| GET    | `/api/notifications`          | Daftar notifikasi                    |
| PATCH  | `/api/notifications/:id/read` | Tandai notifikasi dibaca             |
| GET    | `/api/profile`                | Ambil profil                         |
| PATCH  | `/api/profile`                | Perbarui profil                      |
| GET    | `/api/office`                 | Lokasi & radius geofencing kantor    |
