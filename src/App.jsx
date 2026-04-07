import catchmentAreas from './data/catchmentAreas';
import React, { useState, useCallback } from 'react';
import MapView, { haversineDistance, rentalsData } from './components/MapView';
import SchoolPanel from './components/SchoolPanel';
import RentalPanel from './components/RentalPanel';
import FilterBar from './components/FilterBar';
import OnboardingModal from './components/OnboardingModal';
import fraserRatings from './data/fraserRatings';
import './App.css';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [visibleSchoolCount, setVisibleSchoolCount] = useState(0);
  const [visibleRentalCount, setVisibleRentalCount] = useState(0);
  const [schoolSearch, setSchoolSearch] = useState('');

  // Callback from MapView when schools are loaded and filters change
  const handleVisibleCountChange = useCallback((sc, rc) => {
    setVisibleSchoolCount(sc);
    setVisibleRentalCount(rc);
  }, []);

  // When a school marker is clicked
  const handleSchoolClick = useCallback((school) => {
    setSelectedRental(null);
    setSelectedSchool(school);
  }, []);

  // When a rental marker is clicked
  const handleRentalClick = useCallback((rental) => {
    setSelectedSchool(null);
    setSelectedRental(rental);
  }, []);

  // Get rentals within the selected school's catchment polygon
  const nearbyRentals = selectedSchool
    ? (() => {
        const area = catchmentAreas[selectedSchool.name.trim()];
        if (!area) return [];
        return rentalsData
          .filter(r => pointInPolygon(r.lat, r.lng, area.coordinates))
          .map(r => ({
            ...r,
            distance: haversineDistance(selectedSchool.lat, selectedSchool.lng, r.lat, r.lng),
          }))
          .sort((a, b) => a.distance - b.distance);
      })()
    : [];

  // For RentalPanel: get nearby schools from GeoJSON — we'll pass the schools state up via a ref trick
  // Instead, we import fraserRatings and reconstruct schools from GeoJSON in the panel
  // We'll store schools in a ref accessible from App
  const [loadedSchools, setLoadedSchools] = useState([]);

  const handleSchoolsLoaded = useCallback((schools) => {
    setLoadedSchools(schools);
  }, []);

  // Point-in-polygon (ray casting) — coordinates are [lng, lat] pairs
  function pointInPolygon(lat, lng, coordinates) {
    const ring = coordinates[0];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  const assignedSchool = selectedRental
    ? loadedSchools.find(s => {
        const area = catchmentAreas[s.name.trim()];
        return area ? pointInPolygon(selectedRental.lat, selectedRental.lng, area.coordinates) : false;
      }) || null
    : null;

  function handleOnboardingDone({ ratingMin, ratingMax, schoolType }) {
    setRatingMin(ratingMin);
    setRatingMax(ratingMax);
    setSchoolTypeFilter(schoolType);
    setShowOnboarding(false);
  }

  return (
    <div className="app">
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}
      {/* Unified left sidebar: filters + detail panel */}
      <div className="app__sidebar">
        <FilterBar
          ratingMin={ratingMin}
          ratingMax={ratingMax}
          onRatingMinChange={setRatingMin}
          onRatingMaxChange={setRatingMax}
          schoolTypeFilter={schoolTypeFilter}
          onSchoolTypeChange={setSchoolTypeFilter}
          selectedSchool={selectedSchool}
          nearbyRentalCount={nearbyRentals.length}
          schoolSearch={schoolSearch}
          onSchoolSearchChange={setSchoolSearch}
          allSchools={loadedSchools}
          onSchoolSelect={handleSchoolClick}
        />
        {selectedSchool && (
          <SchoolPanel
            school={selectedSchool}
            nearbyRentals={nearbyRentals}
            onClose={() => setSelectedSchool(null)}
            onRentalClick={handleRentalClick}
          />
        )}
        {selectedRental && (
          <RentalPanel
            rental={selectedRental}
            assignedSchool={assignedSchool}
            onClose={() => setSelectedRental(null)}
            onSchoolClick={handleSchoolClick}
          />
        )}
      </div>

      {/* Map */}
      <div className="app__map">
        <MapView
          ratingMin={ratingMin}
          ratingMax={ratingMax}
          schoolTypeFilter={schoolTypeFilter}
          onSchoolClick={handleSchoolClick}
          onRentalClick={handleRentalClick}
          selectedSchool={selectedSchool}
          selectedRental={selectedRental}
          onVisibleCountChange={handleVisibleCountChange}
          onSchoolsLoaded={handleSchoolsLoaded}
        />
      </div>
    </div>
  );
}
