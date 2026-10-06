import { create } from 'zustand';
import { api, TOKEN_KEY } from '../api';

const ME_KEY = 'ha_admin_me';
const savedMe = () => { try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); } catch { return null; } };

export const useAuth = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || '',
  // { name, username, role, areas } — areas is null for a Super Admin
  me: savedMe(),

  login: async (username, password) => {
    const { token, user } = await api.login({ username, password });
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, me: user || null });
    get().refreshMe();
  },

  /** Re-read the profile so a role change takes effect without a new login. */
  refreshMe: async () => {
    try {
      const me = await api.me();
      localStorage.setItem(ME_KEY, JSON.stringify(me));
      set({ me });
    } catch (e) {
      // only an expired or rejected session ends it; a network blip must not
      if (/unauthor/i.test(e.message)) get().logout();
    }
  },

  /** Can this account reach the given area? Super Admin reaches everything. */
  can: (area) => {
    const { me } = get();
    if (!me || me.areas == null) return true;
    return me.areas.includes(area);
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ME_KEY);
    set({ token: '', me: null });
  },
}));

export const useHotels = create((set, get) => ({
  rows: [], total: 0, page: 1, pages: 1, q: '', status: '', loading: false,
  pricesByHotel: {}, expanded: null,
  setQuery: (patch) => set({ ...patch, page: 1 }),
  setPage: (page) => set({ page }),
  fetch: async () => {
    const { q, status, page } = get();
    set({ loading: true });
    try {
      const r = await api.hotels({ q, status, page, limit: 8 });
      set({ rows: r.data, total: r.total, pages: r.pages, loading: false });
    } catch { set({ loading: false }); }
  },
  toggleExpand: async (id) => {
    if (get().expanded === id) return set({ expanded: null });
    set({ expanded: id });
    const prices = await api.hotelPrices(id);
    set((s) => ({ pricesByHotel: { ...s.pricesByHotel, [id]: prices } }));
  },
  reloadPrices: async (id) => {
    const prices = await api.hotelPrices(id);
    set((s) => ({ pricesByHotel: { ...s.pricesByHotel, [id]: prices } }));
    get().fetch();
  },
}));

export const useMasters = create((set, get) => ({
  roomTypes: [], mealPlans: [],
  load: async (force) => {
    if (!force && get().roomTypes.length) return;
    const [roomTypes, mealPlans] = await Promise.all([api.list('room-types'), api.list('meal-plans')]);
    set({ roomTypes, mealPlans });
  },
}));

export const useUsers = create((set, get) => ({
  rows: [], total: 0, page: 1, pages: 1, q: '', status: '', loading: false,
  setQuery: (patch) => set({ ...patch, page: 1 }),
  setPage: (page) => set({ page }),
  fetch: async () => {
    const { q, status, page } = get();
    set({ loading: true });
    try {
      const r = await api.users({ q, status, page, limit: 12 });
      set({ rows: r.data, total: r.total, pages: r.pages, loading: false });
    } catch { set({ loading: false }); }
  },
}));

export const useLeads = create((set, get) => ({
  rows: [], total: 0, page: 1, pages: 1, q: '', status: '', loading: false,
  setQuery: (patch) => set({ ...patch, page: 1 }),
  setPage: (page) => set({ page }),
  fetch: async () => {
    const { q, status, page } = get();
    set({ loading: true });
    try {
      const r = await api.leads({ q, status, page, limit: 12 });
      set({ rows: r.data, total: r.total, pages: r.pages, loading: false });
    } catch { set({ loading: false }); }
  },
}));
