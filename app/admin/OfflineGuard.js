'use client';

import { useEffect, useState } from 'react';

export default function OfflineGuard({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: '#FAFAF8' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1F26', marginBottom: 12 }}>You're offline</h1>
        <p style={{ color: '#585E6C', maxWidth: 380, marginBottom: 24 }}>
          The admin dashboard needs an internet connection. It'll load automatically once you're back online.
        </p>
        <a href="tel:112" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E8553A', color: 'white', padding: '14px 28px', borderRadius: 4, fontWeight: 700, textDecoration: 'none', marginBottom: 12, minHeight: 48 }}>
          Call Emergency (112)
        </a>
        <a href="tel:108" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#1D4E89', border: '1px solid #1D4E89', padding: '14px 28px', borderRadius: 4, fontWeight: 600, textDecoration: 'none', minHeight: 48 }}>
          Call Ambulance (108)
        </a>
      </main>
    );
  }

  return children;
}