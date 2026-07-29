import React, { useEffect, useState } from 'react';
import api from '../../api';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [scientists, setScientists] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'SCIENTIST', specialization: '', availableSeats: 2 });
  const [staffMsg, setStaffMsg] = useState(null);

  function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : '';
    Promise.all([
      api.get('/admin/analytics'),
      api.get(`/admin/applications${q}`),
      api.get('/admin/scientists'),
    ])
      .then(([a, apps, sci]) => {
        setAnalytics(a.data);
        setApplications(apps.data);
        setScientists(sci.data);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [statusFilter]);

  async function decide(app, decision) {
    setBusyId(app.id);
    try {
      await api.patch(`/admin/applications/${app.id}/decision`, { decision });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function autoAllocate(app) {
    setBusyId(app.id);
    try {
      await api.patch(`/admin/applications/${app.id}/auto-allocate`, {});
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Auto-allocation failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function grantWaiver(app) {
    const reason = prompt('EWS fee waiver reason (Director-approved note):', 'EWS category — Director approved');
    if (reason === null) return;
    setBusyId(app.id);
    try {
      await api.patch(`/admin/applications/${app.id}/waiver`, { approve: true, reason });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function generateCertificate(app) {
    setBusyId(app.id);
    try {
      await api.post(`/certificates/${app.id}/generate`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Certificate generation failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function createStaff(e) {
    e.preventDefault();
    setStaffMsg(null);
    try {
      await api.post('/admin/users', newStaff);
      setStaffMsg({ ok: true, msg: 'Account created.' });
      setNewStaff({ name: '', email: '', password: '', role: 'SCIENTIST', specialization: '', availableSeats: 2 });
      load();
    } catch (err) {
      setStaffMsg({ ok: false, msg: err.response?.data?.error || 'Failed to create account.' });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <h1 className="text-2xl font-bold text-wihg-navy">Training Cell / Admin Dashboard</h1>

      {analytics && (
        <section className="grid sm:grid-cols-4 gap-4">
          <StatCard label="Internships" value={analytics.totalInterns} />
          <StatCard label="Dissertations" value={analytics.totalDissertations} />
          <StatCard label="Scientists" value={scientists.length} />
          <StatCard label="Total Applications" value={analytics.byStatus.reduce((s, x) => s + x.count, 0)} />
        </section>
      )}

      <section className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Applications</h2>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All statuses</option>
            {['PENDING_APPROVAL', 'FEE_PAYMENT_NEEDED', 'VERIFICATION_PENDING', 'APPROVED_FOR_JOINING', 'ONBOARDED', 'IN_PROGRESS', 'COMPLETION_PENDING', 'CERTIFICATE_READY', 'REJECTED'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <a href="/api/admin/export.csv" className="text-sm text-wihg-navy underline">Export CSV</a>
        </div>
      </section>

      <div className="space-y-3">
        {!loading && applications.length === 0 && <p className="text-sm text-gray-500">No applications match this filter.</p>}
        {applications.map((app) => (
          <div key={app.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{app.student.name} — {app.type}</p>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {app.collegeName} · Mentor: {app.scientist?.name || (app.autoAssignRequested ? 'Unassigned (auto-allocate requested)' : '—')}
              {app.feeWaived && <span className="text-green-700 font-medium"> · Fee waived</span>}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {app.status === 'PENDING_APPROVAL' && !app.scientist && (
                <button disabled={busyId === app.id} onClick={() => autoAllocate(app)} className="bg-blue-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">Auto-Allocate Mentor</button>
              )}
              {app.status === 'PENDING_APPROVAL' && (
                <>
                  <button disabled={busyId === app.id} onClick={() => decide(app, 'APPROVE')} className="bg-green-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">Approve</button>
                  <button disabled={busyId === app.id} onClick={() => decide(app, 'REJECT')} className="bg-red-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">Reject</button>
                </>
              )}
              {['FEE_PAYMENT_NEEDED', 'VERIFICATION_PENDING'].includes(app.status) && !app.feeWaived && (
                <button disabled={busyId === app.id} onClick={() => grantWaiver(app)} className="bg-amber-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">Grant EWS Fee Waiver</button>
              )}
              {app.status === 'COMPLETION_PENDING' && app.certificate?.scientistSignoff && !app.certificate?.adminApproved && (
                <button disabled={busyId === app.id} onClick={() => generateCertificate(app)} className="bg-wihg-navy text-white px-3 py-1.5 rounded font-medium disabled:opacity-50">Generate Certificate</button>
              )}
              {app.certificate?.pdfPath && (
                <a href={app.certificate.pdfPath} target="_blank" rel="noreferrer" className="text-green-700 underline self-center">View Certificate</a>
              )}
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-3">Create Staff Account</h2>
        <form onSubmit={createStaff} className="bg-white shadow rounded-lg p-4 grid sm:grid-cols-2 gap-3">
          <input required placeholder="Name" className="border rounded px-3 py-2 text-sm" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="border rounded px-3 py-2 text-sm" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
          <input required type="password" placeholder="Temporary password" className="border rounded px-3 py-2 text-sm" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
          <select className="border rounded px-3 py-2 text-sm" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
            <option value="SCIENTIST">Scientist</option>
            <option value="ACCOUNTS">Accounts</option>
            <option value="ADMIN">Admin</option>
          </select>
          {newStaff.role === 'SCIENTIST' && (
            <>
              <input placeholder="Specialization" className="border rounded px-3 py-2 text-sm" value={newStaff.specialization} onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })} />
              <input type="number" placeholder="Available seats" className="border rounded px-3 py-2 text-sm" value={newStaff.availableSeats} onChange={(e) => setNewStaff({ ...newStaff, availableSeats: Number(e.target.value) })} />
            </>
          )}
          <button className="sm:col-span-2 bg-wihg-navy text-white rounded py-2 text-sm font-medium">Create Account</button>
          {staffMsg && <p className={`sm:col-span-2 text-xs ${staffMsg.ok ? 'text-green-700' : 'text-red-700'}`}>{staffMsg.msg}</p>}
        </form>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-wihg-navy">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
