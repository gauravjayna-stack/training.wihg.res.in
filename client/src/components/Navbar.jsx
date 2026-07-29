import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleHome = {
  STUDENT: '/student',
  SCIENTIST: '/scientist',
  ACCOUNTS: '/accounts',
  ADMIN: '/admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-wihg-navy text-white px-6 py-3 flex items-center justify-between shadow">
      <Link to="/" className="font-semibold tracking-wide">
        WIHG Training Portal
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link to={roleHome[user.role] || '/'} className="hover:text-wihg-gold">
              Dashboard
            </Link>
            <span className="text-gray-300">{user.name} · {user.role}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-wihg-gold text-wihg-navy px-3 py-1 rounded font-medium hover:opacity-90"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-wihg-gold">Login</Link>
            <Link to="/register" className="bg-wihg-gold text-wihg-navy px-3 py-1 rounded font-medium hover:opacity-90">
              Student Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
