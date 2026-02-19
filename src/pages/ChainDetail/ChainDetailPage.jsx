import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map from '../../components/Map/Map';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import LocationCard from '../../components/LocationCard/LocationCard';
import { useApi } from '../../hooks/useApi';
import { useVisits } from '../../hooks/useVisits';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { haversineDistance } from '../../utils/geo';
import './ChainDetailPage.css';

const FILTERS = ['All', 'Visited', 'Remaining'];
const SORT_OPTIONS = ['Default', 'Near Me'];

export default function ChainDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const apiFetch = useApi();
  const [chain, setChain] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Default');
  const [focusedId, setFocusedId] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const locationsRef = useRef(null);

  const { isVisited, toggleVisit, visitedCount, updateFromLocations } = useVisits(locations);
  const { position, loading: geoLoading, error: geoError, requestPosition } = useGeolocation();
  const { sheetStyle, panelRef, dragHandleRef, snapState } = useBottomSheet(52);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/chains/${slug}`);
        setChain(data.chain);
        setLocations(data.chain.locations);
        updateFromLocations(data.chain.locations);
      } catch {
        // Error state could be added
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, apiFetch, updateFromLocations]);

  const total = locations.length;
  const remainingCount = total - visitedCount;

  // Handle sort toggle
  const handleSortChange = useCallback((s) => {
    setSort(s);
    if (s === 'Near Me') {
      requestPosition();
    }
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
    // Sort by distance when Near Me is active and we have a position
    if (sort === 'Near Me' && position) {
      result = [...result].sort((a, b) => {
        const distA = haversineDistance(position.lat, position.lng, a.lat, a.lng);
        const distB = haversineDistance(position.lat, position.lng, b.lat, b.lng);
        return distA - distB;
      });
    }
    return result;
  }, [locations, filter, search, isVisited, sort, position]);

  // Pre-compute distances for display
  const distances = useMemo(() => {
    if (sort !== 'Near Me' || !position) return {};
    const map = {};
    for (const loc of locations) {
      map[loc.id] = haversineDistance(position.lat, position.lng, loc.lat, loc.lng);
    }
    return map;
  }, [locations, sort, position]);

  const handleFocusLocation = useCallback((location) => {
    setFocusedId(location.id);
  }, []);

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

  if (loading) {
    return (
      <div className="chain-detail chain-detail--loading">
        <div className="loading-spinner" />
      </div>
    );
  }

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
      </div>

      <aside
        className={panelClass}
        ref={panelRef}
        style={window.innerWidth <= 768 ? sheetStyle : undefined}
      >
        {/* Desktop toggle */}
        <button
          className="app__panel-toggle"
          onClick={() => setPanelCollapsed((c) => !c)}
          aria-label={panelCollapsed ? 'Open panel' : 'Close panel'}
        >
          {panelCollapsed ? '\u25C0' : '\u25B6'}
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
          <div className="panel__back-row">
            <button className="panel__back" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard">
              ← Dashboard
            </button>
          </div>
          <div className="panel__brand">
            <span className="panel__logo">
              Chain<span className="panel__logo-accent">Chaser</span>
            </span>
            <div className="panel__chain-info">
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
              <span className="panel__chain-badge">{chain.name}</span>
            </div>
          </div>
          <p className="panel__subtitle">{chain.description}</p>
        </div>

        <div className="panel__stats">
          <div className="stat">
            <div className="stat__value">{total}</div>
            <div className="stat__label">Total</div>
          </div>
          <div className="stat">
            <div className="stat__value stat__value--green">{visitedCount}</div>
            <div className="stat__label">Visited</div>
          </div>
          <div className="stat">
            <div className="stat__value stat__value--gold">{remainingCount}</div>
            <div className="stat__label">Remaining</div>
          </div>
        </div>

        <div className="panel__progress">
          <ProgressBar visited={visitedCount} total={total} />
        </div>

        <div className="panel__search">
          <div className="search-wrapper">
            <span className="search-icon">{'\u2315'}</span>
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
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f === 'All' && ` (${total})`}
              {f === 'Visited' && ` (${visitedCount})`}
              {f === 'Remaining' && ` (${remainingCount})`}
            </button>
          ))}
        </div>

        <div className="panel__sort">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s}
              className={`sort-tab ${sort === s ? 'sort-tab--active' : ''}`}
              onClick={() => handleSortChange(s)}
            >
              {s === 'Near Me' ? '📍 Near Me' : s}
            </button>
          ))}
          {sort === 'Near Me' && geoLoading && (
            <span className="sort-status">Locating…</span>
          )}
          {sort === 'Near Me' && geoError && (
            <span className="sort-status sort-status--error">Location unavailable</span>
          )}
        </div>

        <div className="panel__locations" ref={locationsRef} onScroll={handleLocationsScroll}>
          <div className="panel__locations-count">
            {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
          </div>
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
                onToggle={() => toggleVisit(loc.id)}
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
