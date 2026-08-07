import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', collegeName: '', degreeName: '' });
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
    <div className="max-w-sm mx-auto mt-12 bg-white shadow rounded-lg p-6">
      <h1 className="text-xl font-bold text-wihg-navy mb-1">Student Sign Up</h1>
      
      <div className="mb-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-medium leading-relaxed">
        <strong>Important:</strong> Only B.Tech students in a relevant field and PG (Post Graduate) students in a relevant field are allowed to apply.
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input required placeholder="Full name" className="w-full border rounded px-3 py-2 text-sm"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="w-full border rounded px-3 py-2 text-sm"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Phone Number" className="w-full border rounded px-3 py-2 text-sm"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required placeholder="College / University Name" className="w-full border rounded px-3 py-2 text-sm"
          value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} />
        <input required placeholder="Degree Name (e.g., B.Tech Geology)" className="w-full border rounded px-3 py-2 text-sm"
          value={form.degreeName} onChange={(e) => setForm({ ...form, degreeName: e.target.value })} />
        <input required type="password" minLength={8} placeholder="Password (min 8 characters)" className="w-full border rounded px-3 py-2 text-sm"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        
        {error && <p className="text-red-700 text-xs">{error}</p>}
        
        <button disabled={loading} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50 mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-wihg-navy font-bold">Log in</Link>
      </p>
    </div>
  );
}