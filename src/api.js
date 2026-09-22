const BASE = '/api';
export const TOKEN_KEY = 'aurelia_admin_token';

export async function req(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.reload(); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const A = '/admin';
export const api = {
  login: (body) => req(`${A}/login`, { method: 'POST', body }),
  stats: () => req(`${A}/stats`),
  hotels: (p) => req(`${A}/hotels?` + new URLSearchParams(p)),
  createHotel: (b) => req(`${A}/hotels`, { method: 'POST', body: b }),
  updateHotel: (id, b) => req(`${A}/hotels/${id}`, { method: 'PUT', body: b }),
  deleteHotel: (id) => req(`${A}/hotels/${id}`, { method: 'DELETE' }),
  hotelPrices: (id) => req(`${A}/hotels/${id}/prices`),
  createPrice: (id, b) => req(`${A}/hotels/${id}/prices`, { method: 'POST', body: b }),
  updatePrice: (id, b) => req(`${A}/prices/${id}`, { method: 'PUT', body: b }),
  deletePrice: (id) => req(`${A}/prices/${id}`, { method: 'DELETE' }),
  list: (res) => req(`${A}/${res}`),
  create: (res, b) => req(`${A}/${res}`, { method: 'POST', body: b }),
  update: (res, id, b) => req(`${A}/${res}/${id}`, { method: 'PUT', body: b }),
  remove: (res, id) => req(`${A}/${res}/${id}`, { method: 'DELETE' }),
  leads: (p) => req(`${A}/leads?` + new URLSearchParams(p)),
  leadStatus: (id, status) => req(`${A}/leads/${id}/status`, { method: 'PUT', body: { status } }),
  deleteLead: (id) => req(`${A}/leads/${id}`, { method: 'DELETE' }),
  users: (p) => req(`${A}/users?` + new URLSearchParams(p)),
  userStatus: (id, status) => req(`${A}/users/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteUser: (id) => req(`${A}/users/${id}`, { method: 'DELETE' }),
};

export const money = (n, c = 'INR') => (n == null ? '—' : ({ INR: '₹', AED: 'AED ', USD: '$' }[c] || '') + Number(n).toLocaleString('en-IN'));
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
