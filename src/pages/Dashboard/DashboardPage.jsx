import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import ChainCard from './ChainCard';
import './DashboardPage.css';

const ALL_BADGES = [
  { id: 'first_bite', icon: '🍔', name: 'First Bite', description: 'Started your journey with your first visit.' },
  { id: 'loyalist', icon: '🔥', name: 'The Loyalist', description: 'Visited 5 locations.' },
  { id: 'veteran', icon: '🤠', name: 'Veteran Chaser', description: 'Visited 25 locations.' },
  { id: 'hopper', icon: '🦘', name: 'Chain Hopper', description: 'Visited at least 3 different chains.' },
  { id: 'completionist', icon: '👑', name: 'Completionist', description: '100% completed a chain.' }
];

export default function DashboardPage() {
  const apiFetch = useApi();
  const { user } = useAuth();
  const [chains, setChains] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [chainsData, authData] = await Promise.all([
          apiFetch('/chains'),
          apiFetch('/auth/me')
        ]);
        setChains(chainsData.chains);
        setBadges(authData.user.badges || []);
      } catch {
        // Handle silently — user will see empty state
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch]);

  if (loading) {
    return (
      <div className="dashboard dashboard--loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const totalVisited = chains.reduce((s, c) => s + (c.visited_count || 0), 0);
  const totalLocations = chains.reduce((s, c) => s + (c.location_count || 0), 0);
  const pct = totalLocations > 0 ? Math.round(totalVisited / totalLocations * 100) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">
          {user ? `Welcome back, ${user.name || user.email?.split('@')[0]}` : 'Your Chains'}
        </h1>
        <p className="dashboard__subtitle">Pick a chain and start chasing</p>
      </div>

      <div className="dashboard__stats-bar">
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{chains.length}</div>
          <div className="dashboard__stat-label">Chains</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{totalVisited}</div>
          <div className="dashboard__stat-label">Visited</div>
        </div>
        <div className="dashboard__stat">
          <div className="dashboard__stat-value">{pct}%</div>
          <div className="dashboard__stat-label">Complete</div>
        </div>
      </div>

      <div className="dashboard__section-label">🏆 Trophy Case</div>
      <div className="dashboard__badges">
        {ALL_BADGES.map(badgeDef => {
          const earned = badges.find(b => b.id === badgeDef.id);
          return (
            <div key={badgeDef.id} className={`badge ${!earned ? 'badge--locked' : ''}`}>
              <div className="badge__icon">{badgeDef.icon}</div>
              <div className="badge__info">
                <div className="badge__name">{badgeDef.name}</div>
                <div className="badge__desc">{badgeDef.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard__section-label">All chains</div>

      <div className="dashboard__grid">
        {chains.map((chain, i) => (
          <ChainCard key={chain.id} chain={chain} index={i} />
        ))}
      </div>

      {chains.length === 0 && (
        <div className="dashboard__empty">
          No chains available yet. Check back soon!
        </div>
      )}
    </div>
  );
}
