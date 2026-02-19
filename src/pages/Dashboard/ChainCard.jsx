import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './ChainCard.css';

export default function ChainCard({ chain, index }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="chain-card"
      onClick={() => navigate(`/chains/${chain.slug}`)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
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
      </div>

      {chain.description && (
        <p className="chain-card__desc">{chain.description}</p>
      )}

      <div className="chain-card__progress">
        <ProgressBar visited={chain.visited_count} total={chain.location_count} />
      </div>
    </div>
  );
}
