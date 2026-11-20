// The ONLY file that knows about URLs and fetch. Components call these functions.
const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status = 0, code = 'UNKNOWN') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running on port 4000.");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body: handled below */
  }
  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status}).`, res.status, data?.error?.code);
  }
  return data;
}

export const getFeed = async () => (await request('/feed')).profiles;
export const getMatches = async () => (await request('/matches')).matches;
export const postSwipe = (profileId, action) =>
  request('/swipe', { method: 'POST', body: JSON.stringify({ profileId, action }) });
export const resetDemo = () => request('/dev/reset', { method: 'POST' });
