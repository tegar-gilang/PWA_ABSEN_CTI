/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import History from './pages/History';
import Request from './pages/Request';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import { useAppStore, processSyncQueue } from './store';

import { requestNotificationPermission, onMessageListener } from './lib/fcm';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
      onMessageListener().catch(err => console.error("Failed to listen for messages", err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online. Processing sync queue...');
      processSyncQueue();
    };
    
    // Also process once on startup if online
    if (navigator.onLine) {
      processSyncQueue();
    }
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/history" element={<History />} />
          <Route path="/request" element={<Request />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
