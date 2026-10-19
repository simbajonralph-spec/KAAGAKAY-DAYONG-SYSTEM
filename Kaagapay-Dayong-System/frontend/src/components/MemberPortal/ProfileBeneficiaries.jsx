import React, { useState, useEffect } from 'react';
import DialogModal from '../DialogModal';
import { fmtDate, todayStr } from '../../constants';

export default function ProfileBeneficiaries({
  dashboardData,
  beneficiaries = [],
  onUpdateProfile,
  onAddBeneficiary,
  onRemoveBeneficiary,
  toast
}) {
  const user = dashboardData?.user || {};
  const chapter = dashboardData?.chapter || {};

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.name || '');
  const [civilStatus, setCivilStatus] = useState(user.civil_status || 'Single');
  const [phone, setPhone] = useState(user.phone || '');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user.name) setFullName(user.name);
    if (user.civil_status) setCivilStatus(user.civil_status);
    if (user.phone) setPhone(user.phone);
  }, [user]);

  // Beneficiary Modal State
  const [benModalOpen, setBenModalOpen] = useState(false);
  const [benName, setBenName] = useState('');
  const [benRelation, setBenRelation] = useState('Spouse');
  const [benDob, setBenDob] = useState('');
  const [benError, setBenError] = useState('');
  const [benSaving, setBenSaving] = useState(false);

  // Remove Confirmation Modal State
  const [benToRemove, setBenToRemove] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (fullName.trim().length < 3) {
      setProfileError('Enter your full name.');
      return;
    }
    if (!/^(\+?63|0)9\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(phone.trim())) {
      setProfileError('Enter a valid Philippine mobile number, like 0917-123-4567.');
      return;
    }

    setProfileSaving(true);
    try {
      await onUpdateProfile({
        name: fullName.trim(),
        civil_status: civilStatus,
        phone: phone.trim()
      });
      setIsEditing(false);
    } catch (err) {
      setProfileError(err.message || 'Profile update failed.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddBeneficiarySubmit = async (e) => {
    e.preventDefault();
    setBenError('');

    if (benName.trim().length < 3) {
      setBenError('Enter the beneficiary’s full name.');
      return;
    }
    if (!benDob || benDob > todayStr()) {
      setBenError('Enter a valid date of birth (cannot be in the future).');
      return;
    }
    if (beneficiaries.length >= 5) {
      setBenError('You can register up to 5 beneficiaries.');
      return;
    }

    if (benRelation === 'Spouse') {
      const hasSpouse = beneficiaries.some((b) => b.relation === 'Spouse' && !b.is_deceased);
      if (hasSpouse) {
        setBenError('You already have a spouse registered.');
        return;
      }
    }

    setBenSaving(true);
    try {
      await onAddBeneficiary({
        name: benName.trim(),
        relation: benRelation,
        dob: benDob
      });
      setBenModalOpen(false);
      setBenName('');
      setBenRelation('Spouse');
      setBenDob('');
    } catch (err) {
      setBenError(err.message || 'Failed to add beneficiary.');
    } finally {
      setBenSaving(false);
    }
  };

  return (
    <div id="mcontent-profile" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information & Connected Admin */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-100 p-4">
              <div
                className="h-10 w-10 rounded-lg bg-brand-700 text-white flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <i className="fa-solid fa-building-user"></i>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-brand-900">Your chapter admin</p>
                <p id="connected-admin-info" className="text-brand-800 mt-0.5">
                  {chapter.admin || 'Chapter Admin'} · {chapter.adminEmail || '—'}
                  <br />
                  <span className="text-brand-700">{chapter.adminAddress || user.municipality}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card-head">
            <h3 className="card-title">Personal information</h3>
            {!isEditing && (
              <button
                type="button"
                id="btn-edit-profile"
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary btn-sm"
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit information
              </button>
            )}
          </div>

          <form id="form-profile" onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5" noValidate>
            {profileError && (
              <div id="profile-error" className="form-error sm:col-span-2" role="alert">
                <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                <span>{profileError}</span>
              </div>
            )}

            <div>
              <label htmlFor="prof-fullname" className="label">
                Full name
              </label>
              <input
                type="text"
                id="prof-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                className="input"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="prof-civil" className="label">
                Civil status
              </label>
              <select
                id="prof-civil"
                value={civilStatus}
                onChange={(e) => setCivilStatus(e.target.value)}
                disabled={!isEditing}
                className="input"
              >
                <option>Single</option>
                <option>Married</option>
                <option>Widowed</option>
                <option>Separated</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-phone" className="label">
                Mobile number
              </label>
              <input
                type="tel"
                id="prof-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                className="input"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="label">
                Email address
              </label>
              <input
                type="email"
                id="prof-email"
                value={user.email || ''}
                disabled
                className="input"
              />
              <p className="hint">Your email is your sign-in ID and can't be changed here.</p>
            </div>

            <div>
              <label htmlFor="prof-municipality" className="label">
                Municipality / chapter
              </label>
              <input
                type="text"
                id="prof-municipality"
                value={user.municipality || ''}
                disabled
                className="input"
              />
            </div>

            <div>
              <label htmlFor="prof-barangay" className="label">
                Barangay / purok
              </label>
              <input
                type="text"
                id="prof-barangay"
                value={user.barangay || ''}
                disabled
                className="input"
              />
              <p className="hint">To transfer chapters, contact your chapter admin.</p>
            </div>

            {isEditing && (
              <div id="profile-save-btn-container" className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(user.name || '');
                    setCivilStatus(user.civil_status || 'Single');
                    setPhone(user.phone || '');
                    setProfileError('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                >
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Beneficiaries Card */}
        <div className="card self-start">
          <div className="card-head">
            <div>
              <h3 className="card-title">Beneficiaries</h3>
              <p className="card-sub">Eligible for funeral claims.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (beneficiaries.length >= 5) {
                  toast('You can register up to 5 beneficiaries. Remove one to add another.', 'warning');
                  return;
                }
                setBenModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <i className="fa-solid fa-plus" aria-hidden="true"></i> Add
            </button>
          </div>
          <div id="beneficiary-list" className="divide-y divide-slate-100">
            {beneficiaries.length > 0 ? (
              beneficiaries.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {b.name}{' '}
                      {b.is_deceased && <span className="badge badge-slate ml-1">Deceased</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {b.relation} · Born {fmtDate(b.dob)}
                    </p>
                  </div>
                  {!b.is_deceased && (
                    <button
                      type="button"
                      onClick={() => setBenToRemove(b)}
                      className="btn-icon text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove ${b.name}`}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty py-8 text-center text-sm text-slate-500">
                <i className="fa-solid fa-user-plus text-2xl text-slate-300 mb-2 block" aria-hidden="true"></i>
                <span>No beneficiaries yet. Add the family members covered by your membership.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Beneficiary Dialog Modal */}
      {benModalOpen && (
        <DialogModal
          title="Add beneficiary"
          isOpen={benModalOpen}
          onClose={() => setBenModalOpen(false)}
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setBenModalOpen(false) },
            {
              label: benSaving ? 'Saving...' : 'Save beneficiary',
              variant: 'btn-primary',
              disabled: benSaving,
              onClick: handleAddBeneficiarySubmit
            }
          ]}
        >
          <form onSubmit={handleAddBeneficiarySubmit} className="space-y-4" noValidate>
            {benError && (
              <div id="ben-error" className="form-error" role="alert">
                <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                <span>{benError}</span>
              </div>
            )}
            <div>
              <label htmlFor="ben-name" className="label req">
                Full name
              </label>
              <input
                id="ben-name"
                type="text"
                value={benName}
                onChange={(e) => setBenName(e.target.value)}
                className="input"
                required
                maxLength={80}
                placeholder="Maria Dela Cruz"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="ben-relation" className="label req">
                Relationship
              </label>
              <select
                id="ben-relation"
                value={benRelation}
                onChange={(e) => setBenRelation(e.target.value)}
                className="input"
              >
                <option>Spouse</option>
                <option>Child</option>
                <option>Parent</option>
                <option>Sibling</option>
              </select>
            </div>
            <div>
              <label htmlFor="ben-dob" className="label req">
                Date of birth
              </label>
              <input
                id="ben-dob"
                type="date"
                value={benDob}
                onChange={(e) => setBenDob(e.target.value)}
                className="input"
                required
                max={todayStr()}
              />
            </div>
          </form>
        </DialogModal>
      )}

      {/* Remove Confirmation Dialog Modal */}
      {benToRemove && (
        <DialogModal
          title="Remove beneficiary?"
          isOpen={!!benToRemove}
          onClose={() => setBenToRemove(null)}
          size="sm"
          actions={[
            { label: 'Cancel', variant: 'btn-secondary', onClick: () => setBenToRemove(null) },
            {
              label: 'Remove',
              variant: 'btn-danger',
              onClick: async () => {
                await onRemoveBeneficiary(benToRemove.id);
                setBenToRemove(null);
              }
            }
          ]}
        >
          <p className="text-slate-600 leading-relaxed">
            <strong>{benToRemove.name}</strong> will no longer be covered by your membership.
          </p>
        </DialogModal>
      )}
    </div>
  );
}
