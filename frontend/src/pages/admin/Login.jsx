import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthCard from '../../components/auth/AuthCard.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { useAdminAuth } from '../../context/AdminAuth.jsx';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const from = location.state?.from || '/admin/dashboard';
  const notice =
    location.state?.reason === 'expired'
      ? 'Your admin session ended. Sign in again to continue.'
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
      portal="admin"
      title="Admin sign in"
      subtitle="Restricted control room. This address is never linked from the public site."
      notice={notice}
      error={error}
      footer={
        <span>
          Not an administrator? <Link to="/">Return to the website</Link>
        </span>
      }
    >
      <LoginForm onSubmit={handleSubmit} submitLabel="Enter control room" />
    </AuthCard>
  );
}
