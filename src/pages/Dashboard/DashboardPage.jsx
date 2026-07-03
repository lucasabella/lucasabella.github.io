import { useEffect, useMemo, useRef } from 'react';
import { motion as Motion, animate, useReducedMotion } from 'framer-motion';
import { getChains } from '../../data/chains';
import { useVisits } from '../../hooks/useVisits';
import ChainCard from './ChainCard';
import './DashboardPage.css';

const TROPHY_ICONS = {
  first_bite: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c0-3.3 3.6-5.5 8-5.5S20 6.7 20 10H4z" />
      <line x1="4" y1="13.5" x2="20" y2="13.5" />
      <path d="M4 17c0 1.4 1.2 2.5 2.7 2.5h10.6c1.5 0 2.7-1.1 2.7-2.5v-.5H4v.5z" />
    </svg>
  ),
  loyalist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-2.6-1.5-4.6-3-6.3-.4 1-1 1.8-1.9 2.3.2-2.9-1-6-3.6-7.8.2 2.3-.7 3.9-2 5.4-1.4 1.6-3.5 3.5-3.5 6.4C4.5 18.4 8.1 21 12 21z" />
    </svg>
  ),
  veteran: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.8 13.5 7 21l5-2.6L17 21l-1.8-7.5" />
    </svg>
  ),
  hopper: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4.5" cy="17" r="1.6" />
      <circle cx="12" cy="17" r="1.6" />
      <circle cx="19.5" cy="17" r="1.6" />
      <path d="M6 15c1-3.2 3.4-3.2 4.4 0" />
      <path d="M13.6 15c1-3.2 3.4-3.2 4.4 0" />
    </svg>
  ),
  completionist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8.5 7.8 12 12 6l4.2 6L20 8.5V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V8.5z" />
    </svg>
  ),
};

const ALL_BADGES = [
  { id: 'first_bite', name: 'First Bite', description: 'Started your journey with your first visit.' },
  { id: 'loyalist', name: 'The Loyalist', description: 'Visited 5 locations.' },
  { id: 'veteran', name: 'Veteran Chaser', description: 'Visited 25 locations.' },
  { id: 'hopper', name: 'Chain Hopper', description: 'Visited at least 3 different chains.' },
  { id: 'completionist', name: 'Completionist', description: '100% completed a chain.' }
];

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CountUp({ value, duration = 1.2 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = String(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = String(Math.round(v)); },
    });
    return () => controls.stop();
  }, [value, duration, reduced]);

  return <span ref={ref}>{value}</span>;
}

const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

export default function DashboardPage() {
  const { visitedIds } = useVisits();

  const chains = useMemo(() =>
    getChains().map((chain) => ({
      ...chain,
      location_count: chain.locations.length,
      visited_count: chain.locations.filter((l) => visitedIds.has(l.id)).length,
    })),
    [visitedIds]
  );

  const totalVisited = chains.reduce((s, c) => s + c.visited_count, 0);
  const totalLocations = chains.reduce((s, c) => s + c.location_count, 0);
  const pct = totalLocations > 0 ? Math.round(totalVisited / totalLocations * 100) : 0;
  const ringOffset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  const chainsStarted = chains.filter((c) => c.visited_count > 0).length;
  const earnedIds = new Set([
    totalVisited >= 1 && 'first_bite',
    totalVisited >= 5 && 'loyalist',
    totalVisited >= 25 && 'veteran',
    chainsStarted >= 3 && 'hopper',
    chains.some((c) => c.location_count > 0 && c.visited_count === c.location_count) && 'completionist',
  ].filter(Boolean));
  const earnedCount = earnedIds.size;

  return (
    <div className="dashboard">
      {/* Hero */}
      <header className="dashboard__hero">
        <Motion.span
          className="dashboard__eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          ChainChaser
        </Motion.span>
        <Motion.h1
          className="dashboard__title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          Your Chains
        </Motion.h1>
        <Motion.p
          className="dashboard__subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <CountUp value={totalVisited} /> of {totalLocations} locations chased
        </Motion.p>

        <Motion.div
          className="dashboard__ring-wrap"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg className="dashboard__ring" viewBox="0 0 120 120">
            <circle
              className="dashboard__ring-track"
              cx="60" cy="60" r={RING_RADIUS}
              fill="none" strokeWidth="8"
            />
            <Motion.circle
              className="dashboard__ring-fill"
              cx="60" cy="60" r={RING_RADIUS}
              fill="none" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              transform="rotate(-90 60 60)"
              initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <span className="dashboard__ring-label">
            <CountUp value={pct} duration={1.4} /><span className="dashboard__ring-pct">%</span>
          </span>
        </Motion.div>
      </header>

      {/* Chains */}
      <section className="dashboard__section">
        <Motion.h2 className="dashboard__section-title" {...sectionReveal}>
          Pick a chain
        </Motion.h2>
        <div className="dashboard__grid">
          {chains.map((chain, i) => (
            <ChainCard key={chain.slug} chain={chain} index={i} />
          ))}
        </div>
        {chains.length === 0 && (
          <div className="dashboard__empty">
            No chains available yet. Check back soon!
          </div>
        )}
      </section>

      {/* Trophies */}
      <section className="dashboard__section dashboard__section--trophies">
        <Motion.div className="dashboard__section-header" {...sectionReveal}>
          <h2 className="dashboard__section-title">Trophies</h2>
          <span className="dashboard__section-count">{earnedCount}/{ALL_BADGES.length}</span>
        </Motion.div>
        <div className="dashboard__badge-row">
          {ALL_BADGES.map((badgeDef, i) => {
            const earned = earnedIds.has(badgeDef.id);
            return (
              <Motion.div
                key={badgeDef.id}
                className={`badge ${!earned ? 'badge--locked' : ''}`}
                title={badgeDef.description}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="badge__medallion">
                  <span className="badge__icon">{TROPHY_ICONS[badgeDef.id]}</span>
                </div>
                <span className="badge__name">{badgeDef.name}</span>
              </Motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
