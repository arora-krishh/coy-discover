import { useEffect } from 'react';
import ProfilePhoto from './ProfilePhoto.jsx';

export default function MatchOverlay({ profile, onKeepSwiping, onViewMatches }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onKeepSwiping();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKeepSwiping]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="match-title">
      <div className="match">
        <h2 id="match-title" className="match-title">It's a match!</h2>
        <p className="match-sub">You and {profile.name} liked each other.</p>
        <div className="match-photos">
          <div className="match-you" aria-hidden="true">You</div>
          <ProfilePhoto profile={profile} className="match-them" />
        </div>
        <button type="button" className="btn btn-primary" onClick={onViewMatches} autoFocus>See matches</button>
        <button type="button" className="btn btn-ghost" onClick={onKeepSwiping}>Keep swiping</button>
      </div>
    </div>
  );
}
