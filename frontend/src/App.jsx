import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Pages - Student
import StudentDashboard from './pages/student/Dashboard';
import FloorView from './pages/student/FloorView';
import WashroomQueue from './pages/student/WashroomQueue';
import WashingMachineQueue from './pages/student/WashingMachineQueue';
import Profile from './pages/student/Profile';
import Notifications from './pages/student/Notifications';
import QueueHistory from './pages/student/QueueHistory';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import ManageStudents from './pages/admin/ManageStudents';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import LiveQueues from './pages/admin/LiveQueues';
import ResourceManagement from './pages/admin/ResourceManagement';
import ManageAdmins from './pages/admin/ManageAdmins';

import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
        </Route>

        <Route element={<MainLayout />}>
          {/* Root Redirect */}
          <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/floors" element={<FloorView />} />
            <Route path="/washrooms/:floorId" element={<WashroomQueue />} />
            <Route path="/washing-machine" element={<WashingMachineQueue />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/history" element={<QueueHistory />} />
          </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<ManageStudents />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/live-queues" element={<LiveQueues />} />
              <Route path="/admin/resources" element={<ResourceManagement />} />
              <Route path="/admin/manage-admins" element={<ManageAdmins />} />
            </Route>
        </Route>
      </Routes>
      <ToastContainer theme="dark" position="top-center" />
    </>
  );
}

export default App;
