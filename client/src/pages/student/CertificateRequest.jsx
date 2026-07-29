import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

export default function CertificateRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [report, setReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!report) return setError('Please attach your final report/thesis PDF.');
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append('topic', topic);
    fd.append('feedback', feedback);
    fd.append('report', report);
    try {
      await api.post(`/certificates/${id}/request`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-1">Certificate Request</h1>
      <p className="text-xs text-gray-500 mb-6">
        Submit your final report/thesis and feedback. Your supervisor will review and sign off before the
        Training Cell issues your certificate.
      </p>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Internship/Dissertation Topic</label>
          <input required className="w-full border rounded px-3 py-2 text-sm mt-1"
            value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Final Report / Thesis (PDF)</label>
          <input required type="file" accept=".pdf" className="w-full border rounded px-3 py-2 text-sm mt-1"
            onChange={(e) => setReport(e.target.files[0])} />
        </div>
        <div>
          <label className="text-sm font-medium">Feedback (optional)</label>
          <textarea rows={4} className="w-full border rounded px-3 py-2 text-sm mt-1"
            placeholder="Share your experience with the programme…"
            value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
