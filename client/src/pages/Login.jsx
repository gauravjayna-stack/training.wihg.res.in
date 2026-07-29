import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleHome = { STUDENT: '/student', SCIENTIST: '/scientist', ACCOUNTS: '/accounts', ADMIN: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white shadow rounded-lg p-6">
      <h1 className="text-xl font-bold text-wihg-navy mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required type="email" placeholder="Email" className="w-full border rounded px-3 py-2 text-sm"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" className="w-full border rounded px-3 py-2 text-sm"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={loading} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-4">
        Student? <Link to="/register" className="text-wihg-navy font-medium">Create an account</Link>
      </p>
    </div>
  );
}
