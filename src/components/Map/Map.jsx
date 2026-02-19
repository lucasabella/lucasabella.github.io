import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../contexts/ThemeContext';
import './Map.css';

//test
function createMarkerIcon(visited) {
  const color = visited ? '#2C6E49' : '#D4522A';
  const glow = visited ? 'rgba(44,110,73,0.35)' : 'rgba(212,82,42,0.35)';

  const svg = `
    <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${glow}" flood-opacity="0.8"/>
      </filter>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28s16-16 16-28C32 7.163 24.837 0 16 0z"
            fill="${color}" filter="url(#shadow)" />
      <circle cx="16" cy="15" r="7" fill="rgba(255,255,255,0.3)"/>
      <circle cx="16" cy="15" r="5" fill="white" opacity="0.9"/>
      ${visited ? '<path d="M12 15l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: `map-marker ${visited ? 'map-marker--visited' : 'map-marker--unvisited'}`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
}

// Fly to a location when focusedId changes
function FlyToLocation({ locations, focusedId }) {
  const map = useMap();

  useEffect(() => {
    if (!focusedId) return;
    const loc = locations.find(l => l.id === focusedId);
    if (loc) {
      map.flyTo([loc.lat, loc.lng], 14, { duration: 0.8 });
    }
  }, [focusedId, locations, map]);

  return null;
}

export default function Map({ locations = [], isVisited, onToggleVisit, focusedId }) {
  const mapRef = useRef(null);
  const { theme } = useTheme();

  // Netherlands center
  const center = [52.2, 5.3];
  const zoom = 8;

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={zoom}
        ref={mapRef}
        className="map-container"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

        <FlyToLocation locations={locations} focusedId={focusedId} />

        {locations.map((loc) => {
          const visited = isVisited?.(loc.id) ?? false;
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={createMarkerIcon(visited)}
            >
              <Popup>
                <div className="popup-content">
                  <h3 className="popup-content__name">{loc.name}</h3>
                  <p className="popup-content__address">{loc.address}</p>
                  <p className="popup-content__city">{loc.city}</p>
                  <button
                    className={`popup-content__btn ${visited ? 'popup-content__btn--visited' : ''}`}
                    onClick={() => onToggleVisit?.(loc.id)}
                  >
                    {visited ? '\u2713 Visited' : 'Mark as visited'}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
