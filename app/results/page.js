'use client';

import { Suspense } from 'react';
import ResultsContent from './ResultsContent';

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading results…</p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
