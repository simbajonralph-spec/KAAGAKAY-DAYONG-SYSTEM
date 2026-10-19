import React, { useState } from 'react';
import DialogModal from '../DialogModal';
import { fmtDate } from '../../constants';

export default function UserApprovals({
  registrations = [],
  onApproveUser,
  onRejectUser,
  onViewUserDetails
}) {
  const [rejectingUser, setRejectingUser] = useState(null);

  return (
    <div id="acontent-user-approvals">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-user-check text-brand-700" aria-hidden="true"></i> Pending registrations
            </h3>
            <p className="card-sub">Verify new accounts before granting access to member features.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Pending member registrations</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Location</th>
                <th scope="col">Registered</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody id="userApprovalList">
              {registrations.length > 0 ? (
                registrations.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold text-slate-900">{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      {m.barangay ? `${m.barangay}, ` : ''}{m.municipality}
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(m.reg_date)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onViewUserDetails(m.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveUser(m.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingUser(m)}
                          className="btn btn-danger-outline btn-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-user-check text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>No registrations are waiting for approval.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {rejectingUser && (
        <DialogModal
          title="Reject registration?"
          isOpen={!!rejectingUser}
          onClose={() => setRejectingUser(null)}
          size="sm"
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setRejectingUser(null) },
            {
              label: 'Reject',
              variant: 'btn-danger',
              onClick: async () => {
                await onRejectUser(rejectingUser.id);
                setRejectingUser(null);
              }
            }
          ]}
        >
          <p className="text-slate-600 leading-relaxed">
            <strong>{rejectingUser.name}</strong> will not be able to sign in.
          </p>
        </DialogModal>
      )}
    </div>
  );
}
