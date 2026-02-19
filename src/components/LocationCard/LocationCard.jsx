import { memo } from 'react';
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
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={() => onFocus?.(location)}
    >
      <div className="location-card__content">
        <div className="location-card__info">
          <div className="location-card__name-row">
            <h3 className="location-card__name">{location.name}</h3>
          </div>
          <p className="location-card__address">{location.address}</p>
          <div className="location-card__meta">
            <span className="location-card__city">{location.city}</span>
            {distance != null && (
              <span className="location-card__distance">{formatDistance(distance)}</span>
            )}
          </div>
        </div>
        <button
          className={`location-card__toggle ${visited ? 'location-card__toggle--visited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          aria-label={visited ? 'Mark as not visited' : 'Mark as visited'}
        >
          {visited ? 'Visited' : 'Mark as visited'}
        </button>
      </div>
    </div>
  );
});

export default LocationCard;
