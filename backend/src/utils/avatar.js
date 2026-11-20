import { hash } from './hash.js';

const PALETTES = [
  ['#F0506E', '#FFB199'],
  ['#5B3E96', '#C9A7F5'],
  ['#1F7A8C', '#A8E6CF'],
  ['#E76F51', '#F4D58D'],
  ['#3A2E6B', '#F08BB4'],
  ['#2D6A4F', '#B7E4C7'],
  ['#9D4EDD', '#FFC8DD'],
  ['#264653', '#F4A261'],
];

const escapeXml = (s) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

// Placeholder "photo": generated locally, so it can never 404 or hotlink-fail.
export function avatarSvg(profile) {
  const h = hash(profile.id);
  const [a, b] = PALETTES[h % PALETTES.length];
  const initial = escapeXml(profile.name.charAt(0).toUpperCase());
  const circle = (n, fill, op) => {
    const x = (hash(profile.id + 'x' + n) % 500) + 50;
    const y = (hash(profile.id + 'y' + n) % 700) + 50;
    const r = (hash(profile.id + 'r' + n) % 160) + 120;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${op}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="600" height="800" fill="url(#g)"/>
${circle(1, '#ffffff', 0.18)}${circle(2, '#000000', 0.12)}${circle(3, '#ffffff', 0.12)}
<text x="300" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="320" fill="#ffffff" fill-opacity="0.9">${initial}</text>
</svg>`;
}
