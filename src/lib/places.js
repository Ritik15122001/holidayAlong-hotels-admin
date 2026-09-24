/**
 * Free place lookup via OpenStreetMap's Nominatim — no key required.
 * Used to suggest real areas and landmarks when adding a location.
 * Nominatim asks for a identifying User-Agent and light usage, so calls
 * are debounced by the Autocomplete component and cached here.
 */
const cache = new Map();

export async function searchPlaces(query, city = '') {
  const q = [query, city].filter(Boolean).join(', ');
  if (cache.has(q)) return cache.get(q);
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const rows = await res.json();
  // keep the leading place name, drop the long administrative tail
  const names = [...new Set(rows.map((r) => String(r.display_name).split(',')[0].trim()).filter(Boolean))];
  cache.set(q, names);
  return names;
}
