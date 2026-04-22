import React, { useEffect, useState } from 'react';

/**
 * Full-screen splash loader shown until the map data is ready.
 * Fades in on mount, fades out once `done` becomes true.
 */
export default function AppLoader({ done }) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'visible' | 'leaving' | 'gone'

  useEffect(() => {
    // Short pause after entering animation, then stay visible
    const t = setTimeout(() => setPhase('visible'), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!done || phase === 'gone') return;
    // Brief hold (300 ms) then slide out
    const t = setTimeout(() => {
      setPhase('leaving');
      const t2 = setTimeout(() => setPhase('gone'), 550);
      return () => clearTimeout(t2);
    }, 300);
    return () => clearTimeout(t);
  }, [done, phase]);

  if (phase === 'gone') return null;

  return (
    <div className={`app-loader app-loader--${phase}`} aria-live="polite" aria-label="Loading">
      <div className="app-loader__card">
        <img
          src="/logo.svg"
          className="app-loader__logo"
          alt="Rent by School logo"
          width="88"
          height="99"
        />
        <div className="app-loader__wordmark">
          <span className="app-loader__title">Rent by School</span>
          <span className="app-loader__city">Toronto</span>
        </div>
        <div className="app-loader__dots" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
