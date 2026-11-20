import { useCallback, useEffect, useRef, useState } from 'react';
import { getFeed, postSwipe, resetDemo, getMatches } from '../api.js';
import SwipeCard from './SwipeCard.jsx';
import MatchOverlay from './MatchOverlay.jsx';
import MatchesView from './MatchesView.jsx';
import { CardSkeleton, EmptyState, ErrorState } from './States.jsx';
import { CloseIcon, HeartIcon } from './Icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const EXIT_MS = 320; // keep in sync with the card's exit transition
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Discover({ theme = 'light', onToggleTheme }) {
  const [view, setView] = useState('swipe'); // 'swipe' | 'matches'
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [feed, setFeed] = useState([]);
  const [exiting, setExiting] = useState(null); // { id, action } while the top card flies away
  const [matched, setMatched] = useState(null); // profile shown in "It's a match!"
  const [matchCount, setMatchCount] = useState(0);
  const [toast, setToast] = useState('');
  const busy = useRef(false);

  const loadFeed = useCallback(async () => {
    setStatus('loading');
    try {
      setFeed(await getFeed());
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadFeed();
    getMatches().then((m) => setMatchCount(m.length)).catch(() => {});
  }, [loadFeed]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const top = feed[0];

  async function decide(action) {
    if (busy.current || !top || matched) return;
    busy.current = true;
    const profile = top;
    setExiting({ id: profile.id, action });
    try {
      // Run the request and the animation together; continue when both are done.
      const [result] = await Promise.all([postSwipe(profile.id, action), wait(EXIT_MS)]);
      setFeed((f) => f.filter((p) => p.id !== profile.id));
      setExiting(null);
      if (result.match) {
        setMatched(result.profile);
        setMatchCount((n) => n + 1);
      }
    } catch (err) {
      await wait(EXIT_MS);
      if (err.status === 409 || err.status === 404) {
        // Server says this swipe already happened / profile is gone: just drop the card.
        setFeed((f) => f.filter((p) => p.id !== profile.id));
      } else {
        setToast(err.message);
      }
      setExiting(null); // card snaps back if it is still in the feed
    } finally {
      busy.current = false;
    }
  }

  // Desktop: arrow keys swipe too.
  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'swipe' || matched) return;
      if (e.key === 'ArrowRight') decide('like');
      if (e.key === 'ArrowLeft') decide('pass');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function handleReset() {
    try {
      await resetDemo();
      setMatchCount(0);
      await loadFeed();
    } catch (err) {
      setToast(err.message);
    }
  }

  function renderSwipe() {
    if (status === 'loading') return <CardSkeleton />;
    if (status === 'error') return <ErrorState message={error} onRetry={loadFeed} />;
    if (feed.length === 0) {
      return (
        <EmptyState
          title="You're all caught up"
          action={
            <>
              <button type="button" className="btn btn-primary" onClick={() => setView('matches')}>View matches</button>
              {import.meta.env.DEV && (
                <button type="button" className="btn btn-ghost" onClick={handleReset}>Reset demo data</button>
              )}
            </>
          }
        >
          You've swiped on everyone for now. New people will show up here.
        </EmptyState>
      );
    }
    const visible = feed.slice(0, 2);
    return (
      <>
        <div className="deck">
          {/* Render the next card first so the top card sits above it. */}
          {[...visible].reverse().map((p) => (
            <SwipeCard
              key={p.id}
              profile={p}
              isTop={p.id === top.id}
              exiting={exiting && exiting.id === p.id ? exiting.action : null}
              onDecide={decide}
            />
          ))}
        </div>
        <div className="actions">
          <button type="button" className="action action-pass" aria-label="Pass" onClick={() => decide('pass')} disabled={!!exiting}>
            <CloseIcon />
          </button>
          <button type="button" className="action action-like" aria-label="Like" onClick={() => decide('like')} disabled={!!exiting}>
            <HeartIcon />
          </button>
        </div>
      </>
    );
  }

  return (
    <main className="discover">
      <header className="topbar">
        <h1>Discover</h1>
        <div className="topbar-right">
          <div className="segmented" role="tablist" aria-label="Discover views">
            <button type="button" role="tab" aria-selected={view === 'swipe'} className={view === 'swipe' ? 'is-active' : ''} onClick={() => setView('swipe')}>
              Swipe
            </button>
            <button type="button" role="tab" aria-selected={view === 'matches'} className={view === 'matches' ? 'is-active' : ''} onClick={() => setView('matches')}>
              Matches{matchCount > 0 && <span className="badge">{matchCount}</span>}
            </button>
          </div>
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
      </header>

      {toast && <div className="toast" role="alert">{toast}</div>}

      <section className="content">
        {view === 'swipe' ? renderSwipe() : <MatchesView onCount={setMatchCount} onGoSwipe={() => setView('swipe')} />}
      </section>

      {matched && (
        <MatchOverlay
          profile={matched}
          onKeepSwiping={() => setMatched(null)}
          onViewMatches={() => { setMatched(null); setView('matches'); }}
        />
      )}
    </main>
  );
}
