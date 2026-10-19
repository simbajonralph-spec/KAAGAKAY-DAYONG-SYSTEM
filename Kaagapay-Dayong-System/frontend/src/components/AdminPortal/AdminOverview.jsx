import React, { useState } from 'react';
import Badge from '../Badge';
import { peso, fmtDate, todayStr } from '../../constants';

export default function AdminOverview({
  overviewData,
  onGotoTab,
  onPostDues,
  onToggleDue
}) {
  const kpis = overviewData?.kpis || {
    activeMembers: 0,
    reserveFund: 0,
    payoutsSum: 0,
    pendingUsers: 0,
    pendingPayments: 0,
    pendingClaims: 0
  };
  const dues = overviewData?.dues || [];

  // Post Dues Form State
  const [payTitle, setPayTitle] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDueDate, setPayDueDate] = useState('');
  const [payDescription, setPayDescription] = useState('');
  const [dueError, setDueError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handlePostDuesSubmit = async (e) => {
    e.preventDefault();
    setDueError('');

    if (!payTitle.trim()) {
      setDueError('Enter a title for the dues.');
      return;
    }
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setDueError('Enter an amount greater than zero.');
      return;
    }
    if (!payDueDate || payDueDate < todayStr()) {
      setDueError('The due date cannot be in the past.');
      return;
    }
    if (!payDescription.trim()) {
      setDueError('Enter the particulars for members.');
      return;
    }

    setPublishing(true);
    try {
      await onPostDues({
        title: payTitle.trim(),
        amount: numAmount,
        due_date: payDueDate,
        description: payDescription.trim()
      });

      setPayTitle('');
      setPayAmount('');
      setPayDueDate('');
      setPayDescription('');
    } catch (err) {
      setDueError(err.message || 'Failed to publish dues.');
    } finally {
      setPublishing(false);
    }
  };

  const attentionItems = [
    {
      count: kpis.pendingUsers,
      noun: 'registration',
      tail: 'waiting for approval',
      tab: 'user-approvals',
      icon: 'fa-user-clock'
    },
    {
      count: kpis.pendingPayments,
      noun: 'payment',
      tail: 'waiting for verification',
      tab: 'payment-verify',
      icon: 'fa-clipboard-check'
    },
    {
      count: kpis.pendingClaims,
      noun: 'benefit claim',
      tail: 'waiting for review',
      tab: 'death-verify',
      icon: 'fa-file-signature'
    }
  ].filter((i) => i.count > 0);

  return (
    <div id="acontent-overview" className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi">
          <div>
            <p className="kpi-label">Active members</p>
            <p id="adm-kpi-total-members" className="kpi-value">
              {kpis.activeMembers}
            </p>
            <p className="kpi-note">Chapter registry</p>
          </div>
          <div className="kpi-icon bg-sky-50 text-sky-700" aria-hidden="true">
            <i className="fa-solid fa-users"></i>
          </div>
        </div>

        <div className="kpi">
          <div>
            <p className="kpi-label">Reserve fund</p>
            <p id="adm-kpi-reserve" className="kpi-value">
              {peso(kpis.reserveFund)}
            </p>
            <p className="kpi-note">Approved payments less payouts</p>
          </div>
          <div className="kpi-icon bg-emerald-50 text-emerald-700" aria-hidden="true">
            <i className="fa-solid fa-vault"></i>
          </div>
        </div>

        <div className="kpi">
          <div>
            <p className="kpi-label">Benefits paid out</p>
            <p id="adm-kpi-payouts-sum" className="kpi-value">
              {peso(kpis.payoutsSum)}
            </p>
            <p className="kpi-note">Approved claims</p>
          </div>
          <div className="kpi-icon bg-violet-50 text-violet-700" aria-hidden="true">
            <i className="fa-solid fa-hand-holding-medical"></i>
          </div>
        </div>

        <div className="kpi">
          <div>
            <p className="kpi-label">Pending registrations</p>
            <p id="adm-kpi-pending-users" className="kpi-value">
              {kpis.pendingUsers}
            </p>
            <p className="kpi-note">Waiting for review</p>
          </div>
          <div className="kpi-icon bg-amber-50 text-amber-700" aria-hidden="true">
            <i className="fa-solid fa-user-clock"></i>
          </div>
        </div>
      </div>

      {/* Needs Attention Card */}
      {attentionItems.length > 0 && (
        <div id="admin-attention" className="card">
          <div className="card-head">
            <h3 className="card-title">
              <i className="fa-solid fa-bell text-amber-600" aria-hidden="true"></i> Needs your attention
            </h3>
          </div>
          <div id="admin-attention-list" className="divide-y divide-slate-100">
            {attentionItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <p className="text-sm text-slate-700">
                  <i className={`fa-solid ${item.icon} w-5 text-amber-600`} aria-hidden="true"></i>{' '}
                  <strong>{item.count}</strong> {item.noun}
                  {item.count > 1 ? 's' : ''} {item.tail}
                </p>
                <button
                  type="button"
                  onClick={() => onGotoTab(item.tab)}
                  className="btn btn-secondary btn-sm"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post New Dues Form */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">
              <i className="fa-solid fa-bullhorn text-brand-700" aria-hidden="true"></i> Post new dues
            </h3>
            <p className="card-sub">Members of the chapter are notified as soon as you publish.</p>
          </div>
        </div>
        <form id="paymentForm" onSubmit={handlePostDuesSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5" noValidate>
          {dueError && (
            <div id="due-error" className="form-error md:col-span-3" role="alert">
              <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
              <span>{dueError}</span>
            </div>
          )}

          <div>
            <label htmlFor="payTitle" className="label req">
              Title
            </label>
            <input
              type="text"
              id="payTitle"
              value={payTitle}
              onChange={(e) => setPayTitle(e.target.value)}
              required
              maxLength={80}
              placeholder="Death Contribution #2026-007"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="payAmount" className="label req">
              Amount per member (₱)
            </label>
            <input
              type="number"
              id="payAmount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              placeholder="50.00"
              className="input"
              inputMode="decimal"
            />
          </div>

          <div>
            <label htmlFor="payDueDate" className="label req">
              Due date
            </label>
            <input
              type="date"
              id="payDueDate"
              value={payDueDate}
              onChange={(e) => setPayDueDate(e.target.value)}
              min={todayStr()}
              required
              className="input"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="payDescription" className="label req">
              Particulars
            </label>
            <textarea
              id="payDescription"
              rows="2"
              value={payDescription}
              onChange={(e) => setPayDescription(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Late Juan Dela Cruz — Brgy. Visayan"
              className="input"
            ></textarea>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={publishing}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-bullhorn" aria-hidden="true"></i>{' '}
              {publishing ? 'Publishing...' : 'Publish dues'}
            </button>
          </div>
        </form>
      </div>

      {/* Posted Dues Table */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">Posted dues</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Dues posted for this chapter</caption>
            <thead>
              <tr>
                <th scope="col">Title &amp; particulars</th>
                <th scope="col" className="text-right">Amount</th>
                <th scope="col">Due date</th>
                <th scope="col">Members paid</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody id="admin-dues-tbody">
              {dues.length > 0 ? (
                dues.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{d.title}</p>
                      <p className="text-slate-500 text-sm">{d.description}</p>
                    </td>
                    <td className="text-right font-semibold tabular-nums">{peso(d.amount)}</td>
                    <td className="whitespace-nowrap">{fmtDate(d.due_date)}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {d.paid_count || 0} of {d.total_audience || 0}
                    </td>
                    <td><Badge status={d.status} /></td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onToggleDue(d.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        {d.status === 'Open' ? 'Close' : 'Reopen'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-bullhorn text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>No dues posted yet. Use the form above to publish the first one.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
