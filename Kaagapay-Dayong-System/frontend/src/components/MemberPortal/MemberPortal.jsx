import React, { useState } from 'react';
import MemberDashboard from './MemberDashboard';
import PaymentsDues from './PaymentsDues';
import ProfileBeneficiaries from './ProfileBeneficiaries';
import BenefitClaims from './BenefitClaims';

export default function MemberPortal({
  dashboardData,
  beneficiaries,
  payments,
  claims,
  benefitTypes,
  onUpdateProfile,
  onAddBeneficiary,
  onRemoveBeneficiary,
  onSubmitPayment,
  onSubmitClaim,
  toast
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDueId, setSelectedDueId] = useState(null);

  const unpaidCount = dashboardData?.summary?.unpaidCount || 0;

  const handleSelectDueToPay = (dueId) => {
    setSelectedDueId(dueId);
    setActiveTab('payments');
  };

  return (
    <section id="portal-member" className="space-y-6" aria-label="Member portal">
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Member sections" className="tabbar">
        <button
          role="tab"
          type="button"
          id="mtab-dashboard"
          aria-selected={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          className="tab"
        >
          <i className="fa-solid fa-gauge-high" aria-hidden="true"></i> Dashboard
        </button>

        <button
          role="tab"
          type="button"
          id="mtab-payments"
          aria-selected={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          className="tab"
        >
          <i className="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Payments &amp; dues{' '}
          {unpaidCount > 0 && (
            <span id="mtab-payments-count" className="tab-count">
              {unpaidCount}
            </span>
          )}
        </button>

        <button
          role="tab"
          type="button"
          id="mtab-profile"
          aria-selected={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          className="tab"
        >
          <i className="fa-solid fa-address-card" aria-hidden="true"></i> Profile &amp; beneficiaries
        </button>

        <button
          role="tab"
          type="button"
          id="mtab-death-report"
          aria-selected={activeTab === 'death-report'}
          onClick={() => setActiveTab('death-report')}
          className="tab"
        >
          <i className="fa-solid fa-hand-holding-heart" aria-hidden="true"></i> Benefit claims
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dashboard' && (
        <MemberDashboard
          dashboardData={dashboardData}
          onGotoTab={setActiveTab}
          onSelectDueToPay={handleSelectDueToPay}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsDues
          dashboardData={dashboardData}
          payments={payments}
          selectedDueId={selectedDueId}
          onSubmitPayment={onSubmitPayment}
          toast={toast}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileBeneficiaries
          dashboardData={dashboardData}
          beneficiaries={beneficiaries}
          onUpdateProfile={onUpdateProfile}
          onAddBeneficiary={onAddBeneficiary}
          onRemoveBeneficiary={onRemoveBeneficiary}
          toast={toast}
        />
      )}

      {activeTab === 'death-report' && (
        <BenefitClaims
          dashboardData={dashboardData}
          beneficiaries={beneficiaries}
          claims={claims}
          benefitTypes={benefitTypes}
          onSubmitClaim={onSubmitClaim}
          toast={toast}
        />
      )}
    </section>
  );
}
