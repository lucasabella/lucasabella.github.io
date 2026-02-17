import { useState, useMemo, useCallback } from 'react';
import Map from './components/Map/Map';
import ProgressBar from './components/ProgressBar/ProgressBar';
import LocationCard from './components/LocationCard/LocationCard';
import useVisited from './hooks/useVisited';
import chainData from './data/loetje.json';
import './App.css';

const FILTERS = ['All', 'Visited', 'Remaining'];

function App() {
  const { toggleVisit, isVisited, visitedCount } = useVisited();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [focusedId, setFocusedId] = useState(null);

  const locations = chainData.locations;
  const total = locations.length;

  const filteredLocations = useMemo(() => {
    let result = locations;

    // Filter by status
    if (filter === 'Visited') {
      result = result.filter(l => isVisited(l.id));
    } else if (filter === 'Remaining') {
      result = result.filter(l => !isVisited(l.id));
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    }

    return result;
  }, [locations, filter, search, isVisited]);

  const handleFocusLocation = useCallback((location) => {
    setFocusedId(location.id);
  }, []);

  const remainingCount = total - visitedCount;

  return (
    <div className="app">
      <div className="app__map">
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
          onClick={() => setPanelCollapsed(c => !c)}
          aria-label={panelCollapsed ? 'Open panel' : 'Close panel'}
        >
          {panelCollapsed ? '\u25C0' : '\u25B6'}
        </button>

        <div className="panel__drag-handle" onClick={() => setPanelCollapsed(c => !c)}>
          <div className="panel__drag-handle-bar" />
        </div>

        <div className="panel__header">
          <div className="panel__brand">
            <span className="panel__logo">
              Chain<span className="panel__logo-accent">Chaser</span>
            </span>
            <span className="panel__chain-badge">{chainData.chain}</span>
          </div>
          <p className="panel__subtitle">{chainData.description}</p>
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
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="panel__filters">
          {FILTERS.map(f => (
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

export default App;
