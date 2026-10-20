import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/Button.jsx';
import { forgotPassword, resetPassword } from '../../services/authService.js';

const ROLES = ['employee'];
const LABEL = { employee: 'Employee' };

/**
 * Password reset for employee accounts (the API rejects `admin`).
 * Stage 1 requests a token, stage 2 exchanges it for a new password - so the
 * flow still works when outbound email is not configured in development.
 */
export default function ForgotPassword() {
  const [params, setParams] = useSearchParams();
  const role = ROLES.includes(params.get('role')) ? params.get('role') : 'employee';

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const setRole = (next) => {
    setParams({ role: next });
    setStep(1);
    setError('');
    setSent('');
  };

  const requestReset = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await forgotPassword(role, email.trim());
      setSent(res?.message || 'If an account exists for that email, a reset link has been sent.');
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Could not start the reset. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const applyReset = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      await resetPassword(role, token.trim(), password, confirm);
      setStep(3);
    } catch (err) {
      setError(err?.message || 'That reset token was rejected. Request a new one.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth auth--reset">
      <Helmet>
        <title>Reset password · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="auth__panel">
        <Link to="/" className="auth__brand" aria-label="SvapNora — home">
          SvapNora<span className="logo-chevron">&gt;</span>
        </Link>

        <p className="eyebrow">
          <span className="eyebrow__bullet" aria-hidden="true" />
          Account recovery
        </p>
        <h1 className="auth__title">Reset your password</h1>

        {ROLES.length > 1 && (
          <div className="auth__tabs" role="tablist" aria-label="Account type">
            {ROLES.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={r === role}
                className={`auth__tab${r === role ? ' is-active' : ''}`}
                onClick={() => setRole(r)}
                type="button"
              >
                {LABEL[r]}
              </button>
            ))}
          </div>
        )}

        {error && <Alert tone="error">{error}</Alert>}
        {sent && step === 2 && <Alert tone="info">{sent}</Alert>}

        {step === 1 && (
          <form className="form auth__form" onSubmit={requestReset} noValidate>
            <div className="field">
              <label htmlFor="fp-email">
                Email address <span className="req">*</span>
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary">
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form className="form auth__form" onSubmit={applyReset} noValidate>
            <div className="field">
              <label htmlFor="fp-token">
                Reset token <span className="req">*</span>
              </label>
              <input
                id="fp-token"
                type="text"
                autoComplete="one-time-code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the token from the reset email"
                required
              />
              <p className="field__error" id="fp-token-hint">
                Valid for 30 minutes.
              </p>
            </div>
            <div className="field">
              <label htmlFor="fp-password">
                New password <span className="req">*</span>
              </label>
              <input
                id="fp-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="fp-confirm">
                Confirm new password <span className="req">*</span>
              </label>
              <input
                id="fp-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary">
              {busy ? 'Updating…' : 'Set new password'}
            </Button>
          </form>
        )}

        {step === 3 && (
          <>
            <Alert tone="success" title="Password updated">
              You can sign in with your new password.
            </Alert>
            <div className="auth__foot">
              <Link to={`/${role}/login`}>Go to {LABEL[role].toLowerCase()} sign in</Link>
            </div>
          </>
        )}

        {step < 3 && (
          <div className="auth__foot">
            <Link to={`/${role}/login`}>Back to sign in</Link> · <Link to="/">Website</Link>
          </div>
        )}
      </div>
    </div>
  );
}
