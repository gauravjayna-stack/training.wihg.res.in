import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

export default function CertificateRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    applicantFullName: '',
    applicantEmail: '',
    applicantMobile: '',
    university: '',
    topic: '',
    durationFrom: '',
    durationTo: '',
    supervisorName: '',
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!report) return setError('Please attach your final report/thesis PDF.');
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
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

  const input = 'w-full border rounded px-3 py-2 text-sm mt-1';
  const label = 'text-sm font-medium';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-1">Certificate Request Form</h1>
      <p className="text-xs text-gray-500 mb-6">
        To be filled in block letters. Your supervisor will review and sign off before the Training Cell issues your certificate.
      </p>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className={label}>Full Name</label>
          <input required className={input} value={form.applicantFullName} onChange={(e) => set('applicantFullName', e.target.value.toUpperCase())} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Email</label>
            <input required type="email" className={input} value={form.applicantEmail} onChange={(e) => set('applicantEmail', e.target.value)} />
          </div>
          <div>
            <label className={label}>Mobile Number</label>
            <input required className={input} value={form.applicantMobile} onChange={(e) => set('applicantMobile', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>University / College / Institute</label>
          <input required className={input} value={form.university} onChange={(e) => set('university', e.target.value)} />
        </div>
        <div>
          <label className={label}>Internship / Dissertation Topic</label>
          <textarea required rows={2} className={input} value={form.topic} onChange={(e) => set('topic', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Duration From</label>
            <input required type="date" className={input} value={form.durationFrom} onChange={(e) => set('durationFrom', e.target.value)} />
          </div>
          <div>
            <label className={label}>Duration To</label>
            <input required type="date" className={input} value={form.durationTo} onChange={(e) => set('durationTo', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Supervisor</label>
          <input required className={input} value={form.supervisorName} onChange={(e) => set('supervisorName', e.target.value)} placeholder="Name of your allotted supervisor" />
        </div>
        <div>
          <label className={label}>Final Report / Thesis (PDF)</label>
          <input required type="file" accept=".pdf" className={input} onChange={(e) => setReport(e.target.files[0])} />
        </div>

        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
