import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { fileUrl } from '../../api';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/mine').then((res) => setApplications(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-wihg-navy">My Applications</h1>
        <Link to="/student/apply" className="bg-wihg-navy text-white px-4 py-2 rounded text-sm font-medium">
          + New Application
        </Link>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && applications.length === 0 && (
        <p className="text-gray-500 text-sm">You haven't submitted an application yet.</p>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-wihg-navy">{app.type} — {app.collegeName}</p>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Mentor: {app.scientist?.name || (app.autoAssignRequested ? 'Awaiting auto-allocation' : '—')} · Duration: {app.durationMonths} month(s)
            </p>
            <div className="flex gap-3 text-sm">
              {app.status === 'FEE_PAYMENT_NEEDED' && (
                <Link to={`/student/pay/${app.id}`} className="text-wihg-navy font-medium underline">Pay Fee →</Link>
              )}
              {app.status === 'APPROVED_FOR_JOINING' && (
                <Link to={`/student/join/${app.id}`} className="text-wihg-navy font-medium underline">Submit Joining Form →</Link>
              )}
              {app.status === 'IN_PROGRESS' && (
                <Link to={`/student/certificate/${app.id}`} className="text-wihg-navy font-medium underline">Request Certificate →</Link>
              )}
              {app.certificate?.pdfPath && (
                <a href={fileUrl(app.certificate.pdfPath)} target="_blank" rel="noreferrer" className="text-green-700 font-medium underline">
                  Download Certificate ↓
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
