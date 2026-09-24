import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, ConciergeBell } from 'lucide-react';
import { api } from '../api';
import { Modal, Field, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';
import { ICON_NAMES, iconFor } from '../lib/icons.js';

const BLANK = { name: '', icon: 'ConciergeBell', sortOrder: 0, status: 'Active' };

export default function Amenities() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => api.list('amenities').then(setRows);
  useEffect(() => { load(); }, []);

  const del = async (row) => {
    if (!confirmDelete(`“${row.name}”`)) return;
    await api.remove('amenities', row._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Amenities</p>
          <p className="text-[12px] text-slate-500">The list hotels pick from, and what the website shows</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={15} /> Add amenity</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={ConciergeBell} title="No amenities yet" sub="Add the facilities your hotels offer." />
        ) : (
          <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((a) => {
              const Icon = iconFor(a.icon);
              return (
                <div key={a._id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-slate-900">{a.name}</p>
                    <p className="text-[11px] text-slate-400">{a.icon} · order {a.sortOrder}</p>
                  </div>
                  <StatusBadge status={a.status} />
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(a)} title="Edit" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={14} /></button>
                    <button onClick={() => del(a)} title="Delete" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && <AmenityForm row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AmenityForm({ row, onClose, onSaved }) {
  const editing = Boolean(row._id);
  const [form, setForm] = useState({ ...BLANK, ...row });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = { name: form.name.trim(), icon: form.icon, sortOrder: Number(form.sortOrder) || 0, status: form.status };
      if (!body.name) throw new Error('Name is required');
      if (editing) await api.update('amenities', row._id, body);
      else await api.create('amenities', body);
      onSaved();
    } catch (e) {
      setError(/duplicate/i.test(e.message) ? 'That amenity already exists' : e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${editing ? 'Edit' : 'Add'} amenity`} width="max-w-lg"
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} Save
        </button>
      </>}>
      <div className="space-y-3.5">
        <Field label="Name *">
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rooftop Pool" />
        </Field>
        <Field label="Icon">
          <div className="grid max-h-48 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {ICON_NAMES.map((n) => {
              const Icon = iconFor(n);
              return (
                <button key={n} type="button" title={n} onClick={() => setForm({ ...form, icon: n })}
                  className={`grid h-9 place-items-center rounded-lg border transition ${
                    form.icon === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}>
                  <Icon size={17} />
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><input type="number" className="field" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></select>
          </Field>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
