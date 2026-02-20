import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import ChainCard from './ChainCard';
import './DashboardPage.css';

const ALL_BADGES = [
  { id: 'first_bite', icon: '\u{1F354}', name: 'First Bite', description: 'Started your journey with your first visit.' },
  { id: 'loyalist', icon: '\u{1F525}', name: 'The Loyalist', description: 'Visited 5 locations.' },
  { id: 'veteran', icon: '\u{1F920}', name: 'Veteran Chaser', description: 'Visited 25 locations.' },
  { id: 'hopper', icon: '\u{1F998}', name: 'Chain Hopper', description: 'Visited at least 3 different chains.' },
  { id: 'completionist', icon: '\u{1F451}', name: 'Completionist', description: '100% completed a chain.' }
];

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  const ringOffset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
  const earnedCount = ALL_BADGES.filter(b => badges.find(e => e.id === b.id)).length;

  return (
    <div className="dashboard">
      {/* Hero Card */}
      <div className="dashboard__hero">
        <div className="dashboard__greeting">
          <span className="dashboard__eyebrow">ChainChaser</span>
          <h1 className="dashboard__title">
            {user ? `Welcome back, ${user.name || user.email?.split('@')[0]}` : 'Your Chains'}
          </h1>
          <p className="dashboard__subtitle">Pick a chain and start chasing</p>
        </div>

        <div className="dashboard__ring-wrap">
          <svg
            className="dashboard__ring"
            viewBox="0 0 120 120"
            style={{
              '--ring-circumference': RING_CIRCUMFERENCE,
              '--ring-offset': ringOffset,
            }}
          >
            <circle
              className="dashboard__ring-track"
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="8"
            />
            <circle
              className="dashboard__ring-fill"
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <span className="dashboard__ring-label">{pct}%</span>
        </div>

        <div className="dashboard__stats">
          <div className="dashboard__stat" style={{ animationDelay: '700ms' }}>
            <div className="dashboard__stat-value">{chains.length}</div>
            <div className="dashboard__stat-label">Chains</div>
          </div>
          <div className="dashboard__stat-divider" />
          <div className="dashboard__stat" style={{ animationDelay: '800ms' }}>
            <div className="dashboard__stat-value">{totalVisited}</div>
            <div className="dashboard__stat-label">Visited</div>
          </div>
          <div className="dashboard__stat-divider" />
          <div className="dashboard__stat" style={{ animationDelay: '900ms' }}>
            <div className="dashboard__stat-value">{totalLocations}</div>
            <div className="dashboard__stat-label">Locations</div>
          </div>
        </div>
      </div>

      {/* Trophy Case */}
      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Trophy Case</h2>
          <span className="dashboard__section-count">{earnedCount}/{ALL_BADGES.length}</span>
        </div>
        <div className="dashboard__badge-shelf">
          <div className="dashboard__badge-track">
            {ALL_BADGES.map((badgeDef, i) => {
              const earned = badges.find(b => b.id === badgeDef.id);
              return (
                <div
                  key={badgeDef.id}
                  className={`badge ${!earned ? 'badge--locked' : ''}`}
                  style={{ animationDelay: `${600 + i * 80}ms` }}
                >
                  <div className="badge__medallion">
                    <span className="badge__icon">{badgeDef.icon}</span>
                  </div>
                  <div className="badge__pedestal">
                    <span className="badge__name">{badgeDef.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chain Cards */}
      <div className="dashboard__section">
        <div className="dashboard__section-header">
          <h2 className="dashboard__section-title">Your Chains</h2>
        </div>
        <div className="dashboard__grid">
          {chains.map((chain, i) => (
            <ChainCard key={chain.id} chain={chain} index={i} />
          ))}
        </div>
      </div>

      {chains.length === 0 && (
        <div className="dashboard__empty">
          No chains available yet. Check back soon!
        </div>
      )}
    </div>
  );
}
