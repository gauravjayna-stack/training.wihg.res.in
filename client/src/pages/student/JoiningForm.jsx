import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const emptyForm = {
  joiningDate: '',
  enrolmentNo: '',
  fullName: '',
  fatherMotherName: '',
  dateOfBirth: '',
  gender: '',
  university: '',
  nationality: '',
  aadhaarNo: '',
  emergencyContact: '',
  email: '',
  permanentAddress: '',
  mobileNo: '',
  durationFrom: '',
  durationTo: '',
  totalDurationValue: '',
  totalDurationUnit: 'WEEKS',
};

export default function JoiningForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState({ photo: null, collegeId: null, idProof: null, feeReceipt: null });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!files.collegeId || !files.idProof || !files.feeReceipt) {
      return setError('College/School ID card, identity proof, and fee receipt copies are all required.');
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    if (files.photo) fd.append('photo', files.photo);
    fd.append('collegeId', files.collegeId);
    fd.append('idProof', files.idProof);
    fd.append('feeReceipt', files.feeReceipt);
    try {
      await api.post(`/joining/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wihg-navy mb-1">Joining Form for Internship / Dissertation Work</h1>
      <p className="text-xs text-gray-500 mb-6">
        Submit this on your first day of reporting, along with photocopies of your College/School ID card, identity proof, and fee receipt.
      </p>
      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Enrolment No.</label>
            <input placeholder="WIHG/2026/Intern/..." className={input} value={form.enrolmentNo} onChange={(e) => set('enrolmentNo', e.target.value)} />
          </div>
          <div>
            <label className={label}>Joining Date</label>
            <input required type="date" className={input} value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>Name (in Block Letters)</label>
          <input required className={input} value={form.fullName} onChange={(e) => set('fullName', e.target.value.toUpperCase())} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Father's / Mother's Name</label>
            <input required className={input} value={form.fatherMotherName} onChange={(e) => set('fatherMotherName', e.target.value)} />
          </div>
          <div>
            <label className={label}>Date of Birth</label>
            <input required type="date" className={input} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Gender</label>
            <select required className={input} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select…</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label}>University / College / Institute</label>
            <input required className={input} value={form.university} onChange={(e) => set('university', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nationality</label>
            <input required className={input} value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
          </div>
          <div>
            <label className={label}>Aadhaar No.</label>
            <input required className={input} value={form.aadhaarNo} onChange={(e) => set('aadhaarNo', e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Emergency Contact No.</label>
            <input required className={input} value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
          </div>
          <div>
            <label className={label}>Mobile No.</label>
            <input required className={input} value={form.mobileNo} onChange={(e) => set('mobileNo', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={label}>E-mail</label>
          <input required type="email" className={input} value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <div>
          <label className={label}>Permanent Address</label>
          <textarea required rows={3} className={input} value={form.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} />
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

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Total Duration</label>
            <input required type="number" min={1} className={input} value={form.totalDurationValue} onChange={(e) => set('totalDurationValue', e.target.value)} />
          </div>
          <div>
            <label className={label}>Unit</label>
            <select className={input} value={form.totalDurationUnit} onChange={(e) => set('totalDurationUnit', e.target.value)}>
              <option value="WEEKS">Weeks</option>
              <option value="MONTHS">Months</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-wihg-navy mb-3">Enclosures</p>
          <div className="space-y-3">
            <div>
              <label className={label}>Passport-size photograph (optional)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className={input} onChange={(e) => setFiles((f) => ({ ...f, photo: e.target.files[0] }))} />
            </div>
            <div>
              <label className={label}>1. Photocopy of University/College/School ID Card *</label>
              <input required type="file" accept=".pdf,.jpg,.jpeg,.png" className={input} onChange={(e) => setFiles((f) => ({ ...f, collegeId: e.target.files[0] }))} />
            </div>
            <div>
              <label className={label}>2. Photocopy of Identity Proof *</label>
              <input required type="file" accept=".pdf,.jpg,.jpeg,.png" className={input} onChange={(e) => setFiles((f) => ({ ...f, idProof: e.target.files[0] }))} />
            </div>
            <div>
              <label className={label}>3. Photocopy of Fee Receipt *</label>
              <input required type="file" accept=".pdf,.jpg,.jpeg,.png" className={input} onChange={(e) => setFiles((f) => ({ ...f, feeReceipt: e.target.files[0] }))} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-700 text-xs">{error}</p>}
        <button disabled={submitting} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit Joining Form'}
        </button>
      </form>
    </div>
  );
}
