import axios from 'axios';

// In production, the frontend and backend are separate Render services on
// separate domains — a relative '/api' path only works locally via Vite's
// dev proxy. Set VITE_API_URL (e.g. https://wihg-backend.onrender.com) as
// an environment variable on the Render *frontend* static site, and rebuild.
export const BACKEND_ORIGIN = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${BACKEND_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wihg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wihg_token');
      localStorage.removeItem('wihg_user');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Build a full URL for a file served by the backend (receipts, reports,
// generated certificate PDFs) — these come back as relative "/uploads/..."
// paths from the API and must be prefixed with the backend's origin too.
export function fileUrl(path) {
  if (!path) return path;
  return `${BACKEND_ORIGIN}${path}`;
}

export default api;
