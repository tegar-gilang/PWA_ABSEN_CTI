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


### Auth (Autentikasi)

#### 1. Auth (Autentikasi)

**`POST` /api/auth/register**
* **Akses:** Public
* **Keterangan:** Daftar Akun Baru Untuk Karyawan.
* **Request Body (JSON):**
  ```json
  {
      
    "nik": "32712",
    "name": "Gilang",
    "email": "gilang@gmail.com",
    "password": "test123",
    "phone": "08128162312",
    "id_department": "1",
    "id_position": "1"

  }

#### 2. Login (Autentikasi)

**`POST` /api/auth/login**
* **Akses:** Public
* **Keterangan:** Login karyawan, mengembalikan token JWT.
* **Request Body (JSON):**
  ```json
  {
      
    "email": "gilang@gmail.com",
    "password": "test123"

  }

#### 3. Register Admin (Autentikasi)

**`POST` /api/hrd/register**
* **Akses:** Admin
* **Keterangan:** Daftar Admin Baru, mengembalikan token JWT.
* **Request Body (JSON):**
  ```json
  {
    "name": "admin",
    "email": "admin@gmail.com",
    "nik": "3275",
    "password": "admin123"
  }

#### 4. Login Admin (Autentikasi)

**`POST` /api/auth/login-admin**
* **Akses:** Public
* **Keterangan:** Login Admin, mengembalikan token JWT.
* **Request Body (JSON):**
  ```json
  {
    "email": "gesa@gmail.com",
    "password": "test123"
  }

---

## Rumah Sakit

#### 1. Add Rumah Sakit

**`POST` /api/hrd/hospitals**
* **Akses:** Admin
* **Keterangan:** Tambah Rumah Sakit Baru.
* **Request Body (JSON):**
  ```json
  {
    "nama_rs": "RSUD Margono Soekarjo",
    "address": "Jl. Dr. Gumbreg No.1, Purwokerto",
    "latitude": -7.4347712,
    "longitude": 109.2687584,
    "radius_meters": 200
  }

#### 2. Lihat List Rumah Sakit

**`GET` /api/hrd/hospitals**
* **Akses:** Admin
* **Keterangan:** Lihat List Rumah Sakit.
* **Response Body (JSON):**
  ```json
  {
      "hospitals": [
          {
              "id": "55cdc6a7-8b01-452e-98f9-5a5d6943642b",
              "nama_rs": "RSUD Margono Soekarjo",
              "name": "RSUD Margono Soekarjo",
              "address": "Jl. Dr. Gumbreg No.1, Purwokerto",
              "latitude": -7.4347712,
              "longitude": 109.2687584,
              "radius_meters": 200
          }
      ]
  }

#### 3. Edit Data Rumah Sakit

**`PUT` /api/hrd/hospitals/:id**
* **Akses:** Admin
* **Keterangan:** Edit Data Rumah Sakit.
* **Request Body (JSON):**
  ```json
  {
      "nama_rs": "RS Siloam Semanggi",
      "address": " Jalan Garnisun 1 No.2-3 5, RT.5/RW.4, Karet Semanggi, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12930",
      "latitude": -6.2187924,
      "longitude": 106.817268,
      "radius_meters": 200
  }

#### 4. Delete Data Rumah Sakit

**`DELETE` /api/hrd/hospitals/:id**
* **Akses:** Admin
* **Keterangan:** Delete Rumah Sakit.
* **Response Body (JSON):**
  ```json
  {
      "message": "Rumah sakit berhasil dihapus."
  }

#### 5. Lokasi Tugas Rumah Sakit

**`GET` /api/attendance/locations**
* **Akses:** Karyawan
* **Keterangan:** Lokasi Tugas Rumah Sakit.
* **Response Body (JSON):**
  ```json
  {
      "locations": [
          {
              "id": "55cdc6a7-8b01-452e-98f9-5a5d6943642b",
              "nama_rs": "RS Siloam Semanggi",
              "latitude": -6.2187924,
              "longitude": 106.817268,
              "radius_meters": 200
          }
      ]
  }

---

## Departments

#### 1. Add Departments

**`POST` /api/hrd/departments**
* **Akses:** Admin
* **Keterangan:** Tambah Divisi Baru.
* **Request Body (JSON):**
  ```json
  {
      "name": "Human Resource"
  }

