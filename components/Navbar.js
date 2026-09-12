'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Search, Radio } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link href="/" className="navbar-logo" id="nav-logo">
          <span className="logo-badge-icon">
            <Plus size={16} strokeWidth={3.5} />
          </span>
          <span className="logo-title">
            Emergency<span className="logo-accent">Finder</span>
          </span>
        </Link>
        {isAdmin && <span className="admin-portal-tag">PORTAL</span>}
      </div>

      <div className="navbar-right">
        {isAdmin ? (
          <>
            <Link href="/" className="nav-link nav-search-public" id="nav-public-search">
              <Search size={14} />
              Search Public View
            </Link>
            <span className="nav-admin-active">
              <span className="nav-dot-active"></span>
              Admin Portal
            </span>
            <div className="user-avatar" title="Officer On Duty">
              ND
            </div>
          </>
        ) : (
          <>
            <div className="live-status-pill">
              <span className="live-status-dot"></span>
              Live Sync Active
            </div>
            <Link
              href="/"
              className={`nav-link ${pathname === '/' ? 'nav-link-active' : ''}`}
              id="nav-search"
            >
              Search
            </Link>
            <Link
              href="/admin"
              className="nav-link nav-btn-portal"
              id="nav-admin"
            >
              Admin Portal
            </Link>
            <div className="user-avatar" title="Emergency Services">
              JD
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--action-primary);
          color: white;
          border-radius: 7px;
          flex-shrink: 0;
        }

        .logo-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-ink);
          letter-spacing: -0.02em;
        }

        .logo-accent {
          color: var(--action-primary);
        }

        .admin-portal-tag {
          font-size: 0.625rem;
          font-weight: 700;
          background: #F1F3F5;
          color: var(--text-secondary);
          padding: 2px 6px;
          border-radius: var(--radius-xs);
          letter-spacing: 0.5px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: #F0FFF4;
          border: 1px solid #C6F6D5;
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--status-available);
        }

        .live-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--status-available);
        }

        .nav-link {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nav-link:hover {
          color: var(--text-ink);
        }

        .nav-link-active {
          color: var(--action-primary);
          font-weight: 600;
        }

        .nav-search-public {
          color: var(--text-secondary);
        }

        .nav-btn-portal {
          padding: 4px 12px;
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-ink);
          box-shadow: var(--shadow-sm);
        }

        .nav-btn-portal:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .nav-admin-active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--action-primary);
        }

        .nav-dot-active {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--action-primary);
        }

        .user-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1C1F26;
          color: white;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
        }

        @media (max-width: 680px) {
          .live-status-pill,
          .admin-portal-tag {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
