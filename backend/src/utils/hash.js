// FNV-1a: tiny, deterministic string hash. Used for two things:
//  1. a stable "shuffled" feed order (so order never hints at who liked you)
//  2. deterministic placeholder avatars
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
