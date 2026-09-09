-- =========================================================
-- Skema Database MySQL - Aplikasi Absensi PWA (PWA_ABSEN_CTI)
-- =========================================================

DROP DATABASE IF EXISTS absensi_cti;
CREATE DATABASE absensi_cti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE absensi_cti;

-- =========================================================
-- 1. TABEL MASTER (DATA REFERENSI DINAMIS)
-- =========================================================
CREATE TABLE IF NOT EXISTS master_departments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS master_positions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hospitals (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  nama_rs VARCHAR(150) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_meters INT NOT NULL DEFAULT 200,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabel: offices (Opsional untuk Radius Pusat / Kantor)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS offices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius_meters INT NOT NULL DEFAULT 150,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 2. TABEL USERS (KARYAWAN & ADMIN)
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  nik VARCHAR(50) NOT NULL UNIQUE, -- Menggantikan employee_id
  name VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Relasi ke Tabel Master (Menggantikan teks bebas)
  id_department VARCHAR(36) DEFAULT NULL,
  id_position VARCHAR(36) DEFAULT NULL,
  
  phone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(150) UNIQUE DEFAULT NULL, -- Dibuat UNIQUE untuk opsi login
  address TEXT DEFAULT NULL,
  
  -- Pengaturan Jam Kerja Fleksibel (Menggantikan schedule)
  jam_masuk TIME NOT NULL DEFAULT '08:00:00',
  jam_keluar TIME NOT NULL DEFAULT '17:00:00',
  
  photo_url LONGTEXT DEFAULT NULL,
  tanda_tangan_digital LONGTEXT DEFAULT NULL,
  emergency_contact VARCHAR(100) DEFAULT NULL,
  assigned_office_id INT DEFAULT NULL,
  
  role ENUM('EMPLOYEE','ADMIN') NOT NULL DEFAULT 'EMPLOYEE',
  status_karyawan ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  performance_status ENUM('BAIK', 'PERLU DIPERHATIKAN') NOT NULL DEFAULT 'BAIK',
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user_dept FOREIGN KEY (id_department) REFERENCES master_departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_pos FOREIGN KEY (id_position) REFERENCES master_positions(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_office FOREIGN KEY (assigned_office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- 3. TABEL ABSENSI
-- =========================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  
  -- Tambahan untuk lokasi penugasan
  hospital_id VARCHAR(36) DEFAULT NULL, 
  custom_location_name VARCHAR(255) DEFAULT NULL,
  
  date DATE NOT NULL,
  check_in_time DATETIME DEFAULT NULL,
  check_out_time DATETIME DEFAULT NULL,
  status ENUM('ON_TIME','LATE','ABSENT') NOT NULL DEFAULT 'ON_TIME',
  working_hours DECIMAL(5,2) DEFAULT NULL,

  -- Field existing tidak diubah agar frontend aman
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

  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_user_date (user_id, date)
) ENGINE=InnoDB;


-- =========================================================
-- 4. TABEL PENGAJUAN (CUTI, IZIN, SAKIT)
-- =========================================================
CREATE TABLE IF NOT EXISTS requests (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('LEAVE','PERMISSION','SICK') NOT NULL,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  attachment_url TEXT DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


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
) ENGINE=InnoDB;

-- =========================================================
-- 6. TABEL KPI
-- =========================================================
CREATE TABLE IF NOT EXISTS kpi_records (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  period VARCHAR(10) NOT NULL,
  target_unit INT NOT NULL DEFAULT 0,
  target_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  achieved_unit INT NOT NULL DEFAULT 0,
  achieved_rupiah DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  status ENUM('ACHIEVED', 'NOT_ACHIEVED') NOT NULL DEFAULT 'NOT_ACHIEVED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_kpi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table KPI Evaluations (Berdasarkan Evaluasi Bulanan & Skoring Excel)
CREATE TABLE IF NOT EXISTS kpi_evaluations (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format periode, contoh: '2026-08'
  terlambat_laporan INT NOT NULL DEFAULT 0,
  laporan_tidak_sesuai INT NOT NULL DEFAULT 0,
  komplain INT NOT NULL DEFAULT 0,
  target_persen INT NOT NULL DEFAULT 0,
  pelanggaran_sop BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_kpi_eval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_kpi_eval (user_id, month_year)
) ENGINE=InnoDB;


-- =========================================================
-- 7. TABEL REKRUTMEN (LOWONGAN & KANDIDAT)
-- =========================================================
CREATE TABLE IF NOT EXISTS job_openings (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  role VARCHAR(100) NOT NULL,
  status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidates (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  job_opening_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  stage ENUM('SCREENING', 'INTERVIEW', 'HIRED', 'REJECTED') NOT NULL DEFAULT 'SCREENING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_candidate_job FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- INDEXING UNTUK PERFORMA QUERY
-- =========================================================
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_kpi_user ON kpi_records(user_id);
CREATE INDEX idx_kpi_eval_user ON kpi_evaluations(user_id);
CREATE INDEX idx_candidates_job ON candidates(job_opening_id);
