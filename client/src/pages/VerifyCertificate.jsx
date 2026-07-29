import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function VerifyCertificate() {
  const { certNo } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/certificates/verify/${encodeURIComponent(certNo)}`)
      .then((res) => setResult(res.data))
      .catch((err) => setResult(err.response?.data || { valid: false, message: 'Verification failed.' }))
      .finally(() => setLoading(false));
  }, [certNo]);

  return (
    <div className="max-w-lg mx-auto mt-16 bg-white shadow rounded-lg p-6 text-center">
      <h1 className="text-xl font-bold text-wihg-navy mb-4">Certificate Verification</h1>
      {loading && <p className="text-gray-500 text-sm">Checking…</p>}
      {!loading && result?.valid && (
        <div className="text-left space-y-2">
          <p className="text-green-700 font-semibold text-center mb-3">✔ Valid Certificate</p>
          <p><span className="text-gray-500">Certificate No.:</span> {result.certNo}</p>
          <p><span className="text-gray-500">Name:</span> {result.studentName}</p>
          <p><span className="text-gray-500">Type:</span> {result.type}</p>
          {result.topic && <p><span className="text-gray-500">Topic:</span> {result.topic}</p>}
          <p><span className="text-gray-500">Mentor:</span> {result.mentor || '—'}</p>
          <p><span className="text-gray-500">Issued:</span> {new Date(result.issueDate).toLocaleDateString('en-IN')}</p>
        </div>
      )}
      {!loading && !result?.valid && (
        <p className="text-red-700 font-medium">✘ {result?.message || 'This certificate could not be verified.'}</p>
      )}
    </div>
  );
}
