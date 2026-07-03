import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './ChainCard.css';

export default function ChainCard({ chain, index }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const isComplete = chain.visited_count === chain.location_count && chain.location_count > 0;
  const pct = chain.location_count > 0
    ? Math.round(chain.visited_count / chain.location_count * 100)
    : 0;

  return (
    <Motion.article
      className={`chain-card ${isComplete ? 'chain-card--complete' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/chains/${chain.slug}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/chains/${chain.slug}`); } }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
    >
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

      <div className="chain-card__body">
        <div className="chain-card__top">
          <h2 className="chain-card__name">{chain.name}</h2>
          <span className={`chain-card__count ${isComplete ? 'chain-card__count--complete' : ''}`}>
            {isComplete ? 'Completed' : `${chain.visited_count} of ${chain.location_count}`}
          </span>
        </div>
        {chain.description && (
          <p className="chain-card__desc">{chain.description}</p>
        )}
        <div className="chain-card__progress">
          <ProgressBar visited={chain.visited_count} total={chain.location_count} variant="compact" />
          <span className="chain-card__pct">{pct}%</span>
        </div>
      </div>

      <svg className="chain-card__arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Motion.article>
  );
}
