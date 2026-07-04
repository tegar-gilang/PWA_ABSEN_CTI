-- =========================================================
-- Skema Database MySQL - Aplikasi Absensi PWA (PWA_ABSEN_CTI)
-- =========================================================
-- Cara pakai:
--   mysql -u root -p < server/schema.sql
-- atau import lewat phpMyAdmin / TablePlus / dsb.
-- =========================================================

CREATE DATABASE IF NOT EXISTS absensi_cti
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE absensi_cti;

-- ---------------------------------------------------------
-- Tabel: users
-- Menyimpan data akun karyawan
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  employee_id      VARCHAR(50)  NOT NULL UNIQUE,
  name             VARCHAR(150) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  department       VARCHAR(100) DEFAULT NULL,
  position         VARCHAR(100) DEFAULT NULL,
  phone            VARCHAR(30)  DEFAULT NULL,
  email            VARCHAR(150) DEFAULT NULL,
  schedule         VARCHAR(150) DEFAULT 'Senin - Jumat, 09:00 - 17:00',
  photo_url        LONGTEXT DEFAULT NULL,
  emergency_contact VARCHAR(100) DEFAULT NULL,
  role             ENUM('EMPLOYEE','ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: offices
-- OPSIONAL - hanya dipakai jika suatu saat geofencing radius kantor diaktifkan
-- (ENABLE_GEOFENCING=true di .env). Untuk teknisi lapangan, tabel ini boleh
-- dikosongkan/diabaikan karena lokasi absen memang direkam apa adanya (berpindah-pindah).
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS offices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,
  radius_meters   INT NOT NULL DEFAULT 150,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Catatan: tidak ada seed data kantor secara default lagi, karena teknisi lapangan
-- tidak terikat ke satu lokasi kantor. Tambahkan manual jika ingin mengaktifkan geofencing:
-- INSERT INTO offices (name, latitude, longitude, radius_meters) VALUES ('Kantor Pusat', -6.200000, 106.816666, 150);

-- ---------------------------------------------------------
-- Tabel: attendance_records
-- Rekap absensi harian tiap karyawan (check-in & check-out)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
  id                        VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id                   VARCHAR(36) NOT NULL,
  date                      DATE NOT NULL,
  check_in_time             DATETIME DEFAULT NULL,
  check_out_time            DATETIME DEFAULT NULL,
  status                    ENUM('ON_TIME','LATE','ABSENT') NOT NULL DEFAULT 'ON_TIME',
  working_hours             DECIMAL(5,2) DEFAULT NULL,

  check_in_lat              DECIMAL(10, 7) DEFAULT NULL,
  check_in_lng              DECIMAL(10, 7) DEFAULT NULL,
  check_in_accuracy_m       DECIMAL(8, 2) DEFAULT NULL, -- akurasi GPS (meter) saat check-in
  check_in_distance_m       DECIMAL(8, 2) DEFAULT NULL, -- jarak ke kantor (meter) saat check-in
  check_in_photo_url        LONGTEXT DEFAULT NULL,

  check_out_lat             DECIMAL(10, 7) DEFAULT NULL,
  check_out_lng             DECIMAL(10, 7) DEFAULT NULL,
  check_out_accuracy_m      DECIMAL(8, 2) DEFAULT NULL,
  check_out_distance_m      DECIMAL(8, 2) DEFAULT NULL,
  check_out_photo_url       LONGTEXT DEFAULT NULL,

  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_date (user_id, date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: requests
-- Pengajuan Cuti / Izin / Sakit / Lembur
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id              VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL,
  type            ENUM('LEAVE','PERMISSION','SICK','OVERTIME') NOT NULL,
  reason          TEXT NOT NULL,
  date            DATE NOT NULL,
  status          ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  attachment_url  TEXT DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: notifications
-- Notifikasi dalam aplikasi untuk tiap pengguna
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  type            ENUM('SUCCESS','WARNING','INFO') NOT NULL DEFAULT 'INFO',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
