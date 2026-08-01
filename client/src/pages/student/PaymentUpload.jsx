import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

export default function PaymentUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Please attach your payment receipt.');
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('utrNumber', utrNumber);
    fd.append('amount', amount);
    fd.append('receipt', file);
    try {
      await api.post(`/payments/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-6">Fee Payment</h1>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">UTR / Transaction Number</label>
          <input required className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Amount Paid (₹)</label>
          <input required type="number" step="0.01" className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Payment Receipt (PDF/JPG/PNG)</label>
          <input required type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border rounded px-3 py-2 text-sm mt-1"
            onChange={(e) => setFile(e.target.files[0])} />
        </div>
        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Uploading…' : 'Submit Payment Details'}
        </button>
      </form>
    </div>
  );
}