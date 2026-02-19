import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map from '../../components/Map/Map';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import LocationCard from '../../components/LocationCard/LocationCard';
import { useApi } from '../../hooks/useApi';
import { useVisits } from '../../hooks/useVisits';
import './ChainDetailPage.css';

const FILTERS = ['All', 'Visited', 'Remaining'];

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
  const [focusedId, setFocusedId] = useState(null);
  const dragRef = useRef({ startY: 0, startCollapsed: false });

  const { isVisited, toggleVisit, visitedCount, updateFromLocations } = useVisits(locations);

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
    return result;
  }, [locations, filter, search, isVisited]);

  const handleFocusLocation = useCallback((location) => {
    setFocusedId(location.id);
  }, []);

  const handleDragHandleTouchStart = useCallback((e) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.startCollapsed = panelCollapsed;
  }, [panelCollapsed]);

  const handleDragHandleTouchEnd = useCallback((e) => {
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    if (Math.abs(dy) > 60) {
      setPanelCollapsed(dy > 0);
    }
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

      <aside className={`app__panel ${panelCollapsed ? 'app__panel--collapsed' : ''}`}>
        <button
          className="app__panel-toggle"
          onClick={() => setPanelCollapsed((c) => !c)}
          aria-label={panelCollapsed ? 'Open panel' : 'Close panel'}
        >
          {panelCollapsed ? '\u25C0' : '\u25B6'}
        </button>

        <div
          className="panel__drag-handle"
          onClick={() => setPanelCollapsed((c) => !c)}
          onTouchStart={handleDragHandleTouchStart}
          onTouchEnd={handleDragHandleTouchEnd}
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
            <span className="panel__chain-badge">{chain.name}</span>
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
              {f === 'Visited' && ` (${visitedCount})`}
              {f === 'Remaining' && ` (${remainingCount})`}
            </button>
          ))}
        </div>

        <div className="panel__locations">
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
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
