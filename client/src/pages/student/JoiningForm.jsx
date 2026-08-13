import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function JoiningForm() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Prefilled & Form Fields
  const [enrolmentNo, setEnrolmentNo] = useState('');
  const [appType, setAppType] = useState('INTERNSHIP');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Duration
  const [durationFrom, setDurationFrom] = useState('');
  const [durationTo, setDurationTo] = useState('');
  const [totalMonthsText, setTotalMonthsText] = useState('');
  const [durationError, setDurationError] = useState('');

  // Declaration Checkbox
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // File Enclosures & Previews
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signature, setSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [collegeId, setCollegeId] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [feeReceipt, setFeeReceipt] = useState(null);

  // Load Prefill Data
  useEffect(() => {
    api
      .get(`/joining/prefill/${applicationId}`)
      .then((res) => {
        const d = res.data;
        setEnrolmentNo(d.enrolmentNo || '');
        setAppType(d.type || 'INTERNSHIP');
        setName(d.name || '');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setFatherName(d.fatherName || '');
        setDob(d.dob || '');
        setGender(d.gender || '');
        setCollegeName(d.collegeName || '');
        setNationality(d.nationality || 'Indian');
        setAddress(d.address || '');

        if (d.alreadySubmitted) {
          setSuccessMsg('You have already submitted your Day 1 Joining Form.');
        }
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || 'Failed to load application details.');
      })
      .finally(() => setLoading(false));
  }, [applicationId]);

  // Handle Photo Selection & Preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle Signature Upload & Preview (.jpg / .jpeg / .png)
  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignature(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  // Calculate Duration automatically
  useEffect(() => {
    if (!durationFrom || !durationTo) {
      setTotalMonthsText('');
      setDurationError('');
      return;
    }

    const start = new Date(durationFrom);
    const end = new Date(durationTo);

    if (end <= start) {
      setDurationError('Duration "To" date must be after "From" date.');
      setTotalMonthsText('');
      return;
    }

    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    const approxMonths = Math.round(diffDays / 30);

    if (appType === 'INTERNSHIP') {
      if (diffDays < 28 || approxMonths > 3) {
        setDurationError('Internship duration must be between 1 Month and 3 Months.');
        setTotalMonthsText(`${approxMonths} Month(s) [Invalid]`);
        return;
      }
    } else if (appType === 'DISSERTATION') {
      if (diffDays < 28 || approxMonths > 6) {
        setDurationError('Dissertation duration must be between 1 Month and 6 Months.');
        setTotalMonthsText(`${approxMonths} Month(s) [Invalid]`);
        return;
      }
    }

    setDurationError('');
    setTotalMonthsText(`${approxMonths} Month(s) (${diffDays} Days)`);
  }, [durationFrom, durationTo, appType]);

  const validateForm = () => {
    if (durationError) {
      setErrorMsg(durationError);
      return false;
    }
    if (!declarationAccepted) {
      setErrorMsg('Please read and accept the declaration before proceeding.');
      return false;
    }
    if (!photo || !signature || !collegeId || !idProof || !feeReceipt) {
      setErrorMsg('All mandatory enclosures (Photo, Signature Attachment, College ID, Identity Proof, Fee Receipt) are required.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleOpenPreview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('enrolmentNo', enrolmentNo);
      formData.append('joiningDate', joiningDate);
      formData.append('fatherName', fatherName);
      formData.append('dob', dob);
      formData.append('gender', gender);
      formData.append('nationality', nationality);
      formData.append('aadhaarNo', aadhaarNo);
      formData.append('emergencyContact', emergencyContact);
      formData.append('address', address);
      formData.append('durationFrom', durationFrom);
      formData.append('durationTo', durationTo);
      formData.append('declarationAccepted', declarationAccepted);

      // Attach Files
      formData.append('photo', photo);
      formData.append('signature', signature);
      formData.append('collegeId', collegeId);
      formData.append('idProof', idProof);
      formData.append('feeReceipt', feeReceipt);

      await api.post(`/joining/${applicationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowPreview(false);
      setSuccessMsg('Joining Form submitted successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/student'), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit joining form.');
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-slate-600 font-medium">Loading Joining Form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800">
            Joining Form for {appType === 'INTERNSHIP' ? 'Internship' : 'Dissertation Work'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit this on your first day of reporting, along with photocopies of your College/School ID card, identity proof, and fee receipt.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleOpenPreview} className="space-y-6">
          {/* Section 1: Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Enrolment No. (Auto-generated)</label>
              <input
                type="text"
                readOnly
                value={enrolmentNo}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name (in Block Letters) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Father's / Mother's Name *</label>
              <input
                type="text"
                required
                placeholder="Parent Name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University / College / Institute *</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality *</label>
              <input
                type="text"
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar No. *</label>
              <input
                type="text"
                required
                maxLength="12"
                placeholder="12 digit Aadhaar Number"
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact No. *</label>
              <input
                type="tel"
                required
                placeholder="Emergency Contact Phone"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Fetched from account)</label>
              <input
                type="email"
                readOnly
                value={email}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile No. (Fetched from account)</label>
              <input
                type="tel"
                readOnly
                value={phone}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Address *</label>
            <textarea
              required
              rows="3"
              placeholder="Full Permanent Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Section 2: Duration */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">
              Duration Period ({appType === 'INTERNSHIP' ? 'Allowed: 1 to 3 Months' : 'Allowed: 1 to 6 Months'})
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Duration From *</label>
                <input
                  type="date"
                  required
                  value={durationFrom}
                  onChange={(e) => setDurationFrom(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Duration To *</label>
                <input
                  type="date"
                  required
                  value={durationTo}
                  onChange={(e) => setDurationTo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Calculated Duration</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto calculated"
                  value={totalMonthsText}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold ${
                    durationError ? 'bg-red-100 text-red-700 border-red-300' : 'bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                />
              </div>
            </div>
            {durationError && <p className="text-xs text-red-600 font-medium">{durationError}</p>}
          </div>

          {/* Section 3: Declaration */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-xs text-blue-950 leading-relaxed font-medium">
                I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge and belief.
                I undertake to abide by all rules, regulations, safety instructions and disciplinary requirements of the Wadia Institute of Himalayan Geology during the period of my Internship / Dissertation Work.
              </span>
            </label>
          </div>

          {/* Section 4: Mandatory Enclosures */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Mandatory Enclosures & Uploads</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Passport Photo */}
              <div className="border rounded-lg p-3 bg-white space-y-1">
                <label className="block text-xs font-semibold text-slate-700">📷 Passport-size Photograph (.jpg/.png) *</label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="text-xs w-full text-slate-600"
                />
              </div>

              {/* Signature Upload in JPG Format */}
              <div className="border rounded-lg p-3 bg-white space-y-1 border-blue-200 bg-blue-50/30">
                <label className="block text-xs font-semibold text-slate-800">✍️ Student Signature Image (.jpg / .jpeg) *</label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleSignatureChange}
                  className="text-xs w-full text-slate-600"
                />
                <p className="text-[10px] text-slate-500">Upload a clear photo/scan of your signature on white paper.</p>
              </div>

              {/* College ID */}
              <div className="border rounded-lg p-3 bg-white space-y-1">
                <label className="block text-xs font-semibold text-slate-700">1. Photocopy of University/College ID Card *</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setCollegeId(e.target.files[0])}
                  className="text-xs w-full text-slate-600"
                />
              </div>

              {/* ID Proof */}
              <div className="border rounded-lg p-3 bg-white space-y-1">
                <label className="block text-xs font-semibold text-slate-700">2. Photocopy of Identity Proof (Aadhaar / Passport) *</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setIdProof(e.target.files[0])}
                  className="text-xs w-full text-slate-600"
                />
              </div>

              {/* Fee Receipt */}
              <div className="border sm:col-span-2 rounded-lg p-3 bg-white space-y-1">
                <label className="block text-xs font-semibold text-slate-700">3. Photocopy of Fee Receipt *</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={(e) => setFeeReceipt(e.target.files[0])}
                  className="text-xs w-full text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="flex-1 bg-slate-100 text-slate-800 border border-slate-300 py-3 rounded-lg font-bold text-sm hover:bg-slate-200 transition shadow-sm flex items-center justify-center gap-2"
            >
              👁️ Preview Joining Form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50 transition shadow-md"
            >
              {submitting ? 'Submitting...' : 'Submit Joining Form'}
            </button>
          </div>
        </form>
      </div>

      {/* ================= EXACT OFFICIAL PDF PREVIEW MODAL ================= */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-300 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header Bar */}
            <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between no-print">
              <span className="font-semibold text-sm">Official Joining Form Preview</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white text-xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Form Content */}
            <div className="p-8 overflow-y-auto font-serif text-slate-900 text-sm leading-relaxed space-y-4 border-2 border-slate-800 m-4 rounded">
              
              {/* Header Titles */}
              <div className="text-center space-y-1 border-b-2 border-slate-800 pb-3">
                <p className="text-xs font-bold tracking-wider uppercase text-slate-700">
                  विज्ञान एवं प्रौद्योगिकी विभाग / DEPARTMENT OF SCIENCE & TECHNOLOGY
                </p>
                <h2 className="text-lg font-black uppercase text-slate-900 tracking-wide">
                  वाडिया हिमालय भूविज्ञान संस्थान / WADIA INSTITUTE OF HIMALAYAN GEOLOGY
                </h2>
                <h3 className="text-md font-bold uppercase underline decoration-1 text-slate-800 pt-1">
                  JOINING FORM FOR INTERNSHIP/DISSERTATION WORK 2026
                </h3>
              </div>

              {/* Enrolment & Date Header */}
              <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
                <div>
                  Enrolment No.: <span className="font-mono text-sm underline">{enrolmentNo || 'WIHG/2026/Intern/7B/'}</span>
                </div>
                <div>
                  Date: <span className="underline">{joiningDate}</span>
                </div>
              </div>

              {/* Program Type Checkboxes */}
              <div className="flex gap-6 text-xs font-bold py-1">
                <span className="text-slate-600">(Please tick the appropriate option):</span>
                <div className="flex items-center gap-1.5">
                  <span className="border border-slate-800 px-1 text-xs">{appType === 'INTERNSHIP' ? '✓' : ' '}</span>
                  <span>Internship Programme</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="border border-slate-800 px-1 text-xs">{appType === 'DISSERTATION' ? '✓' : ' '}</span>
                  <span>Dissertation Work</span>
                </div>
              </div>

              {/* Main Body: Details + Photo Box */}
              <div className="grid grid-cols-4 gap-4 items-start pt-2">
                <div className="col-span-3 space-y-2 text-xs">
                  <div>
                    <strong className="w-44 inline-block">Name (in Block Letters):</strong>
                    <span className="uppercase font-semibold underline">{name}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Father's/Mother's Name:</strong>
                    <span className="underline">{fatherName}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Date of Birth:</strong>
                    <span className="underline">{dob}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Gender:</strong>
                    <span className="underline">{gender}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">University/College/Institute:</strong>
                    <span className="underline">{collegeName}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Nationality:</strong>
                    <span className="underline">{nationality}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Aadhaar No.:</strong>
                    <span className="underline">[Aadhaar Redacted]</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Emergency Contact No.:</strong>
                    <span className="underline">{emergencyContact}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">E-mail:</strong>
                    <span className="underline">{email}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block">Mobile No.:</strong>
                    <span className="underline">{phone}</span>
                  </div>
                  <div>
                    <strong className="w-44 inline-block align-top">Permanent Address:</strong>
                    <span className="underline inline-block w-64 leading-tight">{address}</span>
                  </div>
                </div>

                {/* Photo Box with Uploaded Signature Embedded */}
                <div className="col-span-1 flex flex-col items-center">
                  <div className="w-28 h-36 border-2 border-slate-800 flex flex-col items-center justify-between p-1 text-center bg-slate-50 overflow-hidden relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student Photo" className="w-full h-24 object-cover" />
                    ) : (
                      <p className="text-[10px] text-slate-500 leading-tight my-auto">
                        affix recent passport size colour photograph with signature
                      </p>
                    )}
                    
                    {/* Embedded Uploaded Signature image overlay under photo */}
                    {signaturePreview && (
                      <div className="w-full border-t border-slate-400 bg-white/90 pt-0.5">
                        <img src={signaturePreview} alt="Uploaded Signature" className="h-6 object-contain mx-auto" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 font-sans italic text-center">
                    (Photograph & Signature)
                  </span>
                </div>
              </div>

              {/* Declaration Statement */}
              <div className="text-[11px] text-justify leading-tight border-t border-b border-slate-300 py-2 my-2 italic">
                I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge and belief.
                I undertake to abide by all rules, regulations, safety instructions and disciplinary requirements of the Wadia Institute of Himalayan Geology during the period of my Internship / Dissertation Work.
              </div>

              {/* Duration Row */}
              <div className="text-xs font-semibold flex justify-between border-b pb-2">
                <div>
                  Duration: From <span className="underline">{durationFrom}</span> To <span className="underline">{durationTo}</span>
                </div>
                <div>
                  Total Duration: <span className="underline">{totalMonthsText}</span>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="pt-4 flex justify-between items-end text-xs">
                <div className="text-center flex flex-col items-center">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Student Signature" className="h-10 object-contain mb-1" />
                  ) : (
                    <div className="h-10"></div>
                  )}
                  <div className="border-t border-slate-800 w-48 pt-1 font-bold">
                    Student Signature with Date
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-800 w-52 pt-1 font-bold">
                    Signature by the Allotted Supervisor
                  </div>
                  <div className="text-[10px] text-slate-500">(with Name & Designation)</div>
                </div>
              </div>

              {/* Accounts Section Block */}
              <div className="border-2 border-slate-800 p-3 my-2 space-y-2 bg-slate-50/50">
                <div className="text-xs font-bold uppercase border-b border-slate-400 pb-1">
                  TO BE FILLED BY ACCOUNT SECTION
                </div>
                <p className="text-[11px]">
                  Fee for dissertation and internship program has been received and verified from account section.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Payment Mode: ____________________</div>
                  <div>Amount: __________________________</div>
                  <div>Trans./Receipt No.: ________________</div>
                  <div>Payment Date: ____________________</div>
                </div>
                <div className="pt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div>Verified by Name: ____________</div>
                  <div>Designation: __________________</div>
                  <div>Signature & Date: _____________</div>
                </div>
              </div>

              {/* Office Use & Enclosures Footer */}
              <div className="pt-2 flex justify-between items-start text-xs border-t border-slate-800">
                <div>
                  <div className="font-bold underline mb-1">Enclosed: -</div>
                  <ol className="list-decimal list-inside text-[11px] space-y-0.5">
                    <li>Photocopy of University/College/School Identity Card.</li>
                    <li>Photocopy of Identity Proof.</li>
                    <li>Photocopy of Fee Receipt.</li>
                  </ol>
                </div>
                <div className="text-center pt-4">
                  <div className="border-t border-slate-800 w-56 pt-1 font-bold">
                    Signature
                  </div>
                  <div className="text-[10px] font-semibold">
                    OIC, Dissertation Work & Internship Programme
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Controls */}
            <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                Close Preview
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit Form'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}