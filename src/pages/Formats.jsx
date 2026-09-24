import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import { api } from '../api';
import { Drawer, Field, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';

const GROUPS = ['Calls', 'Quotes', 'Follow-ups', 'Vendors', 'WhatsApp', 'Payments', 'General'];
const BLANK = { title: '', group: 'General', body: '', sortOrder: 0, status: 'Active' };

export default function Formats() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => api.list('formats').then(setRows);
  useEffect(() => { load(); }, []);

  const del = async (row) => {
    if (!confirmDelete(`“${row.title}”`)) return;
    await api.remove('formats', row._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Formats &amp; scripts</p>
          <p className="text-[12px] text-slate-500">Call scripts and message templates shown on the website</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={15} /> Add format</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={FileText} title="No formats yet" sub="Add a call script or message template and it appears on the website." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50"><tr>
                {['Order', 'Title', 'Group', 'Preview', 'Status', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td text-slate-500">{f.sortOrder}</td>
                    <td className="td font-semibold text-slate-900">{f.title}</td>
                    <td className="td"><span className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">{f.group}</span></td>
                    <td className="td max-w-[280px] truncate text-slate-500">{f.body.split('\n')[0]}</td>
                    <td className="td"><StatusBadge status={f.status} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(f)} title="Edit" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                        <button onClick={() => del(f)} title="Delete" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <FormatForm row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function FormatForm({ row, onClose, onSaved }) {
  const editing = Boolean(row._id);
  const [form, setForm] = useState({ ...BLANK, ...row });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = {
        title: form.title.trim(), group: form.group.trim() || 'General',
        body: form.body, sortOrder: Number(form.sortOrder) || 0, status: form.status,
      };
      if (!body.title) throw new Error('Title is required');
      if (!body.body.trim()) throw new Error('The template text is required');
      if (editing) await api.update('formats', row._id, body);
      else await api.create('formats', body);
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-2xl"
      title={editing ? 'Edit format' : 'Add format'}
      subtitle={editing ? row.title : 'Appears on the website’s Formats & Scripts page'}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} Save
        </button>
      </>}>
      <div className="space-y-3.5">
        <Field label="Title *">
          <input className="field" value={form.title} onChange={set('title')} placeholder="e.g. Hotel booking format" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Group" className="col-span-1">
            <select className="field" value={form.group} onChange={set('group')}>
              {GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Sort order"><input type="number" className="field" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
        </div>
        <Field label="Template text *">
          <textarea rows="16" className="field resize-y font-mono text-[12.5px] leading-relaxed"
            value={form.body} onChange={set('body')}
            placeholder={'Dear [name],\n\nUse square brackets for the blanks your team fills in.'} />
          <p className="mt-1.5 text-[11.5px] text-slate-500">Line breaks are kept exactly as typed. Put blanks in [square brackets].</p>
        </Field>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Drawer>
  );
}
