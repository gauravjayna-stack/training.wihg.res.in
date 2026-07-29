import React, { useEffect, useState } from 'react';
import api from '../../api';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function ScientistDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    api.get('/scientists/me/applications').then((res) => setApplications(res.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function decide(app, decision) {
    setBusyId(app.id);
    try {
      await api.patch(`/applications/${app.id}/scientist-decision`, { decision });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function signOff(app) {
    setBusyId(app.id);
    try {
      await api.patch(`/applications/${app.id}/signoff`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  const pending = applications.filter((a) => a.status === 'PENDING_APPROVAL');
  const completionPending = applications.filter((a) => a.status === 'COMPLETION_PENDING');
  const others = applications.filter((a) => !['PENDING_APPROVAL', 'COMPLETION_PENDING'].includes(a.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-wihg-navy">Scientist Dashboard</h1>

      <section>
        <h2 className="font-semibold text-lg mb-3">Pending Requests</h2>
        {!loading && pending.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
        <div className="space-y-3">
          {pending.map((app) => (
            <div key={app.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{app.student.name} — {app.type}</p>
                <p className="text-xs text-gray-500">{app.collegeName} · {app.durationMonths} month(s){app.topic ? ` · ${app.topic}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busyId === app.id} onClick={() => decide(app, 'APPROVE')}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">Approve</button>
                <button disabled={busyId === app.id} onClick={() => decide(app, 'REJECT')}
                  className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">Disapprove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Awaiting Your Sign-off (Training Complete)</h2>
        {!loading && completionPending.length === 0 && <p className="text-sm text-gray-500">Nothing awaiting sign-off.</p>}
        <div className="space-y-3">
          {completionPending.map((app) => (
            <div key={app.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{app.student.name} — {app.type}</p>
                <p className="text-xs text-gray-500">{app.topic}</p>
                {app.certificate?.reportFilePath && (
                  <a href={app.certificate.reportFilePath} target="_blank" rel="noreferrer" className="text-xs text-wihg-navy underline">View final report</a>
                )}
              </div>
              <button disabled={busyId === app.id || app.certificate?.scientistSignoff} onClick={() => signOff(app)}
                className="bg-wihg-navy text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">
                {app.certificate?.scientistSignoff ? 'Signed off ✓' : 'Confirm Completion'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">All My Students</h2>
        <div className="space-y-2">
          {others.map((app) => (
            <div key={app.id} className="bg-white shadow rounded-lg p-3 flex items-center justify-between text-sm">
              <span>{app.student.name} — {app.type}</span>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
