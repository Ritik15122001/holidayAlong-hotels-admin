import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { api, fmtDate } from '../api';
import { Drawer, Field, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';
import { useAuth } from '../store/useAdmin';

/** Kept in step with EDITOR_AREAS on the server. */
const EDITOR_CAN = [
  'Hotels', 'Cities', 'Locations', 'Amenities', 'Room Types',
  'Meal Plans', 'Vendors', 'Packages', 'Bookings', 'Expenses & P&L',
];
const EDITOR_CANNOT = ['Formats', 'Users', 'Important documents', 'Staff & roles'];

const BLANK = { name: '', username: '', password: '', role: 'Editor', status: 'Active' };

export default function Staff() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const me = useAuth((s) => s.me);

  const load = useCallback(async () => {
    setRows(await api.staff().catch(() => []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (u) => {
    if (!confirmDelete(`the ${u.role.toLowerCase()} account “${u.name}”`)) return;
    await api.deleteStaff(u._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Access</p>
          <h1 className="mt-1 text-[24px] font-extrabold text-slate-900">Staff &amp; roles</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-slate-500">
            Logins for this admin panel. A Super Admin reaches everything; an Editor is limited to the areas below.
          </p>
        </div>
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Plus size={15} /> Add staff</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900"><ShieldCheck size={15} className="text-brand-600" /> Super Admin</p>
          <p className="mt-1.5 text-[13px] text-slate-600">Full access, including staff accounts, customer users, formats and the document library.</p>
        </div>
        <div className="card p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900"><UserCog size={15} className="text-brand-600" /> Editor</p>
          <p className="mt-1.5 text-[13px] text-slate-600">{EDITOR_CAN.join(', ')}.</p>
          <p className="mt-1.5 text-[12px] text-slate-500">No access to {EDITOR_CANNOT.join(', ')}.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={ShieldCheck} title="No staff accounts yet"
            sub="Add an Editor so your team can manage hotels, rates and bookings without full access." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50"><tr>
                {['Name', 'Username', 'Role', 'Status', 'Last signed in', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td font-semibold text-slate-900">{u.name}</td>
                    <td className="td text-slate-600">{u.username}</td>
                    <td className="td">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                        u.role === 'Super Admin' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                    </td>
                    <td className="td"><StatusBadge status={u.status} /></td>
                    <td className="td text-slate-600">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing({ ...u, password: '' })} title="Edit"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                        <button onClick={() => del(u)} title="Delete" disabled={u.username === me?.username}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-40"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[12.5px] text-slate-500">
        The account in the server environment stays a Super Admin and is not listed here — it is the way back in if a
        staff password is lost.
      </p>

      {editing && <StaffForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function StaffForm({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isNew = !form._id;

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.username.trim()) return setError('Username is required.');
    if (isNew && (form.password || '').length < 6) return setError('Password must be at least 6 characters.');
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (isNew) await api.createStaff(body);
      else await api.updateStaff(form._id, body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open onClose={onClose} title={isNew ? 'Add staff' : 'Edit staff'}
      subtitle="They sign in to this panel with the username and password you set here."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }>
      <form onSubmit={save} className="space-y-3.5">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>}
        <Field label="Full name"><input className="field" value={form.name} onChange={set('name')} placeholder="Who this login belongs to" /></Field>
        <Field label="Username"><input className="field" value={form.username} onChange={set('username')} placeholder="e.g. priya" autoCapitalize="none" /></Field>
        <Field label={isNew ? 'Password' : 'New password'}>
          <input type="password" className="field" value={form.password || ''} onChange={set('password')}
            placeholder={isNew ? 'At least 6 characters' : 'Leave blank to keep the current one'} autoComplete="new-password" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select className="field" value={form.role} onChange={set('role')}><option>Editor</option><option>Super Admin</option></select>
          </Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
        </div>
        {form.role === 'Editor' && (
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[12.5px] text-slate-600">
            An Editor can manage {EDITOR_CAN.join(', ')} — and nothing else.
          </p>
        )}
      </form>
    </Drawer>
  );
}
