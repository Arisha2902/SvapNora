import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthCard from '../../components/auth/AuthCard.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { useEmployeeAuth } from '../../context/EmployeeAuth.jsx';

export default function EmployeeLogin() {
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const from = location.state?.from || '/employee/dashboard';
  const notice =
    location.state?.reason === 'expired'
      ? 'Your session ended. Sign in again to continue.'
      : '';

  const handleSubmit = async (credentials) => {
    setError('');
    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.');
    }
  };

  return (
    <AuthCard
      portal="employee"
      title="Employee sign in"
      subtitle="Your projects, tasks, leave balance and team announcements."
      notice={notice}
      error={error}
      footer={
        <span>
          Need access? <Link to="/contact">Talk to your administrator</Link> ·{' '}
          <Link to="/">Back to website</Link>
        </span>
      }
    >
      <LoginForm onSubmit={handleSubmit} forgotTo="/forgot-password" submitLabel="Sign in" />
    </AuthCard>
  );
}
