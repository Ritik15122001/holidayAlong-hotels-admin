import { useEffect, useRef, useState } from 'react';
import { Search, Trash2, UserRound, Ban, CheckCircle2, Mail, Phone } from 'lucide-react';
import { api, fmtDate } from '../api';
import { useUsers } from '../store/useAdmin';
import { Pager, Empty, confirmDelete } from '../components/ui.jsx';

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export default function Users() {
  const st = useUsers();
  const { rows, total, page, pages, q, status, loading } = st;
  const [busy, setBusy] = useState('');
  const first = useRef(true);

  useEffect(() => {
    const t = setTimeout(st.fetch, first.current ? 0 : 350);
    first.current = false;
    return () => clearTimeout(t);
  }, [q, status, page]); // eslint-disable-line

  const toggle = async (u) => {
    const next = u.status === 'Active' ? 'Blocked' : 'Active';
    setBusy(u._id);
    try { await api.userStatus(u._id, next); await st.fetch(); } finally { setBusy(''); }
  };

  const del = async (u) => {
    if (!confirmDelete(`the account for ${u.name} (${u.email})`)) return;
    setBusy(u._id);
    try { await api.deleteUser(u._id); await st.fetch(); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field !pl-9" placeholder="Search name, email or phone"
            value={q} onChange={(e) => st.setQuery({ q: e.target.value })} />
        </div>
        <select className="field !w-auto" value={status} onChange={(e) => st.setQuery({ status: e.target.value })}>
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
        <span className="text-[12px] text-slate-500">{total} registered user{total === 1 ? '' : 's'}</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-px">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={UserRound} title="No users found" sub="Guests who sign up on the website appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50"><tr>
                {['User', 'Email', 'Phone', 'Status', 'Registered', 'Last login', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                          {initials(u.name)}
                        </span>
                        <span className="font-semibold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="td">
                      <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-700">
                        <Mail size={13} /> {u.email}
                      </a>
                    </td>
                    <td className="td">
                      {u.phone
                        ? <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-700"><Phone size={13} /> {u.phone}</a>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
                        u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {u.status === 'Active' ? <CheckCircle2 size={12} /> : <Ban size={12} />} {u.status}
                      </span>
                    </td>
                    <td className="td text-slate-600">{fmtDate(u.createdAt)}</td>
                    <td className="td text-slate-600">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : '—'}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => toggle(u)} disabled={busy === u._id}
                          title={u.status === 'Active' ? 'Block this user' : 'Unblock this user'}
                          className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 ${
                            u.status === 'Active'
                              ? 'border-slate-200 text-slate-700 hover:border-red-200 hover:text-red-700'
                              : 'border-slate-200 text-emerald-700 hover:border-emerald-200'}`}>
                          {u.status === 'Active' ? 'Block' : 'Unblock'}
                        </button>
                        <button onClick={() => del(u)} disabled={busy === u._id} title="Delete user"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pager page={page} pages={pages} onChange={st.setPage} />
    </div>
  );
}
