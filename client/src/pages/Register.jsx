import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white shadow rounded-lg p-6">
      <h1 className="text-xl font-bold text-wihg-navy mb-1">Student Sign Up</h1>
      <p className="text-xs text-gray-500 mb-4">Staff accounts (Scientist/Accounts/Admin) are created by the Training Cell.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required placeholder="Full name" className="w-full border rounded px-3 py-2 text-sm"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="w-full border rounded px-3 py-2 text-sm"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone (optional)" className="w-full border rounded px-3 py-2 text-sm"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="password" minLength={8} placeholder="Password (min 8 characters)" className="w-full border rounded px-3 py-2 text-sm"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={loading} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-4">
        Already have an account? <Link to="/login" className="text-wihg-navy font-medium">Log in</Link>
      </p>
    </div>
  );
}
