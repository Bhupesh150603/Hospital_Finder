'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

// Fix default marker icon issue in webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Status colors matching DESIGN.md and Stitch mockup
 */
const STATUS_COLORS = {
  Available: '#10B981', // emerald green
  Limited: '#F59E0B',   // amber
  Full: '#EF4444',      // red/coral
  Community: '#4B5563', // slate grey
};

/**
 * Custom circular pin with white medical cross icon
 */
function createStatusIcon(availability, source) {
  const isOSM = source === 'osm';
  const color = isOSM ? STATUS_COLORS.Community : (STATUS_COLORS[availability] || STATUS_COLORS.Community);

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: transform 0.15s ease;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/**
 * Blue user location marker with "You are here" label pill
 */
function createUserIcon() {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.35), 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          margin-top: 4px;
          background: #0F172A;
          color: white;
          font-size: 10px;
          font-weight: 700;
          font-family: 'IBM Plex Sans', sans-serif;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.2px;
        ">You are here</div>
      </div>
    `,
    iconSize: [80, 48],
    iconAnchor: [40, 10],
    popupAnchor: [0, -12],
  });
}

/**
 * Map controller hook to capture map instance & auto fit bounds
 */
function MapController({ hospitals, userLat, userLng, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (!map || hospitals.length === 0) return;

    const points = hospitals.map((h) => [h.lat, h.lng]);
    points.push([userLat, userLng]);

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [hospitals, userLat, userLng, map]);

  return null;
}

export default function HospitalMap({ hospitals, userLat, userLng }) {
  const [mapInstance, setMapInstance] = useState(null);
  const center = [userLat, userLng];

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstance) return;
    const points = hospitals.map((h) => [h.lat, h.lng]);
    points.push([userLat, userLng]);
    mapInstance.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  };

  return (
    <div className="map-card card">
      {/* Top radar control bar matching Stitch mockup */}
      <div className="map-top-bar">
        <div className="radar-status">
          <span className="radar-dot"></span>
          <span className="radar-text">Live GPS Radar</span>
        </div>

        <div className="map-controls">
          <button
            type="button"
            className="ctrl-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            className="ctrl-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            className="ctrl-btn ctrl-recenter"
            onClick={handleRecenter}
            title="Recenter map"
          >
            Recenter
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className="map-frame">
        <MapContainer
          center={center}
          zoom={12}
          zoomControl={false}
          style={{ height: '480px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            hospitals={hospitals}
            userLat={userLat}
            userLng={userLng}
            onMapReady={setMapInstance}
          />

          {/* User Marker */}
          <Marker position={center} icon={createUserIcon()}>
            <Popup>
              <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <strong style={{ fontSize: '12px' }}>Your coordinates</strong>
                <br />
                <small style={{ color: '#64748B' }}>{userLat.toFixed(4)}, {userLng.toFixed(4)}</small>
              </div>
            </Popup>
          </Marker>

          {/* Hospital Markers */}
          {hospitals.map((h) => {
            const isOSM = h.source === 'osm';
            const isFull = h.availability === 'Full';
            const statusLabel = isOSM ? 'Community-sourced' : isFull ? 'At Capacity' : h.availability;

            return (
              <Marker
                key={h.id}
                position={[h.lat, h.lng]}
                icon={createStatusIcon(h.availability, h.source)}
              >
                <Popup>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", minWidth: '180px' }}>
                    <strong style={{ fontSize: '13px', color: '#1E293B', display: 'block', marginBottom: '2px' }}>
                      {h.name}
                    </strong>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>
                      {h.distance} km &bull; ~{h.etaMinutes} min away
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: isOSM ? '#F1F5F9' : isFull ? '#FEF2F2' : h.availability === 'Limited' ? '#FFFBEB' : '#ECFDF5',
                      color: isOSM ? '#475569' : isFull ? '#DC2626' : h.availability === 'Limited' ? '#D97706' : '#059669',
                      border: `1px solid ${isOSM ? '#CBD5E1' : isFull ? '#FECACA' : h.availability === 'Limited' ? '#FDE68A' : '#A7F3D0'}`,
                      marginBottom: '8px'
                    }}>
                      {statusLabel}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {h.phone ? (
                        <a
                          href={`tel:${h.phone}`}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '4px 8px',
                            background: '#F1F5F9',
                            color: '#1E293B',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Call
                        </a>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '4px 8px',
                            background: '#F1F5F9',
                            color: '#1E293B',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Search
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '4px 8px',
                          background: '#1D4E89',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend and copyright bar matching Stitch */}
      <div className="map-bottom-bar">
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLORS.Available }}></span>
            Available
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLORS.Limited }}></span>
            Limited
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLORS.Full }}></span>
            Full
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: STATUS_COLORS.Community }}></span>
            Community-sourced
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#2563EB' }}></span>
            You
          </span>
        </div>
        <span className="map-osm-credit">&copy; OpenStreetMap</span>
      </div>

      <style jsx>{`
        .map-card {
          padding: 0;
          overflow: hidden;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-subtle);
          background: var(--surface-card);
          box-shadow: var(--shadow-md);
        }

        .map-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: var(--surface-card);
          border-bottom: 1px solid var(--border-subtle);
        }

        .radar-status {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .radar-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563EB;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
        }

        .radar-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-ink);
          letter-spacing: -0.01em;
        }

        .map-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ctrl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          padding: 0 8px;
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-ink);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }

        .ctrl-btn:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }

        .ctrl-recenter {
          font-size: 0.6875rem;
          color: var(--action-primary);
          padding: 0 10px;
        }

        .map-frame {
          position: relative;
          width: 100%;
        }

        .map-bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 14px;
          background: var(--surface-card);
          border-top: 1px solid var(--border-subtle);
          font-size: 0.6875rem;
        }

        .map-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .map-osm-credit {
          color: var(--text-muted);
          font-size: 0.625rem;
        }

        @media (max-width: 600px) {
          .map-bottom-bar {
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
