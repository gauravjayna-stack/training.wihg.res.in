import React from 'react';

const STYLES = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  FEE_PAYMENT_NEEDED: 'bg-orange-100 text-orange-800',
  VERIFICATION_PENDING: 'bg-blue-100 text-blue-800',
  APPROVED_FOR_JOINING: 'bg-teal-100 text-teal-800',
  ONBOARDED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETION_PENDING: 'bg-pink-100 text-pink-800',
  CERTIFICATE_READY: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