#### 2. Edit Departments

**`PUT` /api/hrd/departments:id**
* **Akses:** Admin
* **Keterangan:** Edit Divisi.
* **Request Body (JSON):**
  ```json
  {
      "name": "Web Dev"
  }

#### 3. List Departments

**`GET` /api/auth/departments**
* **Akses:** Karyawan
* **Keterangan:** Melihat Divisi.
* **Response Body (JSON):**
  ```json
  {
      "departments": [
          {
              "id": "1",
              "name": "IT"
          },
          {
              "id": "8099d4dc-f58a-458e-9a59-2e590e3bfcea",
              "name": "Operational"
          },
          {
              "id": "b446d273-4858-4c5f-92ae-39d622e60a10",
              "name": "Programmer"
          }
      ]
  }

#### 4. Delete Departments

**`DELETE` /api/auth/departments:id**
* **Akses:** Admin
* **Keterangan:** Menghapus Divisi.
* **Response Body (JSON):**
  ```json
  {
      "message": "Divisi berhasil dihapus."
  }

---

## Positions

#### 1. Add Positions

**`POST` /api/hrd/positions**
* **Akses:** Admin
* **Keterangan:** Tambah Posisi Baru.
* **Request Body (JSON):**
  ```json
  {
      "name": "HRD"
  }

#### 2. View Positions

**`GET` /api/auth/positions**
* **Akses:** Public
* **Keterangan:** Lihat Posisi .
* **Response Body (JSON):**
  ```json
  {
      "positions": [
          {
              "id": "bb1ce47c-c77e-48c9-816f-c140e979d987",
              "name": "HRD"
          },
          {
              "id": "1",
              "name": "Web Developer"
          }
      ]
  }

#### 3. Edit Positions

**`PUT` /api/hrd/positions/:id**
* **Akses:** Admin
* **Keterangan:** Edit Posisi .
* **Response Body (JSON):**
  ```json
  {
      "message": "Posisi berhasil diperbarui."
  }

#### 4. Delete Positions

**`DELETE` /api/hrd/positions/:id**
* **Akses:** Admin
* **Keterangan:** Hapus Posisi .
* **Response Body (JSON):**
  ```json
  {
      "message": "Posisi berhasil dihapus."
  }

---

## Attendance

#### 1. Checkin Attendance

**`POST` /api/attendance/checkin**
* **Akses:** Karyawan
* **Keterangan:** Absen Masuk.
* **Request Body (JSON):**
  ```json
  {
    "latitude": -6.2190313718557775,
    "longitude": 106.81737033538214,
    "hospital_id": "10e446c8-7f08-4cee-8457-dd4fa1281be2",
    "photo_url": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg"
  }
  
* **Response Body (JSON):**
  ```json
    {
        "message": "Check-in berhasil. Status: Terlambat",
        "status": "LATE",
        "record": {
            "id": "d6c4c0f8-c3da-4a37-8bec-85ec143cda5a",
            "date": "2026-09-10",
            "checkInTime": "2026-09-10T13:15:48.000Z",
            "checkOutTime": null,
            "status": "LATE",
            "workingHours": null,
            "hospitalId": "55cdc6a7-8b01-452e-98f9-5a5d6943642b",
            "customLocationName": null,
            "checkInLocation": {
                "lat": -6.2190314,
                "lng": 106.8173703,
                "accuracy": null
            },
            "checkOutLocation": null,
            "checkInPhotoUrl": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg",
            "checkOutPhotoUrl": null,
            "checkInDistanceMeters": 28.88,
            "checkOutDistanceMeters": null
        },
        "geo": {
            "distanceMeters": 28.880125684482827,
            "accuracyQuality": "GOOD"
        }
    }


#### 2. Checkout Attendance

**`POST` /api/attendance/checkout**
* **Akses:** Karyawan
* **Keterangan:** Absen Pulang.
* **Request Body (JSON):**
  ```json
  {
    "latitude": -6.2190313718557775,
    "longitude": 106.81737033538214,
    "hospital_id": "10e446c8-7f08-4cee-8457-dd4fa1281be2",
    "photo_url": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg"
  }
