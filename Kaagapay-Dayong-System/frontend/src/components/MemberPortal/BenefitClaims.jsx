import React, { useState, useEffect } from 'react';
import Badge from '../Badge';
import DialogModal from '../DialogModal';
import { peso, fmtDate, todayStr } from '../../constants';

export default function BenefitClaims({
  dashboardData,
  beneficiaries = [],
  claims = [],
  benefitTypes = [],
  onSubmitClaim,
  toast
}) {
  const summary = dashboardData?.summary || { overdueCount: 0 };
  const eligibleBeneficiaries = beneficiaries.filter(
    (b) => !b.is_deceased && !claims.some((c) => c.beneficiary_id === b.id && c.status !== 'Rejected')
  );

  const [selectedBenId, setSelectedBenId] = useState(eligibleBeneficiaries[0]?.id || '');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [cause, setCause] = useState('');
  const [place, setPlace] = useState('');
  const [certPreview, setCertPreview] = useState(null);
  const [certBase64, setCertBase64] = useState(null);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [formError, setFormError] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Set default checked benefits if available
  useEffect(() => {
    if (benefitTypes.length > 0 && selectedBenefits.length === 0) {
      setSelectedBenefits([benefitTypes[0].id]);
    }
  }, [benefitTypes]);

  useEffect(() => {
    if (!selectedBenId && eligibleBeneficiaries.length > 0) {
      setSelectedBenId(eligibleBeneficiaries[0].id);
    }
  }, [eligibleBeneficiaries, selectedBenId]);

  const handleBenefitToggle = (id) => {
    setSelectedBenefits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeTypes = benefitTypes.filter((b) => b.is_active);
  const totalAmount = activeTypes
    .filter((b) => selectedBenefits.includes(b.id))
    .reduce((sum, b) => sum + parseFloat(b.amount), 0);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setCertPreview(null);
    setCertBase64(null);
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
      setCertPreview(reader.result);
      setCertBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormValidate = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedBenId) {
      setFormError('Select the beneficiary who passed away.');
      return;
    }
    const ben = beneficiaries.find((b) => b.id === selectedBenId);
    if (!ben) {
      setFormError('Selected beneficiary not found.');
      return;
    }
    if (!dateOfDeath) {
      setFormError('Enter the date of death.');
      return;
    }
    if (dateOfDeath > todayStr()) {
      setFormError('The date of death cannot be in the future.');
      return;
    }
    if (ben.dob && dateOfDeath < ben.dob) {
      setFormError('The date of death cannot be before the date of birth.');
      return;
    }
    if (!cause.trim()) {
      setFormError('Enter the cause of death.');
      return;
    }
    if (!place.trim()) {
      setFormError('Enter the place of death.');
      return;
    }
    if (!certBase64) {
      setFormError('Upload a photo or scan of the death certificate.');
      return;
    }
    if (selectedBenefits.length === 0) {
      setFormError('Select at least one benefit to request.');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmitClaim({
        beneficiary_id: selectedBenId,
        date_of_death: dateOfDeath,
        cause: cause.trim(),
        place: place.trim(),
        deathCertBase64: certBase64,
        benefit_ids: selectedBenefits
      });

      setConfirmModalOpen(false);
      // Reset form
      setDateOfDeath('');
      setCause('');
      setPlace('');
      setCertPreview(null);
      setCertBase64(null);
    } catch (err) {
      setFormError(err.message || 'Claim submission failed.');
      setConfirmModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBenObj = beneficiaries.find((b) => b.id === selectedBenId);

  return (
    <div id="mcontent-death-report" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Form: File Claim */}
        <div className="card lg:col-span-2 self-start">
          <div className="card-head">
            <div>
              <h3 className="card-title">
                <i className="fa-solid fa-ribbon text-slate-700" aria-hidden="true"></i> File a funeral benefit claim
              </h3>
              <p className="card-sub">Claims can be filed for a registered beneficiary.</p>
            </div>
          </div>

          <form id="form-death-report" onSubmit={handleFormValidate} className="p-5 space-y-4" noValidate>
            {formError && (
              <div id="dr-error" className="form-error" role="alert">
                <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                <span>{formError}</span>
              </div>
            )}

            {summary.overdueCount > 0 && (
              <div
                id="dr-standing-warning"
                className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-3 py-2.5"
              >
                <i className="fa-solid fa-triangle-exclamation mr-1.5" aria-hidden="true"></i>
                You have {summary.overdueCount} overdue due{summary.overdueCount > 1 ? 's' : ''}. Your admin may hold this claim until they are settled.
              </div>
            )}

            <div>
              <label htmlFor="dr-deceased" className="label req">
                Deceased beneficiary
              </label>
              <select
                id="dr-deceased"
                value={selectedBenId}
                onChange={(e) => setSelectedBenId(e.target.value)}
                disabled={eligibleBeneficiaries.length === 0}
                className="input"
              >
                {eligibleBeneficiaries.length > 0 ? (
                  eligibleBeneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.relation})
                    </option>
                  ))
                ) : (
                  <option value="">No eligible beneficiaries</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="dr-date" className="label req">
                Date of death
              </label>
              <input
                type="date"
                id="dr-date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                max={todayStr()}
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="dr-cause" className="label req">
                Cause of death
              </label>
              <input
                type="text"
                id="dr-cause"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                required
                maxLength={120}
                placeholder="e.g. Cardiopulmonary arrest"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="dr-place" className="label req">
                Place of death
              </label>
              <input
                type="text"
                id="dr-place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
                maxLength={160}
                placeholder="Hospital or residence address"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="dr-cert-file" className="label req">
                Death certificate
              </label>
              <input
                type="file"
                id="dr-cert-file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:h-10 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
              />
              <p className="hint">Upload a clear photo or scan (image files up to 10 MB).</p>
              {certPreview && (
                <img
                  src={certPreview}
                  alt="Death certificate preview"
                  className="mt-3 max-h-48 rounded-lg border border-slate-200"
                />
              )}
            </div>

            <div>
              <span className="label req">Benefits requested</span>
              <div id="dr-benefits-list" className="space-y-2">
                {activeTypes.length > 0 ? (
                  activeTypes.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBenefits.includes(b.id)}
                        onChange={() => handleBenefitToggle(b.id)}
                        className="mt-0.5"
                      />
                      <span className="flex-1 text-sm">
                        <span className="block font-medium text-slate-900">{b.name}</span>
                        {b.description && (
                          <span className="block text-slate-500 text-xs mt-0.5">{b.description}</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                        {peso(b.amount)}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No benefit types available.</p>
                )}
              </div>
              <p className="hint">
                Select every benefit that applies. Your chapter admin will confirm the final amount.
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-2">
                Estimated total: <span id="dr-benefits-total">{peso(totalAmount)}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || eligibleBeneficiaries.length === 0}
              className="btn btn-dark w-full"
            >
              Submit claim
            </button>
          </form>
        </div>

        {/* Right Table: Claim History */}
        <div className="card lg:col-span-3 self-start">
          <div className="card-head">
            <h3 className="card-title">Your claims</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <caption className="sr-only">Your benefit claims</caption>
              <thead>
                <tr>
                  <th scope="col">Claim</th>
                  <th scope="col">Deceased</th>
                  <th scope="col">Date of death</th>
                  <th scope="col" className="text-right">Benefit</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody id="member-claims-tbody">
                {claims.length > 0 ? (
                  claims.map((c) => {
                    const benefitNames = Array.isArray(c.benefits)
                      ? c.benefits.map((b) => b.name).join(', ')
                      : '—';
                    return (
                      <tr key={c.id}>
                        <td className="font-mono font-semibold text-slate-900">{c.id}</td>
                        <td>
                          {c.deceased_name}
                          <p className="text-xs text-slate-500 font-normal mt-0.5">
                            {benefitNames}
                          </p>
                        </td>
                        <td className="whitespace-nowrap">{fmtDate(c.date_of_death)}</td>
                        <td className="text-right font-semibold tabular-nums">{peso(c.amount)}</td>
                        <td>
                          <Badge status={c.status} />
                          {c.status === 'Rejected' && c.review_note && (
                            <p className="text-xs text-red-700 mt-1 max-w-[14rem]">
                              {c.review_note}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty py-8 text-center text-sm text-slate-500">
                        <i className="fa-solid fa-file-circle-question text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                        <span>You haven’t filed any claims.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedBenObj && (
        <DialogModal
          title="Submit this claim?"
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          size="sm"
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setConfirmModalOpen(false) },
            {
              label: submitting ? 'Submitting...' : 'Submit claim',
              variant: 'btn-primary',
              disabled: submitting,
              onClick: handleConfirmedSubmit
            }
          ]}
        >
          <p className="text-slate-600 leading-relaxed">
            A claim for <strong>{selectedBenObj.name}</strong> requesting {peso(totalAmount)} in
            benefits will be sent to your chapter admin for review.
          </p>
        </DialogModal>
      )}
    </div>
  );
}
