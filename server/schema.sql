-- -- =========================================================
-- -- Skema Database MySQL - Aplikasi Absensi PWA (PWA_ABSEN_CTI)
-- -- =========================================================

-- DROP DATABASE IF EXISTS absensi_cti;
-- CREATE DATABASE IF NOT EXISTS absensi_cti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE absensi_cti;

-- -- =========================================================
-- -- 1. TABEL MASTER (DATA REFERENSI DINAMIS)
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS master_departments (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL UNIQUE,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   display_order INT(11) NOT NULL DEFAULT 0
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS master_positions (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   name VARCHAR(100) NOT NULL UNIQUE,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS hospitals (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   nama_rs VARCHAR(150) NOT NULL,
--   name VARCHAR(150) DEFAULT NULL,
--   address TEXT NOT NULL,
--   latitude DECIMAL(10, 7) NOT NULL,
--   longitude DECIMAL(10, 7) NOT NULL,
--   radius_meters INT(11) NOT NULL DEFAULT 200,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS offices (
--   id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(150) NOT NULL,
--   address TEXT DEFAULT NULL,
--   latitude DECIMAL(10, 7) NOT NULL,
--   longitude DECIMAL(10, 7) NOT NULL,
--   radius_meters INT(11) NOT NULL DEFAULT 150,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 2. TABEL USERS (KARYAWAN & ADMIN)
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS users (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   employee_id VARCHAR(50) NOT NULL UNIQUE,
--   name VARCHAR(150) NOT NULL,
--   password_hash VARCHAR(255) NOT NULL,
  
--   -- Kolom Legacy & Baru
--   department VARCHAR(100) DEFAULT NULL,
--   status_karyawan VARCHAR(50) DEFAULT 'Aktif',
--   performance_status VARCHAR(50) DEFAULT 'Good',
--   position VARCHAR(100) DEFAULT NULL,
--   phone VARCHAR(30) DEFAULT NULL,
--   email VARCHAR(150) DEFAULT NULL,
--   schedule VARCHAR(150) DEFAULT 'Senin - Jumat, 09:00 - 17:00',
--   photo_url LONGTEXT DEFAULT NULL,
--   emergency_contact VARCHAR(100) DEFAULT NULL,
--   role ENUM('EMPLOYEE','ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   assigned_office_id INT(11) DEFAULT NULL,
--   address TEXT DEFAULT NULL,
--   hospital_id VARCHAR(36) DEFAULT NULL,
--   nik VARCHAR(50) DEFAULT NULL,
--   id_department VARCHAR(36) DEFAULT NULL,
--   id_position VARCHAR(36) DEFAULT NULL,
--   jam_masuk TIME NOT NULL DEFAULT '08:00:00',
--   jam_keluar TIME NOT NULL DEFAULT '17:00:00',
  
--   CONSTRAINT fk_office FOREIGN KEY (assigned_office_id) REFERENCES offices(id) ON DELETE SET NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 3. TABEL ABSENSI
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS attendance_records (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   user_id VARCHAR(36) NOT NULL,
--   date DATE NOT NULL,
--   check_in_time DATETIME DEFAULT NULL,
--   check_out_time DATETIME DEFAULT NULL,
--   status ENUM('ON_TIME','LATE','ABSENT') NOT NULL DEFAULT 'ON_TIME',
--   working_hours DECIMAL(5,2) DEFAULT NULL,
  
--   check_in_lat DECIMAL(10, 7) DEFAULT NULL,
--   check_in_lng DECIMAL(10, 7) DEFAULT NULL,
--   check_in_accuracy_m DECIMAL(8, 2) DEFAULT NULL,
--   check_in_distance_m DECIMAL(8, 2) DEFAULT NULL,
--   check_in_photo_url LONGTEXT DEFAULT NULL,

--   check_out_lat DECIMAL(10, 7) DEFAULT NULL,
--   check_out_lng DECIMAL(10, 7) DEFAULT NULL,
--   check_out_accuracy_m DECIMAL(8, 2) DEFAULT NULL,
--   check_out_distance_m DECIMAL(8, 2) DEFAULT NULL,
--   check_out_photo_url LONGTEXT DEFAULT NULL,

--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   hospital_id VARCHAR(36) DEFAULT NULL,
--   custom_location_name VARCHAR(255) DEFAULT NULL,
--   office_id INT(11) DEFAULT NULL,

--   UNIQUE KEY uniq_user_date (user_id, date),
--   CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 4. TABEL PENGAJUAN (CUTI, IZIN, SAKIT, LEMBUR)
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS requests (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   user_id VARCHAR(36) NOT NULL,
--   type ENUM('LEAVE','PERMISSION','SICK','OVERTIME') NOT NULL,
--   reason TEXT NOT NULL,
--   date DATE NOT NULL,
--   end_date DATE DEFAULT NULL,
--   status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
--   rejection_reason TEXT DEFAULT NULL,
--   attachment_url TEXT DEFAULT NULL,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

--   CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 5. TABEL NOTIFIKASI
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS notifications (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   user_id VARCHAR(36) NOT NULL,
--   title VARCHAR(200) NOT NULL,
--   description TEXT NOT NULL,
--   is_read TINYINT(1) NOT NULL DEFAULT 0,
--   type ENUM('SUCCESS','WARNING','INFO') NOT NULL DEFAULT 'INFO',
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

--   CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 6. TABEL KPI
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS kpi_records (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   user_id VARCHAR(36) NOT NULL,
--   period VARCHAR(20) NOT NULL,
--   target_unit INT(11) NOT NULL DEFAULT 0,
--   achieved_unit INT(11) NOT NULL DEFAULT 0,
--   target_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
--   achieved_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
--   status VARCHAR(50) DEFAULT 'Tidak Capai',
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   CONSTRAINT fk_kpi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS kpi_evaluations (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   user_id VARCHAR(36) NOT NULL,
--   month_year VARCHAR(7) NOT NULL,
--   terlambat_laporan INT(11) NOT NULL DEFAULT 0,
--   laporan_tidak_sesuai INT(11) NOT NULL DEFAULT 0,
--   komplain INT(11) NOT NULL DEFAULT 0,
--   target_persen INT(11) NOT NULL DEFAULT 0,
--   pelanggaran_sop TINYINT(1) NOT NULL DEFAULT 0,
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   UNIQUE KEY uniq_kpi_eval (user_id, month_year),
--   CONSTRAINT fk_kpi_eval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- 7. TABEL REKRUTMEN (LOWONGAN & KANDIDAT)
-- -- =========================================================
-- CREATE TABLE IF NOT EXISTS job_openings (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   title VARCHAR(150) NOT NULL,
--   department VARCHAR(100) NOT NULL,
--   status ENUM('OPEN', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'OPEN',
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   role VARCHAR(100) DEFAULT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE IF NOT EXISTS candidates (
--   id VARCHAR(36) NOT NULL PRIMARY KEY,
--   job_opening_id VARCHAR(36) NOT NULL,
--   name VARCHAR(150) NOT NULL,
--   stage VARCHAR(50) NOT NULL DEFAULT 'Applied',
--   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
--   CONSTRAINT fk_candidate_job FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- =========================================================
-- -- INDEXING UNTUK PERFORMA QUERY
-- -- =========================================================
-- CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
-- CREATE INDEX idx_requests_user ON requests(user_id);
-- CREATE INDEX idx_notifications_user ON notifications(user_id);
-- CREATE INDEX idx_kpi_user ON kpi_records(user_id);
-- CREATE INDEX idx_kpi_eval_user ON kpi_evaluations(user_id);
-- CREATE INDEX idx_candidates_job ON candidates(job_opening_id);



-- !! PERHATIAAN UYY
-- SKEMA DI ATAS ERROR YAA HANN?? KALO DI RUN SQL NYA KAYAKNYA ADA KESALAHAN COBA DAHH

-- INI YANG BENAR DARI AI URUTAN NYA UDAH SESUAI DI BAWAH 
-- -> ->



-- =========================================================
-- Skema Database MySQL - Aplikasi Absensi PWA (PWA_ABSEN_CTI)
-- Versi: Clean Reset (Sinkronisasi dengan Tim)
-- =========================================================

CREATE DATABASE IF NOT EXISTS absensi_cti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE absensi_cti;

-- ---------------------------------------------------------
-- 0. MATIKAN FOREIGN KEY & BERSIHKAN TABEL LAMA
-- ---------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS job_openings;
DROP TABLE IF EXISTS kpi_evaluations;
DROP TABLE IF EXISTS kpi_records;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS offices;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS master_positions;
DROP TABLE IF EXISTS master_departments;

-- =========================================================
-- 1. TABEL MASTER (DATA REFERENSI DINAMIS)
-- =========================================================
CREATE TABLE IF NOT EXISTS master_departments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  display_order INT(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_positions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospitals (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  nama_rs VARCHAR(150) NOT NULL,
  name VARCHAR(150) DEFAULT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_meters INT(11) NOT NULL DEFAULT 200,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offices (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT DEFAULT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_meters INT(11) NOT NULL DEFAULT 150,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2. TABEL USERS (KARYAWAN & ADMIN)
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Kolom Legacy & Baru
  department VARCHAR(100) DEFAULT NULL,
  status_karyawan VARCHAR(50) DEFAULT 'Aktif',
  performance_status VARCHAR(50) DEFAULT 'Good',
  position VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  schedule VARCHAR(150) DEFAULT 'Senin - Jumat, 09:00 - 17:00',
  photo_url LONGTEXT DEFAULT NULL,
  emergency_contact VARCHAR(100) DEFAULT NULL,
  role ENUM('EMPLOYEE','ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  assigned_office_id INT(11) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  hospital_id VARCHAR(36) DEFAULT NULL,
  nik VARCHAR(50) DEFAULT NULL,
  id_department VARCHAR(36) DEFAULT NULL,
  id_position VARCHAR(36) DEFAULT NULL,
  jam_masuk TIME NOT NULL DEFAULT '08:00:00',
  jam_keluar TIME NOT NULL DEFAULT '17:00:00',
  reset_otp VARCHAR(10) DEFAULT NULL,
  reset_otp_expires DATETIME DEFAULT NULL,
  
  CONSTRAINT fk_office FOREIGN KEY (assigned_office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3. TABEL ABSENSI
-- =========================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  check_in_time DATETIME DEFAULT NULL,
  check_out_time DATETIME DEFAULT NULL,
  status ENUM('ON_TIME','LATE','ABSENT') NOT NULL DEFAULT 'ON_TIME',
  working_hours DECIMAL(5,2) DEFAULT NULL,
  
  check_in_lat DECIMAL(10, 7) DEFAULT NULL,
  check_in_lng DECIMAL(10, 7) DEFAULT NULL,
  check_in_accuracy_m DECIMAL(8, 2) DEFAULT NULL,
  check_in_distance_m DECIMAL(8, 2) DEFAULT NULL,
  check_in_photo_url LONGTEXT DEFAULT NULL,

  check_out_lat DECIMAL(10, 7) DEFAULT NULL,
  check_out_lng DECIMAL(10, 7) DEFAULT NULL,
  check_out_accuracy_m DECIMAL(8, 2) DEFAULT NULL,
  check_out_distance_m DECIMAL(8, 2) DEFAULT NULL,
  check_out_photo_url LONGTEXT DEFAULT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  hospital_id VARCHAR(36) DEFAULT NULL,
  custom_location_name VARCHAR(255) DEFAULT NULL,
  office_id INT(11) DEFAULT NULL,

  UNIQUE KEY uniq_user_date (user_id, date),
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4. TABEL PENGAJUAN (CUTI, IZIN, SAKIT, LEMBUR)
-- =========================================================
CREATE TABLE IF NOT EXISTS requests (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('LEAVE','PERMISSION','SICK','OVERTIME') NOT NULL,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT DEFAULT NULL,
  attachment_url TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5. TABEL NOTIFIKASI
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type ENUM('SUCCESS','WARNING','INFO') NOT NULL DEFAULT 'INFO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 6. TABEL KPI
-- =========================================================
CREATE TABLE IF NOT EXISTS kpi_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  period VARCHAR(20) NOT NULL,
  target_unit INT(11) NOT NULL DEFAULT 0,
  achieved_unit INT(11) NOT NULL DEFAULT 0,
  target_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  achieved_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Tidak Capai',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_kpi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kpi_evaluations (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  month_year VARCHAR(7) NOT NULL,
  terlambat_laporan INT(11) NOT NULL DEFAULT 0,
  laporan_tidak_sesuai INT(11) NOT NULL DEFAULT 0,
  komplain INT(11) NOT NULL DEFAULT 0,
  target_persen INT(11) NOT NULL DEFAULT 0,
  pelanggaran_sop TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uniq_kpi_eval (user_id, month_year),
  CONSTRAINT fk_kpi_eval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 7. TABEL REKRUTMEN (LOWONGAN & KANDIDAT)
-- =========================================================
CREATE TABLE IF NOT EXISTS job_openings (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status ENUM('OPEN', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidates (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  job_opening_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  stage VARCHAR(50) NOT NULL DEFAULT 'Applied',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_candidate_job FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 8. INDEXING UNTUK PERFORMA QUERY
-- =========================================================
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_kpi_user ON kpi_records(user_id);
CREATE INDEX idx_kpi_eval_user ON kpi_evaluations(user_id);
CREATE INDEX idx_candidates_job ON candidates(job_opening_id);

-- ---------------------------------------------------------
-- NYALAKAN KEMBALI FOREIGN KEY
-- ---------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;