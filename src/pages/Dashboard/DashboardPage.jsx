import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import ChainCard from './ChainCard';
import './DashboardPage.css';

export default function DashboardPage() {
  const apiFetch = useApi();
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/chains');
        setChains(data.chains);
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

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Your Chains</h1>
        <p className="dashboard__subtitle">Pick a chain and start chasing</p>
      </div>

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
