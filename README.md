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

> **Update penting:** Jika kamu meng-update dari versi sebelumnya dan mengalami status absen yang
> tidak berubah ("Belum Masuk" terus padahal sudah absen), itu karena bug timezone pada driver MySQL
> yang membuat tanggal absen "geser satu hari" saat dibaca kembali - sudah diperbaiki di `server/db.js`
> dan `server/utils/date.js`. Cukup tarik kode terbaru dan restart server (`npm run server`),
> **tidak perlu** menjalankan migrasi database apapun untuk perbaikan ini.

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


## Struktur API SystemWork CTI

### Auth
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Public| POST   | `/api/auth/register`| Daftar Akun Baru Untuk Karyawan |
|Public| POST   | `/api/auth/login`| Login Mengembalikan JWT  |
|Admin| POST   | `/api/hrd/admins/register`| Daftar Admin Baru di halaman dashboard  |
|Public| POST   | `/api/auth/login-admin`| Login untuk Admin mengembalikan JWT  |
| - | GET    | `/api/auth/me`                | Data user dari token                 |
---

### Rumah Sakit
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin| GET   | `/api/hrd/hospitals`| Menampilkan Data Rumah Sakit  |
|Karyawan| GET   | `/api/attendance/locations`| Menampilkan Data Rumah Sakit Untuk Absensi  |
|Admin| POST   | `/api/hrd/hospitals`| Menambahkan data Rumah Sakit  |
|Admin| PUT   | `/api/hrd/hospitals/:id`| Mengedit data rumah Sakit  |
|Admin| DELETE   | `/api/hrd/hospitals/:id`| Menghapus data rumah Sakit  |
---

### Divisi/Departments
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Karyawan| GET   | `/api/auth/departments`| Menampilkan Data Departments/Divis yang tersedia  |
|Admin| POST   | `/api/hrd/departments`| Menambahkan Data Divisi/Department  |
|Admin| PUT   | `/api/hrd/departments/:id`| Mengedit Divisi/Department  |
|Admin| DELETE   | `/api/hrd/departments/:id`| Menghapus Divisi/Department  |

### Posisi
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Karyawan| GET   | `/api/auth/positions`| Menampilkan Data Posisi Yang Tersedia  |
|Admin| POST   | `/api/hrd/positions`| Menambahkan Posisi   |
|Admin| PUT   | `/api/hrd/positions/:id`| Mengedit Posisi Seperti nama dll   |
|Admin| DELETE   | `/api/hrd/positions/:id`| Menghapus Posisi   |

### Absen/Attendance
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin| GET   | `/api/hrd/attendance`| Menampilkan Data Absen aktif Karyawan  |
|Karyawan| POST   | `/api/hrd/attendance/checkin`| Digunakan Saat Check-in Absensi Masuk   |
|Karyawan| POST   | `/api/hrd/attendance/checkout`| Digunakan Saat Check-out Absensi Keluar   |

### Manajemen Data Karyawan
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin| GET   | `/api/hrd/employees`| Menampilkan Data karyawan, dan dapat menggunakan params key: 'name' dan value: 'nama_kryawan' |
|Admin| PUT   | `/api/hrd/employees/:id`| Mengedit Data Karyawan mulai dari jam_masuk, jam_keluar, id_departments, id_positions   |
|Admin| DELETE   | `/api/hrd/employees/:id`| Menghapus karyawan berdasarkan Id   |

### Profile
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Karyawan| GET   | `/api/profile`| Menampilkan data profile karyawan tersebut  |
|Karyawan| PUT   | `/api/profile`| Mengedit data profile karyawan tersebut  |

### Perizinan
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin| GET   | `/api/hrd/leaves`| Menampilkan Data Permintaan Cuti/Izin  |
|Admin| PATCH  | `/api/hrd/leaves/:id/approval`| Mengubah Status Permintaan Cuti/Izin|

### Dashboard HRD
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin|  GET  | `/api/hrd/dashboard/overview`| Menampilkan Data Dashboard Untuk HRD |
---

### WIP(Work In Progress) API General

| Method | Endpoint                     | Keterangan                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/api/auth/me`                | Data user dari token                 |
| GET    | `/api/attendance/today`       | Status absen hari ini                |
| GET    | `/api/attendance/history`     | Riwayat absensi                      |
| GET    | `/api/requests`               | Daftar pengajuan                     |
| POST   | `/api/requests`               | Kirim pengajuan baru                 |
| GET    | `/api/notifications`          | Daftar notifikasi                    |
| PATCH  | `/api/notifications/:id/read` | Tandai notifikasi dibaca             |
| GET    | `/api/office`                 | Lokasi & radius geofencing kantor    |
