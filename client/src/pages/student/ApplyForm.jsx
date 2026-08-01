import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function ApplyForm() {
  const navigate = useNavigate();
  const [scientists, setScientists] = useState([]);
  const [mode, setMode] = useState('AUTO'); // 'AUTO' | 'DIRECT'
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState({
    type: 'INTERNSHIP', // 'INTERNSHIP' | 'DISSERTATION'
    year: new Date().getFullYear().toString(),
    fullName: '',
    fatherOrHusbandName: '',
    addressCorrespondence: '',
    addressPermanent: '',
    phoneNo: '',
    email: '',
    dob: '',
    placeOfBirth: '',
    ageYears: '',
    ageMonths: '',
    ageDays: '',
    gender: 'Male',
    maritalStatus: 'Single',
    identificationMark: '',
    nationality: 'Indian',
    category: 'General', // SC/ST/OBC/General
    categoryDetails: '',
    academicRecords: [
      { exam: 'High School (10th)', subject: '', year: '', division: '', percentage: '', board: '', distinctions: '' },
      { exam: 'Intermediate (12th)', subject: '', year: '', division: '', percentage: '', board: '', distinctions: '' },
      { exam: 'Bachelor Degree', subject: '', year: '', division: '', percentage: '', board: '', distinctions: '' },
      { exam: 'Master Degree (Pursuing/Completed)', subject: '', year: '', division: '', percentage: '', board: '', distinctions: '' }
    ],
    punishedDetails: '',
    prizesAndAwards: '',
    specialTraining: '',
    researchInterest: '',
    durationMonths: 1,
    topic: '',
    scientistId: '',
  });

  const [hodLetter, setHodLetter] = useState(null);
  const [categoryCert, setCategoryCert] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch available scientists
    api.get('/scientists').then((res) => setScientists(res.data)).catch(() => {});

    // 2. Fetch logged-in user profile to auto-fill registration data
    api.get('/auth/me')
      .then((res) => {
        const user = res.data;
        if (user) {
          setForm((prev) => ({
            ...prev,
            fullName: user.fullName || user.name || prev.fullName,
            email: user.email || prev.email,
            phoneNo: user.phoneNo || user.phone || prev.phoneNo,
            fatherOrHusbandName: user.fatherOrHusbandName || prev.fatherOrHusbandName,
            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : prev.dob,
            gender: user.gender || prev.gender,
            category: user.category || prev.category,
            addressPermanent: user.addressPermanent || user.address || prev.addressPermanent,
            addressCorrespondence: user.addressCorrespondence || user.address || prev.addressCorrespondence,
          }));
        }
      })
      .catch((err) => console.error('Failed to pre-fill registration data', err))
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleAcademicChange = (index, field, value) => {
    const updated = [...form.academicRecords];
    updated[index][field] = value;
    setForm({ ...form, academicRecords: updated });
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!hodLetter) {
      return setError('Please attach the HOD Forwarding / Recommendation Letter in PDF format.');
    }

    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'academicRecords') {
        fd.append('academicRecords', JSON.stringify(val));
      } else {
        fd.append(key, val);
      }
    });

    fd.append('autoAssignRequested', mode === 'AUTO');
    if (mode === 'DIRECT') {
      fd.append('scientistId', form.scientistId);
    }

    fd.append('hodLetter', hodLetter);
    if (categoryCert) fd.append('categoryCert', categoryCert);

    try {
      await api.post('/applications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm mt-1 focus:ring-1 focus:ring-navy-600";
  const readOnlyInputClass = "w-full border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed rounded px-3 py-1.5 text-sm mt-1";
  const labelClass = "text-xs font-semibold text-gray-700";

  if (loadingProfile) {
    return <div className="text-center py-12 text-sm text-gray-500">Loading student profile details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8 border border-gray-200">
        
        {/* Form Title Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h2 className="text-sm font-bold uppercase text-gray-600">WADIA INSTITUTE OF HIMALAYAN GEOLOGY</h2>
          <h1 className="text-xl font-extrabold text-slate-800">APPLICATION FORM FOR DISSERTATION WORK / INTERNSHIP PROGRAMME</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* Program Type and Year */}
          <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
            <div>
              <label className={labelClass}>Programme Applying For *</label>
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="INTERNSHIP">Internship Programme (1 - 3 Months)</option>
                <option value="DISSERTATION">Dissertation Work (4 - 6 Months)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Year *</label>
              <input required className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-1">1. Personal Information</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>1. Full Name (Auto-fetched from Registration) *</label>
                <input readOnly className={readOnlyInputClass} value={form.fullName} />
              </div>
              <div>
                <label className={labelClass}>2. Father's / Husband's Name *</label>
                <input required className={inputClass} value={form.fatherOrHusbandName} onChange={(e) => setForm({ ...form, fatherOrHusbandName: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>3. (a) Address For Correspondence *</label>
                <textarea required rows={2} className={inputClass} value={form.addressCorrespondence} onChange={(e) => setForm({ ...form, addressCorrespondence: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>3. (b) Permanent Address *</label>
                <textarea required rows={2} className={inputClass} value={form.addressPermanent} onChange={(e) => setForm({ ...form, addressPermanent: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact Phone No. (Auto-fetched) *</label>
                <input readOnly type="tel" className={readOnlyInputClass} value={form.phoneNo} />
              </div>
              <div>
                <label className={labelClass}>E-mail Address (Auto-fetched) *</label>
                <input readOnly type="email" className={readOnlyInputClass} value={form.email} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>4. Date of Birth *</label>
                <input required type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Place of Birth *</label>
                <input required className={inputClass} value={form.placeOfBirth} onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Age (Years)</label>
                <input required type="number" className={inputClass} value={form.ageYears} onChange={(e) => setForm({ ...form, ageYears: e.target.value })} placeholder="Years" />
              </div>
              <div>
                <label className={labelClass}>Age (Months)</label>
                <input required type="number" className={inputClass} value={form.ageMonths} onChange={(e) => setForm({ ...form, ageMonths: e.target.value })} placeholder="Months" />
              </div>
              <div>
                <label className={labelClass}>Age (Days)</label>
                <input required type="number" className={inputClass} value={form.ageDays} onChange={(e) => setForm({ ...form, ageDays: e.target.value })} placeholder="Days" />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>5. (a) Sex *</label>
                <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>5. (b) Marital Status *</label>
                <select className={inputClass} value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>5. (c) Identification Mark</label>
                <input className={inputClass} value={form.identificationMark} onChange={(e) => setForm({ ...form, identificationMark: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>6. Nationality *</label>
                <input required className={inputClass} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>7. Category (General/SC/ST/OBC)</label>
                <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="General">General</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="OBC">Other Backward Class (OBC)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Qualifications Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-1">8. Academic Qualifications (Commencing from High School)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-gray-300">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">Exam / Degree</th>
                    <th className="p-2 border">Subject / Specialization</th>
                    <th className="p-2 border">Year</th>
                    <th className="p-2 border">Division</th>
                    <th className="p-2 border">% / Grade</th>
                    <th className="p-2 border">University / Board</th>
                  </tr>
                </thead>
                <tbody>
                  {form.academicRecords.map((rec, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-semibold border bg-gray-50">{rec.exam}</td>
                      <td className="p-1 border">
                        <input className="w-full p-1 border rounded" value={rec.subject} onChange={(e) => handleAcademicChange(idx, 'subject', e.target.value)} />
                      </td>
                      <td className="p-1 border">
                        <input className="w-full p-1 border rounded" value={rec.year} onChange={(e) => handleAcademicChange(idx, 'year', e.target.value)} />
                      </td>
                      <td className="p-1 border">
                        <input className="w-full p-1 border rounded" value={rec.division} onChange={(e) => handleAcademicChange(idx, 'division', e.target.value)} />
                      </td>
                      <td className="p-1 border">
                        <input className="w-full p-1 border rounded" value={rec.percentage} onChange={(e) => handleAcademicChange(idx, 'percentage', e.target.value)} />
                      </td>
                      <td className="p-1 border">
                        <input className="w-full p-1 border rounded" value={rec.board} onChange={(e) => handleAcademicChange(idx, 'board', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Particulars */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>9. Have you been punished during your studies at College/University?</label>
              <input className={inputClass} placeholder="Enter details or write 'NO'" value={form.punishedDetails} onChange={(e) => setForm({ ...form, punishedDetails: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>10. Prizes / Medals / Awards / Honours, if any</label>
              <input className={inputClass} value={form.prizesAndAwards} onChange={(e) => setForm({ ...form, prizesAndAwards: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>11. Special Training / Assignment / Any other Relevant Particulars</label>
              <input className={inputClass} value={form.specialTraining} onChange={(e) => setForm({ ...form, specialTraining: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>12. Statement of Research Interest (100 - 150 words) *</label>
              <textarea required rows={4} className={inputClass} placeholder="Describe your research area and interest at WIHG..." value={form.researchInterest} onChange={(e) => setForm({ ...form, researchInterest: e.target.value })} />
            </div>
          </div>

          {/* Mentor Assignment Selection */}
          <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <label className="text-xs font-bold text-slate-800 block">Faculty / Mentor Consent</label>
            <div className="flex flex-col sm:flex-row gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'AUTO'} onChange={() => setMode('AUTO')} />
                <span>Auto-Allocation by Training Cell</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mode" checked={mode === 'DIRECT'} onChange={() => setMode('DIRECT')} />
                <span>I have obtained consent from a WIHG Scientist</span>
              </label>
            </div>

            {mode === 'DIRECT' && (
              <div className="pt-2">
                <label className={labelClass}>Select Approved Scientist *</label>
                <select required className={inputClass} value={form.scientistId} onChange={(e) => setForm({ ...form, scientistId: e.target.value })}>
                  <option value="">Choose Scientist...</option>
                  {scientists.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.specialization})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mandatory Enclosures */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-bold text-slate-800">Mandatory File Uploads</h3>
            
            <div>
              <label className={labelClass}>Forwarding Letter / Recommendation from Head of Department (PDF) *</label>
              <input required type="file" accept=".pdf" className="w-full text-xs text-gray-600 mt-1" onChange={(e) => setHodLetter(e.target.files[0])} />
            </div>

            {form.category !== 'General' && (
              <div>
                <label className={labelClass}>Attested Copy of Category Certificate (SC/ST/OBC) (PDF/JPG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-gray-600 mt-1" onChange={(e) => setCategoryCert(e.target.files[0])} />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button disabled={submitting} type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg text-sm transition">
            {submitting ? 'Submitting Application...' : 'Submit Official Application Form'}
          </button>
        </form>
      </div>
    </div>
  );
}