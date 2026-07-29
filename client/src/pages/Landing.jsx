import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Landing() {
  const [scientists, setScientists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ studentName: '', studentEmail: '', proposedDuration: '', message: '' });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api
      .get('/scientists')
      .then((res) => setScientists(Array.isArray(res.data) ? res.data : []))
      .catch(() => setScientists([]));
  }, []);

  const grouped = scientists.reduce((acc, s) => {
    acc[s.specialization] = acc[s.specialization] || [];
    acc[s.specialization].push(s);
    return acc;
  }, {});

  async function sendInquiry(e) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      await api.post(`/scientists/${selected.id}/contact`, form);
      setFeedback({ ok: true, msg: 'Your inquiry has been sent to the scientist. They will reply to your email directly.' });
      setForm({ studentName: '', studentEmail: '', proposedDuration: '', message: '' });
    } catch (err) {
      setFeedback({ ok: false, msg: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-wihg-navy mb-2">Internship & Dissertation Programme</h1>
      <p className="text-gray-600 mb-8">Wadia Institute of Himalayan Geology — Training Cell</p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-lg mb-2 text-wihg-navy">Internship Programme</h2>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Open to undergraduate & postgraduate students in Earth Sciences and allied disciplines.</li>
            <li>Typical duration: 2–8 weeks.</li>
            <li>Hands-on exposure to labs, field data, and ongoing research projects.</li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-lg mb-2 text-wihg-navy">Dissertation Work</h2>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>For students pursuing M.Sc./M.Tech. dissertation or thesis components.</li>
            <li>Typical duration: 1–6 months, under a named scientist supervisor.</li>
            <li>Ends with a submitted report and supervisor sign-off before certification.</li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-wihg-navy mb-4">Connect with a Scientist</h2>
      <p className="text-sm text-gray-600 mb-4">
        Browse scientists by research area and send a pre-application inquiry. This is an informal first step —
        you'll still need to submit the formal Application Form after you sign up.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {Object.keys(grouped).length === 0 && <p className="text-gray-500 text-sm">Loading scientist directory…</p>}
          {Object.entries(grouped).map(([discipline, list]) => (
            <div key={discipline}>
              <h3 className="font-semibold text-wihg-navy mb-2">{discipline}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`text-left border rounded-lg p-3 hover:border-wihg-navy transition ${selected?.id === s.id ? 'border-wihg-navy ring-2 ring-wihg-navy/20' : 'border-gray-200'}`}
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.availableSeats} seat(s) available</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-5 h-fit sticky top-6">
          {!selected && <p className="text-sm text-gray-500">Select a scientist to send an inquiry.</p>}
          {selected && (
            <form onSubmit={sendInquiry} className="space-y-3">
              <p className="font-semibold text-wihg-navy">Message {selected.name}</p>
              <input required placeholder="Your full name" className="w-full border rounded px-3 py-2 text-sm"
                value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
              <input required type="email" placeholder="Your email" className="w-full border rounded px-3 py-2 text-sm"
                value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} />
              <input placeholder="Proposed duration (e.g. 4 weeks)" className="w-full border rounded px-3 py-2 text-sm"
                value={form.proposedDuration} onChange={(e) => setForm({ ...form, proposedDuration: e.target.value })} />
              <textarea required placeholder="Describe your area of interest, background, and goals..." rows={4}
                className="w-full border rounded px-3 py-2 text-sm"
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button disabled={sending} className="w-full bg-wihg-navy text-white rounded py-2 text-sm font-medium disabled:opacity-50">
                {sending ? 'Sending…' : 'Send Inquiry'}
              </button>
              {feedback && (
                <p className={`text-xs ${feedback.ok ? 'text-green-700' : 'text-red-700'}`}>{feedback.msg}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
