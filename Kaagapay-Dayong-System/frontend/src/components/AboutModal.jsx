import React from 'react';
import DialogModal from './DialogModal';
import { CHAPTER_DATA } from '../constants';

export default function AboutModal({ isOpen, onClose }) {
  return (
    <DialogModal
      title="About Kaagapay Dayong"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      actions={[{ label: 'Close', variant: 'btn-primary', onClick: onClose }]}
    >
      <p className="text-slate-600 leading-relaxed">
        Kaagapay Dayong is a community mutual assistance program that gives bereaved families quick,
        dignified financial help and funeral support. Members contribute small amounts when a fellow
        member passes away, and each chapter administers its own fund.
      </p>

      <h3 className="font-semibold text-slate-900 mt-5 mb-2">Chapter administrators</h3>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {Object.entries(CHAPTER_DATA).map(([municipality, chapter]) => (
          <li key={municipality} className="px-3 py-2.5 flex flex-wrap justify-between gap-x-4">
            <span className="font-medium text-slate-900">{municipality}</span>
            <span className="text-slate-600">
              {chapter.admin} · {chapter.adminEmail}
            </span>
          </li>
        ))}
      </ul>
    </DialogModal>
  );
}
