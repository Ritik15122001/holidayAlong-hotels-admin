/**
 * Free geography lookup (countriesnow.space — no key, no signup).
 * Used to populate the city master so admins pick real places
 * instead of typing them by hand. Results are cached per session.
 */
const BASE = 'https://countriesnow.space/api/v0.1/countries';
const cache = new Map();

async function get(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach the location directory');
  const json = await res.json();
  cache.set(url, json);
  return json;
}

export async function fetchStates(country = 'India') {
  const j = await get(`${BASE}/states/q?country=${encodeURIComponent(country)}`);
  return (j?.data?.states || []).map((s) => s.name);
}

export async function fetchCities(state, country = 'India') {
  if (!state) return [];
  const j = await get(`${BASE}/state/cities/q?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`);
  return j?.data || [];
}