* **Response Body (JSON):**
  ```json
    {
      "message": "Check-out berhasil.",
      "working_hours": "0.06",
      "record": {
          "id": "d6c4c0f8-c3da-4a37-8bec-85ec143cda5a",
          "date": "2026-09-10",
          "checkInTime": "2026-09-10T13:15:48.000Z",
          "checkOutTime": "2026-09-10T13:19:11.000Z",
          "status": "LATE",
          "workingHours": 0.06,
          "hospitalId": "55cdc6a7-8b01-452e-98f9-5a5d6943642b",
          "customLocationName": null,
          "checkInLocation": {
              "lat": -6.2190314,
              "lng": 106.8173703,
              "accuracy": null
          },
          "checkOutLocation": {
              "lat": -6.2241367,
              "lng": 106.842338,
              "accuracy": null
          },
          "checkInPhotoUrl": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg",
          "checkOutPhotoUrl": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg",
          "checkInDistanceMeters": 28.88,
          "checkOutDistanceMeters": 2834.24
      },
      "geo": {
          "distanceMeters": 2834.235790034991,
          "accuracyQuality": "GOOD"
      }
   }


#### 3. All Attendances

**`GET` /api/hrd/attendance**
* **Akses:** Admin
* **Keterangan:** Lihat Absen Karyawan.
* **Response Body (JSON):**
  ```json
    {
      "records": [
          {
              "id": "d6c4c0f8-c3da-4a37-8bec-85ec143cda5a",
              "name": "Gilang",
              "position": "Web Developer",
              "email": "gilang@gmail.com",
              "status": "LATE",
              "checkInTime": "20:15",
              "checkOutTime": "20:19",
              "check_in_lat": -6.2190314,
              "check_in_lng": 106.8173703,
              "check_in_photo_url": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg",
              "check_out_lat": -6.2241367,
              "check_out_lng": 106.842338,
              "check_out_photo_url": "https://res.cloudinary.com/demo/image/upload/selfie-masuk.jpg",
              "date": "2026-09-10"
          }
      ]
    }

---

## Manajemen Data Karyawan

#### 1. Lihat Data Karyawan

