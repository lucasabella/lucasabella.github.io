import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import Map from '../../components/Map/Map';
import LocationCard from '../../components/LocationCard/LocationCard';
import { getChain } from '../../data/chains';
import { useVisits } from '../../hooks/useVisits';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { haversineDistance } from '../../utils/geo';
import { fireCompletionConfetti } from '../../utils/confetti';
import './ChainDetailPage.css';

const FILTERS = ['All', 'Visited', 'Remaining'];

const MINI_RING_RADIUS = 9;
const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS;

export default function ChainDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [nearMe, setNearMe] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const locationsRef = useRef(null);

  const chain = getChain(slug);
  const locations = useMemo(() => chain?.locations ?? [], [chain]);

  const { isVisited, toggleVisit } = useVisits();
  const { position, loading: geoLoading, error: geoError, requestPosition } = useGeolocation();
  const { panelRef, dragHandleRef, snapState, setSnapState } = useBottomSheet(52);
  const [findingNearest, setFindingNearest] = useState(false);

  const total = locations.length;
  const visitedCount = locations.filter((l) => isVisited(l.id)).length;
  const remainingCount = total - visitedCount;
  const pct = total > 0 ? Math.round(visitedCount / total * 100) : 0;
  const miniRingOffset = MINI_RING_CIRCUMFERENCE - (pct / 100) * MINI_RING_CIRCUMFERENCE;

  const prevVisitedCount = useRef(null);
  useEffect(() => {
    if (total > 0 && visitedCount === total && prevVisitedCount.current !== null && prevVisitedCount.current < total) {
      fireCompletionConfetti();
    }
    prevVisitedCount.current = visitedCount;
  }, [visitedCount, total]);

  const handleNearMeToggle = useCallback(() => {
    setNearMe((active) => {
      if (!active) requestPosition();
      return !active;
    });
  }, [requestPosition]);

  // Filter + sort locations
  const filteredLocations = useMemo(() => {
    let result = locations;
    if (filter === 'Visited') {
      result = result.filter((l) => isVisited(l.id));
    } else if (filter === 'Remaining') {
      result = result.filter((l) => !isVisited(l.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.address && l.address.toLowerCase().includes(q))
      );
    }
    if (nearMe && position) {
      result = [...result].sort((a, b) => {
        const distA = haversineDistance(position.lat, position.lng, a.lat, a.lng);
        const distB = haversineDistance(position.lat, position.lng, b.lat, b.lng);
        return distA - distB;
      });
    }
    return result;
  }, [locations, filter, search, isVisited, nearMe, position]);

  // Pre-compute distances for display
  const distances = useMemo(() => {
    if (!nearMe || !position) return {};
    const map = {};
    for (const loc of locations) {
      map[loc.id] = haversineDistance(position.lat, position.lng, loc.lat, loc.lng);
    }
    return map;
  }, [locations, nearMe, position]);

  const handleFocusLocation = useCallback((location) => {
    setFocusedId(location.id);
  }, []);

  const findAndFocusNearest = useCallback((pos) => {
    const unvisited = locations.filter(l => !isVisited(l.id));
    if (unvisited.length === 0) return;

    let nearest = unvisited[0];
    let minDist = haversineDistance(pos.lat, pos.lng, nearest.lat, nearest.lng);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = haversineDistance(pos.lat, pos.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = unvisited[i];
      }
    }

    setFocusedId(nearest.id);
    if (window.innerWidth <= 768) {
      setSnapState('collapsed');
    }
  }, [locations, isVisited, setSnapState]);

  const handleFindNearestClick = useCallback(() => {
    if (!position) {
      setFindingNearest(true);
      requestPosition();
    } else {
      findAndFocusNearest(position);
    }
  }, [position, requestPosition, findAndFocusNearest]);

  useEffect(() => {
    if (findingNearest && position) {
      findAndFocusNearest(position);
      setFindingNearest(false);
    }
  }, [position, findingNearest, findAndFocusNearest]);

  const scrollTopRef = useRef(false);
  const handleLocationsScroll = useCallback((e) => {
    const shouldShow = e.target.scrollTop > 200;
    if (shouldShow !== scrollTopRef.current) {
      scrollTopRef.current = shouldShow;
      setShowScrollTop(shouldShow);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    locationsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!chain) {
    return (
      <div className="chain-detail chain-detail--error">
        Chain not found.
      </div>
    );
  }

  // Determine panel class for desktop (mobile uses inline sheetStyle)
  const panelClass = `app__panel ${panelCollapsed ? 'app__panel--collapsed' : ''} app__panel--snap-${snapState}`;

  return (
    <div className="chain-detail">
      <div className="chain-detail__map">
        <Map
          locations={locations}
          isVisited={isVisited}
          onToggleVisit={toggleVisit}
          focusedId={focusedId}
        />

        {/* Floating map actions */}
        <div className="map-actions">
          <Motion.button
            className={`map-action ${nearMe ? 'map-action--active' : ''}`}
            onClick={handleNearMeToggle}
            whileTap={{ scale: 0.94 }}
          >
            📍 Near Me
          </Motion.button>
          <Motion.button
            className="map-action"
            onClick={handleFindNearestClick}
            disabled={findingNearest || remainingCount === 0}
            whileTap={{ scale: 0.94 }}
          >
            🎯 {findingNearest ? 'Locating…' : 'Nearest'}
          </Motion.button>
          {nearMe && geoLoading && !findingNearest && (
            <span className="map-actions__status">Locating…</span>
          )}
          {nearMe && geoError && (
            <span className="map-actions__status map-actions__status--error">Location unavailable</span>
          )}
        </div>
      </div>

      <aside
        className={panelClass}
        ref={panelRef}
      >
        {/* Desktop toggle */}
        <button
          className="app__panel-toggle"
          onClick={() => setPanelCollapsed((c) => !c)}
          aria-label={panelCollapsed ? 'Open panel' : 'Close panel'}
        >
          {panelCollapsed ? '◀' : '▶'}
        </button>

        {/* Mobile drag handle */}
        <div
          className="panel__drag-handle"
          ref={dragHandleRef}
          style={{ touchAction: 'none' }}
        >
          <div className="panel__drag-handle-bar" />
        </div>

        <div className="panel__header">
          <button className="panel__back" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="panel__chain">
            {chain.logo_url && !imgError ? (
              <img
                src={chain.logo_url}
                alt={`${chain.name} logo`}
                className="panel__chain-logo"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="panel__chain-logo-fallback">
                {chain.name?.charAt(0)}
              </span>
            )}
            <h1 className="panel__chain-name">{chain.name}</h1>
          </div>
          <div className="panel__ring-wrap" title={`${visitedCount} of ${total} visited`}>
            <svg className="panel__ring" viewBox="0 0 24 24">
              <circle className="panel__ring-track" cx="12" cy="12" r={MINI_RING_RADIUS} fill="none" strokeWidth="2.5" />
              <Motion.circle
                className="panel__ring-fill"
                cx="12" cy="12" r={MINI_RING_RADIUS}
                fill="none" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={MINI_RING_CIRCUMFERENCE}
                transform="rotate(-90 12 12)"
                initial={false}
                animate={{ strokeDashoffset: miniRingOffset }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <span className="panel__ring-label">{pct}%</span>
          </div>
        </div>

        <div className="panel__search">
          <div className="search-wrapper">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="panel__filters">
          <div className="segmented">
            {FILTERS.map((f) => {
              const count = f === 'All' ? total : f === 'Visited' ? visitedCount : remainingCount;
              return (
                <button
                  key={f}
                  className={`segmented__option ${filter === f ? 'segmented__option--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {filter === f && (
                    <Motion.span
                      layoutId="filter-thumb"
                      className="segmented__thumb"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="segmented__label">
                    {f} <span className="segmented__count">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel__locations" ref={locationsRef} onScroll={handleLocationsScroll}>
          {filteredLocations.length === 0 ? (
            <div className="panel__empty">
              {search ? 'No locations match your search.' : 'No locations to show.'}
            </div>
          ) : (
            filteredLocations.map((loc, i) => (
              <LocationCard
                key={loc.id}
                location={loc}
                visited={isVisited(loc.id)}
                onToggle={(e) => toggleVisit(loc.id, e)}
                onFocus={handleFocusLocation}
                index={i}
                distance={distances[loc.id]}
              />
            ))
          )}
          <button
            className={`panel__scroll-top ${showScrollTop ? 'panel__scroll-top--visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            ↑
          </button>
        </div>
      </aside>
    </div>
  );
}
