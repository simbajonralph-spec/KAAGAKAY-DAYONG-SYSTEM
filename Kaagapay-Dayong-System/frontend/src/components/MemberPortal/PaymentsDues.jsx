import React, { useState, useEffect } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { peso, fmtDate, todayStr, safeImg } from '../../constants';

export default function PaymentsDues({
  dashboardData,
  payments = [],
  selectedDueId,
  onSubmitPayment,
  toast
}) {
  const user = dashboardData?.user || {};
  const chapter = dashboardData?.chapter || {};
  const dues = dashboardData?.dues || [];
  const unpaidDues = dues.filter(
    (d) => d.paymentState === 'unpaid' || d.paymentState === 'overdue'
  );

  const [paymentDue, setPaymentDue] = useState(selectedDueId || (unpaidDues[0]?.id || 'GENERAL'));
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [refNo, setRefNo] = useState('');
  const [amount, setAmount] = useState('');
  const [datePaid, setDatePaid] = useState(todayStr());
  const [proofPreview, setProofPreview] = useState(null);
  const [proofBase64, setProofBase64] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [viewingPayment, setViewingPayment] = useState(null);

  useEffect(() => {
    if (selectedDueId) {
      setPaymentDue(selectedDueId);
    }
  }, [selectedDueId]);

  useEffect(() => {
    const due = dues.find((d) => d.id === paymentDue);
    if (due) {
      setAmount(due.amount);
    } else if (paymentDue === 'GENERAL' && !amount) {
      setAmount('50');
    }
  }, [paymentDue, dues]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setProofPreview(null);
    setProofBase64(null);
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      toast('Please choose an image file (JPG or PNG).', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('The image is larger than 10 MB. Choose a smaller file.', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result);
      setProofBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard.', 'success');
    } catch (_) {
      toast('Failed to copy. Please select and copy manually.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!refNo.trim()) {
      setFormError('Enter the reference number from your receipt.');
      return;
    }
    if (!/^[A-Za-z0-9\-]{4,40}$/.test(refNo.trim())) {
      setFormError('The reference number should be 4–40 letters, numbers, or dashes.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Enter the amount you paid.');
      return;
    }
    const due = dues.find((d) => d.id === paymentDue);
    if (due && numAmount < parseFloat(due.amount)) {
      setFormError(`The amount must be at least ${peso(due.amount)} for this due.`);
      return;
    }
    if (!datePaid || datePaid > todayStr()) {
      setFormError('The payment date cannot be in the future.');
      return;
    }
    if (paymentMethod !== 'Office Cash Counter' && !proofBase64) {
      setFormError('Upload a screenshot or photo of your receipt.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPayment({
        due_id: paymentDue,
        method: paymentMethod,
        ref_no: refNo.trim(),
        amount: numAmount,
        payment_date: datePaid,
        proofBase64
      });

      // Reset form
      setRefNo('');
      setProofPreview(null);
      setProofBase64(null);
      setDatePaid(todayStr());
    } catch (err) {
      setFormError(err.message || 'Payment submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCash = paymentMethod === 'Office Cash Counter';

  return (
    <div id="mcontent-payments" className="space-y-6">
      {/* Chapter Dues Full List */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-list-check text-brand-700" aria-hidden="true"></i> Dues for your chapter
            </h3>
            <p className="card-sub">Only dues posted by your chapter admin are shown here.</p>
          </div>
        </div>
        <div id="dues-full-list" className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {dues.length > 0 ? (
            dues.map((d) => {
              const isOverdue = d.paymentState === 'overdue';
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border ${
                    isOverdue ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50/50'
                  } p-4 flex flex-col gap-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{d.title}</h4>
                      <p className="text-sm text-slate-500">{d.description}</p>
                    </div>
                    <Badge status={d.paymentState} />
                  </div>
                  <div className="flex items-end justify-between gap-2 pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">{peso(d.amount)}</p>
                      <p className="text-xs text-slate-500">Due {fmtDate(d.due_date)}</p>
                    </div>
                    {(d.paymentState === 'unpaid' || d.paymentState === 'overdue') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentDue(d.id);
                          document
                            .getElementById('form-submit-payment')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Pay now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="md:col-span-2 empty py-6">
              <i className="fa-solid fa-circle-check text-2xl text-slate-300 mb-2"></i>
              <span>No dues are open for your chapter.</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Channels & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels Sidebar */}
        <div className="card self-start">
          <div className="card-head">
            <h3 className="card-title">
              <i className="fa-solid fa-qrcode text-brand-700" aria-hidden="true"></i> Chapter payment channels
            </h3>
          </div>
          <div className="p-5 space-y-3">
            <p id="channel-admin-name" className="text-sm font-medium text-slate-700">
              {user.municipality} chapter
            </p>

            <div
              id="channel-gcash"
              className={`rounded-lg border border-sky-200 bg-sky-50 p-4 transition-all ${
                paymentMethod === 'GCash' ? 'ring-2 ring-brand-600' : 'opacity-85'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-sky-900">GCash</span>
                <span className="badge badge-blue">E-wallet</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Account name: <strong>{chapter.gcashAcc || '—'}</strong>
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono font-semibold text-slate-900">{chapter.gcashNum || '—'}</p>
                {chapter.gcashNum && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(chapter.gcashNum)}
                    className="btn btn-secondary btn-sm"
                  >
                    <i className="fa-regular fa-copy" aria-hidden="true"></i> Copy
                  </button>
                )}
              </div>
            </div>

            <div
              id="channel-bank"
              className={`rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition-all ${
                paymentMethod === 'Bank Transfer' ? 'ring-2 ring-brand-600' : 'opacity-85'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900">Bank transfer</span>
                <span className="badge badge-green">Landbank</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Account name: <strong>{chapter.bankAcc || '—'}</strong>
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono font-semibold text-slate-900">{chapter.bankNum || '—'}</p>
                {chapter.bankNum && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(chapter.bankNum)}
                    className="btn btn-secondary btn-sm"
                  >
                    <i className="fa-regular fa-copy" aria-hidden="true"></i> Copy
                  </button>
                )}
              </div>
            </div>

            <div
              id="channel-cash"
              className={`rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 transition-all ${
                isCash ? 'ring-2 ring-brand-600' : 'opacity-85'
              }`}
            >
              <span className="font-semibold text-slate-800 block mb-1">Office cash counter</span>
              Pay in person at your chapter office and enter the official receipt number below.
            </div>
          </div>
        </div>

        {/* Submit Payment Form & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-head">
              <div>
                <h3 className="card-title">Submit payment for verification</h3>
                <p className="card-sub">Your admin will review the details and confirm the payment.</p>
              </div>
            </div>
            <form id="form-submit-payment" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5" noValidate>
              {formError && (
                <div id="pay-error" className="form-error sm:col-span-2" role="alert">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                  <span>{formError}</span>
                </div>
              )}

              <div className="sm:col-span-2">
                <label htmlFor="pay-due" className="label req">
                  Payment for
                </label>
                <select
                  id="pay-due"
                  value={paymentDue}
                  onChange={(e) => setPaymentDue(e.target.value)}
                  className="input"
                >
                  {unpaidDues.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} — {peso(d.amount)}
                      {d.paymentState === 'overdue' ? ' (overdue)' : ''}
                    </option>
                  ))}
                  <option value="GENERAL">General contribution (not tied to a specific due)</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-method" className="label req">
                  Payment channel
                </label>
                <select
                  id="pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="GCash">GCash</option>
                  <option value="Bank Transfer">Bank transfer (Landbank)</option>
                  <option value="Office Cash Counter">Office cash counter</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-ref" id="pay-ref-label" className="label req">
                  {isCash ? 'Official receipt number' : 'Reference number'}
                </label>
                <input
                  type="text"
                  id="pay-ref"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  required
                  maxLength={40}
                  placeholder={isCash ? 'e.g. OR-88291' : 'e.g. 10029384728'}
                  className="input"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="pay-amount" className="label req">
                  Amount paid (₱)
                </label>
                <input
                  type="number"
                  id="pay-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  className="input"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label htmlFor="pay-date" className="label req">
                  Date paid
                </label>
                <input
                  type="date"
                  id="pay-date"
                  value={datePaid}
                  onChange={(e) => setDatePaid(e.target.value)}
                  max={todayStr()}
                  required
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="pay-proof-file" className={`label ${!isCash ? 'req' : ''}`}>
                  {isCash ? 'Proof of payment (optional)' : 'Proof of payment'}
                </label>
                <input
                  type="file"
                  id="pay-proof-file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:h-10 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-800 hover:file:bg-brand-100 file:cursor-pointer"
                />
                <p className="hint">Upload a clear screenshot or photo of the receipt (image files up to 10 MB).</p>
                {proofPreview && (
                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                    className="mt-3 max-h-40 rounded-lg border border-slate-200"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full"
                >
                  <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>{' '}
                  {submitting ? 'Submitting payment...' : 'Submit payment'}
                </button>
              </div>
            </form>
          </div>

          {/* Payment History Table */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Payment history</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <caption className="sr-only">Your payment history</caption>
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Payment for</th>
                    <th scope="col">Date</th>
                    <th scope="col">Channel</th>
                    <th scope="col" className="text-right">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Receipt</span></th>
                  </tr>
                </thead>
                <tbody id="member-payments-tbody">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono font-semibold text-slate-900">{p.ref_no}</td>
                        <td>{p.due_title || 'General contribution'}</td>
                        <td className="whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                        <td>{p.method}</td>
                        <td className="text-right font-semibold tabular-nums">{peso(p.amount)}</td>
                        <td>
                          <Badge status={p.status} />
                          {p.status === 'Rejected' && p.review_note && (
                            <p className="text-xs text-red-700 mt-1 max-w-[14rem]">
                              {p.review_note}
                            </p>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setViewingPayment(p)}
                            className="btn btn-secondary btn-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="empty py-8 text-center text-sm text-slate-500">
                          <i className="fa-solid fa-receipt text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                          <span>No payments yet. Submitted payments will appear here.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {viewingPayment && (
        <DialogModal
          title="Payment receipt"
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          actions={[{ label: 'Close', variant: 'btn-primary', onClick: () => setViewingPayment(null) }]}
        >
          <dl className="dl mb-4">
            <dt>Reference</dt>
            <dd className="font-mono">{viewingPayment.ref_no}</dd>
            <dt>Payment for</dt>
            <dd>{viewingPayment.due_title || 'General contribution'}</dd>
            <dt>Channel</dt>
            <dd>{viewingPayment.method}</dd>
            <dt>Amount</dt>
            <dd>{peso(viewingPayment.amount)}</dd>
            <dt>Date paid</dt>
            <dd>{fmtDate(viewingPayment.payment_date)}</dd>
            <dt>Status</dt>
            <dd><Badge status={viewingPayment.status} /></dd>
            {viewingPayment.review_note && (
              <>
                <dt>Admin note</dt>
                <dd className="text-red-700">{viewingPayment.review_note}</dd>
              </>
            )}
          </dl>
          <img
            src={safeImg(viewingPayment.proof)}
            alt="Uploaded proof of payment"
            className="w-full max-h-72 object-contain rounded-lg border border-slate-200 bg-slate-50"
          />
        </DialogModal>
      )}
    </div>
  );
}
