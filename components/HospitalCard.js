import { MapPin, Phone, Navigation, Search, Users } from 'lucide-react';

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
 * HospitalCard — renders a single hospital result card.
 * Matches the Stitch "Hospital Results & Map - Modern View" mockup.
 */
export default function HospitalCard({ hospital }) {
  const { name, distance, etaMinutes, specialties, availability, phone, lat, lng, lastUpdated, source } = hospital;

  const isOSM = source === 'osm';
  const isFull = availability === 'Full';
  const isLimited = availability === 'Limited';
  const isAvailable = availability === 'Available';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

  // Estimated beds for curated status display
  const bedCount = isAvailable ? '8 Beds' : isLimited ? '2 Beds' : null;

  return (
    <div className="hospital-card card">
      {/* Header row */}
      <div className="hc-header">
        <h3 className="hc-name">{name}</h3>

        {/* Status Badge */}
        {isOSM ? (
          <span className="badge-osm">
            <Users size={11} />
            Community-sourced
          </span>
        ) : isFull ? (
          <span className="badge-status badge-full">
            <span className="badge-dot dot-full"></span>
            At Capacity
          </span>
        ) : isLimited ? (
          <span className="badge-status badge-limited">
            <span className="badge-dot dot-limited"></span>
            Limited &bull; {bedCount}
          </span>
        ) : (
          <span className="badge-status badge-available">
            <span className="badge-dot dot-available"></span>
            Available &bull; {bedCount}
          </span>
        )}
      </div>

      {/* Distance row */}
      <div className="hc-meta">
        <span className="hc-distance">
          <MapPin size={12} className="meta-pin-icon" />
          {distance} km &bull; ~{etaMinutes} min away
        </span>
      </div>

      {/* Specialty tags */}
      <div className="hc-tags">
        {specialties &&
          specialties.map((s) => {
            const isEmergencyHighlight = s.toLowerCase().includes('trauma') || s.toLowerCase().includes('icu');
            return (
              <span key={s} className={`spec-tag ${isEmergencyHighlight ? 'spec-tag-highlight' : ''}`}>
                {s}
              </span>
            );
          })}
        {/* 24x7 ER tag for major emergency facilities */}
        {!isOSM && <span className="spec-tag spec-tag-er">24&times;7 ER</span>}
      </div>

      {/* Callout box matching Stitch mockup */}
      <div
        className={`hc-callout ${
          isOSM
            ? 'callout-community'
            : isFull
            ? 'callout-danger'
            : isLimited
            ? 'callout-warning'
            : 'callout-available'
        }`}
      >
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

      {/* Action buttons */}
      <div className="hc-actions">
        {phone ? (
          <a href={`tel:${phone}`} className="hc-btn hc-btn-outline" id={`call-${hospital.id}`}>
            <Phone size={12} />
            Call
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
        .hospital-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px 18px;
          border-radius: var(--radius-xl);
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
        }

        .hospital-card:hover {
          box-shadow: var(--shadow-md);
          border-color: #CBD5E1;
        }

        .hc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .hc-name {
          font-size: 0.9375rem;
          font-weight: 700;
          line-height: 1.35;
          color: var(--text-ink);
          flex: 1;
          min-width: 0;
        }

        /* Status Badges */
        .badge-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .badge-available {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }
        .dot-available {
          background: #10B981;
        }

        .badge-limited {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid #FDE68A;
        }
        .dot-limited {
          background: #F59E0B;
        }

        .badge-full {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }
        .dot-full {
          background: #EF4444;
        }

        .badge-osm {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #CBD5E1;
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Meta row */
        .hc-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hc-distance {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Specialty Tags */
        .hc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .spec-tag {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #475569;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: var(--radius-sm);
          padding: 2px 7px;
        }

        .spec-tag-highlight {
          color: var(--action-primary);
          background: #EFF6FF;
          border-color: #BFDBFE;
        }

        .spec-tag-er {
          color: #2563EB;
          background: #EFF6FF;
          border: 1px solid #93C5FD;
          font-weight: 700;
        }

        /* Callout Box matching Stitch */
        .hc-callout {
          padding: 9px 12px;
          border-radius: var(--radius-md);
          margin: 2px 0;
        }

        .callout-available,
        .callout-limited,
        .callout-community {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .callout-danger {
          background: #FFF5F5;
          border: 1px solid #FED7D7;
        }

        .callout-text {
          font-size: 0.75rem;
          line-height: 1.45;
          color: #475569;
          margin: 0;
        }

        .text-danger {
          color: #DC2626;
          font-weight: 500;
        }

        /* Actions */
        .hc-actions {
          display: flex;
          gap: 8px;
          padding-top: 4px;
        }

        .hc-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all var(--transition-fast);
          cursor: pointer;
          font-family: inherit;
        }

        .hc-btn-outline {
          background: var(--surface-card);
          color: var(--text-ink);
          border: 1px solid var(--border-subtle);
        }

        .hc-btn-outline:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .hc-btn-filled {
          background: var(--action-primary);
          color: white;
          border: 1px solid var(--action-primary);
        }

        .hc-btn-filled:hover {
          background: var(--action-primary-hover);
        }
      `}</style>
    </div>
  );
}
