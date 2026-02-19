import { useRef, useEffect } from 'react';
import './LocationCard.css';

export default function LocationCard({ location, visited = false, onToggle, onFocus, index = 0 }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.animationDelay = `${index * 30}ms`;
    }
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`location-card ${visited ? 'location-card--visited' : ''}`}
      onClick={() => onFocus?.(location)}
    >
      <div className="location-card__content">
        <div className="location-card__info">
          <div className="location-card__name-row">
            <h3 className="location-card__name">{location.name}</h3>
          </div>
          <p className="location-card__address">{location.address}</p>
          <span className="location-card__city">{location.city}</span>
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
}
