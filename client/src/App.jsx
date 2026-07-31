import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyCertificate from './pages/VerifyCertificate.jsx';

import StudentDashboard from './pages/student/Dashboard.jsx';
import ApplyForm from './pages/student/ApplyForm.jsx';
import PaymentUpload from './pages/student/PaymentUpload.jsx';
import JoiningForm from './pages/student/JoiningForm.jsx';
import CertificateRequest from './pages/student/CertificateRequest.jsx';

import ScientistDashboard from './pages/scientist/Dashboard.jsx';
import AccountsDashboard from './pages/accounts/Dashboard.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:certNo" element={<VerifyCertificate />} />

        <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/apply" element={<ProtectedRoute roles={['STUDENT']}><ApplyForm /></ProtectedRoute>} />
        <Route path="/student/pay/:applicationId" element={<ProtectedRoute roles={['STUDENT']}><PaymentUpload /></ProtectedRoute>} />
        <Route path="/student/join/:applicationId" element={<ProtectedRoute roles={['STUDENT']}><JoiningForm /></ProtectedRoute>} />
        <Route path="/student/joining-form/:applicationId" element={<ProtectedRoute roles={['STUDENT']}><JoiningForm /></ProtectedRoute>} />
        <Route path="/student/certificate/:applicationId" element={<ProtectedRoute roles={['STUDENT']}><CertificateRequest /></ProtectedRoute>} />

        <Route path="/scientist" element={<ProtectedRoute roles={['SCIENTIST']}><ScientistDashboard /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute roles={['ACCOUNTS', 'ADMIN']}><AccountsDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Landing />} />
      </Routes>
    </div>
  );
}