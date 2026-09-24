import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, BedDouble, Utensils, MessageSquare, Users, LogOut, Menu, X, MapPin, Map, Briefcase, FileText, ScrollText, ConciergeBell } from 'lucide-react';
import { Wordmark } from './Logo.jsx';
import { useAuth } from '../store/useAdmin';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hotels', label: 'Hotels', icon: Building2 },
  { to: '/cities', label: 'Cities', icon: Map },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/amenities', label: 'Amenities', icon: ConciergeBell },
  { to: '/room-types', label: 'Room Types', icon: BedDouble },
  { to: '/meal-plans', label: 'Meal Plans', icon: Utensils },
  { to: '/vendors', label: 'Vendors', icon: Briefcase },
  { to: '/brochures', label: 'Packages', icon: FileText },
  { to: '/formats', label: 'Formats', icon: ScrollText },
  { to: '/leads', label: 'Bookings', icon: MessageSquare },
  { to: '/users', label: 'Users', icon: Users },
];

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.htlr.holidayalong.com/';

export default function Shell() {
  const [open, setOpen] = useState(false);
  const logout = useAuth((s) => s.logout);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const SidebarBody = (
    <>
      <div className="px-5 py-5">
        <Wordmark />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="mx-3 mb-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
        <LogOut size={17} /> Sign out
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">{SidebarBody}</aside>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <aside className="flex w-64 flex-col bg-white">{SidebarBody}</aside>
          <div className="flex-1 bg-slate-900/40" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
          <h1 className="text-sm font-bold text-slate-900">{nav.find((n) => n.to === pathname)?.label || 'Admin'}</h1>
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="ml-auto text-[12px] font-semibold text-navy-700 hover:underline">View website ↗</a>
        </header>
        <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
