import { haversine, rankHospitals, type HospitalLike } from './haversine';

describe('haversine', () => {
  it('returns 0 for identical points', () => {
    expect(haversine(28.6139, 77.209, 28.6139, 77.209)).toBeCloseTo(0, 5);
  });

  it('calculates a known real-world distance correctly (Delhi to Mumbai, ~1150km)', () => {
    const distance = haversine(28.6139, 77.209, 19.076, 72.8777);
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1200);
  });
});

describe('rankHospitals', () => {
  const sampleHospitals: HospitalLike[] = [
    { id: '1', name: 'Cardiac Center', lat: 0, lng: 0.02, specialties: ['Cardiac'], availability: 'Available' },
    { id: '2', name: 'Eye Hospital', lat: 0, lng: 0.01, specialties: ['Eye'], availability: 'Available' },
    { id: '3', name: 'General Hospital', lat: 0, lng: 0.015, specialties: ['Cardiac', 'Trauma'], availability: 'Full' },
  ];

  it('filters strictly by specialty — regression test for the real bug we hit earlier', () => {
    const results = rankHospitals(sampleHospitals, 0, 0, 'Cardiac');
    expect(results).toHaveLength(2);
    expect(results.every((h) => (h.specialties as string[])?.includes('Cardiac'))).toBe(true);
    expect(results.some((h) => h.name === 'Eye Hospital')).toBe(false);
  });

  it('returns all hospitals when no specialty is specified', () => {
    const results = rankHospitals(sampleHospitals, 0, 0, null);
    expect(results).toHaveLength(3);
  });

  it('prioritizes Available hospitals over a closer Full one when prioritizeAvailability is true', () => {
    const results = rankHospitals(
      [
        { id: 'a', name: 'Nearby Full', lat: 0, lng: 0.01, specialties: ['Cardiac'], availability: 'Full' },
        { id: 'b', name: 'Farther Available', lat: 0, lng: 0.03, specialties: ['Cardiac'], availability: 'Available' },
      ],
      0, 0, 'Cardiac', 20, true
    );
    expect(results[0].name).toBe('Farther Available');
  });

  it('ranks by pure distance when prioritizeAvailability is false', () => {
    const results = rankHospitals(
      [
        { id: 'a', name: 'Nearby Full', lat: 0, lng: 0.01, specialties: ['Cardiac'], availability: 'Full' },
        { id: 'b', name: 'Farther Available', lat: 0, lng: 0.03, specialties: ['Cardiac'], availability: 'Available' },
      ],
      0, 0, 'Cardiac', 20, false
    );
    expect(results[0].name).toBe('Nearby Full');
  });
});