import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function ApplyForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scientists, setScientists] = useState([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    type: 'INTERNSHIP',
    fullName: '',
    email: '',
    phoneNo: '',
    collegeName: '',
    degreeName: '',
    year: '',
    fatherOrHusbandName: '',
    addressCorrespondence: '',
    addressPermanent: '',
    dob: '',
    placeOfBirth: '',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: 'Indian',
    category: 'General',
    durationMonths: 2,
    topic: '',
    scientistId: '',
    autoAssignRequested: false,
    researchInterest: '',
    prizesAndAwards: '',
    specialTraining: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch active scientists list
      const scientistRes = await axios.get('/api/scientists', authHeader).catch(() => ({ data: [] }));
      setScientists(scientistRes.data || []);

      // Pre-fill user data from AuthContext or fallback /api/auth/me call
      if (user) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || '',
          email: user.email || '',
          phoneNo: user.phone || '',
          collegeName: user.collegeName || '',
          degreeName: user.degreeName || '',
        }));
      } else {
        const profileRes = await axios.get('/api/auth/me', authHeader);
        const me = profileRes.data;
        setFormData((prev) => ({
          ...prev,
          fullName: me.name || '',
          email: me.email || '',
          phoneNo: me.phone || '',
          collegeName: me.collegeName || '',
          degreeName: me.degreeName || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Could not fetch user details. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/applications', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201 || res.status === 200) {
        alert('Application submitted successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600 font-medium">Loading user details from database...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6 sm:p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Form</h1>
        <p className="text-sm text-gray-600 mb-6">
          Wadia Institute of Himalayan Geology — Training & Dissertation Program
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropdown Menu for Internship or Dissertation */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Select Application Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
            >
              <option value="INTERNSHIP">Internship</option>
              <option value="DISSERTATION">Dissertation</option>
            </select>
          </div>

          {/* Personal Information (Auto-filled) */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNo"
                  required
                  value={formData.phoneNo}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Father / Husband Name</label>
                <input
                  type="text"
                  name="fatherOrHusbandName"
                  value={formData.fatherOrHusbandName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Details (Auto-filled) */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Academic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">College / University Name *</label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Degree Name *</label>
                <input
                  type="text"
                  name="degreeName"
                  required
                  value={formData.degreeName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Year / Semester</label>
                <input
                  type="text"
                  name="year"
                  placeholder="e.g. 3rd Year / 6th Semester"
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Months) *</label>
                <input
                  type="number"
                  name="durationMonths"
                  min="1"
                  max="12"
                  required
                  value={formData.durationMonths}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Supervisor / Scientist Selection */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scientist / Supervisor Selection</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Select Supervisor</label>
              <select
                name="scientistId"
                value={formData.scientistId}
                onChange={handleChange}
                disabled={formData.autoAssignRequested}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
              >
                <option value="">-- Select a Scientist --</option>
                {scientists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.specialization}) - Seats: {s.availableSeats}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAssignRequested"
                name="autoAssignRequested"
                checked={formData.autoAssignRequested}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoAssignRequested" className="ml-2 text-sm text-gray-700">
                Auto-assign supervisor based on institute availability
              </label>
            </div>
          </div>

          {/* Research Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Proposed Topic / Field of Research</label>
            <textarea
              name="topic"
              rows={3}
              value={formData.topic}
              onChange={handleChange}
              placeholder="Briefly describe your proposed area of work or topic..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}