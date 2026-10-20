import { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../Button.jsx';

/**
 * Email + password form shared by the three portals.
 * Validation is intentionally light - the API is the source of truth and its
 * message is surfaced through `onError`.
 */
export default function LoginForm({ onSubmit, forgotTo, submitLabel = 'Sign in' }) {
  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const emailError =
    touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
      ? 'Enter a valid email address.'
      : '';
  const passwordError = touched && values.password.length < 1 ? 'Password is required.' : '';

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || !values.password) return;

    setBusy(true);
    try {
      await onSubmit({ email: values.email.trim(), password: values.password });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form auth__form" onSubmit={handleSubmit} noValidate>
      <div className={emailError ? 'field has-error' : 'field'}>
        <label htmlFor="auth-email">
          Email address <span className="req">*</span>
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          value={values.email}
          onChange={set('email')}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? 'auth-email-error' : undefined}
        />
        {emailError && (
          <p className="field__error" id="auth-email-error" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div className={passwordError ? 'field has-error' : 'field'}>
        <label htmlFor="auth-password">
          Password <span className="req">*</span>
        </label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={set('password')}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? 'auth-password-error' : undefined}
        />
        {passwordError && (
          <p className="field__error" id="auth-password-error" role="alert">
            {passwordError}
          </p>
        )}
      </div>

      <div className="auth__row">
        <Button type="submit" variant="primary" ariaLabel={submitLabel}>
          {busy ? 'Signing in…' : submitLabel}
        </Button>
        {forgotTo && (
          <Link className="auth__link" to={forgotTo}>
            Forgot password?
          </Link>
        )}
      </div>
    </form>
  );
}