**`GET` /api/hrd/employees**
* **Akses:** Admin
* **Keterangan:** Melihat Seluruh data karyawan.
* **Response Body (JSON):**
  ```json
  {
      "total": 1,
      "employees": [
          {
              "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
              "employeeId": "32712",
              "nik": "32712",
              "name": "Gilang",
              "email": "gilang@gmail.com",
              "phone": "08128162312",
              "address": null,
              "emergency_contact": null,
              "status_karyawan": "Aktif",
              "performance_status": "Good",
              "profile_photo_url": null,
              "department_name": "IT",
              "department": "IT",
              "position_name": "Web Developer",
              "position": "Web Developer",
              "jam_masuk": "08:00:00",
              "jam_keluar": "17:00:00",
              "schedule": "08:00 - 17:00",
              "hospital_id": null,
              "hospital_name": "-"
          }
      ],
      "data": [
          {
              "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
              "employeeId": "32712",
              "nik": "32712",
              "name": "Gilang",
              "email": "gilang@gmail.com",
              "phone": "08128162312",
              "address": null,
              "emergency_contact": null,
              "status_karyawan": "Aktif",
              "performance_status": "Good",
              "profile_photo_url": null,
              "department_name": "IT",
              "department": "IT",
              "position_name": "Web Developer",
              "position": "Web Developer",
              "jam_masuk": "08:00:00",
              "jam_keluar": "17:00:00",
              "schedule": "08:00 - 17:00",
              "hospital_id": null,
              "hospital_name": "-"
          }
      ]
  }

**`GET` /api/hrd/employees?name=Gilang**
* **Akses:** Admin
* **Keterangan:** Melihat data karyawan atas nama Gilang menggunakan params.
* **Response Body (JSON):**
  ```json
  {
      "total": 1,
      "employees": [
          {
              "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
              "employeeId": "32712",
              "nik": "32712",
              "name": "Gilang",
              "email": "gilang@gmail.com",
              "phone": "08128162312",
              "address": null,
              "emergency_contact": null,
              "status_karyawan": "Aktif",
              "performance_status": "Good",
              "profile_photo_url": null,
              "department_name": "IT",
              "department": "IT",
              "position_name": "Web Developer",
              "position": "Web Developer",
              "jam_masuk": "08:00:00",
              "jam_keluar": "17:00:00",
              "schedule": "08:00 - 17:00",
              "hospital_id": null,
              "hospital_name": "-"
          }
      ],
      "data": [
          {
              "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
              "employeeId": "32712",
              "nik": "32712",
              "name": "Gilang",
              "email": "gilang@gmail.com",
              "phone": "08128162312",
              "address": null,
              "emergency_contact": null,
              "status_karyawan": "Aktif",
              "performance_status": "Good",
              "profile_photo_url": null,
              "department_name": "IT",
              "department": "IT",
              "position_name": "Web Developer",
              "position": "Web Developer",
              "jam_masuk": "08:00:00",
              "jam_keluar": "17:00:00",
              "schedule": "08:00 - 17:00",
              "hospital_id": null,
              "hospital_name": "-"
          }
      ]
  }


#### 2. Edit Data Karyawan

**`PUT` /api/hrd/employees/:id**
* **Akses:** Admin
* **Keterangan:** Mengubah data karyawan berdasarkan id, data yang dapat diubah oleh HRD adalah hampir semua field nya.
* **Request Body (JSON):**
  ```json
  // Case Ubah Jam masuk dan keluar dan email
  {
    "email": "gilang@mail.com",
    "jam_masuk": "19:10:00",
    "jam_keluar": "21:00:00"
  }

#### 3. Delete Karyawan

**`DELETE` /api/hrd/employees/:id**
* **Akses:** Admin
* **Keterangan:** Menghapus Karyawan Berdasarkan id.
* **Response Body (JSON):**
  ```json
  {
      "message": "Karyawan berhasil dihapus."
  }

---

## Profile

#### 1. Seoarang Karyawan Lihat Profile Based on Token JWT

**`GET` /api/profile**
* **Akses:** Admin
* **Keterangan:** Seorang Karyawan Lihat Profile Berdasarkan Token.
* **Response Body (JSON):**
  ```json
  {
      "user": {
          "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
          "employeeId": "32712",
          "nik": "32712",
          "name": "Gilang",
          "department": null,
          "position": null,
          "phone": "08128162312",
          "email": "gilang@mail.com",
          "schedule": "Senin - Jumat, 09:00 - 17:00",
          "jamMasuk": "19:10",
          "jamKeluar": "21:00",
          "photoUrl": null,
          "emergencyContact": null,
          "role": "EMPLOYEE"
      }
  }


#### 2. Seoarang Karyawan Edit Profile Based on Token JWT

**`PUT` /api/profile**
* **Akses:** Admin
* **Keterangan:** Seorang Karyawan Edit Profile Berdasarkan Token.
* **Response Body (JSON):**
  ```json
  // Case 1 Update Semua Data
   {
     "name": "Jimmy",
     "nik": "3201012345678999",
     "email": "budi.update@cti.co.id",
     "address": "Jl. Kemerdekaan No. 45, Jakarta",
     "phone": "081299998888",
     "photo_url": "https://res.cloudinary.com/demo/image/upload/foto-budi-baru.jpg"
   }

  // Case 2 Update beberapa data doang
  {
      "address": "Jl. Gatot Subroto Jakarta Selatan"
  }

---

