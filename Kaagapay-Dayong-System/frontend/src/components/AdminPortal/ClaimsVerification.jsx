import React, { useState } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { fmtDate, peso, safeImg } from '../../constants';

export default function ClaimsVerification({
  claims = [],
  reserveFund = 0,
  onReviewClaim,
  toast
}) {
  const [filter, setFilter] = useState('Pending Review');
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const [amount, setAmount] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filteredClaims = claims.filter((c) => {
    if (filter === 'Pending Review') return c.status === 'Pending Review';
    if (filter) return c.status === filter;
    return true;
  });

  const handleOpenReview = (c) => {
    setReviewingClaim(c);
    setAmount(c.amount || '0');
    setReviewNote(c.review_note || '');
    setReviewError('');
  };

  const handleDecision = async (status) => {
    setReviewError('');
    if (status === 'Rejected' && !reviewNote.trim()) {
      setReviewError('Add a note so the member knows why the claim was rejected.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (status === 'Approved' && (isNaN(numAmount) || numAmount <= 0)) {
      setReviewError('Enter a benefit amount greater than zero.');
      return;
    }

    setActionLoading(true);
    try {
      await onReviewClaim(reviewingClaim.id, status, numAmount, reviewNote.trim());
      setReviewingClaim(null);
      setReviewNote('');
    } catch (err) {
      setReviewError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div id="acontent-death-verify">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Benefit claims</h3>
            <p className="card-sub">
              Inspect the death certificate, then approve or reject the claim.
            </p>
          </div>
          <div>
            <label htmlFor="adm-claim-filter" className="sr-only">
              Filter claims
            </label>
            <select
              id="adm-claim-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-44"
            >
              <option value="Pending Review">Pending only</option>
              <option value="">All claims</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Benefit claims</caption>
            <thead>
              <tr>
                <th scope="col">Claim</th>
                <th scope="col">Claimant</th>
                <th scope="col">Deceased</th>
                <th scope="col">Date of death</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody id="adm-death-queue-tbody">
              {filteredClaims.length > 0 ? (
                filteredClaims.map((c) => {
                  const isPending = c.status === 'Pending Review';
                  const benefitNames = Array.isArray(c.benefits)
                    ? c.benefits.map((b) => b.name).join(', ')
                    : '—';
                  return (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold text-slate-900">{c.id}</td>
                      <td className="font-medium">{c.member_name}</td>
                      <td>
                        {c.deceased_name}
                        <p className="text-xs text-slate-500 font-normal mt-0.5">{benefitNames}</p>
                      </td>
                      <td className="whitespace-nowrap">{fmtDate(c.date_of_death)}</td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(c)}
                          className={`btn ${isPending ? 'btn-dark' : 'btn-secondary'} btn-sm`}
                        >
                          {isPending ? 'Review claim' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-file-signature text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>
                        {filter === 'Pending Review'
                          ? 'No claims are waiting for review.'
                          : 'No claims found.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Review Modal */}
      {reviewingClaim && (
        <DialogModal
          title="Review benefit claim"
          isOpen={!!reviewingClaim}
          onClose={() => setReviewingClaim(null)}
          size="lg"
          actions={[
            { label: 'Close', variant: 'btn-secondary', onClick: () => setReviewingClaim(null) },
            ...(reviewingClaim.status === 'Pending Review'
              ? [
                  {
                    label: 'Reject',
                    variant: 'btn-danger-outline',
                    disabled: actionLoading,
                    onClick: () => handleDecision('Rejected')
                  },
                  {
                    label: actionLoading ? 'Processing...' : 'Approve claim',
                    variant: 'btn-primary',
                    disabled: actionLoading,
                    onClick: () => handleDecision('Approved')
                  }
                ]
              : [])
          ]}
        >
          <dl className="dl mb-4">
            <dt>Claim</dt>
            <dd className="font-mono">{reviewingClaim.id}</dd>
            <dt>Claimant</dt>
            <dd>{reviewingClaim.member_name}</dd>
            <dt>Deceased</dt>
            <dd>{reviewingClaim.deceased_name}</dd>
            <dt>Date of death</dt>
            <dd>{fmtDate(reviewingClaim.date_of_death)}</dd>
            <dt>Cause</dt>
            <dd>{reviewingClaim.cause}</dd>
            <dt>Place</dt>
            <dd>{reviewingClaim.place || '—'}</dd>
            <dt>Benefits requested</dt>
            <dd>
              {Array.isArray(reviewingClaim.benefits)
                ? reviewingClaim.benefits.map((b) => b.name).join(', ')
                : '—'}
            </dd>
            <dt>Status</dt>
            <dd><Badge status={reviewingClaim.status} /></dd>
            {reviewingClaim.status !== 'Pending Review' && (
              <>
                <dt>Benefit total</dt>
                <dd className="font-semibold text-emerald-800">{peso(reviewingClaim.amount)}</dd>
              </>
            )}
            {reviewingClaim.status !== 'Pending Review' && reviewingClaim.review_note && (
              <>
                <dt>Note</dt>
                <dd className="text-red-700">{reviewingClaim.review_note}</dd>
              </>
            )}
          </dl>

          <p className="text-sm font-medium text-slate-700 mb-1.5">Death certificate</p>
          <img
            src={safeImg(reviewingClaim.death_cert)}
            alt="Uploaded death certificate"
            className="w-full max-h-72 object-contain rounded-lg border border-slate-200 bg-slate-50"
          />

          {reviewingClaim.status === 'Pending Review' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-amount" className="label">
                  Benefit amount (₱)
                </label>
                <input
                  id="claim-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input"
                />
                <p className="hint">Chapter reserve: {peso(reserveFund)}</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="claim-note" className="label">
                  Note to member <span className="font-normal text-slate-500">(required when rejecting)</span>
                </label>
                <textarea
                  id="claim-note"
                  rows="2"
                  maxLength={200}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="input"
                  placeholder="Optional review remarks or reason for rejection"
                ></textarea>
              </div>

              {reviewError && (
                <p id="claim-review-error" className="text-sm text-red-700 sm:col-span-2" role="alert">
                  {reviewError}
                </p>
              )}
            </div>
          )}
        </DialogModal>
      )}
    </div>
  );
}
