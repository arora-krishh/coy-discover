import { useCallback, useEffect, useState } from 'react';
import { getMatches } from '../api.js';
import ProfilePhoto from './ProfilePhoto.jsx';
import { EmptyState, ErrorState } from './States.jsx';

function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function MatchesView({ onCount, onGoSwipe }) {
  const [status, setStatus] = useState('loading');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await getMatches(); // always from the server, so reloads show saved matches
      setMatches(list);
      onCount(list.length);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [onCount]);

  useEffect(() => { load(); }, [load]);

  if (status === 'loading') {
    return <ul className="match-list" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="match-row skeleton-row" />)}</ul>;
  }
  if (status === 'error') return <ErrorState message={error} onRetry={load} />;
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        action={<button type="button" className="btn btn-primary" onClick={onGoSwipe}>Start swiping</button>}
      >
        A match only appears when you both like each other.
      </EmptyState>
    );
  }
  return (
    <ul className="match-list">
      {matches.map((m) => (
        <li key={m.id} className="match-row">
          <ProfilePhoto profile={m} className="match-avatar" />
          <div className="match-meta">
            <strong>{m.name}, {m.age}</strong>
            <span>{m.place}</span>
          </div>
          <time className="match-time" dateTime={m.matchedAt}>{timeAgo(m.matchedAt)}</time>
        </li>
      ))}
    </ul>
  );
}
