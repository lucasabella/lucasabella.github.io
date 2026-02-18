import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './ChainCard.css';

export default function ChainCard({ chain, index }) {
  const navigate = useNavigate();

  return (
    <div
      className="chain-card"
      onClick={() => navigate(`/chains/${chain.slug}`)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="chain-card__header">
        <h2 className="chain-card__name">{chain.name}</h2>
        <span className="chain-card__count">
          {chain.visited_count}/{chain.location_count}
        </span>
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
