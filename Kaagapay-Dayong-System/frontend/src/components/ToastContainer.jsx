import React from 'react';

export default function ToastContainer({ toasts, removeToast }) {
  const cfg = {
    success: ['bg-emerald-700', 'fa-circle-check'],
    error: ['bg-red-700', 'fa-circle-exclamation'],
    warning: ['bg-amber-600', 'fa-triangle-exclamation'],
    info: ['bg-slate-800', 'fa-circle-info']
  };

  return (
    <div
      id="toast-container"
      className="fixed top-4 right-4 left-4 sm:left-auto z-[300] flex flex-col gap-2 sm:w-96 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const [bg, icon] = cfg[t.type] || cfg.info;
        return (
          <div
            key={t.id}
            className={`${bg} text-white pl-4 pr-2 py-3 rounded-lg shadow-lg text-sm flex items-start gap-3 pointer-events-auto toast-in`}
          >
            <i className={`fa-solid ${icon} mt-0.5`} aria-hidden="true"></i>
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="h-6 w-6 rounded hover:bg-white/20 shrink-0"
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
}
