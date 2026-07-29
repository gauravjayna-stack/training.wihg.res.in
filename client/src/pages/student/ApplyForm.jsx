import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function ApplyForm() {
  const navigate = useNavigate();
  const [scientists, setScientists] = useState([]);
  const [mode, setMode] = useState('AUTO'); // 'AUTO' | 'DIRECT'
  const [form, setForm] = useState({
    type: 'INTERNSHIP',
    collegeName: '',
    durationMonths: 1,
    topic: '',
    scientistId: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/scientists').then((res) => setScientists(res.data)).catch(() => {});
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/applications', {
        ...form,
        durationMonths: Number(form.durationMonths),
        autoAssignRequested: mode === 'AUTO',
        scientistId: mode === 'DIRECT' ? form.scientistId : undefined,
      });
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-6">Application Form</h1>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Programme Type</label>
          <select className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="INTERNSHIP">Internship</option>
            <option value="DISSERTATION">Dissertation Work</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">University / College / Institute</label>
          <input required className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Duration (months)</label>
          <input required type="number" min={1} max={12} className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Proposed Topic (optional)</label>
          <input className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Mentor Assignment</label>
          <div className="flex gap-4 text-sm mb-2">
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === 'AUTO'} onChange={() => setMode('AUTO')} /> Auto-Allocation by Training Cell
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === 'DIRECT'} onChange={() => setMode('DIRECT')} /> I already have a scientist's approval
            </label>
          </div>
          {mode === 'DIRECT' && (
            <select required className="w-full border rounded px-3 py-2 text-sm"
              value={form.scientistId} onChange={(e) => setForm({ ...form, scientistId: e.target.value })}>
              <option value="">Select scientist…</option>
              {scientists.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.specialization}</option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
