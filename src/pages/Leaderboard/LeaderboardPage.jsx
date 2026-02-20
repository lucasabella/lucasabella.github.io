import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import './LeaderboardPage.css';

const MEDAL_EMOJIS = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

const METRICS = [
  { id: 'total_visits', label: 'Most Visits' },
  { id: 'chains_completed', label: 'Chains Completed' },
  { id: 'badges_earned', label: 'Badges Earned' },
];

function Avatar({ name, avatarUrl }) {
  if (avatarUrl) {
    return <img className="lb__avatar" src={avatarUrl} alt={name} />;
  }
  return (
    <div className="lb__avatar lb__avatar--letter">
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('global');
  const { rows, metric, loading, error, changeMetric } = useLeaderboard(mode);

  return (
    <div className="lb-page">
      <div className="lb-page__header">
        <h1 className="lb-page__title">Leaderboard</h1>
        <p className="lb-page__subtitle">See who&apos;s leading the chase</p>
      </div>

      <div className="lb-page__body">
        {/* Tab switcher */}
        <div className="lb__tabs" role="tablist">
          <button
            className={`lb__tab${mode === 'global' ? ' lb__tab--active' : ''}`}
            onClick={() => setMode('global')}
            role="tab"
            aria-selected={mode === 'global'}
          >
            Global
          </button>
          <button
            className={`lb__tab${mode === 'friends' ? ' lb__tab--active' : ''}`}
            onClick={() => setMode('friends')}
            role="tab"
            aria-selected={mode === 'friends'}
          >
            Friends
          </button>
        </div>

        {/* Metric pills */}
        <div className="lb__metrics" role="group" aria-label="Sort by">
          {METRICS.map((m) => (
            <button
              key={m.id}
              className={`lb__metric-pill${metric === m.id ? ' lb__metric-pill--active' : ''}`}
              onClick={() => changeMetric(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <p className="lb__loading">Loading...</p>}
        {error && <p className="lb__error">{error}</p>}

        {!loading && !error && rows.length === 0 && (
          <p className="lb__empty">
            {mode === 'friends'
              ? 'Add some friends to see your friends leaderboard.'
              : 'No data yet. Start visiting locations to appear here!'}
          </p>
        )}

        {!loading && rows.length > 0 && (
          <ol className="lb__list">
            {rows.map((row, idx) => {
              const isSelf = row.username === user?.username;
              return (
                <li
                  key={row.username}
                  className={`lb__row${isSelf ? ' lb__row--self' : ''}`}
                >
                  <span className="lb__rank">
                    {idx < 3 ? MEDAL_EMOJIS[idx] : <span className="lb__rank-num">{idx + 1}</span>}
                  </span>
                  <Avatar name={row.name} avatarUrl={row.avatar_url} />
                  <div className="lb__user-info">
                    <span className="lb__user-name">{row.name}</span>
                    <span className="lb__user-handle">@{row.username}</span>
                  </div>
                  <span className="lb__score">{row.score}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
