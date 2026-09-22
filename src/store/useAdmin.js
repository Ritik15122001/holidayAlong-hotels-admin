import { create } from 'zustand';
import { api, TOKEN_KEY } from '../api';

export const useAuth = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY) || '',
  login: async (username, password) => {
    const { token } = await api.login({ username, password });
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },
  logout: () => { localStorage.removeItem(TOKEN_KEY); set({ token: '' }); },
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
