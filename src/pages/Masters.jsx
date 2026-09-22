import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BedDouble, Utensils } from 'lucide-react';
import { api } from '../api';
import { Modal, Field, Empty, StatusBadge, Spinner, confirmDelete } from '../components/ui.jsx';
import { useMasters } from '../store/useAdmin';

const CONFIG = {
  'room-types': { label: 'Room type', title: 'Room types', icon: BedDouble, hasCode: false, hint: 'e.g. Standard, Deluxe, Premium, Suite, Penthouse' },
  'meal-plans': { label: 'Meal plan', title: 'Meal plans', icon: Utensils, hasCode: true, hint: 'e.g. EP (room only), CP (with breakfast), MAP (breakfast + one meal)' },
};

export default function Masters({ kind }) {
  const cfg = CONFIG[kind];
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const reloadStore = useMasters((s) => s.load);

  const load = async () => { setRows(await api.list(kind)); reloadStore(true); };
  useEffect(() => { setRows(null); api.list(kind).then(setRows); }, [kind]);

  const del = async (row) => {
    if (!confirmDelete(`“${row.code || row.name}”`)) return;
    await api.remove(kind, row._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{cfg.title}</p>
          <p className="text-[12px] text-slate-500">{cfg.hint}</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={15} /> Add {cfg.label.toLowerCase()}</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={cfg.icon} title={`No ${cfg.title.toLowerCase()} yet`} sub={cfg.hint} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-slate-50"><tr>
                {cfg.hasCode && <th className="th">Code</th>}
                <th className="th">Name</th><th className="th">Description</th><th className="th">Status</th><th className="th" />
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100">
                    {cfg.hasCode && <td className="td"><span className="badge bg-navy-900 text-white">{r.code}</span></td>}
                    <td className="td font-semibold text-slate-900">{r.name}</td>
                    <td className="td whitespace-normal text-slate-600">{r.description || '—'}</td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(r)} className="btn-outline btn-sm"><Pencil size={12} /> Edit</button>
                        <button onClick={() => del(r)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <MasterModal kind={kind} cfg={cfg} row={editing._id ? editing : null} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function MasterModal({ kind, cfg, row, onClose, onSaved }) {
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'Active', ...(row || {}) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const body = { name: form.name, description: form.description, status: form.status };
    if (cfg.hasCode) body.code = form.code.toUpperCase();
    try {
      row?._id ? await api.update(kind, row._id, body) : await api.create(kind, body);
      await onSaved();
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${row ? 'Edit' : 'Add'} ${cfg.label.toLowerCase()}`}
      footer={<>
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button form="master-form" disabled={busy} className="btn-primary">{busy && <Spinner />} Save</button>
      </>}>
      <form id="master-form" onSubmit={save} className="space-y-3.5">
        {cfg.hasCode && <Field label="Code *"><input required className="field uppercase" value={form.code} onChange={set('code')} placeholder="EP" /></Field>}
        <Field label="Name *"><input required className="field" value={form.name} onChange={set('name')} /></Field>
        <Field label="Description"><textarea rows="3" className="field resize-none" value={form.description} onChange={set('description')} /></Field>
        <Field label="Status"><select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select></Field>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
