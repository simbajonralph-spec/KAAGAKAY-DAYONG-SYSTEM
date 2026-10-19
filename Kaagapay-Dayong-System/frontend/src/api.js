const TOKEN_KEY = 'kd_jwt_token';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

async function request(url, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is being sent
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => request('/api/auth/me'),

  resetDemo: () =>
    request('/api/auth/reset-demo', {
      method: 'POST'
    }),

  // Notifications
  getNotifications: () => request('/api/notifications'),
  markNotificationRead: (id) =>
    request(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    }),
  markAllNotificationsRead: () =>
    request('/api/notifications/read-all', {
      method: 'PATCH'
    }),

  // Member
  getMemberDashboard: () => request('/api/member/dashboard'),
  updateProfile: (profileData) =>
    request('/api/member/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }),
  getBeneficiaries: () => request('/api/member/beneficiaries'),
  addBeneficiary: (data) =>
    request('/api/member/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeBeneficiary: (id) =>
    request(`/api/member/beneficiaries/${id}`, {
      method: 'DELETE'
    }),
  getMemberPayments: () => request('/api/member/payments'),
  submitPayment: (paymentData) =>
    request('/api/member/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }),
  getMemberClaims: () => request('/api/member/claims'),
  submitClaim: (claimData) =>
    request('/api/member/claims', {
      method: 'POST',
      body: JSON.stringify(claimData)
    }),

  // Benefit Types
  getBenefitTypes: () => request('/api/benefit-types'),
  createBenefitType: (data) =>
    request('/api/benefit-types', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBenefitType: (id, data) =>
    request(`/api/benefit-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  toggleBenefitType: (id) =>
    request(`/api/benefit-types/${id}/toggle`, {
      method: 'PATCH'
    }),
  deleteBenefitType: (id) =>
    request(`/api/benefit-types/${id}`, {
      method: 'DELETE'
    }),

  // Admin
  getAdminOverview: () => request('/api/admin/overview'),
  postDues: (duesData) =>
    request('/api/admin/dues', {
      method: 'POST',
      body: JSON.stringify(duesData)
    }),
  toggleDue: (id) =>
    request(`/api/admin/dues/${id}/toggle`, {
      method: 'PATCH'
    }),
  getRegistrations: () => request('/api/admin/registrations'),
  getMembers: () => request('/api/admin/members'),
  getMemberDetails: (id) => request(`/api/admin/members/${id}`),
  updateUserStatus: (id, status) =>
    request(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  getAdminPayments: () => request('/api/admin/payments'),
  reviewPayment: (id, status, review_note) =>
    request(`/api/admin/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, review_note })
    }),
  getAdminClaims: () => request('/api/admin/claims'),
  reviewClaim: (id, status, amount, review_note) =>
    request(`/api/admin/claims/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, amount, review_note })
    }),
  getClaimsHistory: () => request('/api/admin/claims-history')
};
