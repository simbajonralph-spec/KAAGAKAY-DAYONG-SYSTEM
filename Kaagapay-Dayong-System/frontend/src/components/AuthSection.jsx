import React, { useState } from 'react';
import { DAVAO_REGION_LOCATIONS } from '../constants';

export default function AuthSection({ onLogin, onRegister, onResetDemo, onOpenAbout }) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPassword2, setSignupPassword2] = useState('');
  const [signupMunicipality, setSignupMunicipality] = useState('');
  const [signupBarangay, setSignupBarangay] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLoginForm = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Enter your email address and password.');
      return;
    }

    setLoginLoading(true);
    try {
      await onLogin({ email: loginEmail.trim(), password: loginPassword });
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupForm = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (signupName.trim().length < 3) {
      setSignupError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      setSignupError('Enter a valid email address.');
      return;
    }
    if (!/^(\+?63|0)9\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(signupPhone.trim())) {
      setSignupError('Enter a valid Philippine mobile number, like 0917-123-4567.');
      return;
    }
    if (signupPassword.length < 8 || !/[A-Za-z]/.test(signupPassword) || !/\d/.test(signupPassword)) {
      setSignupError('Password needs at least 8 characters, including a letter and a number.');
      return;
    }
    if (signupPassword !== signupPassword2) {
      setSignupError('The passwords do not match.');
      return;
    }
    if (!signupMunicipality) {
      setSignupError('Select your municipality or city.');
      return;
    }
    if (signupBarangay.trim().length < 2) {
      setSignupError('Enter your barangay or purok.');
      return;
    }

    setSignupLoading(true);
    try {
      await onRegister({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        password: signupPassword,
        municipality: signupMunicipality,
        barangay: signupBarangay.trim()
      });
      // Switch to login tab and prefill email
      setActiveTab('login');
      setLoginEmail(signupEmail.trim());
      setLoginPassword('');
    } catch (err) {
      setSignupError(err.message || 'Registration failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  const fillDemo = (email, pw) => {
    setLoginEmail(email);
    setLoginPassword(pw);
    setLoginError('');
  };

  return (
    <section
      id="auth-section"
      className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-ink-900"
      aria-label="Sign in or register"
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
        {/* Left Side: Brand Story & Values */}
        <div className="lg:col-span-2 bg-brand-800 text-white p-8 lg:p-10 flex flex-col justify-between gap-8">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-lg bg-white text-brand-800 flex items-center justify-center text-xl"
                aria-hidden="true"
              >
                <i className="fa-solid fa-hands-holding-child"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">Kaagapay Dayong</h1>
                <p className="text-sm text-brand-100">Mutual aid &amp; funeral assistance</p>
              </div>
            </div>
            <h2 className="mt-10 text-2xl lg:text-3xl font-bold leading-snug">
              Neighbors looking after neighbors, in the hardest moments.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-brand-50">
              <li className="flex gap-3">
                <i className="fa-solid fa-id-card mt-0.5 text-brand-200" aria-hidden="true"></i>
                <span>Carry your digital membership ID on any device.</span>
              </li>
              <li className="flex gap-3">
                <i
                  className="fa-solid fa-file-invoice-dollar mt-0.5 text-brand-200"
                  aria-hidden="true"
                ></i>
                <span>See community dues for your barangay and send payment proof.</span>
              </li>
              <li className="flex gap-3">
                <i
                  className="fa-solid fa-hand-holding-heart mt-0.5 text-brand-200"
                  aria-hidden="true"
                ></i>
                <span>File a funeral benefit claim for a registered beneficiary.</span>
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onOpenAbout}
            className="btn btn-sm self-start bg-white/10 text-white border border-white/30 hover:bg-white/20"
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true"></i> About Kaagapay Dayong
          </button>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="lg:col-span-3 p-6 sm:p-8 lg:p-10">
          <div role="tablist" aria-label="Account" className="tabbar mb-6">
            <button
              role="tab"
              type="button"
              id="tab-login-btn"
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              className="tab"
            >
              Sign in
            </button>
            <button
              role="tab"
              type="button"
              id="tab-signup-btn"
              aria-selected={activeTab === 'signup'}
              onClick={() => setActiveTab('signup')}
              className="tab"
            >
              Create account
            </button>
          </div>

          {/* Sign In Form */}
          {activeTab === 'login' && (
            <form id="form-login" onSubmit={handleLoginForm} className="space-y-4" noValidate>
              {loginError && (
                <div id="login-error" className="form-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="label">
                  Email address
                </label>
                <input
                  type="email"
                  id="login-email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="name@email.com"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-icon absolute right-0.5 top-0.5 h-9 w-9 text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i
                      className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-primary w-full h-11"
              >
                {loginLoading ? 'Signing in...' : 'Sign in'}
              </button>

              <details className="rounded-lg border border-slate-200 bg-slate-50 text-sm">
                <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-slate-700">
                  Demo accounts
                </summary>
                <div className="px-3 pb-3 space-y-2 text-slate-600">
                  <p className="text-xs">
                    Connected to PostgreSQL. Use these demo credentials to explore each role:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => fillDemo('tagumcity@gmail.com', 'admin123')}
                      className="text-left rounded-lg border border-slate-200 bg-white p-2.5 hover:border-brand-500 transition-colors"
                    >
                      <span className="block font-semibold text-slate-800">Chapter admin</span>
                      <span className="block text-xs">tagumcity@gmail.com</span>
                      <span className="block text-xs font-mono text-slate-500">admin123</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemo('juan.delacruz@email.com', 'member123')}
                      className="text-left rounded-lg border border-slate-200 bg-white p-2.5 hover:border-brand-500 transition-colors"
                    >
                      <span className="block font-semibold text-slate-800">Member</span>
                      <span className="block text-xs">juan.delacruz@email.com</span>
                      <span className="block text-xs font-mono text-slate-500">member123</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onResetDemo}
                    className="text-xs text-red-700 hover:underline inline-block mt-1"
                  >
                    Reset all demo data in PostgreSQL
                  </button>
                </div>
              </details>
            </form>
          )}

          {/* Create Account Form */}
          {activeTab === 'signup' && (
            <form id="form-signup" onSubmit={handleSignupForm} className="space-y-4" noValidate>
              {signupError && (
                <div id="signup-error" className="form-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true"></i>
                  <span>{signupError}</span>
                </div>
              )}

              <div>
                <label htmlFor="signup-name" className="label req">
                  Full name
                </label>
                <input
                  type="text"
                  id="signup-name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  autoComplete="name"
                  required
                  placeholder="Juan Dela Cruz"
                  className="input"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-email" className="label req">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="signup-email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="juan@email.com"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="signup-phone" className="label req">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    id="signup-phone"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    autoComplete="tel"
                    required
                    placeholder="0917-000-0000"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-password" className="label req">
                    Password
                  </label>
                  <input
                    type="password"
                    id="signup-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="input"
                  />
                  <p className="hint">At least 8 characters, with a letter and a number.</p>
                </div>
                <div>
                  <label htmlFor="signup-password2" className="label req">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    id="signup-password2"
                    value={signupPassword2}
                    onChange={(e) => setSignupPassword2(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="input"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-municipality" className="label req">
                    Municipality / city
                  </label>
                  <select
                    id="signup-municipality"
                    value={signupMunicipality}
                    onChange={(e) => {
                      setSignupMunicipality(e.target.value);
                      if (!e.target.value) setSignupBarangay('');
                    }}
                    required
                    className="input"
                  >
                    <option value="">Select municipality or city</option>
                    {Object.entries(DAVAO_REGION_LOCATIONS).map(([province, towns]) => (
                      <optgroup key={province} label={province}>
                        {towns.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="signup-barangay" className="label req">
                    Barangay / purok
                  </label>
                  <input
                    type="text"
                    id="signup-barangay"
                    value={signupBarangay}
                    onChange={(e) => setSignupBarangay(e.target.value)}
                    required
                    disabled={!signupMunicipality}
                    maxLength={80}
                    placeholder={
                      signupMunicipality
                        ? 'e.g. Poblacion, Purok 3'
                        : 'Select a municipality first'
                    }
                    className="input"
                  />
                </div>
              </div>

              <p className="hint">
                Your chapter admin reviews every new registration before you can sign in.
              </p>

              <button
                type="submit"
                disabled={signupLoading}
                className="btn btn-primary w-full h-11"
              >
                <i className="fa-solid fa-user-plus" aria-hidden="true"></i>{' '}
                {signupLoading ? 'Submitting registration...' : 'Submit registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
