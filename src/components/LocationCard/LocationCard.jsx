import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import './LocationCard.css';

function formatDistance(km) {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

const LocationCard = memo(function LocationCard({ location, visited = false, onToggle, onFocus, index = 0, distance }) {

  return (
    <div
      className={`location-card ${visited ? 'location-card--visited' : ''}`}
      style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}
      onClick={() => onFocus?.(location)}
    >
      <div className="location-card__info">
        <h3 className="location-card__name">{location.name}</h3>
        <p className="location-card__address">
          {location.address} · {location.city}
        </p>
        <div className="location-card__meta">
          {distance != null && (
            <span className="location-card__distance">{formatDistance(distance)}</span>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="location-card__directions"
            onClick={(e) => e.stopPropagation()}
            title="Get Directions"
          >
            Directions ↗
          </a>
        </div>
      </div>

      <Motion.button
        className={`location-card__check ${visited ? 'location-card__check--visited' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(e);
        }}
        aria-label={visited ? 'Mark as not visited' : 'Mark as visited'}
        whileTap={{ scale: 0.85 }}
      >
        <Motion.svg
          key={visited ? 'visited' : 'unvisited'}
          width="20" height="20" viewBox="0 0 20 20" fill="none"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        >
          <path d="M4.5 10.5L8.5 14.5L15.5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Motion.svg>
      </Motion.button>
    </div>
  );
});

export default LocationCard;
