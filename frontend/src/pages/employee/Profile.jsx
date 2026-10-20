import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/Button.jsx';
import { Field } from '../../components/admin/FilterBar.jsx';
import { useEmployeeAuth } from '../../context/EmployeeAuth.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { changePassword, getProfile, updateProfile } from '../../services/employeeService.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function EmployeeProfile() {
  const toast = useToast();
  const { user, updateUser } = useEmployeeAuth();
  const id = user?.id || user?._id;

  const [profile, setProfile] = useState({ name: '', phone: '', avatar: '' });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    let alive = true;
    getProfile()
      .then((res) => {
        if (!alive) return;
        const d = res?.data?.user || {};
        setProfile({ name: d.name || '', phone: d.phone || '', avatar: d.avatar || '' });
      })
      .catch(() => {
        /* fall back to the session copy */
      });
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const res = await updateProfile({ name: profile.name.trim(), phone: profile.phone, avatar: profile.avatar });
      const updated = res?.data?.user;
      if (updated) updateUser(updated);
      toast.success('Profile updated.');
    } catch (err) {
      setProfileError(err?.message || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdError('');
    try {
      await changePassword(pwd.currentPassword, pwd.newPassword, pwd.confirmPassword);
      toast.success('Password changed.');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      updateUser({ mustChangePassword: false });
    } catch (err) {
      setPwdError(err?.message || 'Could not change your password.');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile · Employee · SvapNora</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your employee record and sign-in credentials."
      />

      {user?.mustChangePassword && (
        <Alert tone="warning">
          Your administrator set a temporary password. Set a new one below before using the rest of the portal.
        </Alert>
      )}

      <div className="panel-grid panel-grid--wide">
        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Details</h2>
          </header>
          <form className="form" onSubmit={saveProfile}>
            {profileError && <Alert tone="error">{profileError}</Alert>}

            <dl className="kv-grid">
              <div className="kv">
                <dt className="kv__k">Email</dt>
                <dd className="kv__v mono">{user?.email || '—'}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Employee ID</dt>
                <dd className="kv__v mono">{user?.employeeId || '—'}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Department</dt>
                <dd className="kv__v">{user?.department || '—'}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Designation</dt>
                <dd className="kv__v">{user?.designation || '—'}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Joined</dt>
                <dd className="kv__v">{fmt(user?.joinDate || user?.createdAt)}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Last sign-in</dt>
                <dd className="kv__v">{fmt(user?.lastLoginAt)}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Status</dt>
                <dd className="kv__v">{user?.isActive === false ? 'Inactive - contact your administrator' : 'Active'}</dd>
              </div>
              <div className="kv">
                <dt className="kv__k">Profile ref</dt>
                <dd className="kv__v mono">{id ? String(id).slice(-8) : '—'}</dd>
              </div>
            </dl>

            <Field label="Full name" required>
              <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required minLength={2} />
            </Field>
            <div className="form__row">
              <Field label="Phone">
                <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </Field>
              <Field label="Avatar URL">
                <input value={profile.avatar} onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))} />
              </Field>
            </div>
            <Button type="submit" variant="primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save details'}
            </Button>
          </form>
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Password</h2>
          </header>
          <form className="form" onSubmit={savePassword}>
            {pwdError && <Alert tone="error">{pwdError}</Alert>}
            <Field label="Current password" required>
              <input
                type="password"
                autoComplete="current-password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </Field>
            <div className="form__row">
              <Field label="New password" required hint="8+ chars, a letter and a number">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwd.newPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Confirm new password" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <Button type="submit" variant="primary" disabled={savingPwd}>
              {savingPwd ? 'Updating…' : 'Change password'}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
