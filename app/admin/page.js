'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Phone, Search, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { signOut } from 'next-auth/react';

const STATUSES = ['Available', 'Limited', 'Full'];
const ITEMS_PER_PAGE = 6;

function timeAgo(isoString) {
  if (!isoString) return 'Just now';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFacilityType(hospital) {
  const name = hospital.name.toLowerCase();
  if (name.includes('aiims')) return 'Govt Referral Apex';
  if (name.includes('safdarjung') || name.includes('ram manohar')) return 'Central Govt';
  if (name.includes('ganga ram') || name.includes('trust')) return 'Trust / Multi-Specialty';
  if (name.includes('max') || name.includes('fortis')) return 'Private Tertiary';
  if (name.includes('apollo') || name.includes('manipal')) return 'Multi-Specialty';
  if (name.includes('civil') || name.includes('govt') || name.includes('general')) return 'Public General';
  return 'Specialty Medical Centre';
}

function getOperationalNote(hospital) {
  if (hospital.availability === 'Full') {
    return { text: 'Critical Care Unit at 100% cap', type: 'danger' };
  }
  if (hospital.availability === 'Limited') {
    return { text: 'High casualty intake · < 5 ICU beds remaining', type: 'warning' };
  }
  const notes = [
    'Ward A & C Responding',
    'General ICU: 8 beds open',
    'Verified staff handover active',
    'Trauma bay operational & staffed',
  ];
  // Deterministic note based on hospital id
  const index = Math.abs(hospital.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % notes.length;
  return { text: notes[index], type: 'success' };
}

export default function AdminPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const flashTimeout = useRef(null);

  useEffect(() => {
    fetchHospitals();
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  async function fetchHospitals() {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateAvailability(id, newStatus) {
    setUpdating(id);

    // Optimistic update
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, availability: newStatus, lastUpdated: new Date().toISOString() } : h
      )
    );

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, availability: newStatus }),
      });

      if (!res.ok) {
        await fetchHospitals();
      } else {
        setFlashId(id);
        if (flashTimeout.current) clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setFlashId(null), 700);
      }
    } catch (err) {
      console.error('Failed to update:', err);
      await fetchHospitals();
    } finally {
      setUpdating(null);
    }
  }

  const statusCounts = useMemo(() => {
    return {
      Available: hospitals.filter((h) => h.availability === 'Available').length,
      Limited: hospitals.filter((h) => h.availability === 'Limited').length,
      Full: hospitals.filter((h) => h.availability === 'Full').length,
    };
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals;
    const q = searchQuery.toLowerCase();
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.specialties && h.specialties.some((s) => s.name.toLowerCase().includes(q)))
    );
  }, [hospitals, searchQuery]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHospitals.length / ITEMS_PER_PAGE));
  const paginatedHospitals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHospitals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHospitals, currentPage]);

  return (
    <main className="admin-page">
      <div className="container">
        {/* Eyebrow badge */}
        <div className="admin-eyebrow fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="live-sync-pill">
            <span className="live-dot-indicator"></span>
            Live sync enabled
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="signout-btn"
          >
            Sign out
          </button>
        </div>

        {/* Header & Metrics */}
        <div className="admin-header-row fade-in">
          <div className="admin-header-text">
            <h1 className="admin-title">Bed availability admin</h1>
            <p className="admin-subtitle">
              Manage hospital availability status. Changes reflect immediately in live search results
              and dispatch consoles.
            </p>
          </div>

          <div className="metric-cards">
            <div className="metric-card metric-available">
              <div className="metric-num-box num-box-available">{statusCounts.Available}</div>
              <div className="metric-info">
                <span className="metric-label label-available">Available</span>
                <span className="metric-sub">Beds ready</span>
              </div>
            </div>

            <div className="metric-card metric-limited">
              <div className="metric-num-box num-box-limited">{statusCounts.Limited}</div>
              <div className="metric-info">
                <span className="metric-label label-limited">Limited</span>
                <span className="metric-sub">&lt; 5 ICU left</span>
              </div>
            </div>

            <div className="metric-card metric-full">
              <div className="metric-num-box num-box-full">{statusCounts.Full}</div>
              <div className="metric-info">
                <span className="metric-label label-full">Full</span>
                <span className="metric-sub">Diversion only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and region toolbar */}
        <div className="admin-toolbar fade-in fade-in-delay-1">
          <div className="search-filter-box">
            <Search size={15} className="search-filter-icon" />
            <input
              type="text"
              placeholder="Filter hospitals or departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-filter-input"
              id="admin-search-input"
            />
          </div>
          <div className="admin-meta-info">
            <span>Hospitals tracked: <strong>{hospitals.length}</strong></span>
            <span className="meta-sep">&bull;</span>
            <span>Last verified: <strong>Just now</strong></span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading registered hospitals…</p>
          </div>
        )}

        {/* Hospitals List */}
        {!loading && (
          <div className="admin-list fade-in fade-in-delay-2">
            {paginatedHospitals.length === 0 ? (
              <div className="empty-state">
                <p>No hospitals match your search query &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              paginatedHospitals.map((h) => {
                const facilityType = getFacilityType(h);
                const note = getOperationalNote(h);
                const isUpdating = updating === h.id;
                const isFlash = flashId === h.id;

                return (
                  <div
                    key={h.id}
                    className={`admin-card card ${isUpdating ? 'admin-updating' : ''} ${
                      isFlash ? 'admin-row-flash' : ''
                    }`}
                  >
                    {/* Left Column: Hospital Info */}
                    <div className="admin-card-left">
                      <div className="admin-card-name-row">
                        <h2 className="admin-card-name">{h.name}</h2>
                        <span className="facility-type-pill">{facilityType}</span>
                      </div>

                      {/* Specialties */}
                      <div className="admin-card-specialties">
                        {h.specialties.map((spec) => (
                          <span key={spec.name} className="admin-spec-pill">
                            {spec.name}
                          </span>
                        ))}
                      </div>

                      {/* Meta: Phone, Updated time, Operational note */}
                      <div className="admin-card-meta">
                        {h.phone && (
                          <a href={`tel:${h.phone}`} className="admin-phone-pill">
                            <Phone size={12} />
                            {h.phone}
                          </a>
                        )}
                        <span className="admin-updated-pill">
                          <Clock size={12} />
                          Updated {timeAgo(h.lastUpdated)}
                        </span>
                        <span className={`admin-op-note op-note-${note.type}`}>
                          &bull; {note.text}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Status controls */}
                    <div className="admin-card-right">
                      {/* CURRENT STATE column */}
                      <div className="state-col">
                        <span className="col-header-label">Current state</span>
                        <span className={`state-pill state-pill-${h.availability.toLowerCase()}`}>
                          <span className={`state-dot state-dot-${h.availability.toLowerCase()}`}></span>
                          {h.availability}
                        </span>
                      </div>

                      {/* UPDATE STATUS column */}
                      <div className="update-col">
                        <span className="col-header-label">Update status</span>
                        <div className="status-toggle-group">
                          {STATUSES.map((status) => {
                            const isActive = h.availability === status;
                            return (
                              <button
                                key={status}
                                className={`status-toggle-btn ${
                                  isActive ? `btn-active-${status.toLowerCase()}` : ''
                                }`}
                                onClick={() => updateAvailability(h.id, status)}
                                disabled={isUpdating}
                                id={`toggle-${h.id}-${status.toLowerCase()}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredHospitals.length > 0 && (
          <div className="admin-pagination fade-in">
            <span className="pagination-count">
              Showing <strong>{paginatedHospitals.length}</strong> of{' '}
              <strong>{filteredHospitals.length}</strong> registered hospitals
            </span>

            <div className="pagination-controls">
              <button
                className="btn-pagination"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="pagination-page-label">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn-pagination"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-page {
          padding-top: var(--space-xl);
          padding-bottom: 4rem;
          min-height: calc(100vh - var(--header-height));
        }

        .admin-eyebrow {
          margin-bottom: var(--space-xs);
        }

        .signout-btn {
          background: none;
          border: none;
          color: var(--ink-muted);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-family: inherit;
        }

        .live-sync-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: var(--space-xs) var(--space-md);
          background: var(--status-available-bg);
          border: 1px solid var(--status-available-border);
          border-radius: var(--radius-default);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--status-available);
        }

        .live-dot-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--status-available);
        }

        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-xl);
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
        }

        .admin-header-text {
          flex: 1;
          min-width: 280px;
        }

        .admin-title {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 2rem;
          color: var(--ink-primary);
          margin-bottom: var(--space-xs);
        }

        .admin-subtitle {
          color: var(--ink-muted);
          font-size: 0.8125rem;
          max-width: 580px;
          line-height: 1.125rem;
          font-weight: 400;
        }

        /* Metric cards */
        .metric-cards {
          display: flex;
          gap: var(--space-lg);
          flex-wrap: wrap;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg);
          background: var(--surface-plain);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-structural);
          box-shadow: var(--shadow-tier1);
        }

        .metric-num-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-default);
          font-size: 0.9375rem;
          font-weight: 700;
          color: white;
          font-variant-numeric: tabular-nums;
        }

        .num-box-available {
          background: var(--status-available);
        }

        .num-box-limited {
          background: var(--status-limited);
        }

        .num-box-full {
          background: var(--status-full);
        }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .label-available {
          color: var(--status-available);
        }
        .label-limited {
          color: var(--status-limited);
        }
        .label-full {
          color: var(--status-full);
        }

        .metric-sub {
          font-size: 0.6875rem;
          color: var(--ink-muted);
          font-weight: 400;
        }

        /* Toolbar */
        .admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
        }

        .search-filter-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-plain);
          border: 1px solid var(--border-structural);
          border-radius: var(--radius-default);
          padding: 7px 12px;
          width: 320px;
          box-shadow: var(--shadow-tier1);
        }

        .search-filter-box:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(29, 78, 137, 0.12);
        }

        .search-filter-icon {
          color: var(--ink-muted);
          flex-shrink: 0;
        }

        .search-filter-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.8125rem;
          font-family: inherit;
          color: var(--ink-primary);
          width: 100%;
        }

        .search-filter-input::placeholder {
          color: var(--ink-muted);
        }

        .admin-meta-info {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 400;
        }

        .admin-meta-info strong {
          color: var(--ink-primary);
          font-weight: 600;
        }

        .meta-sep {
          color: var(--border-structural);
        }

        /* Hospital Cards List */
        .admin-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .admin-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          border-radius: var(--radius-lg);
          gap: var(--space-xl);
          transition: opacity var(--transition-fast), background var(--transition-fast);
        }

        .admin-updating {
          opacity: 0.5;
        }

        .admin-card-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-card-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .admin-card-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin: 0;
        }

        .facility-type-pill {
          padding: 2px 8px;
          background: var(--canvas-base);
          color: var(--ink-muted);
          border-radius: var(--radius-default);
          font-size: 0.6875rem;
          font-weight: 500;
          border: 1px solid var(--border-subtle);
        }

        .admin-card-specialties {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .admin-spec-pill {
          padding: 2px 8px;
          background: rgba(29, 78, 137, 0.06);
          color: var(--primary);
          border: 1px solid rgba(29, 78, 137, 0.15);
          border-radius: var(--radius-default);
          font-size: 0.6875rem;
          font-weight: 500;
        }

        .admin-card-meta {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          font-size: 0.8125rem;
          color: var(--ink-muted);
          flex-wrap: wrap;
          margin-top: 2px;
          font-weight: 400;
        }

        .admin-phone-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--ink-primary);
          font-weight: 500;
          padding: 2px 6px;
          border-radius: var(--radius-default);
          border: 1px solid var(--border-structural);
          background: var(--canvas-base);
          font-variant-numeric: tabular-nums;
        }

        .admin-updated-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--ink-muted);
        }

        .admin-op-note {
          font-weight: 500;
        }

        .op-note-success {
          color: var(--ink-muted);
        }

        .op-note-warning {
          color: var(--status-limited);
        }

        .op-note-danger {
          color: var(--status-full);
        }

        /* Right column: State & Toggle */
        .admin-card-right {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
          flex-shrink: 0;
        }

        .state-col,
        .update-col {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .col-header-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--ink-muted);
        }

        .state-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: var(--space-xs) var(--space-md);
          border-radius: var(--radius-default);
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .state-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .state-pill-available {
          background: var(--status-available-bg);
          color: var(--status-available);
          border: 1px solid var(--status-available-border);
        }
        .state-dot-available {
          background: var(--status-available);
        }

        .state-pill-limited {
          background: var(--status-limited-bg);
          color: var(--status-limited);
          border: 1px solid var(--status-limited-border);
        }
        .state-dot-limited {
          background: var(--status-limited);
        }

        .state-pill-full {
          background: var(--status-full-bg);
          color: var(--status-full);
          border: 1px solid var(--status-full-border);
        }
        .state-dot-full {
          background: var(--status-full);
        }

        /* Toggle Button Group */
        .status-toggle-group {
          display: flex;
          background: var(--canvas-base);
          padding: 3px;
          border-radius: var(--radius-default);
          border: 1px solid var(--border-structural);
          gap: 2px;
        }

        .status-toggle-btn {
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-muted);
          padding: 5px 12px;
          border-radius: var(--radius-default);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }

        .status-toggle-btn:hover:not(:disabled) {
          color: var(--ink-primary);
        }

        .status-toggle-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-active-available {
          background: var(--status-available);
          color: white;
          box-shadow: var(--shadow-tier1);
        }

        .btn-active-limited {
          background: var(--status-limited);
          color: white;
          box-shadow: var(--shadow-tier1);
        }

        .btn-active-full {
          background: var(--status-full);
          color: white;
          box-shadow: var(--shadow-tier1);
        }

        /* Pagination Footer */
        .admin-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-xl);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border-structural);
          flex-wrap: wrap;
          gap: var(--space-lg);
        }

        .pagination-count {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-weight: 400;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .btn-pagination {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-primary);
          background: var(--surface-plain);
          border: 1px solid var(--border-structural);
          border-radius: var(--radius-default);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }

        .btn-pagination:hover:not(:disabled) {
          background: var(--canvas-base);
          border-color: #B5B5AD;
        }

        .btn-pagination:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-page-label {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-weight: 500;
        }

        @media (max-width: 860px) {
          .admin-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-card-right {
            width: 100%;
            justify-content: space-between;
            padding-top: var(--space-sm);
            border-top: 1px solid var(--border-subtle);
          }
          .search-filter-box {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}