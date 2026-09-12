'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Crosshair, Search, Activity, HeartPulse, Baby, Stethoscope, Flame, Users, Droplet, Hospital, CircleDot } from 'lucide-react';

const SPECIALTIES = [
  { key: 'Any', label: 'All specialties', icon: Search },
  { key: 'Trauma', label: 'Trauma', icon: Activity },
  { key: 'Cardiac', label: 'Cardiac', icon: HeartPulse },
  { key: 'Pediatric', label: 'Pediatric', icon: Baby },
  { key: 'ICU', label: 'ICU', icon: Stethoscope },
  { key: 'Burns', label: 'Burns', icon: Flame },
  { key: 'Maternity', label: 'Maternity', icon: Users },
  { key: 'Dialysis', label: 'Dialysis', icon: Droplet },
];

const DEMO_CITIES = {
  Delhi:     { lat: '28.6139', lng: '77.2090' },
  Mumbai:    { lat: '19.0760', lng: '72.8777' },
  Bangalore: { lat: '12.9716', lng: '77.5946' },
  Chennai:   { lat: '13.0827', lng: '80.2707' },
  Kolkata:   { lat: '22.5726', lng: '88.3639' },
  Hyderabad: { lat: '17.3850', lng: '78.4867' },
};

export default function Home() {
  const router = useRouter();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [specialty, setSpecialty] = useState('Any');
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setDetecting(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        setDetecting(false);
      },
      (err) => {
        setGeoError('Could not detect location. Please enter manually.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      setGeoError('Please enter valid coordinates or detect your location.');
      return;
    }
    router.push(`/results?lat=${userLat}&lng=${userLng}&specialty=${specialty}`);
  }

  function useDemoLocation(city) {
    const coords = DEMO_CITIES[city];
    setLat(coords.lat);
    setLng(coords.lng);
    setGeoError('');
  }

  return (
    <main className="search-page">
      <div className="container">
        <div className="split-layout fade-in">
          {/* LEFT — Search Form */}
          <section className="search-side">
            <span className="eyebrow-badge">CRITICAL CARE NETWORK</span>
            <h1 className="search-title">
              Find emergency care nearby
            </h1>
            <p className="search-subtitle">
              Locate hospitals with real-time specialty availability, live bed
              capacity, and accurate directions to save vital minutes.
            </p>

            <form onSubmit={handleSearch} className="search-form">
              {/* Location */}
              <div className="form-section">
                <div className="form-label-row">
                  <label className="form-label">
                    <Crosshair size={14} />
                    Your location
                  </label>
                  <span className="form-hint">GPS or manual selection</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary detect-btn"
                  onClick={detectLocation}
                  disabled={detecting}
                  id="detect-location-btn"
                >
                  <Crosshair size={14} />
                  {detecting ? 'Detecting…' : 'Detect my location'}
                </button>

                <div className="demo-cities">
                  <span className="demo-label">OR PICK A DEMO CITY</span>
                  <div className="demo-city-chips">
                    {Object.keys(DEMO_CITIES).map((city) => (
                      <button
                        key={city}
                        type="button"
                        className="demo-chip"
                        onClick={() => useDemoLocation(city)}
                        id={`demo-${city.toLowerCase()}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="coord-row">
                  <div className="input-group">
                    <label htmlFor="lat-input">LATITUDE</label>
                    <input
                      id="lat-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g. 28.6139"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lng-input">LONGITUDE</label>
                    <input
                      id="lng-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g. 77.2090"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>
                {geoError && <p className="geo-error">{geoError}</p>}
              </div>

              {/* Specialty */}
              <div className="form-section">
                <label className="form-label">
                  <Hospital size={14} />
                  Required specialty
                </label>
                <div className="specialty-grid">
                  {SPECIALTIES.map(({ key, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={key}
                      className={`specialty-chip ${specialty === key ? 'specialty-chip-active' : ''}`}
                      onClick={() => setSpecialty(key)}
                      id={`specialty-${key.toLowerCase()}`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-primary search-submit" id="search-btn">
                <Search size={16} />
                Locate nearest available hospital
              </button>
            </form>
          </section>

          {/* RIGHT — Info panel */}
          <aside className="info-side">
            <div className="info-card">
              <div className="info-stat-grid">
                <div className="info-stat">
                  <span className="info-stat-value">101</span>
                  <span className="info-stat-label">Verified hospitals</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-value">All India</span>
                  <span className="info-stat-label">Coverage footprint</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-value">7</span>
                  <span className="info-stat-label">Specialties tracked</span>
                </div>
                <div className="info-stat">
                  <span className="info-stat-value info-stat-live">
                    <CircleDot size={12} className="live-dot" />
                    Live
                  </span>
                  <span className="info-stat-label">OSM data stream</span>
                </div>
              </div>
              <div className="info-note">
                <p>Search results combine our verified medical directory with live OpenStreetMap queries, ensuring emergency facilities appear even in remote regions outside primary partner networks.</p>
              </div>
            </div>

            <div className="info-card">
              <div className="legend-header">
                <h3 className="info-card-title">Status legend</h3>
                <span className="legend-accent">LIVE BED STATUS</span>
              </div>
              <div className="legend-stack">
                <div className="legend-row">
                  <span className="badge badge-available">Available</span>
                  <span className="legend-desc">Beds &amp; critical capacity are open for admission.</span>
                </div>
                <div className="legend-row">
                  <span className="badge badge-limited">Limited</span>
                  <span className="legend-desc">Near capacity; potential wait times in emergency room.</span>
                </div>
                <div className="legend-row">
                  <span className="badge badge-full">At capacity</span>
                  <span className="legend-desc">High diversion likelihood; reroute to secondary center.</span>
                </div>
                <div className="legend-row">
                  <span className="badge badge-community">Community</span>
                  <span className="legend-desc">OSM crowdsourced record; bed metrics unverified.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .search-page {
          padding-top: var(--space-xl);
          padding-bottom: var(--space-3xl);
          min-height: calc(100vh - var(--header-height));
        }

        /* Asymmetric split */
        .split-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-2xl);
          align-items: start;
        }

        /* Left — search form */
        .search-side {
          max-width: 640px;
        }

        .eyebrow-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(29, 78, 137, 0.08);
          color: var(--action-primary);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(29, 78, 137, 0.2);
          margin-bottom: var(--space-md);
        }

        .search-title {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: var(--space-sm);
          color: var(--text-ink);
        }

        .search-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: var(--space-xl);
          max-width: 520px;
        }

        .search-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-ink);
        }

        .form-hint {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .detect-btn {
          align-self: flex-start;
        }

        .coord-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .geo-error {
          color: var(--status-full);
          font-size: 0.75rem;
        }

        /* Demo cities */
        .demo-cities {
          margin-top: var(--space-xs);
        }
        .demo-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
        }
        .demo-city-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .demo-chip {
          padding: 5px 14px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
          background: var(--surface-card);
          color: var(--text-ink);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }
        .demo-chip:hover {
          background: #F0F1F3;
          border-color: #CBD0D8;
        }

        /* Specialty chips */
        .specialty-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .specialty-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 16px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
          background: var(--surface-card);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .specialty-chip:hover {
          background: #F0F1F3;
          color: var(--text-ink);
        }
        .specialty-chip-active {
          background: var(--action-primary);
          color: white;
          border-color: var(--action-primary);
        }
        .specialty-chip-active:hover {
          background: var(--action-primary-hover);
          color: white;
        }

        /* Submit */
        .search-submit {
          width: 100%;
          padding: 14px;
          font-size: 0.875rem;
          border-radius: var(--radius-lg);
          margin-top: var(--space-sm);
        }

        /* Right — info side */
        .info-side {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          position: sticky;
          top: calc(var(--header-height) + var(--space-xl));
        }

        .info-card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .info-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }
        .info-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .info-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-ink);
          line-height: 1.2;
        }
        .info-stat-live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--status-available);
        }
        .info-stat-label {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .info-note {
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-subtle);
        }
        .info-note p {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.55;
        }

        .legend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }
        .info-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-ink);
        }
        .legend-accent {
          font-size: 0.5625rem;
          font-weight: 700;
          color: var(--status-full);
          letter-spacing: 0.06em;
        }

        .legend-stack {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .legend-row {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
        }
        .legend-row .badge {
          flex-shrink: 0;
          min-width: 76px;
          justify-content: center;
        }
        .legend-desc {
          font-size: 0.6875rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .split-layout {
            grid-template-columns: 1fr;
          }
          .info-side {
            position: static;
          }
          .search-title {
            font-size: 1.5rem;
          }
          .coord-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
