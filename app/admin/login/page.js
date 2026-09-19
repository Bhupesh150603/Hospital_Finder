'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Hospital, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/admin');
      router.refresh();
    }
  }

  return (
    <main className="login-page">
      <div className="login-card card fade-in">
        <div className="login-header">
          <div className="login-icon-box">
            <Hospital size={20} />
          </div>
          <h1 className="login-title">Admin login</h1>
          <p className="login-subtitle">
            Access the bed availability management console
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              className="input-field"
              placeholder="admin@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="input-field"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
            id="admin-login-btn"
          >
            <Lock size={14} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-footer">
          Authorized hospital administrators only
        </p>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - var(--header-height));
          padding: var(--space-xl);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .login-icon-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-default);
          margin-bottom: var(--space-md);
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 2rem;
          color: var(--ink-primary);
          margin-bottom: var(--space-xs);
        }

        .login-subtitle {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-weight: 400;
          line-height: 1.125rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .login-error {
          color: var(--status-full);
          font-size: 0.8125rem;
          font-weight: 500;
          background: var(--status-full-bg);
          border: 1px solid var(--status-full-border);
          border-radius: var(--radius-default);
          padding: var(--space-sm) var(--space-md);
          margin: 0;
        }

        .login-submit {
          width: 100%;
          padding: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          min-height: 44px;
          margin-top: var(--space-sm);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          margin-top: var(--space-xl);
          font-size: 0.6875rem;
          color: var(--ink-muted);
          font-weight: 600;
        }
      `}</style>
    </main>
  );
}