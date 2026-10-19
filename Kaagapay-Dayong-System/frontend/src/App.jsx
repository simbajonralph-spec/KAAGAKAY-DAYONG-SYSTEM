import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AuthSection from './components/AuthSection';
import MemberPortal from './components/MemberPortal/MemberPortal';
import AdminPortal from './components/AdminPortal/AdminPortal';
import ToastContainer from './components/ToastContainer';
import AboutModal from './components/AboutModal';
import { api, setAuthToken, getAuthToken } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Member Portal Data
  const [memberDashboard, setMemberDashboard] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [memberPayments, setMemberPayments] = useState([]);
  const [memberClaims, setMemberClaims] = useState([]);

  // Admin Portal Data
  const [adminOverview, setAdminOverview] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminClaims, setAdminClaims] = useState([]);
  const [claimsHistory, setClaimsHistory] = useState([]);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);

  // Common Data
  const [benefitTypes, setBenefitTypes] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, type === 'error' ? 7000 : 4500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Member Portal Data
  const loadMemberData = useCallback(async () => {
    try {
      const [dashRes, benRes, payRes, claimRes, bnfRes] = await Promise.all([
        api.getMemberDashboard(),
        api.getBeneficiaries(),
        api.getMemberPayments(),
        api.getMemberClaims(),
        api.getBenefitTypes()
      ]);
      setMemberDashboard(dashRes);
      setBeneficiaries(benRes.beneficiaries || []);
      setMemberPayments(payRes.payments || []);
      setMemberClaims(claimRes.claims || []);
      setBenefitTypes(bnfRes.benefitTypes || []);
    } catch (err) {
      console.error('Error loading member data:', err);
    }
  }, []);

  // Fetch Admin Portal Data
  const loadAdminData = useCallback(async () => {
    try {
      const [ovRes, regRes, memRes, payRes, clmRes, histRes, bnfRes] = await Promise.all([
        api.getAdminOverview(),
        api.getRegistrations(),
        api.getMembers(),
        api.getAdminPayments(),
        api.getAdminClaims(),
        api.getClaimsHistory(),
        api.getBenefitTypes()
      ]);
      setAdminOverview(ovRes);
      setRegistrations(regRes.registrations || []);
      setAdminMembers(memRes.members || []);
      setAdminPayments(payRes.payments || []);
      setAdminClaims(clmRes.claims || []);
      setClaimsHistory(histRes.history || []);
      setBenefitTypes(bnfRes.benefitTypes || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, []);

  // Fetch Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (_) {}
  }, []);

  // Load User and App Data
  const refreshAppData = useCallback(
    async (currentUser) => {
      const u = currentUser || user;
      if (!u) return;
      loadNotifications();
      if (u.role === 'admin') {
        await loadAdminData();
      } else {
        await loadMemberData();
      }
    },
    [user, loadAdminData, loadMemberData, loadNotifications]
  );

  // Initial Auth Check
  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          await refreshAppData(res.user);
        } catch (_) {
          setAuthToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [refreshAppData]);

  // Auth Handlers
  const handleLogin = async (credentials) => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setUser(res.user);
    addToast(
      res.user.role === 'admin'
        ? `Signed in as administrator for ${res.user.municipality}.`
        : `Welcome back, ${res.user.name}.`,
      'success'
    );
    await refreshAppData(res.user);
  };

  const handleRegister = async (userData) => {
    const res = await api.register(userData);
    addToast(res.message, 'success');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setSelectedMemberDetails(null);
    addToast('You have signed out.', 'info');
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      handleLogout();
      addToast('Demo data in PostgreSQL has been reset.', 'success');
    } catch (err) {
      addToast(err.message || 'Could not reset demo data.', 'error');
    }
  };

  // Notification Handlers
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, read_by: [...(n.read_by || []), user.id] }
            : n
        )
      );
    } catch (_) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_by: [...(n.read_by || []), user.id]
        }))
      );
    } catch (_) {}
  };

  // Member Actions
  const handleUpdateProfile = async (profileData) => {
    await api.updateProfile(profileData);
    addToast('Your profile was updated.', 'success');
    await refreshAppData();
  };

  const handleAddBeneficiary = async (benData) => {
    await api.addBeneficiary(benData);
    addToast('Beneficiary added.', 'success');
    await refreshAppData();
  };

  const handleRemoveBeneficiary = async (id) => {
    await api.removeBeneficiary(id);
    addToast('Beneficiary removed.', 'info');
    await refreshAppData();
  };

  const handleSubmitPayment = async (payData) => {
    const res = await api.submitPayment(payData);
    addToast(res.message, 'success');
    await refreshAppData();
  };

  const handleSubmitClaim = async (claimData) => {
    const res = await api.submitClaim(claimData);
    addToast(res.message, 'success');
    await refreshAppData();
  };

  // Admin Actions
  const handlePostDues = async (duesData) => {
    const res = await api.postDues(duesData);
    addToast(res.message, 'success');
    await refreshAppData();
  };

  const handleToggleDue = async (id) => {
    await api.toggleDue(id);
    addToast('Due status toggled.', 'info');
    await refreshAppData();
  };

  const handleApproveUser = async (id) => {
    await api.updateUserStatus(id, 'Active');
    addToast('User registration approved.', 'success');
    await refreshAppData();
  };

  const handleRejectUser = async (id) => {
    await api.updateUserStatus(id, 'Rejected');
    addToast('User registration rejected.', 'info');
    await refreshAppData();
  };

  const handleUpdateUserStatus = async (id, status) => {
    await api.updateUserStatus(id, status);
    addToast(`Member status updated to ${status}.`, 'info');
    await refreshAppData();
  };

  const handleViewUserDetails = async (id) => {
    try {
      const details = await api.getMemberDetails(id);
      setSelectedMemberDetails(details);
    } catch (err) {
      addToast(err.message || 'Could not load member details.', 'error');
    }
  };

  const handleReviewPayment = async (id, status, reviewNote) => {
    await api.reviewPayment(id, status, reviewNote);
    addToast(`Payment ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
    await refreshAppData();
  };

  const handleReviewClaim = async (id, status, amount, reviewNote) => {
    await api.reviewClaim(id, status, amount, reviewNote);
    addToast(`Claim ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'info');
    await refreshAppData();
  };

  const handleCreateBenefitType = async (data) => {
    await api.createBenefitType(data);
    addToast('Benefit type created.', 'success');
    await refreshAppData();
  };

  const handleUpdateBenefitType = async (id, data) => {
    await api.updateBenefitType(id, data);
    addToast('Benefit type updated.', 'success');
    await refreshAppData();
  };

  const handleToggleBenefitType = async (id) => {
    await api.toggleBenefitType(id);
    addToast('Benefit status toggled.', 'info');
    await refreshAppData();
  };

  const handleDeleteBenefitType = async (id) => {
    await api.deleteBenefitType(id);
    addToast('Benefit type removed.', 'info');
    await refreshAppData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-brand-400"></i>
          <p className="text-sm text-slate-300">Connecting to Kaagapay Dayong...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-100 antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-white focus:text-brand-800 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global About Modal */}
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />

      {/* Authentication Section (when not logged in) */}
      {!user ? (
        <AuthSection
          onLogin={handleLogin}
          onRegister={handleRegister}
          onResetDemo={handleResetDemo}
          onOpenAbout={() => setAboutModalOpen(true)}
        />
      ) : (
        /* Application Shell (when logged in) */
        <div id="app-wrapper" className="flex-1 flex flex-col min-h-screen">
          <Header
            user={user}
            onLogout={handleLogout}
            onOpenAbout={() => setAboutModalOpen(true)}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />

          <main
            id="main-content"
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
            tabIndex="-1"
          >
            {user.role === 'admin' ? (
              <AdminPortal
                user={user}
                overviewData={adminOverview}
                registrations={registrations}
                members={adminMembers}
                payments={adminPayments}
                claims={adminClaims}
                claimsHistory={claimsHistory}
                benefitTypes={benefitTypes}
                onPostDues={handlePostDues}
                onToggleDue={handleToggleDue}
                onApproveUser={handleApproveUser}
                onRejectUser={handleRejectUser}
                onUpdateUserStatus={handleUpdateUserStatus}
                onViewUserDetails={handleViewUserDetails}
                selectedMemberDetails={selectedMemberDetails}
                onCloseMemberDetails={() => setSelectedMemberDetails(null)}
                onReviewPayment={handleReviewPayment}
                onReviewClaim={handleReviewClaim}
                onCreateBenefitType={handleCreateBenefitType}
                onUpdateBenefitType={handleUpdateBenefitType}
                onToggleBenefitType={handleToggleBenefitType}
                onDeleteBenefitType={handleDeleteBenefitType}
                toast={addToast}
              />
            ) : (
              <MemberPortal
                dashboardData={memberDashboard}
                beneficiaries={beneficiaries}
                payments={memberPayments}
                claims={memberClaims}
                benefitTypes={benefitTypes}
                onUpdateProfile={handleUpdateProfile}
                onAddBeneficiary={handleAddBeneficiary}
                onRemoveBeneficiary={handleRemoveBeneficiary}
                onSubmitPayment={handleSubmitPayment}
                onSubmitClaim={handleSubmitClaim}
                toast={addToast}
              />
            )}
          </main>

          <footer className="bg-white border-t border-slate-200 py-4 text-center text-sm text-slate-500 no-print">
            <div className="max-w-7xl mx-auto px-4">
              © 2026 Kaagapay Dayong — Community mutual aid &amp; funeral benefit program.
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
