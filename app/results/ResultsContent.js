'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, LayoutGrid, Columns2, MapIcon, AlertTriangle, Hospital } from 'lucide-react';
import HospitalCard from '@/components/HospitalCard';

// Dynamic import with ssr: false — Leaflet uses `window` and can't render on server
const HospitalMap = dynamic(() => import('@/components/HospitalMap'), {
  ssr: false,
  loading: () => (
    <div className="loading-container" style={{ height: '100%', minHeight: '400px' }}>
      <div className="spinner"></div>
      <p>Loading map…</p>
    </div>
  ),
});

export default function ResultsContent() {
  const searchParams = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const specialty = searchParams.get('specialty') || 'Any';

  const [hospitals, setHospitals] = useState([]);
  const [sources, setSources] = useState({ curated: 0, community: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'grid' | 'split' | 'map'
  const [prioritize, setPrioritize] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchHospitals = useCallback(async (isBackground = false) => {
    if (!lat || !lng) {
      setError('Missing location. Please go back and search again.');
      setLoading(false);
      return;
    }

    try {
      const url = `/api/hospitals?lat=${lat}&lng=${lng}&specialty=${specialty}&prioritizeAvailability=${prioritize}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch hospitals');
      setHospitals(data.results);
      if (data.sources) setSources(data.sources);
    } catch (err) {
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
      initialLoadDone.current = true;
    }
  }, [lat, lng, specialty, prioritize]);

  // Initial fetch + re-fetch when prioritize changes
  useEffect(() => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    fetchHospitals(!initialLoadDone.current ? false : true);
  }, [fetchHospitals]);

  // Live polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHospitals(true); // background refresh — no spinner
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHospitals]);

  const viewModes = [
    { key: 'grid', label: 'Grid', icon: LayoutGrid },
    { key: 'split', label: 'Split', icon: Columns2 },
    { key: 'map', label: 'Map', icon: MapIcon },
  ];

  return (
    <main className="results-page">
      <div className="container">
        {/* Header */}
        <div className="results-header fade-in">
          <div className="results-header-left">
            <Link href="/" className="btn btn-secondary btn-sm back-btn" id="back-btn">
              <ArrowLeft size={14} />
              Back to Search
            </Link>
            <div className="results-title-row">
              <h1 className="results-title">
                {specialty !== 'Any' ? specialty : 'All'} hospitals
              </h1>
              {!loading && !error && (
                <span className="results-found-badge">{hospitals.length} Found</span>
              )}
            </div>
            {!loading && !error && (
              <p className="results-count">
                Showing emergency care units near your coordinates
                {sources.curated > 0 && <> &bull; <strong>{sources.curated}</strong> verified</>}
                {sources.community > 0 && <> &bull; <strong>{sources.community}</strong> community-reported</>}
              </p>
            )}
          </div>
          <div className="results-controls">
            {/* Prioritize Availability toggle */}
            <label className="priority-toggle" id="priority-toggle">
              <input
                type="checkbox"
                checked={prioritize}
                onChange={(e) => setPrioritize(e.target.checked)}
              />
              <span className="priority-slider"></span>
              <span className="priority-label">Prioritize availability</span>
            </label>
            {/* View mode switch */}
            <div className="view-toggle">
              {viewModes.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`vt-btn ${viewMode === key ? 'vt-active' : ''}`}
                  onClick={() => setViewMode(key)}
                  id={`view-${key}-btn`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Searching nearby hospitals…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="empty-state">
            <div className="empty-icon"><AlertTriangle size={32} /></div>
            <p>{error}</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go back
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {/* Grid view — cards only */}
            {viewMode === 'grid' && (
              <div className="results-grid fade-in">
                {hospitals.length === 0 ? (
                  <EmptyResults specialty={specialty} />
                ) : (
                  hospitals.map((h, i) => (
                    <div key={h.id} className="fade-in" style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s`, opacity: 0 }}>
                      <HospitalCard hospital={h} />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Split view — cards left, map right */}
            {viewMode === 'split' && (
              <div className="split-view fade-in">
                <div className="split-cards">
                  {hospitals.length === 0 ? (
                    <EmptyResults specialty={specialty} />
                  ) : (
                    hospitals.map((h, i) => (
                      <div key={h.id} className="fade-in" style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s`, opacity: 0 }}>
                        <HospitalCard hospital={h} />
                      </div>
                    ))
                  )}
                </div>
                <div className="split-map">
                  <HospitalMap
                    hospitals={hospitals}
                    userLat={parseFloat(lat)}
                    userLng={parseFloat(lng)}
                  />
                </div>
              </div>
            )}

            {/* Map view — map only */}
            {viewMode === 'map' && (
              <div className="map-full fade-in">
                <HospitalMap
                  hospitals={hospitals}
                  userLat={parseFloat(lat)}
                  userLng={parseFloat(lng)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .results-page {
          padding-top: var(--space-lg);
          padding-bottom: var(--space-3xl);
          min-height: calc(100vh - var(--header-height));
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
        }

        .back-btn {
          margin-bottom: var(--space-sm);
        }

        .results-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .results-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-ink);
        }

        .results-found-badge {
          display: inline-block;
          padding: 3px 10px;
          background: rgba(29, 78, 137, 0.08);
          color: var(--action-primary);
          font-size: 0.6875rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(29, 78, 137, 0.2);
          white-space: nowrap;
        }

        .results-count {
          color: var(--text-muted);
          font-size: 0.75rem;
          margin-top: 4px;
        }
        .results-count strong {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .results-controls {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        /* Priority toggle */
        .priority-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .priority-toggle input {
          display: none;
        }
        .priority-slider {
          position: relative;
          width: 38px;
          height: 20px;
          background: #D1D5DB;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .priority-slider::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: all var(--transition-fast);
        }
        .priority-toggle input:checked + .priority-slider {
          background: var(--status-available);
        }
        .priority-toggle input:checked + .priority-slider::after {
          transform: translateX(18px);
        }
        .priority-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* View toggle */
        .view-toggle {
          display: flex;
          gap: 2px;
          background: #F0F1F3;
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }
        .vt-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }
        .vt-btn:hover {
          color: var(--text-ink);
        }
        .vt-active {
          background: var(--surface-card);
          color: var(--text-ink);
          box-shadow: var(--shadow-sm);
        }

        /* Grid view */
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-md);
        }

        /* Split view */
        .split-view {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          align-items: start;
        }
        .split-cards {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          max-height: calc(100vh - 180px);
          overflow-y: auto;
          padding-right: var(--space-sm);
        }
        .split-cards::-webkit-scrollbar {
          width: 4px;
        }
        .split-cards::-webkit-scrollbar-track {
          background: transparent;
        }
        .split-cards::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 2px;
        }
        .split-map {
          position: sticky;
          top: calc(var(--header-height) + var(--space-lg));
        }

        /* Map full view */
        .map-full {
          margin-bottom: var(--space-xl);
        }

        @media (max-width: 900px) {
          .split-view {
            grid-template-columns: 1fr;
          }
          .split-cards {
            max-height: none;
            overflow: visible;
          }
          .split-map {
            position: static;
          }
          .results-grid {
            grid-template-columns: 1fr;
          }
          .results-header {
            flex-direction: column;
          }
          .results-title {
            font-size: 1.35rem;
          }
          .results-controls {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </main>
  );
}

function EmptyResults({ specialty }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Hospital size={32} /></div>
      <p>No hospitals found for &quot;{specialty}&quot; specialty near your location.</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Try selecting a different specialty or &quot;Any&quot; to see all nearby hospitals.
      </p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Try another search
      </Link>
    </div>
  );
}
