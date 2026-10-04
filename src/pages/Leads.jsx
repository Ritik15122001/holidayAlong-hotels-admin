import { useEffect, useRef, useState } from 'react';
import { Search, Eye, Trash2, Inbox, UserRound } from 'lucide-react';
import { api, fmtDate } from '../api';
import { useLeads } from '../store/useAdmin';
import { Modal, Pager, Empty, confirmDelete } from '../components/ui.jsx';
import { LeadBadge } from './Dashboard.jsx';

const STATUSES = ['New', 'Contacted', 'Closed'];

const nights = (l) => {
  const n = Math.round((new Date(l.checkOut) - new Date(l.checkIn)) / 864e5);
  return Number.isFinite(n) && n > 0 ? `${n} night${n > 1 ? 's' : ''}` : '—';
};

export default function Leads() {
  const st = useLeads();
  const { rows, total, page, pages, q, status, loading } = st;
  const [view, setView] = useState(null);
  const first = useRef(true);

  useEffect(() => {
    const t = setTimeout(st.fetch, first.current ? 0 : 350);
    first.current = false;
    return () => clearTimeout(t);
  }, [q, status, page]); // eslint-disable-line

  const change = async (lead, next) => { await api.leadStatus(lead._id, next); st.fetch(); setView((v) => (v ? { ...v, status: next } : v)); };
  const del = async (lead) => { if (!confirmDelete(`the enquiry from ${lead.name}`)) return; await api.deleteLead(lead._id); st.fetch(); };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field !pl-9" placeholder="Search guest, account, phone or hotel" value={q} onChange={(e) => st.setQuery({ q: e.target.value })} />
        </div>
        <select className="field !w-auto" value={status} onChange={(e) => st.setQuery({ status: e.target.value })}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-[12px] text-slate-500">{total} booking request{total === 1 ? '' : 's'}</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-px">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={Inbox} title="No booking requests found" sub="Bookings made on the website appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-50"><tr>
                {['Guest', 'Submitted by', 'Phone', 'Hotel', 'Check-in', 'Check-out', 'Room / Meal', 'Status', 'Created', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td">
                      <p className="font-semibold text-slate-900">{l.name}</p>
                      <p className="text-[11.5px] text-slate-500">{l.email}</p>
                    </td>
                    <td className="td">
                      {l.userName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[11.5px] font-bold text-brand-700">
                          <UserRound size={11} /> {l.userName}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="td">{l.phone}</td>
                    <td className="td">{l.hotelName || l.hotelId?.name || '—'}</td>
                    <td className="td">{fmtDate(l.checkIn)}</td>
                    <td className="td">{fmtDate(l.checkOut)}</td>
                    <td className="td">{[l.roomType, l.mealPlan].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="td">
                      <select value={l.status} onChange={(e) => change(l, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] font-semibold text-slate-700 outline-none focus:border-navy-600">
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="td text-slate-500">{fmtDate(l.createdAt)}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setView(l)} className="btn-outline btn-sm"><Eye size={12} /> View</button>
                        <button onClick={() => del(l)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} onChange={st.setPage} />
      </div>

      {view && (
        <Modal open onClose={() => setView(null)} title="Booking request" width="max-w-xl"
          footer={<>
            <select value={view.status} onChange={(e) => change(view, e.target.value)} className="field !w-auto">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => setView(null)} className="btn-primary">Close</button>
          </>}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-slate-900">{view.name}</p>
              <LeadBadge status={view.status} />
            </div>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-[13px] sm:grid-cols-2">
              {[
                ['Guest Name', view.name],
                ['Hotel Name', view.hotelName || view.hotelId?.name || '—'],
                ['First check-in', fmtDate(view.checkIn)], ['First check-out', fmtDate(view.checkOut)],
                ['Re-check-in', view.reCheckIn ? fmtDate(view.reCheckIn) : '—'],
                ['Re-check-out', view.reCheckOut ? fmtDate(view.reCheckOut) : '—'],
                ['Total No. of Nights', view.nights ?? nights(view)],
                ['No. of Adults (12+ Years)', view.adults],
                ['No. of Rooms', view.rooms],
                ['No. Of Extra Beds', view.extraBeds ?? 0],
                ['No. of Child with Bed', view.childWithBed ?? 0],
                ['No. of Child without Bed', view.childNoBedAges || view.childNoBed || 0],
                ['Room Type', view.roomType || '—'], ['Meal Plan', view.mealPlan || '—'],
                ['Extra Inclusions', view.extraInclusions || '—'],
                ['Total Amount Payable To You', view.totalAmount || '—'],
                ['Submitted by', view.userName], ['Account email', view.userEmail],
                ['Received', fmtDate(view.createdAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="font-medium text-slate-800">{v === 0 || v ? v : '—'}</dd>
                </div>
              ))}
            </dl>
            <div className={`rounded-lg p-3 text-[12.5px] ${
              view.mailedAt ? 'bg-emerald-50 text-emerald-800'
                : view.mailError === 'smtp_not_configured' ? 'bg-slate-50 text-slate-600'
                : 'bg-amber-50 text-amber-800'}`}>
              <p className="text-[11px] uppercase tracking-wide opacity-70">Mail to hotel</p>
              <p className="mt-0.5 font-semibold">
                {view.mailedAt
                  ? `Sent to ${view.mailedTo} on ${fmtDate(view.mailedAt)}`
                  : view.mailError === 'smtp_not_configured' ? 'Not sent — no mail server configured'
                  : view.mailError === 'hotel_has_no_email' ? 'Not sent — this hotel has no email address saved'
                  : view.mailError ? `Not sent — ${view.mailError}`
                  : 'Not sent'}
              </p>
            </div>

            {view.message && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Special requests</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{view.message}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
