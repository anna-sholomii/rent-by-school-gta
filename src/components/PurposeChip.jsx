import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Home, Info, X } from 'lucide-react';

const ITEMS = [
  {
    Icon: MapPin,
    label: 'Pick a school',
    description:
      'Tap any school marker on the map to see its Fraser Institute rating and the exact catchment boundary.',
  },
  {
    Icon: Home,
    label: 'See catchment rentals',
    description:
      "Tap 'Explore rentals' to filter listings to only those inside the catchment — no guessing, no cross-referencing.",
  },
  {
    Icon: Info,
    label: 'Understand the score',
    description:
      'Each school shows a Fraser score out of 10. Tap the score to see what it measures and why some high-performing schools score lower.',
  },
];

export default function PurposeChip() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const panelRef = useRef(null);
  const touchStartYRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-focus first element in mobile sheet for accessibility
  useEffect(() => {
    if (open && isMobile && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [open, isMobile]);

  const close = useCallback(() => setOpen(false), []);

  const handleTouchStart = useCallback((e) => {
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartYRef.current === null) return;
    if (e.touches[0].clientY - touchStartYRef.current > 60) {
      touchStartYRef.current = null;
      close();
    }
  }, [close]);

  const handleTouchEnd = useCallback(() => {
    touchStartYRef.current = null;
  }, []);

  return (
    <>
      {/* ── Floating purpose chip ── */}
      <div
        role="region"
        aria-label="App purpose"
        className="purpose-chip"
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 999,
          padding: '8px 8px 8px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
        }}
      >
        <MapPin size={15} color="#4CAF50" strokeWidth={2.5} aria-hidden />

        {!isMobile && (
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
            Find rentals inside a school's catchment
          </span>
        )}

        <button
          aria-expanded={open}
          aria-controls="how-it-works-panel"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 13,
            fontWeight: 400,
            color: '#1a1a1a',
            cursor: 'pointer',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        >
          How it works <span aria-hidden="true">↗</span>
        </button>
      </div>

      {/* ── Panel ── */}
      {open && (
        <>
          {isMobile && (
            <div
              aria-hidden="true"
              onClick={close}
              style={{ position: 'fixed', inset: 0, zIndex: 1001 }}
            />
          )}

          <div
            id="how-it-works-panel"
            ref={panelRef}
            role={isMobile ? 'dialog' : 'tooltip'}
            aria-label="How Rent by School works"
            style={
              isMobile
                ? {
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1002,
                    background: '#fff',
                    borderRadius: '16px 16px 0 0',
                    padding: 20,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                  }
                : {
                    position: 'absolute',
                    top: 60,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1002,
                    background: '#fff',
                    borderRadius: 12,
                    padding: 20,
                    width: 320,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }
            }
          >
            {/* Drag handle — mobile only */}
            {isMobile && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                  marginTop: -4,
                  cursor: 'grab',
                  paddingTop: 4,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    background: '#cbd5e1',
                    borderRadius: 2,
                  }}
                />
              </div>
            )}

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <h2
                style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}
              >
                How Rent by School works
              </h2>
              <button
                aria-label="Close how it works panel"
                onClick={close}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  minWidth: 32,
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b6b6b',
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ITEMS.map(({ Icon, label, description }) => (
                <div
                  key={label}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                  <Icon
                    size={18}
                    color="#6b6b6b"
                    strokeWidth={1.8}
                    style={{ flexShrink: 0, marginTop: 1 }}
                    aria-hidden="true"
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1a1a1a',
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.5 }}
                    >
                      {description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p
              style={{
                margin: '16px 0 0',
                fontSize: 11,
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              Catchment data from TDSB. Ratings from Fraser Institute. Rental
              listings are illustrative.
            </p>
          </div>
        </>
      )}
    </>
  );
}
