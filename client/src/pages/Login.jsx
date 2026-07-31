import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api';

const roleHome = { STUDENT: '/student', SCIENTIST: '/scientist', ACCOUNTS: '/accounts', ADMIN: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Current view state: 'login' | 'forgot' | 'change'
  const [view, setView] = useState('login');

  // Form input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Response & Status indicators
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Switch between panels and clear error/success messages
  function switchView(targetView) {
    setError(null);
    setSuccessMsg(null);
    setView(targetView);
  }

  // Handle Standard Login
  async function onSubmitLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const user = await login(email, password);
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Forgot Password Request
  async function onSubmitForgot(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || 'Reset instructions sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Change Password Request
  async function onSubmitChange(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/auth/change-password', { email, oldPassword, newPassword });
      setSuccessMsg(res.data.message || 'Password changed successfully!');
      setPassword('');
      setOldPassword('');
      setNewPassword('');
      setView('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white shadow rounded-lg p-6">

      {/* --- PANEL 1: LOGIN --- */}
      {view === 'login' && (
        <>
          <h1 className="text-xl font-bold text-wihg-navy mb-4">Log in</h1>
          <form onSubmit={onSubmitLogin} className="space-y-3">
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-red-700 text-xs">{error}</p>}
            {successMsg && <p className="text-green-700 text-xs">{successMsg}</p>}

            <div className="flex justify-between items-center text-xs py-1">
              <button
                type="button"
                onClick={() => switchView('forgot')}
                className="text-wihg-navy hover:underline font-medium bg-transparent border-0 cursor-pointer p-0"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => switchView('change')}
                className="text-wihg-navy hover:underline font-medium bg-transparent border-0 cursor-pointer p-0"
              >
                Change password?
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            Student? <Link to="/register" className="text-wihg-navy font-medium">Create an account</Link>
          </p>
        </>
      )}

      {/* --- PANEL 2: FORGOT PASSWORD --- */}
      {view === 'forgot' && (
        <>
          <h1 className="text-xl font-bold text-wihg-navy mb-2">Forgot Password</h1>
          <p className="text-xs text-gray-500 mb-4">
            Enter your registered email address to request password reset options.
          </p>
          <form onSubmit={onSubmitForgot} className="space-y-3">
            <input
              required
              type="email"
              placeholder="Registered Email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && <p className="text-red-700 text-xs">{error}</p>}
            {successMsg && <p className="text-green-700 text-xs">{successMsg}</p>}

            <button
              disabled={loading}
              className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Sending Request…' : 'Submit Reset Request'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => switchView('login')}
            className="text-xs text-wihg-navy font-medium mt-4 block hover:underline bg-transparent border-0 cursor-pointer p-0"
          >
            ← Back to Log in
          </button>
        </>
      )}

      {/* --- PANEL 3: CHANGE PASSWORD --- */}
      {view === 'change' && (
        <>
          <h1 className="text-xl font-bold text-wihg-navy mb-2">Change Password</h1>
          <p className="text-xs text-gray-500 mb-4">
            Enter your account email, current password, and new password.
          </p>
          <form onSubmit={onSubmitChange} className="space-y-3">
            <input
              required
              type="email"
              placeholder="Email Address"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Current Password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="New Password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {error && <p className="text-red-700 text-xs">{error}</p>}
            {successMsg && <p className="text-green-700 text-xs">{successMsg}</p>}

            <button
              disabled={loading}
              className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => switchView('login')}
            className="text-xs text-wihg-navy font-medium mt-4 block hover:underline bg-transparent border-0 cursor-pointer p-0"
          >
            ← Back to Log in
          </button>
        </>
      )}

    </div>
  );
}