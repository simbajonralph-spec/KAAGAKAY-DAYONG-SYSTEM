import React, { useEffect, useRef } from 'react';

export default function DialogModal({
  title,
  isOpen,
  onClose,
  children,
  actions = [],
  size = 'md'
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`dlg-in bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size] || sizeClasses.md} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-2 -mt-1"
            aria-label="Close dialog"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto text-sm">{children}</div>

        {actions && actions.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-wrap justify-end gap-2">
            {actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                className={`btn ${act.variant || 'btn-secondary'}`}
                onClick={act.onClick || onClose}
                disabled={act.disabled}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