## Laporan

#### 1. Seoarang HRD Melihat Rekap Laporan Absen Perorangan Lebih Detail  Karyawan Berdasarkan id 

**`GET` /api/hrd/employee-report/:id**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat Rekap Seoarng Karyawan.
* **Response Body (JSON):**
  ```json
    {
      "employee": {
          "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
          "name": "Gilang",
          "employeeId": "32712",
          "department": "Staff",
          "position": "Staff",
          "email": "gilang@mail.com",
          "phone": "08128162312"
      },
      "summary": {
          "totalIzin": 0,
          "totalCuti": 0,
          "totalTelat": 1,
          "totalHadir": 0,
          "totalHariAktif": 1
      },
      "periode": "Periode Berjalan",
      "details": [
          {
              "date": "2026-09-10",
              "dayName": "Kamis",
              "category": "TERLAMBAT",
              "categoryLabel": "Terlambat Masuk",
              "keterangan": "Check-in pukul 20:15",
              "status": "Tercatat di Sistem"
          }
      ],
      "incidentDetails": [
          {
              "date": "2026-09-10",
              "dayName": "Kamis",
              "category": "TERLAMBAT",
              "categoryLabel": "Terlambat Masuk",
              "keterangan": "Check-in pukul 20:15",
              "status": "Tercatat di Sistem"
          }
      ]
   }

#### 1.1 Seoarang HRD Melihat Rekap Laporan Absen Perorangan Lebih Detail  Karyawan Berdasarkan id dan tanggal

**`GET` /api/hrd/employee-report/:id?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat Rekap Seoarng Karyawan berdasarkan periode tanggal menggunakan params startDate dan endDate format YYYY-MM-DD.
* **Response Body (JSON):**
  ```json
    {
      "employee": {
          "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
          "name": "Gilang",
          "employeeId": "32712",
          "department": "Staff",
          "position": "Staff",
          "email": "gilang@mail.com",
          "phone": "08128162312"
      },
      "summary": {
          "totalIzin": 0,
          "totalCuti": 0,
          "totalTelat": 1,
          "totalHadir": 0,
          "totalHariAktif": 1
      },
      "periode": "2026-09-07 s/d 2026-09-11",
      "details": [
          {
              "date": "2026-09-10",
              "dayName": "Kamis",
              "category": "TERLAMBAT",
              "categoryLabel": "Terlambat Masuk",
              "keterangan": "Check-in pukul 20:15",
              "status": "Tercatat di Sistem"
          }
      ],
      "incidentDetails": [
          {
              "date": "2026-09-10",
              "dayName": "Kamis",
              "category": "TERLAMBAT",
              "categoryLabel": "Terlambat Masuk",
              "keterangan": "Check-in pukul 20:15",
              "status": "Tercatat di Sistem"
          }
      ]
    }

#### 2. Seoarang HRD Melihat Rekap Absensi Singkat Seluruh Karyawan 

