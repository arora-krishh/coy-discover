import { useEffect, useState } from 'react';

const hueOf = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/**
 * A photo that can never look broken.
 * Layer 1 (always there): gradient + initial. Layer 2: the <img>, which fades in once it
 * has loaded. If the image fails, we remove it and the gradient/initial stays.
 */
export default function ProfilePhoto({ profile, className = '' }) {
  const [state, setState] = useState('loading'); // loading | loaded | failed
  useEffect(() => setState('loading'), [profile.photo]);

  return (
    <div className={`photo ${className}`} style={{ '--hue': hueOf(profile.id) }}>
      <span className="photo-fallback" aria-hidden="true">{profile.name.charAt(0)}</span>
      {state !== 'failed' && (
        <img
          src={profile.photo}
          alt={`${profile.name}'s photo`}
          draggable={false}
          className={state === 'loaded' ? 'is-loaded' : ''}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}
