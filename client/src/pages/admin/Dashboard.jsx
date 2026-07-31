import React, { useEffect, useState } from 'react';
import api, { fileUrl } from '../../api';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [scientists, setScientists] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'SCIENTIST', specialization: '', availableSeats: 2, designation: '' });
  const [staffMsg, setStaffMsg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : '';
    Promise.all([
      api.get('/admin/analytics'),
      api.get(`/admin/applications${q}`),
      api.get('/admin/scientists'),
      api.get('/admin/settings'),
    ])
      .then(([a, apps, sci, set]) => {
        setAnalytics(a.data);
        setApplications(apps.data);
        setScientists(sci.data);
        setSettings(set.data);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [statusFilter]);

  // Safe CSV export using Axios instance with attached Bearer token
  async function handleExportCSV() {
    setExporting(true);
    try {
      const response = await api.get('/admin/export.csv', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wihg_applications_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to export CSV. Please re-login and try again.');
    } finally {
      setExporting(false);
    }
  }

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
      setNewStaff({ name: '', email: '', password: '', role: 'SCIENTIST', specialization: '', availableSeats: 2, designation: '' });
      load();
    } catch (err) {
      setStaffMsg({ ok: false, msg: err.response?.data?.error || 'Failed to create account.' });
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const { data } = await api.put('/admin/settings', settings);
      setSettings(data);
      setSettingsMsg({ ok: true, msg: 'Saved — new certificates will use these signatories.' });
    } catch (err) {
      setSettingsMsg({ ok: false, msg: err.response?.data?.error || 'Failed to save.' });
    } finally {
      setSavingSettings(false);
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
          <button 
            type="button"
            onClick={handleExportCSV} 
            disabled={exporting}
            className="text-sm text-wihg-navy underline cursor-pointer bg-transparent border-0 disabled:opacity-50 font-medium"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {!loading && applications.length === 0 && <p className="text-sm text-gray-500">No applications match this filter.</p>}
        {applications.map((app) => (
          <div key={app.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{app.student?.name} — {app.type}</p>
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
                <a href={fileUrl(app.certificate.pdfPath)} target="_blank" rel="noreferrer" className="text-green-700 underline self-center">View Certificate</a>
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
              <input placeholder="Designation (e.g. Scientist-C) — shown on certificates" className="border rounded px-3 py-2 text-sm sm:col-span-2" value={newStaff.designation} onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} />
            </>
          )}
          <button className="sm:col-span-2 bg-wihg-navy text-white rounded py-2 text-sm font-medium">Create Account</button>
          {staffMsg && <p className={`sm:col-span-2 text-xs ${staffMsg.ok ? 'text-green-700' : 'text-red-700'}`}>{staffMsg.msg}</p>}
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-1">Certificate Signatories</h2>
        <p className="text-xs text-gray-500 mb-3">These names appear on every generated certificate as Coordinator and Director. The Supervisor line is filled automatically from the assigned scientist.</p>
        {settings && (
          <form onSubmit={saveSettings} className="bg-white shadow rounded-lg p-4 grid sm:grid-cols-2 gap-3">
            <input placeholder="Coordinator name" className="border rounded px-3 py-2 text-sm" value={settings.coordinatorName || ''} onChange={(e) => setSettings({ ...settings, coordinatorName: e.target.value })} />
            <input placeholder="Coordinator designation" className="border rounded px-3 py-2 text-sm" value={settings.coordinatorDesignation || ''} onChange={(e) => setSettings({ ...settings, coordinatorDesignation: e.target.value })} />
            <input placeholder="Director name" className="border rounded px-3 py-2 text-sm" value={settings.directorName || ''} onChange={(e) => setSettings({ ...settings, directorName: e.target.value })} />
            <input placeholder="Director designation" className="border rounded px-3 py-2 text-sm" value={settings.directorDesignation || ''} onChange={(e) => setSettings({ ...settings, directorDesignation: e.target.value })} />
            <button disabled={savingSettings} className="sm:col-span-2 bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
              {savingSettings ? 'Saving…' : 'Save Signatories'}
            </button>
            {settingsMsg && <p className={`sm:col-span-2 text-xs ${settingsMsg.ok ? 'text-green-700' : 'text-red-700'}`}>{settingsMsg.msg}</p>}
          </form>
        )}
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