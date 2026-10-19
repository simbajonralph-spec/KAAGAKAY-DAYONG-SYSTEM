import React, { useState } from 'react';
import AdminOverview from './AdminOverview';
import UserApprovals from './UserApprovals';
import MemberRegistry from './MemberRegistry';
import PaymentVerification from './PaymentVerification';
import ClaimsVerification from './ClaimsVerification';
import ClaimsHistory from './ClaimsHistory';
import BenefitTypes from './BenefitTypes';

export default function AdminPortal({
  user,
  overviewData,
  registrations,
  members,
  payments,
  claims,
  claimsHistory,
  benefitTypes,
  onPostDues,
  onToggleDue,
  onApproveUser,
  onRejectUser,
  onUpdateUserStatus,
  onViewUserDetails,
  selectedMemberDetails,
  onCloseMemberDetails,
  onReviewPayment,
  onReviewClaim,
  onCreateBenefitType,
  onUpdateBenefitType,
  onToggleBenefitType,
  onDeleteBenefitType,
  toast
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const pendingUsersCount = overviewData?.kpis?.pendingUsers || 0;
  const pendingPaymentsCount = overviewData?.kpis?.pendingPayments || 0;
  const pendingClaimsCount = overviewData?.kpis?.pendingClaims || 0;

  const chapterTitle =
    user.municipality === 'All' ? 'All chapters' : `${user.municipality} chapter`;
  const locationLabel = user.municipality === 'All' ? 'All chapters' : user.municipality;

  return (
    <section id="portal-admin" className="space-y-6" aria-label="Administrator portal">
      {/* Chapter Title & Location Badge */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-brand-700">Administrator portal</p>
          <h2 id="admin-chapter-title" className="text-2xl font-bold text-slate-900">
            {chapterTitle}
          </h2>
        </div>
        <span id="admin-location-badge" className="badge badge-green self-start sm:self-auto">
          <i className="fa-solid fa-location-dot" aria-hidden="true"></i> {locationLabel}
        </span>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Admin sections" className="tabbar">
        <button
          role="tab"
          type="button"
          id="atab-overview"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className="tab"
        >
          <i className="fa-solid fa-chart-pie" aria-hidden="true"></i> Overview
        </button>

        <button
          role="tab"
          type="button"
          id="atab-user-approvals"
          aria-selected={activeTab === 'user-approvals'}
          onClick={() => setActiveTab('user-approvals')}
          className="tab"
        >
          <i className="fa-solid fa-user-clock" aria-hidden="true"></i> Registrations{' '}
          {pendingUsersCount > 0 && (
            <span id="atab-user-approvals-count" className="tab-count">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          role="tab"
          type="button"
          id="atab-members"
          aria-selected={activeTab === 'members'}
          onClick={() => setActiveTab('members')}
          className="tab"
        >
          <i className="fa-solid fa-users" aria-hidden="true"></i> Members
        </button>

        <button
          role="tab"
          type="button"
          id="atab-payment-verify"
          aria-selected={activeTab === 'payment-verify'}
          onClick={() => setActiveTab('payment-verify')}
          className="tab"
        >
          <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i> Payments{' '}
          {pendingPaymentsCount > 0 && (
            <span id="atab-payment-verify-count" className="tab-count">
              {pendingPaymentsCount}
            </span>
          )}
        </button>

        <button
          role="tab"
          type="button"
          id="atab-death-verify"
          aria-selected={activeTab === 'death-verify'}
          onClick={() => setActiveTab('death-verify')}
          className="tab"
        >
          <i className="fa-solid fa-file-signature" aria-hidden="true"></i> Benefit claims{' '}
          {pendingClaimsCount > 0 && (
            <span id="atab-death-verify-count" className="tab-count">
              {pendingClaimsCount}
            </span>
          )}
        </button>

        <button
          role="tab"
          type="button"
          id="atab-benefits-history"
          aria-selected={activeTab === 'benefits-history'}
          onClick={() => setActiveTab('benefits-history')}
          className="tab"
        >
          <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Claims history
        </button>

        <button
          role="tab"
          type="button"
          id="atab-benefit-types"
          aria-selected={activeTab === 'benefit-types'}
          onClick={() => setActiveTab('benefit-types')}
          className="tab"
        >
          <i className="fa-solid fa-hand-holding-heart" aria-hidden="true"></i> Benefit types
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <AdminOverview
          overviewData={overviewData}
          onGotoTab={setActiveTab}
          onPostDues={onPostDues}
          onToggleDue={onToggleDue}
        />
      )}

      {activeTab === 'user-approvals' && (
        <UserApprovals
          registrations={registrations}
          onApproveUser={onApproveUser}
          onRejectUser={onRejectUser}
          onViewUserDetails={onViewUserDetails}
        />
      )}

      {activeTab === 'members' && (
        <MemberRegistry
          members={members}
          onApproveUser={onApproveUser}
          onUpdateStatus={onUpdateUserStatus}
          onViewUserDetails={onViewUserDetails}
          selectedMemberDetails={selectedMemberDetails}
          onCloseMemberDetails={onCloseMemberDetails}
        />
      )}

      {activeTab === 'payment-verify' && (
        <PaymentVerification
          payments={payments}
          onReviewPayment={onReviewPayment}
        />
      )}

      {activeTab === 'death-verify' && (
        <ClaimsVerification
          claims={claims}
          reserveFund={overviewData?.kpis?.reserveFund || 0}
          onReviewClaim={onReviewClaim}
          toast={toast}
        />
      )}

      {activeTab === 'benefits-history' && (
        <ClaimsHistory history={claimsHistory} />
      )}

      {activeTab === 'benefit-types' && (
        <BenefitTypes
          benefitTypes={benefitTypes}
          onCreateBenefitType={onCreateBenefitType}
          onUpdateBenefitType={onUpdateBenefitType}
          onToggleBenefitType={onToggleBenefitType}
          onDeleteBenefitType={onDeleteBenefitType}
          toast={toast}
        />
      )}
    </section>
  );
}
