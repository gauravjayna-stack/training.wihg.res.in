import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

export default function JoiningForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [joiningDate, setJoiningDate] = useState('');
  const [idProof, setIdProof] = useState(null);
  const [feeReceipt, setFeeReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('joiningDate', joiningDate);
    if (idProof) fd.append('idProof', idProof);
    if (feeReceipt) fd.append('feeReceipt', feeReceipt);
    try {
      await api.post(`/joining/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-1">Joining Form</h1>
      <p className="text-xs text-gray-500 mb-6">
        Submit this on your first day of reporting. Enclose photocopies of your ID card, identity proof, and fee receipt as instructed.
      </p>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Joining Date</label>
          <input required type="date" className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">ID / Identity Proof (PDF/JPG/PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border rounded px-3 py-2 text-sm mt-1"
            onChange={(e) => setIdProof(e.target.files[0])} />
        </div>
        <div>
          <label className="text-sm font-medium">Fee Receipt Copy (PDF/JPG/PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border rounded px-3 py-2 text-sm mt-1"
            onChange={(e) => setFeeReceipt(e.target.files[0])} />
        </div>
        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Joining Form'}
        </button>
      </form>
    </div>
  );
}
