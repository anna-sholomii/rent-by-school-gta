import { useEffect } from 'react';
import Shepherd from 'shepherd.js';
const { Tour } = Shepherd;
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_KEY = 'rbs-tour-v1';

export default function CoachTour() {
  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return;

    const tour = new Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        scrollTo: false,
        cancelIcon: { enabled: true },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 10,
        classes: 'rbs-step',
      },
    });

    tour.addStep({
      id: 'map-pins',
      attachTo: { element: '.app__map', on: 'left' },
      title: 'Schools on the map',
      text: 'Each colored pin is a school, scored by the Fraser Institute. <span style="color:#4ade80;font-weight:600">Green</span> = excellent (8–10), <span style="color:#f87171;font-weight:600">red</span> = low. Click any pin to start.',
      buttons: [
        { text: 'Next →', action: () => tour.next(), classes: 'rbs-btn-primary' },
      ],
    });

    tour.addStep({
      id: 'filters',
      attachTo: { element: '.sidebar-header', on: 'right' },
      title: 'Filter schools',
      text: 'Narrow down by board (Public / Catholic), language, Fraser rating range, or your monthly rent budget.',
      buttons: [
        { text: '← Back', action: () => tour.back(), classes: 'rbs-btn-secondary' },
        { text: 'Next →', action: () => tour.next(), classes: 'rbs-btn-primary' },
      ],
    });

    tour.addStep({
      id: 'see-rentals',
      attachTo: { element: '.sidebar__empty-state', on: 'right' },
      title: 'See nearby rentals',
      text: 'Click any school pin and this panel fills with rentals inside its catchment area — filtered to your budget.',
      buttons: [
        { text: '← Back', action: () => tour.back(), classes: 'rbs-btn-secondary' },
        { text: 'Got it', action: () => tour.complete(), classes: 'rbs-btn-primary' },
      ],
    });

    tour.on('complete', () => localStorage.setItem(TOUR_KEY, '1'));
    tour.on('cancel', () => localStorage.setItem(TOUR_KEY, '1'));

    const timer = setTimeout(() => tour.start(), 700);

    return () => {
      clearTimeout(timer);
      try { if (tour.isActive()) tour.cancel(); } catch (_) {}
    };
  }, []);

  return null;
}
