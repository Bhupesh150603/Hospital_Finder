'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Search, Radio, WifiOff } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  /* ── online / offline state ───────────────────────────────── */
  const [isOnline, setIsOnline] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastDismissing, setToastDismissing] = useState(false);

  useEffect(() => {
    // Initialise from the browser on mount (SSR always defaults to true)
    setIsOnline(navigator.onLine);

    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /* ── toast helpers ────────────────────────────────────────── */
  const dismissToast = useCallback(() => {
    setToastDismissing(true);
    setTimeout(() => {
      setToastVisible(false);
      setToastDismissing(false);
    }, 300);              // match the CSS fade-out duration
  }, []);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setToastDismissing(false);
    const timer = setTimeout(dismissToast, 5000);   // auto-dismiss after 5 s
    return () => clearTimeout(timer);
  }, [dismissToast]);

  /* ── click guard on Admin portal link ─────────────────────── */
  const handleAdminClick = useCallback((e) => {
    if (!navigator.onLine) {
      e.preventDefault();
      showToast();
    }
    // if online → do nothing, <Link> navigates normally
  }, [showToast]);

  return (
    <>
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
                className={`nav-link nav-btn-portal ${!isOnline ? 'nav-btn-portal--offline' : ''}`}
                id="nav-admin"
                onClick={handleAdminClick}
              >
                Admin portal
                {!isOnline && (
                  <span className="offline-badge">
                    <WifiOff size={10} />
                    offline
                  </span>
                )}
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
            transition: color var(--transition-fast), opacity 0.3s ease;
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
            transition: background 0.2s, border-color 0.2s, opacity 0.3s ease;
          }

          .nav-btn-portal:hover {
            background: var(--canvas-base);
            border-color: #B5B5AD;
          }

          /* ── offline visual treatment ───────────────── */
          .nav-btn-portal--offline {
            opacity: 0.5;
            pointer-events: auto;       /* still clickable so the toast fires */
            cursor: not-allowed;
          }

          .nav-btn-portal--offline:hover {
            background: var(--surface-plain);
            border-color: var(--border-structural);
          }

          .offline-badge {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            margin-left: 2px;
            padding: 1px 6px;
            font-size: 0.625rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #b45309;
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 999px;
            line-height: 1.4;
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

      {/* ── offline toast ──────────────────────────────────────── */}
      {toastVisible && (
        <div className={`offline-toast ${toastDismissing ? 'offline-toast--exit' : ''}`}>
          <WifiOff size={14} className="offline-toast-icon" />
          <span>
            Admin requires an internet connection — you'll be able to access it once you're back online.
          </span>
          <button
            className="offline-toast-close"
            onClick={dismissToast}
            aria-label="Dismiss"
          >
            ✕
          </button>

          <style jsx>{`
            .offline-toast {
              position: fixed;
              bottom: 24px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 9999;
              display: flex;
              align-items: center;
              gap: 10px;
              max-width: 520px;
              padding: 12px 18px;
              background: #1c1917;
              color: #fafaf9;
              font-size: 0.8125rem;
              line-height: 1.45;
              border-radius: 10px;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
              animation: toast-in 0.3s ease forwards;
            }

            .offline-toast--exit {
              animation: toast-out 0.3s ease forwards;
            }

            .offline-toast-icon {
              flex-shrink: 0;
              color: #facc15;
            }

            .offline-toast-close {
              background: none;
              border: none;
              color: #a8a29e;
              font-size: 0.875rem;
              cursor: pointer;
              padding: 2px 4px;
              margin-left: 4px;
              line-height: 1;
              flex-shrink: 0;
              transition: color 0.15s;
            }

            .offline-toast-close:hover {
              color: #fafaf9;
            }

            @keyframes toast-in {
              from { opacity: 0; transform: translateX(-50%) translateY(12px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }

            @keyframes toast-out {
              from { opacity: 1; transform: translateX(-50%) translateY(0); }
              to   { opacity: 0; transform: translateX(-50%) translateY(12px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
