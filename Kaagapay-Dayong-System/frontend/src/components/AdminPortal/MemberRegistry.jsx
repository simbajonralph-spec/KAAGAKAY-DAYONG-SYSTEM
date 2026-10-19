import React, { useState } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { fmtDate, peso } from '../../constants';

export default function MemberRegistry({
  members = [],
  onApproveUser,
  onUpdateStatus,
  onViewUserDetails,
  selectedMemberDetails,
  onCloseMemberDetails
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suspendingMember, setSuspendingMember] = useState(null);

  const filteredMembers = members.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div id="acontent-members">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Member registry</h3>
            <p className="card-sub">Review members and manage account access.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <label htmlFor="adm-member-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="adm-member-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input sm:w-40"
            >
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
              <option>Rejected</option>
            </select>

            <label htmlFor="adm-member-search" className="sr-only">
              Search members
            </label>
            <input
              type="search"
              id="adm-member-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email or ID"
              className="input sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Chapter members</caption>
            <thead>
              <tr>
                <th scope="col">Member ID</th>
                <th scope="col">Name</th>
                <th scope="col">Location</th>
                <th scope="col">Contact</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody id="adm-members-tbody">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono font-semibold text-slate-900">{m.id}</td>
                    <td className="font-medium text-slate-900">
                      {m.name}
                      <p className="text-xs text-slate-500 font-normal">{m.email}</p>
                    </td>
                    <td>
                      {m.barangay ? `${m.barangay}, ` : ''}{m.municipality}
                    </td>
                    <td className="whitespace-nowrap">{m.phone || '—'}</td>
                    <td><Badge status={m.status} /></td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onViewUserDetails(m.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Details
                        </button>
                        {(m.status === 'Pending' || m.status === 'Rejected') && (
                          <button
                            type="button"
                            onClick={() => onApproveUser(m.id)}
                            className="btn btn-primary btn-sm"
                          >
                            Approve
                          </button>
                        )}
                        {m.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => setSuspendingMember(m)}
                            className="btn btn-danger-outline btn-sm"
                          >
                            Suspend
                          </button>
                        )}
                        {m.status === 'Suspended' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(m.id, 'Active')}
                            className="btn btn-secondary btn-sm"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-users-slash text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>
                        {searchQuery || statusFilter
                          ? 'No members match your search.'
                          : 'No members in this chapter yet.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendingMember && (
        <DialogModal
          title="Suspend member?"
          isOpen={!!suspendingMember}
          onClose={() => setSuspendingMember(null)}
          size="sm"
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setSuspendingMember(null) },
            {
              label: 'Suspend',
              variant: 'btn-danger',
              onClick: async () => {
                await onUpdateStatus(suspendingMember.id, 'Suspended');
                setSuspendingMember(null);
              }
            }
          ]}
        >
          <p className="text-slate-600 leading-relaxed">
            <strong>{suspendingMember.name}</strong> will be signed out of their next session and
            blocked until you reactivate the account.
          </p>
        </DialogModal>
      )}

      {/* Member Details Modal */}
      {selectedMemberDetails && (
        <DialogModal
          title={
            selectedMemberDetails.member?.status === 'Pending'
              ? 'Review registration'
              : 'Member details'
          }
          isOpen={!!selectedMemberDetails}
          onClose={onCloseMemberDetails}
          size="lg"
          actions={[
            { label: 'Close', variant: 'btn-secondary', onClick: onCloseMemberDetails },
            ...(selectedMemberDetails.member?.status === 'Pending' ||
            selectedMemberDetails.member?.status === 'Rejected'
              ? [
                  {
                    label: 'Approve',
                    variant: 'btn-primary',
                    onClick: () => {
                      onApproveUser(selectedMemberDetails.member.id);
                      onCloseMemberDetails();
                    }
                  }
                ]
              : [])
          ]}
        >
          <dl className="dl mb-5">
            <dt>Member ID</dt>
            <dd className="font-mono">{selectedMemberDetails.member?.id}</dd>
            <dt>Full name</dt>
            <dd>{selectedMemberDetails.member?.name}</dd>
            <dt>Email</dt>
            <dd>{selectedMemberDetails.member?.email}</dd>
            <dt>Mobile</dt>
            <dd>{selectedMemberDetails.member?.phone || '—'}</dd>
            <dt>Chapter</dt>
            <dd>{selectedMemberDetails.member?.municipality}</dd>
            <dt>Barangay / purok</dt>
            <dd>{selectedMemberDetails.member?.barangay || '—'}</dd>
            <dt>Civil status</dt>
            <dd>{selectedMemberDetails.member?.civil_status || '—'}</dd>
            <dt>Registered</dt>
            <dd>{fmtDate(selectedMemberDetails.member?.reg_date)}</dd>
            <dt>Status</dt>
            <dd><Badge status={selectedMemberDetails.member?.status} /></dd>
          </dl>

          <h3 className="font-semibold text-slate-900 mb-2">Payment history</h3>
          {selectedMemberDetails.payments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Payment for</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="text-right">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMemberDetails.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono">{p.ref_no}</td>
                      <td>{p.due_title || 'General contribution'}</td>
                      <td className="whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                      <td className="text-right font-semibold tabular-nums">{peso(p.amount)}</td>
                      <td><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">No payments submitted yet.</p>
          )}

          <h3 className="font-semibold text-slate-900 mt-5 mb-2">Benefit claims</h3>
          {selectedMemberDetails.claims?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Claim</th>
                    <th scope="col">Deceased</th>
                    <th scope="col">Benefits</th>
                    <th scope="col" className="text-right">Amount</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMemberDetails.claims.map((c) => {
                    const bNames = Array.isArray(c.benefits)
                      ? c.benefits.map((b) => b.name).join(', ')
                      : '—';
                    return (
                      <tr key={c.id}>
                        <td className="font-mono">{c.id}</td>
                        <td>{c.deceased_name}</td>
                        <td>{bNames}</td>
                        <td className="text-right font-semibold tabular-nums">{peso(c.amount)}</td>
                        <td><Badge status={c.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No benefit claims filed yet.</p>
          )}
        </DialogModal>
      )}
    </div>
  );
}
