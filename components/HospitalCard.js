import { MapPin, Phone, Navigation, Search } from 'lucide-react';

/**
 * Compute a human-readable relative time string from an ISO timestamp.
 */
function timeAgo(isoString) {
  if (!isoString) return 'recently';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Map specialty availability status to DESIGN.md triage tokens.
 */
function triageClass(availability) {
  switch (availability) {
    case 'Available': return 'triage-available';
    case 'Limited': return 'triage-limited';
    case 'Full': return 'triage-full';
    default: return 'triage-unknown';
  }
}

function triageLabel(availability) {
  switch (availability) {
    case 'Available': return 'Open';
    case 'Limited': return 'Limited';
    case 'Full': return 'Full';
    default: return 'N/A';
  }
}

/**
 * HospitalCard — renders a single hospital result card.
 * Implements DESIGN.md §5.3 Facility Card Structure:
 *   1. Header Zone — facility name, distance/ETA
 *   2. Triage Metric Row — per-specialty availability boxes
 *   3. Direct Action Footer — split Directions + Call/Search buttons
 */
export default function HospitalCard({ hospital }) {
  const { name, distance, etaMinutes, specialties, specialtyDetails, availability, phone, lat, lng, lastUpdated, source } = hospital;

  const isOSM = source === 'osm';
  const isFull = availability === 'Full';
  const isLimited = availability === 'Limited';
  const isAvailable = availability === 'Available';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

  return (
    <div className="hospital-card card">
      {/* ── Zone 1: Header ── */}
      <div className="hc-header">
        <div className="hc-header-left">
          <h3 className="hc-name">{name}</h3>
          <span className="hc-distance">
            <MapPin size={12} />
            {distance} km &bull; ~{etaMinutes} min away
          </span>
        </div>

        {/* Overall Status Badge — DESIGN.md §5.2 */}
        {isOSM ? (
          <span className="badge badge-community">Community</span>
        ) : (
          <span className={`badge ${isFull ? 'badge-full' : isLimited ? 'badge-limited' : 'badge-available'}`}>
            {isFull ? 'At capacity' : isLimited ? 'Limited' : 'Available'}
          </span>
        )}
      </div>

      {/* ── Zone 2: Triage Metric Row — per-specialty availability ── */}
      {!isOSM && specialtyDetails && specialtyDetails.length > 0 && (
        <>
          <div className="hc-divider" />
          <div className="hc-triage-row">
            {specialtyDetails.map((spec) => (
              <div key={spec.name} className={`triage-box ${triageClass(spec.availability)}`}>
                <span className="triage-label">{spec.name}</span>
                <span className="triage-value">{triageLabel(spec.availability)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* OSM fallback — no per-specialty data */}
      {isOSM && specialties && specialties.length > 0 && (
        <>
          <div className="hc-divider" />
          <div className="hc-spec-tags">
            {specialties.map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        </>
      )}

      {/* Contextual callout */}
      <div className={`hc-callout ${
        isOSM ? 'callout-community' : isFull ? 'callout-danger' : isLimited ? 'callout-warning' : 'callout-available'
      }`}>
        {isOSM && (
          <p className="callout-text">
            Capacity not reported &mdash; call ahead to confirm.
          </p>
        )}
        {isFull && !isOSM && (
          <p className="callout-text text-danger">
            Diversion active for acute trauma. Please route ambulances to nearest alternate emergency wing.
          </p>
        )}
        {isLimited && !isOSM && (
          <p className="callout-text">
            ICU beds currently near capacity. Emergency triage running with minor delays.
          </p>
        )}
        {isAvailable && !isOSM && (
          <p className="callout-text">
            Live verified {timeAgo(lastUpdated)}. Full emergency resuscitation suite and adult ventilator available.
          </p>
        )}
      </div>

      {/* ── Zone 3: Direct Action Footer ── */}
      <div className="hc-divider" />
      <div className="hc-actions">
        {phone ? (
          <a href={`tel:${phone}`} className="hc-btn hc-btn-outline" id={`call-${hospital.id}`}>
            <Phone size={12} />
            Call ER
          </a>
        ) : (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hc-btn hc-btn-outline"
            id={`search-${hospital.id}`}
          >
            <Search size={12} />
            Search on Maps
          </a>
        )}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hc-btn hc-btn-filled"
          id={`dir-${hospital.id}`}
        >
          <Navigation size={12} />
          Directions
        </a>
      </div>

      <style jsx>{`
        /* ── Facility Card — DESIGN.md §5.3 ── */
        .hospital-card {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          background: var(--surface-plain);
          border: 1px solid var(--border-structural);
          box-shadow: var(--shadow-tier1);
          transition: border-color var(--transition-fast);
        }

        .hospital-card:hover {
          border-color: #B5B5AD;
        }

        /* ── Header Zone ── */
        .hc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-md);
        }

        .hc-header-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .hc-name {
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.375rem;
          color: var(--ink-primary);
        }

        .hc-distance {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-weight: 400;
        }

        /* ── Dividers — hairline 1px solid EAEAE4 ── */
        .hc-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: var(--space-md) 0;
        }

        /* ── Triage Metric Row ── */
        .hc-triage-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .triage-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-default);
          border: 1px solid;
          min-width: 64px;
          flex: 1;
        }

        .triage-label {
          font-size: 0.6875rem;
          font-weight: 600;
          line-height: 0.875rem;
        }

        .triage-value {
          font-size: 0.6875rem;
          font-weight: 600;
          line-height: 0.875rem;
        }

        .triage-available {
          background: var(--status-available-bg);
          border-color: var(--status-available-border);
          color: var(--status-available);
        }

        .triage-limited {
          background: var(--status-limited-bg);
          border-color: var(--status-limited-border);
          color: var(--status-limited);
        }

        .triage-full {
          background: var(--status-full-bg);
          border-color: var(--status-full-border);
          color: var(--status-full);
        }

        .triage-unknown {
          background: var(--status-community-bg);
          border-color: var(--status-community-border);
          color: var(--status-community);
        }

        /* ── Specialty tags (OSM cards only) ── */
        .hc-spec-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        /* ── Callout Box ── */
        .hc-callout {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-default);
          margin-top: var(--space-sm);
        }

        .callout-available,
        .callout-warning,
        .callout-community {
          background: var(--canvas-base);
          border: 1px solid var(--border-subtle);
        }

        .callout-danger {
          background: var(--status-full-bg);
          border: 1px solid var(--status-full-border);
        }

        .callout-text {
          font-size: 0.8125rem;
          line-height: 1.125rem;
          color: var(--ink-muted);
          margin: 0;
          font-weight: 400;
        }

        .text-danger {
          color: var(--status-full);
          font-weight: 500;
        }

        /* ── Action Footer — split buttons ── */
        .hc-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .hc-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: var(--space-sm) var(--space-md);
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-default);
          text-decoration: none;
          transition: all var(--transition-fast);
          cursor: pointer;
          font-family: inherit;
          min-height: 36px;
        }

        .hc-btn-outline {
          background: var(--surface-plain);
          color: var(--ink-primary);
          border: 1px solid var(--border-structural);
        }

        .hc-btn-outline:hover {
          background: var(--canvas-base);
          border-color: #B5B5AD;
        }

        .hc-btn-filled {
          background: var(--primary);
          color: white;
          border: 1px solid var(--primary);
        }

        .hc-btn-filled:hover {
          background: var(--primary-hover);
        }
      `}</style>
    </div>
  );
}
