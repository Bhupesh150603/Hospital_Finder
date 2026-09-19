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
        {isAdmin && <span className="admin-portal-tag">Portal</span>}
      </div>

      <div className="navbar-right">
        {isAdmin ? (
          <>
            <Link href="/" className="nav-link nav-search-public" id="nav-public-search">
              <Search size={14} />
              Search public view
            </Link>
            <span className="nav-admin-active">
              <span className="nav-dot-active"></span>
              Admin portal
            </span>
            <div className="user-avatar" title="Officer On Duty">
              ND
            </div>
          </>
        ) : (
          <>
            <div className="live-status-pill">
              <span className="live-status-dot"></span>
              Live sync active
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
              Admin portal
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
          background: var(--primary);
          color: white;
          border-radius: var(--radius-default);
          flex-shrink: 0;
        }

        .logo-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--ink-primary);
        }

        .logo-accent {
          color: var(--primary);
        }

        .admin-portal-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          background: var(--canvas-base);
          color: var(--ink-muted);
          padding: 2px 6px;
          border-radius: var(--radius-default);
          border: 1px solid var(--border-subtle);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: var(--space-xs) var(--space-md);
          background: var(--status-available-bg);
          border: 1px solid var(--status-available-border);
          border-radius: var(--radius-default);
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
          color: var(--ink-muted);
          transition: color var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nav-link:hover {
          color: var(--ink-primary);
        }

        .nav-link-active {
          color: var(--primary);
          font-weight: 600;
        }

        .nav-search-public {
          color: var(--ink-muted);
        }

        .nav-btn-portal {
          padding: var(--space-xs) var(--space-md);
          background: var(--surface-plain);
          border: 1px solid var(--border-structural);
          border-radius: var(--radius-default);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-primary);
          box-shadow: var(--shadow-tier1);
        }

        .nav-btn-portal:hover {
          background: var(--canvas-base);
          border-color: #B5B5AD;
        }

        .nav-admin-active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(29, 78, 137, 0.08);
          border: 1px solid rgba(29, 78, 137, 0.2);
          border-radius: var(--radius-default);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--primary);
        }

        .nav-dot-active {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
        }

        .user-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--ink-primary);
          color: white;
          font-size: 0.6875rem;
          font-weight: 700;
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
