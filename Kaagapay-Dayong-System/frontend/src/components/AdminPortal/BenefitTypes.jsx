import React, { useState } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { peso } from '../../constants';

export default function BenefitTypes({
  benefitTypes = [],
  onCreateBenefitType,
  onUpdateBenefitType,
  onToggleBenefitType,
  onDeleteBenefitType,
  toast
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingType, setDeletingType] = useState(null);

  const handleOpenAdd = () => {
    setEditingType(null);
    setName('');
    setDescription('');
    setAmount('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingType(b);
    setName(b.name);
    setDescription(b.description || '');
    setAmount(b.amount);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Enter a benefit name.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await onUpdateBenefitType(editingType.id, {
          name: name.trim(),
          description: description.trim(),
          amount: numAmount
        });
      } else {
        await onCreateBenefitType({
          name: name.trim(),
          description: description.trim(),
          amount: numAmount
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="acontent-benefit-types">
      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Benefit types</h3>
            <p className="card-sub">
              Manage the individual benefits members can request in a claim (e.g. flowers, coffin, decoration).
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm"
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i> Add benefit
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <caption className="sr-only">Benefit type catalog</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col" className="text-right">Amount</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody id="adm-benefit-types-tbody">
              {benefitTypes.length > 0 ? (
                benefitTypes.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium text-slate-900">{b.name}</td>
                    <td className="text-slate-600 max-w-xs">{b.description || '—'}</td>
                    <td className="text-right font-semibold tabular-nums">{peso(b.amount)}</td>
                    <td>
                      <Badge status={b.is_active ? 'Active' : 'Suspended'} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleBenefitType(b.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          {b.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingType(b)}
                          className="btn btn-danger-outline btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty py-8 text-center text-sm text-slate-500">
                      <i className="fa-solid fa-hand-holding-heart text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                      <span>
                        No benefit types yet. Add flowers, coffin, decoration and other benefits members can claim.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Benefit Modal */}
      {modalOpen && (
        <DialogModal
          title={editingType ? 'Edit benefit type' : 'Add benefit type'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setModalOpen(false) },
            {
              label: saving ? 'Saving...' : editingType ? 'Save changes' : 'Add benefit',
              variant: 'btn-primary',
              disabled: saving,
              onClick: handleSave
            }
          ]}
        >
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            {formError && (
              <div id="bnf-error" className="form-error" role="alert">
                <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                <span>{formError}</span>
              </div>
            )}
            <div>
              <label htmlFor="bnf-name" className="label req">
                Name
              </label>
              <input
                id="bnf-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
                maxLength={60}
                placeholder="e.g. Flowers"
              />
            </div>
            <div>
              <label htmlFor="bnf-desc" className="label">
                Description
              </label>
              <textarea
                id="bnf-desc"
                rows="2"
                maxLength={160}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Optional details for members"
              ></textarea>
            </div>
            <div>
              <label htmlFor="bnf-amount" className="label req">
                Amount (₱)
              </label>
              <input
                id="bnf-amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                required
              />
            </div>
          </form>
        </DialogModal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingType && (
        <DialogModal
          title="Delete benefit type?"
          isOpen={!!deletingType}
          onClose={() => setDeletingType(null)}
          size="sm"
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setDeletingType(null) },
            {
              label: 'Delete',
              variant: 'btn-danger',
              onClick: async () => {
                await onDeleteBenefitType(deletingType.id);
                setDeletingType(null);
              }
            }
          ]}
        >
          <p className="text-slate-600 leading-relaxed">
            <strong>{deletingType.name}</strong> will be removed from the catalog. Past claims
            already keep their own record of it.
          </p>
        </DialogModal>
      )}
    </div>
  );
}