**`GET` /api/hrd/attendance-summary**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat Rekap Absensi Singkat Karyawan.
* **Response Body (JSON):**
  ```json
    {
      "summary": [
          {
              "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
              "name": "Gilang",
              "employeeId": "32712",
              "department": "Staff",
              "position": "Staff",
              "email": "gilang@mail.com",
              "phone": "08128162312",
              "izin": 0,
              "cuti": 0,
              "telat": 1,
              "hadir": 1,
              "periode": "08/07/2026 - Sekarang",
              "periodeSubtext": "Rekap Kumulatif",
              "today": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "weekly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "monthly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "yearly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "hasData": true
          },
          {
              "id": "c020153e-c8ca-4513-aefc-0b9d6d7f97a4",
              "name": "Jeje",
              "employeeId": "555",
              "department": "IT",
              "position": "Web Developer",
              "email": "jeje@gmail.com",
              "phone": "08128162312",
              "izin": 0,
              "cuti": 0,
              "telat": 1,
              "hadir": 1,
              "periode": "08/07/2026 - Sekarang",
              "periodeSubtext": "Rekap Kumulatif",
              "today": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "weekly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "monthly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "yearly": {
                  "telat": 1,
                  "hadir": 1,
                  "izin": 0,
                  "cuti": 0,
                  "lateMins": 15
              },
              "hasData": true
          }
      ]
  }

#### 2.1 Seoarang HRD Melihat Rekap Absensi Singkat Karyawan Berdasarkan nama dan tanggal

**`GET` /api/hrd/attendance-summary?search=gilang&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat Rekap Absensi Singkat Karyawan berdasarkan nama tanggal menggunakan params search untuk nama startDate dan endDate untuk tanggal.
* **Response Body (JSON):**
  ```json
  {
    "summary": [
        {
            "id": "b2e169a5-43db-44ae-9918-d3e4ee323873",
            "name": "Gilang",
            "employeeId": "32712",
            "department": "Staff",
            "position": "Staff",
            "email": "gilang@mail.com",
            "phone": "08128162312",
            "izin": 0,
            "cuti": 0,
            "telat": 1,
            "hadir": 1,
            "periode": "2026-09-07 s/d 2026-09-10",
            "periodeSubtext": "Rentang Tanggal",
            "today": {
                "telat": 1,
                "hadir": 1,
                "izin": 0,
                "cuti": 0,
                "lateMins": 15
            },
            "weekly": {
                "telat": 1,
                "hadir": 1,
                "izin": 0,
                "cuti": 0,
                "lateMins": 15
            },
            "monthly": {
                "telat": 1,
                "hadir": 1,
                "izin": 0,
                "cuti": 0,
                "lateMins": 15
            },
            "yearly": {
                "telat": 1,
                "hadir": 1,
                "izin": 0,
                "cuti": 0,
                "lateMins": 15
            },
            "hasData": true
        }
    ]
  }


#### 2.1 Seoarang HRD Melihat Laporan Data Karyawan

**`GET` /api/hrd/reports/employee**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat Laporan Data Karyawan dapat menggunakan params untuk nama key: 'name' value: 'name_person' dan tanggal menggunakan startDate dan endDate berformat YYYY-MM-DD
* **Response Body (JSON):**
  ```json
    {
      "total": 2,
      "data": [
          {
              "name": "Gilang",
              "nik": "32712",
              "email": "gilang@mail.com",
              "phone": "08128162312",
              "address": null,
              "status_karyawan": "Aktif",
              "department_name": null,
              "position_name": null,
              "jam_masuk": "19:10:00",
              "jam_keluar": "21:00:00"
          },
          {
              "name": "Jeje",
              "nik": "555",
              "email": "jeje@gmail.com",
              "phone": "08128162312",
              "address": null,
              "status_karyawan": "Aktif",
              "department_name": "IT",
              "position_name": "Web Developer",
              "jam_masuk": "08:00:00",
              "jam_keluar": "17:00:00"
          }
      ]
  }

---

## Perizinan

#### 1. Melihat List Pengajuan Izin 

**`GET` /api/hrd/leaves**
* **Akses:** Admin
* **Keterangan:** Seoarang HRD Melihat siapa saja yang mengajukan izin.

#### 2. Melakukan aksi Terhadap izin Terima/Tolak 

**`PATCH` /api/hrd/leaves/:id/approval**
* **Akses:** Admin
* **Keterangan:** HRD Melakukan aksi menolak/terima izin karyawan.
* **Request Body (JSON):**
  ```json
  {
      "status":"APPROVED"
  }

---



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


### Laporan
|Type | Method | Endpoint                     | Keterangan                           |
|----|--------|------------------------------|--------------------------------------|
|Admin| GET   | `/api/hrd/employee-report/:id`| Menampilkan data laporan seorang karyawan absen secara detail  |
|Admin| GET   | `/api/hrd/attendance-summary`| Menampilkan data laporan seluruh/seorang karyawan absen secara singkat  |
|Admin| GET   | `/api/hrd/reports/employee`| Menampilkan data laporan seluruh/seorang data karyawan  |


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
