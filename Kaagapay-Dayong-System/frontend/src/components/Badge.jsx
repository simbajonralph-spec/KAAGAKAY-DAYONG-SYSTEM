import React from 'react';

export default function Badge({ status }) {
  const map = {
    Active: ['badge-green', 'fa-circle-check', 'Active'],
    Approved: ['badge-green', 'fa-circle-check', 'Approved'],
    paid: ['badge-green', 'fa-circle-check', 'Paid'],
    Open: ['badge-green', 'fa-circle', 'Open'],
    Pending: ['badge-amber', 'fa-clock', 'Pending'],
    'Pending Review': ['badge-amber', 'fa-clock', 'Pending review'],
    review: ['badge-amber', 'fa-clock', 'Under review'],
    Rejected: ['badge-red', 'fa-circle-xmark', 'Rejected'],
    Suspended: ['badge-red', 'fa-ban', 'Suspended'],
    overdue: ['badge-red', 'fa-circle-exclamation', 'Overdue'],
    unpaid: ['badge-slate', 'fa-circle', 'Unpaid'],
    Closed: ['badge-slate', 'fa-lock', 'Closed']
  };

  const [cls, icon, label] = map[status] || ['badge-slate', 'fa-circle', status];

  return (
    <span className={`badge ${cls}`}>
      <i className={`fa-solid ${icon} text-[10px]`} aria-hidden="true"></i>
      {label || status}
    </span>
  );
}
