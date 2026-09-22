import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Tags, Inbox, ArrowRight, UserRound } from 'lucide-react';
import { api, fmtDate } from '../api';
import { Empty } from '../components/ui.jsx';

export default function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.stats().then(setS).catch(() => {}); }, []);

  const cards = [
    { label: 'Total hotels', value: s?.totalHotels, icon: Building2, tone: 'bg-brand-600 text-white' },
    { label: 'Active hotels', value: s?.activeHotels, icon: CheckCircle2, tone: 'bg-emerald-600 text-white' },
    { label: 'Active price records', value: s?.activePrices, icon: Tags, tone: 'bg-accent-500 text-white' },
    { label: 'New enquiries', value: s?.newLeads, icon: Inbox, tone: 'bg-slate-800 text-white' },
    { label: 'Registered users', value: s?.totalUsers, icon: UserRound, tone: 'bg-navy-900 text-white' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card flex items-center gap-3.5 p-4">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
            <div>
              <p className="text-[12px] text-slate-500">{label}</p>
              <p className="text-2xl font-bold leading-tight text-slate-900">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Recent enquiries</h2>
          <Link to="/leads" className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700 hover:underline">View all <ArrowRight size={13} /></Link>
        </div>
        {s && !s.recentLeads?.length ? (
          <Empty icon={Inbox} title="No enquiries yet" sub="Leads submitted from the website will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50"><tr>
                {['Name', 'Phone', 'Hotel', 'Stay', 'Room / Meal', 'Status', 'Received'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {(s?.recentLeads || []).map((l) => (
                  <tr key={l._id} className="border-t border-slate-100">
                    <td className="td font-semibold text-slate-900">{l.name}</td>
                    <td className="td">{l.phone}</td>
                    <td className="td">{l.hotelName || '—'}</td>
                    <td className="td">{fmtDate(l.checkIn)} → {fmtDate(l.checkOut)}</td>
                    <td className="td">{[l.roomType, l.mealPlan].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="td"><LeadBadge status={l.status} /></td>
                    <td className="td text-slate-500">{fmtDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Newest users</h2>
          <Link to="/users" className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700 hover:underline">Manage users <ArrowRight size={13} /></Link>
        </div>
        {s && !s.recentUsers?.length ? (
          <Empty icon={UserRound} title="No registered users yet" sub="Guests who sign up on the website appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="bg-slate-50"><tr>
                {['Name', 'Email', 'Phone', 'Status', 'Registered'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {(s?.recentUsers || []).map((u) => (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="td font-semibold text-slate-900">{u.name}</td>
                    <td className="td text-slate-600">{u.email}</td>
                    <td className="td text-slate-600">{u.phone || '—'}</td>
                    <td className="td">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{u.status}</span>
                    </td>
                    <td className="td text-slate-600">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
</div>
  );
}

export const LeadBadge = ({ status }) => (
  <span className={`badge ${{ New: 'bg-blue-50 text-blue-700', Contacted: 'bg-amber-50 text-amber-700', Closed: 'bg-slate-100 text-slate-500' }[status]}`}>{status}</span>
);
