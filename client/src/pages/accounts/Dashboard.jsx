import React, { useEffect, useState } from 'react';
import api from '../../api';

export default function AccountsDashboard() {
  const [payments, setPayments] = useState([]);
  const [joinings, setJoinings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([api.get('/payments/pending'), api.get('/joining/pending')])
      .then(([p, j]) => {
        setPayments(p.data);
        setJoinings(j.data);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function decide(payment, decision) {
    setBusyId(payment.id);
    try {
      await api.patch(`/payments/${payment.id}/decision`, { decision });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function verifyJoining(record) {
    setBusyId(record.id);
    try {
      await api.patch(`/joining/${record.id}/verify`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-wihg-navy">Accounts Dashboard</h1>

      <section>
        <h2 className="font-semibold text-lg mb-3">Pending Fee Verifications</h2>
        {!loading && payments.length === 0 && <p className="text-sm text-gray-500">No pending payments.</p>}
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.application.student.name}</p>
                <p className="text-xs text-gray-500">UTR: {p.utrNumber} · ₹{p.amount}</p>
                <a href={p.receiptFile} target="_blank" rel="noreferrer" className="text-xs text-wihg-navy underline">View receipt</a>
              </div>
              <div className="flex gap-2">
                <button disabled={busyId === p.id} onClick={() => decide(p, 'VERIFY')}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">Verify</button>
                <button disabled={busyId === p.id} onClick={() => decide(p, 'REJECT')}
                  className="bg-red-600 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Physical Joining Verification</h2>
        {!loading && joinings.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
        <div className="space-y-3">
          {joinings.map((record) => (
            <div key={record.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{record.application.student.name}</p>
                <p className="text-xs text-gray-500">Joined: {new Date(record.joiningDate).toLocaleDateString('en-IN')}</p>
              </div>
              <button disabled={busyId === record.id} onClick={() => verifyJoining(record)}
                className="bg-wihg-navy text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50">
                Mark Verified
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
