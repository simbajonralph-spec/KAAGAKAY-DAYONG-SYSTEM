import React, { useState } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { fmtDate, peso, safeImg } from '../../constants';

export default function PaymentVerification({
  payments = [],
  onReviewPayment
}) {
  const [filter, setFilter] = useState('Pending');
  const [reviewingPay, setReviewingPay] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filteredPayments = payments.filter((p) => {
    if (filter === 'Pending') return p.status === 'Pending';
    if (filter) return p.status === filter;
    return true;
  });

  const handleDecision = async (status) => {
    setReviewError('');
    if (status === 'Rejected' && !reviewNote.trim()) {
      setReviewError('Add a note so the member knows what to fix.');
      return;
    }

    setActionLoading(true);
    try {
      await onReviewPayment(reviewingPay.id, status, reviewNote.trim());
      setReviewingPay(null);
      setReviewNote('');
    } catch (err) {
      setReviewError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div id="acontent-payment-verify">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Payment verification</h3>
            <p className="card-sub">
              Review member receipts and confirm or reject each transaction.
            </p>
          </div>
          <div>
            <label htmlFor="adm-payment-filter" className="sr-only">
              Filter payments
            </label>
            <select
              id="adm-payment-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-44"
            >
              <option value="Pending">Pending only</option>
              <option value="">All payments</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Member payments</caption>
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Member</th>
                <th scope="col">Payment for</th>
                <th scope="col">Date</th>
                <th scope="col">Channel</th>
                <th scope="col" className="text-right">Amount</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody id="adm-payment-queue-tbody">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const isPending = p.status === 'Pending';
                  return (
                    <tr key={p.id}>
                      <td className="font-mono font-semibold text-slate-900">{p.ref_no}</td>
                      <td className="font-medium">{p.member_name}</td>
                      <td>{p.due_title || 'General contribution'}</td>
                      <td className="whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                      <td>{p.method}</td>
                      <td className="text-right font-semibold tabular-nums">{peso(p.amount)}</td>
                      <td><Badge status={p.status} /></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingPay(p);
                            setReviewNote(p.review_note || '');
                            setReviewError('');
                          }}
                          className={`btn ${isPending ? 'btn-dark' : 'btn-secondary'} btn-sm`}
                        >
                          {isPending ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-clipboard-check text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>
                        {filter === 'Pending'
                          ? 'No payments are waiting for verification.'
                          : 'No payments found.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Review Modal */}
      {reviewingPay && (
        <DialogModal
          title="Verify payment"
          isOpen={!!reviewingPay}
          onClose={() => setReviewingPay(null)}
          size="lg"
          actions={[
            { label: 'Close', variant: 'btn-secondary', onClick: () => setReviewingPay(null) },
            ...(reviewingPay.status === 'Pending'
              ? [
                  {
                    label: 'Reject',
                    variant: 'btn-danger-outline',
                    disabled: actionLoading,
                    onClick: () => handleDecision('Rejected')
                  },
                  {
                    label: actionLoading ? 'Processing...' : 'Approve payment',
                    variant: 'btn-primary',
                    disabled: actionLoading,
                    onClick: () => handleDecision('Approved')
                  }
                ]
              : [])
          ]}
        >
          <dl className="dl mb-4">
            <dt>Member</dt>
            <dd>{reviewingPay.member_name}</dd>
            <dt>Payment for</dt>
            <dd>{reviewingPay.due_title || 'General contribution'}</dd>
            <dt>Reference</dt>
            <dd className="font-mono">{reviewingPay.ref_no}</dd>
            <dt>Channel</dt>
            <dd>{reviewingPay.method}</dd>
            <dt>Amount</dt>
            <dd>{peso(reviewingPay.amount)}</dd>
            <dt>Date paid</dt>
            <dd>{fmtDate(reviewingPay.payment_date)}</dd>
            <dt>Status</dt>
            <dd><Badge status={reviewingPay.status} /></dd>
            {reviewingPay.status !== 'Pending' && reviewingPay.review_note && (
              <>
                <dt>Note</dt>
                <dd className="text-red-700">{reviewingPay.review_note}</dd>
              </>
            )}
          </dl>

          <p className="text-sm font-medium text-slate-700 mb-1.5">Uploaded proof</p>
          <img
            src={safeImg(reviewingPay.proof)}
            alt="Uploaded proof of payment"
            className="w-full max-h-72 object-contain rounded-lg border border-slate-200 bg-slate-50"
          />

          {reviewingPay.status === 'Pending' && (
            <div className="mt-4">
              <label htmlFor="pay-review-note" className="label">
                Note to member <span className="font-normal text-slate-500">(required when rejecting)</span>
              </label>
              <textarea
                id="pay-review-note"
                rows="2"
                maxLength={200}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="input"
                placeholder="e.g. Reference number does not match the receipt"
              ></textarea>
              {reviewError && (
                <p id="pay-review-error" className="text-sm text-red-700 mt-1.5" role="alert">
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
