/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import History from './pages/History';
import Request from './pages/Request';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import HRDLayout from './components/hrd/HRDLayout';
import DashboardHRD from './pages/hrd/DashboardHRD';
import { useAppStore, processSyncQueue } from './store';
import LayoutHRD from './pages/hrd/LayoutHRD';
import DashboardHRD from './pages/hrd/DashboardHRD';
import KehadiranHRD from './pages/hrd/KehadiranHRD';
import KaryawanHRD from './pages/hrd/KaryawanHRD';
import CutiHRD from './pages/hrd/CutiHRD';
import KPIHRD from './pages/hrd/KPIHRD';
import RekrutmenHRD from './pages/hrd/RekrutmenHRD';
import { requestNotificationPermission, onMessageListener } from './lib/fcm';



/**
 * Komponen pembungkus (wrapper) untuk melindungi rute yang memerlukan otentikasi.
 * Mengarahkan pengguna kembali ke halaman login jika mereka belum terotentikasi.
 */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({children}: {children: React.ReactNode}) => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const user = useAppStore(state => state.user);

  if(!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if(user?.role !== 'ADMIN') {
    return <Navigate to="/home" replace />;
  }

  return <>
    {children}
  </>
};


/**
 * Komponen Utama Aplikasi.
 * Mengatur rute aplikasi, menangani sinkronisasi data saat status online/offline berubah,
 * dan meminta izin untuk menampilkan notifikasi kepada pengguna.
 */
export default function App() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const hydrateSession = useAppStore(state => state.hydrateSession);

  // Memulihkan sesi login (token JWT) & memuat ulang data dari backend saat aplikasi pertama kali dibuka
  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  // Meminta izin notifikasi ketika pengguna berhasil masuk (terotentikasi)
  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
      onMessageListener().catch(err => console.error("Gagal mendengarkan pesan notifikasi", err));
    }
  }, [isAuthenticated]);

  // Menangani proses sinkronisasi latar belakang saat perangkat kembali terhubung ke internet (offline ke online)
  useEffect(() => {
    const handleOnline = () => {
      console.log('Aplikasi kembali online. Memproses antrean sinkronisasi...');
      processSyncQueue(); // Menyinkronkan data yang disimpan secara lokal ke server (backend)
    };
    
    // Selain itu, jalankan proses sinkronisasi satu kali saat aplikasi baru dimulai dan perangkat dalam keadaan online
    if (navigator.onLine) {
      processSyncQueue();
    }
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik: Rute yang dapat diakses tanpa harus login terlebih dahulu */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Rute Privat dengan Navigasi Layout: Rute yang dilindungi dan menampilkan bilah navigasi di bawah layar */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/history" element={<History />} />
          <Route path="/request" element={<Request />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Rute Buat HRD/Admin */}
        <Route element={<AdminRoute><HRDLayout /></AdminRoute>}>
          <Route path="/hrd/dashboard" element={<DashboardHRD />} />
        </Route>
        {/* Rute Privat tanpa Navigasi Bawah: Digunakan untuk halaman spesifik seperti daftar notifikasi */}
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />



        {/* Rute Bersarang (Nested Routing) khusus Web HRD */}
        <Route path="/hrd" element={<LayoutHRD />}>
        {/* Index berarti rute default saat /hrd dibuka */}
        <Route index element={<DashboardHRD />} />
  
        {/* Rute untuk /hrd/kehadiran */}
        <Route path="kehadiran" element={<KehadiranHRD />} />
        <Route path="karyawan" element={<KaryawanHRD />} />
        <Route path="cuti" element={<CutiHRD />} />
        <Route path="kpi" element={<KPIHRD />} />
        <Route path="rekrutmen" element={<RekrutmenHRD />} />
        </Route>
        
        {/* Rute Cadangan (Fallback): Akan mengarahkan pengguna kembali ke halaman awal jika URL tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
