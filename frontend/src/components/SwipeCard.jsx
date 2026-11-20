import { useEffect, useRef, useState } from 'react';
import ProfilePhoto from './ProfilePhoto.jsx';
import { PinIcon } from './Icons.jsx';

const THRESHOLD = 110; // px of horizontal drag that counts as a decision
const clamp = (n) => Math.max(0, Math.min(1, n));

/**
 * One profile card. Owns ONLY the drag gesture; the parent decides what a decision means.
 *  - isTop:   is this the card on top of the stack?
 *  - exiting: null | 'like' | 'pass'  (set by the parent; makes the card fly away)
 *  - onDecide('like'|'pass'): called when a drag passes the threshold
 */
export default function SwipeCard({ profile, isTop, exiting, onDecide }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const dragRef = useRef({ x: 0, y: 0 });
  const startRef = useRef(null);

  // If the parent cancels an exit (e.g. the request failed), snap back to the middle.
  useEffect(() => {
    if (!exiting) {
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0, active: false });
    }
  }, [exiting]);

  function handleDown(e) {
    if (!isTop || exiting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  }
  function handleMove(e) {
    if (!startRef.current) return;
    const next = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
    dragRef.current = next;
    setDrag({ ...next, active: true });
  }
  function handleUp() {
    if (!startRef.current) return;
    startRef.current = null;
    const { x } = dragRef.current;
    if (Math.abs(x) >= THRESHOLD) {
      setDrag((d) => ({ ...d, active: false }));
      onDecide(x > 0 ? 'like' : 'pass');
    } else {
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0, active: false }); // spring back
    }
  }

  const dir = exiting === 'like' ? 1 : exiting === 'pass' ? -1 : 0;
  let transform;
  let transition;
  if (dir) {
    transform = `translate(${dir * 140}%, ${drag.y * 0.2 - 30}px) rotate(${dir * 22}deg)`;
    transition = 'transform 320ms cubic-bezier(.5,0,.9,.6), opacity 320ms ease-in';
  } else if (drag.active) {
    transform = `translate(${drag.x}px, ${drag.y * 0.25}px) rotate(${drag.x * 0.05}deg)`;
    transition = 'none';
  } else if (isTop) {
    transform = 'none';
    transition = 'transform 300ms cubic-bezier(.2,.8,.2,1)';
  } else {
    transform = 'scale(0.94) translateY(18px)';
    transition = 'transform 300ms cubic-bezier(.2,.8,.2,1)';
  }

  const likeAmount = dir === 1 ? 1 : clamp(drag.x / THRESHOLD);
  const passAmount = dir === -1 ? 1 : clamp(-drag.x / THRESHOLD);

  return (
    <article
      className={`card ${isTop ? 'is-top' : ''}`}
      style={{ transform, transition, opacity: dir ? 0 : 1 }}
      aria-label={`${profile.name}, ${profile.age}`}
      aria-hidden={isTop ? undefined : true}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <ProfilePhoto profile={profile} className="card-photo" />
      <div className="tint tint-like" style={{ opacity: likeAmount * 0.5 }} />
      <div className="tint tint-pass" style={{ opacity: passAmount * 0.5 }} />
      <span className="stamp stamp-like" style={{ opacity: likeAmount }}>Like</span>
      <span className="stamp stamp-pass" style={{ opacity: passAmount }}>Pass</span>

      <div className="card-info">
        <h2 className="card-name">
          {profile.name} <span className="card-age">{profile.age}</span>
        </h2>
        <p className="card-place"><PinIcon /> {profile.place}</p>
        <p className="card-bio">{profile.bio}</p>
        <ul className="chips">
          {profile.interests.map((i) => <li key={i}>{i}</li>)}
        </ul>
      </div>
    </article>
  );
}
