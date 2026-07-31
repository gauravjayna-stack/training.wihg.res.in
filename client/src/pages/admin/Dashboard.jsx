import React, { useEffect, useState } from 'react';
import api, { fileUrl } from '../../api';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [scientists, setScientists] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SCIENTIST',
    specialization: '',
    availableSeats: 2,
    designation: '',
  });
  const [staffMsg, setStaffMsg] = useState(null);

  // Signatories Settings State
  const [settings, setSettings] = useState(null);
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Custom Report Date Range State
  const [reportFilter, setReportFilter] = useState({ year: '', discipline: '', status: '' });

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
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  // Handlers
  async function handleExportCSV() {
    setExporting(true);
    try {
      const response = await api.get('/admin/export.csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wihg_applications_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('Failed to export CSV. Please refresh and try again.');
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
      setStaffMsg({ ok: true, msg: 'Staff account created successfully.' });
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
      setSettingsMsg({ ok: true, msg: 'Signatories saved! Future certificates will use these details.' });
    } catch (err) {
      setSettingsMsg({ ok: false, msg: err.response?.data?.error || 'Failed to save.' });
    } finally {
      setSavingSettings(false);
    }
  }

  // Calculated Report Metrics
  const filteredAppsForReport = applications.filter((app) => {
    if (reportFilter.status && app.status !== reportFilter.status) return false;
    if (reportFilter.discipline && app.scientist?.specialization !== reportFilter.discipline) return false;
    if (reportFilter.year && new Date(app.createdAt).getFullYear().toString() !== reportFilter.year) return false;
    return true;
  });

  const totalRevenue = applications
    .filter((a) => a.payment?.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 p-5 space-y-6">
        <div className="border-b border-slate-700 pb-4">
          <h2 className="text-xl font-bold tracking-wide text-blue-400">WIHG Admin</h2>
          <p className="text-xs text-slate-400 mt-1">Training Cell Portal</p>
        </div>

        <nav className="space-y-1">
          <SidebarTab id="overview" label="📊 Analytics & Charts" active={activeTab} setActive={setActiveTab} />
          <SidebarTab id="students" label="🎓 Applications List" active={activeTab} setActive={setActiveTab} badge={applications.length} />
          <SidebarTab id="reports" label="📈 Reports & Exports" active={activeTab} setActive={setActiveTab} />
          <SidebarTab id="staff" label="👨‍💼 Staff Management" active={activeTab} setActive={setActiveTab} />
          <SidebarTab id="settings" label="✍️ Certificate Signatories" active={activeTab} setActive={setActiveTab} />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* TAB 1: OVERVIEW & INFOGRAPHICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard Infographics</h1>
              <p className="text-sm text-slate-500">Visual breakdown of applications, discipline trends, and status counts.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Applications" value={applications.length} icon="📝" color="border-blue-500" />
              <KpiCard label="Internship Trainees" value={analytics?.totalInterns || 0} icon="🔬" color="border-emerald-500" />
              <KpiCard label="Dissertation Students" value={analytics?.totalDissertations || 0} icon="📚" color="border-purple-500" />
              <KpiCard label="Est. Revenue (₹)" value={`₹${totalRevenue.toLocaleString()}`} icon="💰" color="border-amber-500" />
            </div>

            {/* Infographics / Bar Chart Representation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Status Breakdown */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📌</span> Status Breakdown
                </h3>
                <div className="space-y-3">
                  {analytics?.byStatus?.map((item) => {
                    const percentage = Math.round((item.count / (applications.length || 1)) * 100);
                    return (
                      <div key={item.status}>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>{item.status.replace(/_/g, ' ')}</span>
                          <span>{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specialization Breakdown */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>🌋</span> Applications by Specialization
                </h3>
                <div className="space-y-3">
                  {analytics?.byDiscipline?.map((item) => {
                    const percentage = Math.round((item.count / (applications.length || 1)) * 100);
                    return (
                      <div key={item.discipline}>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>{item.discipline || 'General'}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT APPLICATIONS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Student Applications</h1>
                <p className="text-sm text-slate-500">Manage student onboarding, auto-allocation, fee waivers, and certificates.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Statuses</option>
                  {['PENDING_APPROVAL', 'FEE_PAYMENT_NEEDED', 'VERIFICATION_PENDING', 'APPROVED_FOR_JOINING', 'ONBOARDED', 'IN_PROGRESS', 'COMPLETION_PENDING', 'CERTIFICATE_READY', 'REJECTED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500 py-10 text-center">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="text-slate-500 py-10 text-center bg-white rounded-xl border">No applications match this status filter.</p>
            ) : (
              <div className="grid gap-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-base">{app.student?.name || 'N/A'}</h3>
                        <p className="text-xs text-slate-500">{app.student?.email} · {app.collegeName}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg my-3 grid sm:grid-cols-3 gap-2">
                      <div><span className="font-medium text-slate-500">Type:</span> {app.type}</div>
                      <div><span className="font-medium text-slate-500">Supervisor:</span> {app.scientist?.name || 'Unassigned'}</div>
                      <div><span className="font-medium text-slate-500">Fee Status:</span> {app.feeWaived ? 'Waived (EWS)' : app.payment?.status || 'N/A'}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs pt-1">
                      {app.status === 'PENDING_APPROVAL' && !app.scientist && (
                        <button disabled={busyId === app.id} onClick={() => autoAllocate(app)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Auto-Allocate Mentor</button>
                      )}
                      {app.status === 'PENDING_APPROVAL' && (
                        <>
                          <button disabled={busyId === app.id} onClick={() => decide(app, 'APPROVE')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                          <button disabled={busyId === app.id} onClick={() => decide(app, 'REJECT')} className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">Reject</button>
                        </>
                      )}
                      {['FEE_PAYMENT_NEEDED', 'VERIFICATION_PENDING'].includes(app.status) && !app.feeWaived && (
                        <button disabled={busyId === app.id} onClick={() => grantWaiver(app)} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50">Grant EWS Fee Waiver</button>
                      )}
                      {app.status === 'COMPLETION_PENDING' && app.certificate?.scientistSignoff && !app.certificate?.adminApproved && (
                        <button disabled={busyId === app.id} onClick={() => generateCertificate(app)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-black disabled:opacity-50">Generate Certificate</button>
                      )}
                      {app.certificate?.pdfPath && (
                        <a href={fileUrl(app.certificate.pdfPath)} target="_blank" rel="noreferrer" className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200">View Certificate 📄</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTS & EXPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Reports & Data Exports</h1>
              <p className="text-sm text-slate-500">Generate custom summaries or export full dataset into Excel/CSV.</p>
            </div>

            {/* Export Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800">Download Full CSV Report</h3>
                <p className="text-xs text-slate-500 mt-1">Includes student details, supervisor names, dates, fee waiver statuses, and certificate links.</p>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                <span>📥</span> {exporting ? 'Generating CSV...' : 'Export Complete CSV'}
              </button>
            </div>

            {/* Dynamic Filtered Summary Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800">Custom Report Generator</h3>
              
              <div className="grid sm:grid-cols-3 gap-3">
                <select className="border rounded-lg px-3 py-2 text-sm" value={reportFilter.discipline} onChange={(e) => setReportFilter({ ...reportFilter, discipline: e.target.value })}>
                  <option value="">All Disciplines</option>
                  {analytics?.byDiscipline?.map((d) => (
                    <option key={d.discipline} value={d.discipline}>{d.discipline}</option>
                  ))}
                </select>

                <select className="border rounded-lg px-3 py-2 text-sm" value={reportFilter.status} onChange={(e) => setReportFilter({ ...reportFilter, status: e.target.value })}>
                  <option value="">All Statuses</option>
                  {['PENDING_APPROVAL', 'APPROVED_FOR_JOINING', 'IN_PROGRESS', 'CERTIFICATE_READY', 'REJECTED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>

                <button onClick={() => setReportFilter({ year: '', discipline: '', status: '' })} className="text-xs text-blue-600 underline text-left sm:text-right self-center">Clear Filters</button>
              </div>

              {/* Summary Results */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Supervisor</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppsForReport.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-slate-400">No applications match the report criteria.</td></tr>
                    ) : (
                      filteredAppsForReport.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{app.student?.name || 'N/A'}</td>
                          <td className="p-3">{app.type}</td>
                          <td className="p-3">{app.collegeName}</td>
                          <td className="p-3">{app.scientist?.name || 'Unassigned'}</td>
                          <td className="p-3">{app.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Staff Account Creation</h1>
              <p className="text-sm text-slate-500">Add new Scientist, Accounts, or Admin accounts to the platform.</p>
            </div>

            <form onSubmit={createStaff} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input required placeholder="Dr. Jane Doe" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input required type="email" placeholder="jane@wihg.res.in" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Temporary Password</label>
                <input required type="password" placeholder="••••••••" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                  <option value="SCIENTIST">Scientist (Mentor)</option>
                  <option value="ACCOUNTS">Accounts Officer</option>
                  <option value="ADMIN">Admin / Training Cell</option>
                </select>
              </div>

              {newStaff.role === 'SCIENTIST' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization / Discipline</label>
                    <input placeholder="e.g. Geomorphology" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.specialization} onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Available Trainee Seats</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.availableSeats} onChange={(e) => setNewStaff({ ...newStaff, availableSeats: Number(e.target.value) })} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Official Designation</label>
                    <input placeholder="e.g. Scientist-E" className="w-full border rounded-lg px-3 py-2 text-sm" value={newStaff.designation} onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} />
                  </div>
                </>
              )}

              <button className="sm:col-span-2 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-black transition">
                Create Account
              </button>

              {staffMsg && (
                <p className={`sm:col-span-2 text-xs font-medium p-2 rounded ${staffMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {staffMsg.msg}
                </p>
              )}
            </form>
          </div>
        )}

        {/* TAB 5: CERTIFICATE SIGNATORIES */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Certificate Signatories Settings</h1>
              <p className="text-sm text-slate-500">Set default names and designations printed on issued certificates.</p>
            </div>

            {settings ? (
              <form onSubmit={saveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Coordinator Name</label>
                  <input placeholder="e.g. Dr. A. K. Singh" className="w-full border rounded-lg px-3 py-2 text-sm" value={settings.coordinatorName || ''} onChange={(e) => setSettings({ ...settings, coordinatorName: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Coordinator Designation</label>
                  <input placeholder="Coordinator, Training Cell" className="w-full border rounded-lg px-3 py-2 text-sm" value={settings.coordinatorDesignation || ''} onChange={(e) => setSettings({ ...settings, coordinatorDesignation: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Director Name</label>
                  <input placeholder="e.g. Prof. Kalachand Sain" className="w-full border rounded-lg px-3 py-2 text-sm" value={settings.directorName || ''} onChange={(e) => setSettings({ ...settings, directorName: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Director Designation</label>
                  <input placeholder="Director, WIHG" className="w-full border rounded-lg px-3 py-2 text-sm" value={settings.directorDesignation || ''} onChange={(e) => setSettings({ ...settings, directorDesignation: e.target.value })} />
                </div>

                <button disabled={savingSettings} className="sm:col-span-2 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-50 transition">
                  {savingSettings ? 'Saving Details...' : 'Save Signatory Details'}
                </button>

                {settingsMsg && (
                  <p className={`sm:col-span-2 text-xs font-medium p-2 rounded ${settingsMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {settingsMsg.msg}
                  </p>
                )}
              </form>
            ) : (
              <p className="text-slate-500">Loading signatory settings...</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Sidebar Navigation Button Helper
function SidebarTab({ id, label, active, setActive, badge }) {
  const isSelected = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        isSelected ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// KPI Stat Card Helper
function KpiCard({ label, value, icon, color }) {
  return (
    <div className={`bg-white p-5 rounded-xl border-l-4 shadow-sm ${color} border-slate-200`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}