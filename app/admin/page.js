'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  Activity, HeartPulse, Stethoscope, Flame, Baby, Droplet, Users, Phone, Clock,
} from 'lucide-react';

const STATUSES = ['Available', 'Limited', 'Full'];
const SPECIALTY_ICONS = {
  Trauma: Activity,
  Cardiac: HeartPulse,
  ICU: Stethoscope,
  Burns: Flame,
  Pediatric: Baby,
  Dialysis: Droplet,
  Maternity: Users,
};
const KEY_TO_STATUS = { '1': 'Available', '2': 'Limited', '3': 'Full' };

function timeAgo(isoString) {
  if (!isoString) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminPage() {
  const [hospital, setHospital] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      setHospital(data.hospital || null);
      setSpecialties(data.specialties || []);
      setActivity(data.activity || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = useCallback(async (specialtyRow, newStatus) => {
    if (!hospital || specialtyRow.availability === newStatus) return;
    setUpdatingId(specialtyRow.id);

    setSpecialties((prev) =>
      prev.map((s) => (s.id === specialtyRow.id ? { ...s, availability: newStatus, lastUpdated: new Date().toISOString() } : s))
    );

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hospital.id, availability: newStatus, specialty: specialtyRow.name }),
      });
      if (!res.ok) {
        await fetchData();
      } else {
        setFlashId(specialtyRow.id);
        setTimeout(() => setFlashId(null), 700);
        fetchData(); // refresh activity log too
      }
    } catch (err) {
      console.error('Update failed:', err);
      await fetchData();
    } finally {
      setUpdatingId(null);
    }
  }, [hospital, fetchData]);

  // Keyboard shortcut: hover a row, press 1/2/3 to set Available/Limited/Full
  useEffect(() => {
    function handleKeyDown(e) {
      if (!hoveredId) return;
      const status = KEY_TO_STATUS[e.key];
      if (!status) return;
      const row = specialties.find((s) => s.id === hoveredId);
      if (row) updateStatus(row, status);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredId, specialties, updateStatus]);

  const counts = specialties.reduce(
    (acc, s) => ({ ...acc, [s.availability]: (acc[s.availability] || 0) + 1 }),
    {}
  );

  if (loading) {
    return (
      <main className="admin-page">
        <div className="container"><p>Loading your hospital dashboard...</p></div>
      </main>
    );
  }

  if (!hospital) {
    return (
      <main className="admin-page">
        <div className="container"><p>No hospital linked to this account. Contact support.</p></div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="container">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">{hospital.name}</h1>
            <div className="admin-header-meta">
              {hospital.phone && <span><Phone size={13} /> {hospital.phone}</span>}
              <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="sign-out-link">Sign out</button>
            </div>
          </div>
          <div className="metric-cards">
            <div className="metric-card"><span className="metric-num num-available">{counts.Available || 0}</span><span className="metric-label">Available</span></div>
            <div className="metric-card"><span className="metric-num num-limited">{counts.Limited || 0}</span><span className="metric-label">Limited</span></div>
            <div className="metric-card"><span className="metric-num num-full">{counts.Full || 0}</span><span className="metric-label">Full</span></div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="specialty-table card">
            <div className="table-header-row">
              <span>Specialty</span>
              <span>Current Status</span>
              <span>Last Updated</span>
              <span>Update</span>
            </div>
            <p className="keyboard-hint">Tip: hover a row and press 1 / 2 / 3 for Available / Limited / Full</p>
            {specialties.map((s) => {
              const Icon = SPECIALTY_ICONS[s.name] || Activity;
              const isUpdating = updatingId === s.id;
              const isFlash = flashId === s.id;
              return (
                <div
                  key={s.id}
                  className={`specialty-row ${isUpdating ? 'row-updating' : ''} ${isFlash ? 'row-flash' : ''}`}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === s.id ? null : id))}
                >
                  <span className="row-specialty"><Icon size={16} /> {s.name}</span>
                  <span className={`state-pill state-pill-${s.availability.toLowerCase()}`}>{s.availability}</span>
                  <span className="row-updated"><Clock size={12} /> {timeAgo(s.lastUpdated)}</span>
                  <span className="status-toggle-group">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        className={`status-toggle-btn ${s.availability === status ? `btn-active-${status.toLowerCase()}` : ''}`}
                        onClick={() => updateStatus(s, status)}
                        disabled={isUpdating}
                      >
                        {status}
                      </button>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="activity-panel card">
            <h2 className="activity-title">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="activity-empty">No changes recorded yet.</p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="activity-item">
                  <p className="activity-text">
                    <strong>{a.specialty}</strong> changed from {a.previousStatus} to <strong>{a.newStatus}</strong>
                  </p>
                  <span className="activity-time">{timeAgo(a.changedAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-page { padding: var(--space-xl) 0 var(--space-3xl); }
        .admin-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-xl); margin-bottom: var(--space-xl); flex-wrap: wrap; }
        .admin-title { font-size: 1.625rem; font-weight: 700; color: var(--text-ink); margin-bottom: 4px; }
        .admin-header-meta { display: flex; align-items: center; gap: var(--space-md); font-size: 0.8125rem; color: var(--text-secondary); }
        .admin-header-meta span { display: inline-flex; align-items: center; gap: 4px; }
        .sign-out-link { background: none; border: none; color: var(--text-muted); font-size: 0.8125rem; cursor: pointer; text-decoration: underline; padding: 0; }
        .metric-cards { display: flex; gap: var(--space-md); }
        .metric-card { display: flex; flex-direction: column; align-items: center; padding: 10px 20px; background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
        .metric-num { font-size: 1.5rem; font-weight: 700; }
        .num-available { color: var(--status-available); }
        .num-limited { color: var(--status-limited); }
        .num-full { color: var(--status-full); }
        .metric-label { font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; }

        .admin-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-lg); }
        @media (min-width: 1024px) {
          .admin-grid { grid-template-columns: 2.2fr 1fr; align-items: start; }
        }

        .specialty-table { padding: var(--space-lg); border-radius: var(--radius-xl); }
        .table-header-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.8fr; padding: 0 var(--space-sm) var(--space-sm); font-size: 0.6875rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); }
        .keyboard-hint { font-size: 0.75rem; color: var(--text-muted); margin: var(--space-sm) 0; }
        .specialty-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.8fr; align-items: center; padding: var(--space-md) var(--space-sm); border-bottom: 1px solid var(--border-subtle); transition: background var(--transition-fast), opacity var(--transition-fast); }
        .specialty-row:hover { background: #F9FAFB; }
        .row-updating { opacity: 0.5; }
        .row-flash { background: #EBF7EE; }
        .row-specialty { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text-ink); font-size: 0.875rem; }
        .row-updated { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); }

        .state-pill { display: inline-flex; align-items: center; width: fit-content; padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
        .state-pill-available { background: var(--status-available-bg); color: var(--status-available); }
        .state-pill-limited { background: var(--status-limited-bg); color: var(--status-limited); }
        .state-pill-full { background: var(--status-full-bg); color: var(--status-full); }

        .status-toggle-group { display: flex; background: #F1F3F5; padding: 3px; border-radius: var(--radius-md); gap: 2px; width: fit-content; }
        .status-toggle-btn { border: none; background: transparent; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer; }
        .status-toggle-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-active-available { background: var(--status-available); color: white; }
        .btn-active-limited { background: var(--status-limited); color: white; }
        .btn-active-full { background: var(--status-full); color: white; }

        .activity-panel { padding: var(--space-lg); border-radius: var(--radius-xl); }
        .activity-title { font-size: 1rem; font-weight: 700; color: var(--text-ink); margin-bottom: var(--space-md); }
        .activity-empty { font-size: 0.8125rem; color: var(--text-muted); }
        .activity-item { padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-subtle); }
        .activity-text { font-size: 0.8125rem; color: var(--text-ink); margin: 0; }
        .activity-time { font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </main>
  );
}