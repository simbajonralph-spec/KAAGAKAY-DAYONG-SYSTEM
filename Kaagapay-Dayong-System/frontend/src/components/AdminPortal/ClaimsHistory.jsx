import React from 'react';
import { fmtDate, peso } from '../../constants';

export default function ClaimsHistory({ history = [] }) {
  return (
    <div id="acontent-benefits-history">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Members who received benefit claims</h3>
            <p className="card-sub">A read-only record of every approved and released benefit claim.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Approved benefit claims history</caption>
            <thead>
              <tr>
                <th scope="col">Claim</th>
                <th scope="col">Member</th>
                <th scope="col">Deceased</th>
                <th scope="col">Benefits released</th>
                <th scope="col">Date approved</th>
                <th scope="col" className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody id="adm-benefits-history-tbody">
              {history.length > 0 ? (
                history.map((c) => {
                  const benefitNames = Array.isArray(c.benefits)
                    ? c.benefits.map((b) => b.name).join(', ')
                    : '—';
                  return (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold text-slate-900">{c.id}</td>
                      <td className="font-medium">{c.member_name}</td>
                      <td>{c.deceased_name}</td>
                      <td>{benefitNames}</td>
                      <td className="whitespace-nowrap">
                        {c.reviewed_at ? fmtDate(c.reviewed_at) : '—'}
                      </td>
                      <td className="text-right font-semibold tabular-nums">{peso(c.amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-hand-holding-heart text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>No benefit claims have been released yet.</span>
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
