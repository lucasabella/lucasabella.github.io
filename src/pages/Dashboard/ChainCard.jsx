import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './ChainCard.css';

export default function ChainCard({ chain, index }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const isComplete = chain.visited_count === chain.location_count && chain.location_count > 0;

  return (
    <article
      className={`chain-card ${isComplete ? 'chain-card--complete' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/chains/${chain.slug}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/chains/${chain.slug}`); } }}
      style={{ animationDelay: `${900 + index * 80}ms` }}
    >
      <div className="chain-card__accent" />
      <div className="chain-card__header">
        <div className="chain-card__logo-wrap">
          {chain.logo_url && !imgError ? (
            <img
              src={chain.logo_url}
              alt={`${chain.name} logo`}
              className="chain-card__logo"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="chain-card__logo-fallback">
              {chain.name?.charAt(0)}
            </span>
          )}
        </div>
        <div className="chain-card__header-text">
          <h2 className="chain-card__name">{chain.name}</h2>
          <span className="chain-card__count">
            {chain.visited_count}/{chain.location_count}
          </span>
        </div>
        <svg className="chain-card__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {chain.description && (
        <p className="chain-card__desc">{chain.description}</p>
      )}

      <div className="chain-card__progress">
        <ProgressBar visited={chain.visited_count} total={chain.location_count} variant="compact" />
      </div>
    </article>
  );
}
