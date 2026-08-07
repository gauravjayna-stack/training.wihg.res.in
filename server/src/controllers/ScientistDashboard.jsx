import React, { useState, useEffect } from 'react';

export default function ScientistDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    fetch('/api/scientist/students')
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setStudents(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('signature', file);

    fetch('/api/scientist/signature', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => alert(data.message))
      .catch((err) => alert('Upload failed'));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Navigation Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 font-bold text-lg border-b border-slate-800">Scientist Portal</div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            ['dashboard', 'Dashboard'],
            ['assigned', 'Assigned Students'],
            ['weekly', 'Weekly Progress'],
            ['reports', 'Submitted Reports'],
            ['approve', 'Approve Certificate'],
            ['signature', 'Supervisor Signature'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full text-left px-3 py-2 rounded transition ${
                activeTab === id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Overview</h1>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded shadow">
                <p className="text-gray-500">Total Assigned Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signature' && (
          <div className="bg-white p-6 rounded shadow max-w-lg">
            <h2 className="text-xl font-bold mb-4">Supervisor Digital Signature</h2>
            <p className="text-sm text-gray-600 mb-4">Upload your digital signature to automatically embed it on completed certificates.</p>
            <input type="file" accept="image/*" onChange={handleSignatureUpload} className="mb-4 block w-full" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Signature</button>
          </div>
        )}

        {activeTab === 'assigned' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Assigned Students & Progress</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Topic</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-2">{s.student?.user?.name || 'N/A'}</td>
                    <td className="p-2">{s.topic || 'N/A'}</td>
                    <td className="p-2"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s.status}</span></td>
                    <td className="p-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Update Progress</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}