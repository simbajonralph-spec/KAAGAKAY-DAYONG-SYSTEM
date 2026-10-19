import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Badge from '../Badge';
import { peso, fmtDate, initialsOf } from '../../constants';

export default function MemberDashboard({
  dashboardData,
  onGotoTab,
  onSelectDueToPay
}) {
  const qrCanvasRef = useRef(null);
  const user = dashboardData?.user || {};
  const summary = dashboardData?.summary || { totalDue: 0, unpaidCount: 0, overdueCount: 0, beneficiaryCount: 0 };
  const dues = dashboardData?.dues || [];

  useEffect(() => {
    if (qrCanvasRef.current && user.id) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        `KD-ID:${user.id}`,
        {
          width: 64,
          margin: 0,
          color: { dark: '#10231a', light: '#ffffff' }
        },
        (error) => {
          if (error) console.error('QR Code error:', error);
        }
      );
    }
  }, [user.id]);

  const standing = summary.standing || 'good';
  const borderClass =
    standing === 'overdue'
      ? 'border-l-red-500'
      : standing === 'dueSoon'
      ? 'border-l-amber-500'
      : 'border-l-brand-600';

  return (
    <div id="mcontent-dashboard" className="space-y-6">
      {/* Banner */}
      <div
        id="member-banner"
        className={`card border-l-4 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderClass}`}
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome back, <span id="banner-user-name">{user.name?.split(' ')[0] || 'Member'}</span>
          </h2>
          <p id="banner-user-address" className="text-sm text-slate-500 mt-1">
            {user.barangay ? `${user.barangay}, ` : ''}{user.municipality}
          </p>
          <div id="banner-standing" className="mt-3">
            {standing === 'overdue' && (
              <span className="badge badge-red">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Overdue dues — please pay soon
              </span>
            )}
            {standing === 'dueSoon' && (
              <span className="badge badge-amber">
                <i className="fa-solid fa-clock" aria-hidden="true"></i> Dues to pay
              </span>
            )}
            {standing === 'good' && (
              <span className="badge badge-green">
                <i className="fa-solid fa-circle-check" aria-hidden="true"></i> Good standing
              </span>
            )}
          </div>
        </div>

        <div className="md:text-right shrink-0">
          <p className="text-sm text-slate-500">Amount due</p>
          <p id="mem-balance-display" className="text-3xl font-bold text-slate-900 tabular-nums">
            {peso(summary.totalDue)}
          </p>
          <p id="mem-next-due" className="text-xs text-slate-500 mt-0.5">
            {summary.overdueCount > 0
              ? `${summary.overdueCount} overdue`
              : summary.nextDueDate
              ? `Next due ${fmtDate(summary.nextDueDate)}`
              : 'Nothing due'}
          </p>
        </div>
      </div>

      {/* Grid: KPIs & Dues + ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="kpi">
              <div>
                <p className="kpi-label">Membership</p>
                <p id="mem-status-text" className="text-lg font-bold text-slate-900 mt-1">
                  {user.status || 'Active'}
                </p>
                <p className="kpi-note">Benefit eligible</p>
              </div>
              <div className="kpi-icon bg-emerald-50 text-emerald-700" aria-hidden="true">
                <i className="fa-solid fa-user-check"></i>
              </div>
            </div>

            <div className="kpi">
              <div>
                <p className="kpi-label">Beneficiaries</p>
                <p id="mem-beneficiary-count" className="text-lg font-bold text-slate-900 mt-1">
                  {summary.beneficiaryCount || 0} of 5
                </p>
                <p className="kpi-note">Registered</p>
              </div>
              <div className="kpi-icon bg-sky-50 text-sky-700" aria-hidden="true">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>

            <div className="kpi">
              <div>
                <p className="kpi-label">Unpaid dues</p>
                <p id="mem-obligations-amount" className="text-lg font-bold text-slate-900 mt-1">
                  {summary.unpaidCount > 0 ? `${summary.unpaidCount} · ${peso(summary.totalDue)}` : 'None'}
                </p>
                <p className="kpi-note">Death contributions</p>
              </div>
              <div className="kpi-icon bg-amber-50 text-amber-700" aria-hidden="true">
                <i className="fa-solid fa-receipt"></i>
              </div>
            </div>
          </div>

          {/* Dues List */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <i className="fa-solid fa-hand-holding-dollar text-brand-700" aria-hidden="true"></i> Community dues for your chapter
              </h3>
              <button
                type="button"
                onClick={() => onGotoTab('payments')}
                className="btn btn-secondary btn-sm"
              >
                View all
              </button>
            </div>
            <div id="dashboard-dues-list" className="divide-y divide-slate-100">
              {dues.length > 0 ? (
                dues.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{d.title}</p>
                      <p className="text-sm text-slate-500">{d.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Due {fmtDate(d.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 tabular-nums">{peso(d.amount)}</span>
                      <Badge status={d.paymentState} />
                      {d.paymentState === 'unpaid' || d.paymentState === 'overdue' ? (
                        <button
                          type="button"
                          onClick={() => onSelectDueToPay(d.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Pay now
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty py-8 text-center text-sm text-slate-500">
                  <i className="fa-solid fa-circle-check text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                  <span>No community dues for your chapter right now.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Digital Membership ID Card */}
        <div className="card self-start">
          <div className="card-head">
            <h3 className="card-title">
              <i className="fa-solid fa-id-card text-brand-700" aria-hidden="true"></i> Digital membership ID
            </h3>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-ink-900 text-white p-5 shadow-lg" id="id-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold tracking-wide">Kaagapay Dayong</p>
                  <p className="text-xs text-slate-300">Official membership ID</p>
                </div>
                <span id="card-status" className="badge bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/40">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <div
                  id="card-avatar"
                  className="h-14 w-14 rounded-lg bg-brand-600 flex items-center justify-center text-lg font-bold shrink-0 text-white"
                >
                  {initialsOf(user.name)}
                </div>
                <div className="min-w-0">
                  <p id="card-name" className="font-semibold truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    ID <span id="card-id" className="font-mono text-white">{user.id}</span>
                  </p>
                  <p id="card-chapter" className="text-xs text-slate-400 truncate">
                    {user.municipality} chapter
                  </p>
                </div>
              </div>
              <div className="flex items-end justify-between border-t border-white/15 mt-5 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Valid until</p>
                  <p id="card-valid" className="text-sm font-semibold">
                    31 Dec {new Date().getFullYear()}
                  </p>
                </div>
                <div className="bg-white p-1.5 rounded-md">
                  <canvas ref={qrCanvasRef} width={64} height={64} className="w-16 h-16 block" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm mt-4 w-full no-print"
            >
              <i className="fa-solid fa-print" aria-hidden="true"></i> Print ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
