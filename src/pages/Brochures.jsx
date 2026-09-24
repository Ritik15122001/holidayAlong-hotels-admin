import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { Modal, Field, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';

const BLANK = { title: '', region: '', fileUrl: '', sortOrder: 0, status: 'Active' };

export default function Brochures() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => api.list('brochures').then(setRows);
  useEffect(() => { load(); }, []);

  const del = async (row) => {
    if (!confirmDelete(`“${row.title}”`)) return;
    await api.remove('brochures', row._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Packages &amp; brochures</p>
          <p className="text-[12px] text-slate-500">PDFs listed on the website’s Packages page</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={15} /> Add brochure</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={FileText} title="No brochures yet" sub="Add a PDF link and it appears on the website immediately." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50"><tr>
                {['Order', 'Title', 'Region', 'File', 'Status', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td text-slate-500">{b.sortOrder}</td>
                    <td className="td font-semibold text-slate-900">{b.title}</td>
                    <td className="td text-slate-600">{b.region || '—'}</td>
                    <td className="td">
                      <a href={b.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
                        <FileText size={13} /> Open <ExternalLink size={11} />
                      </a>
                    </td>
                    <td className="td"><StatusBadge status={b.status} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(b)} title="Edit" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                        <button onClick={() => del(b)} title="Delete" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <BrochureForm row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function BrochureForm({ row, onClose, onSaved }) {
  const editing = Boolean(row._id);
  const [form, setForm] = useState({ ...BLANK, ...row });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = { title: form.title.trim(), region: form.region.trim(), fileUrl: form.fileUrl.trim(), sortOrder: Number(form.sortOrder) || 0, status: form.status };
      if (!body.title) throw new Error('Title is required');
      if (!body.fileUrl) throw new Error('A PDF link is required');
      if (editing) await api.update('brochures', row._id, body);
      else await api.create('brochures', body);
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${editing ? 'Edit' : 'Add'} brochure`}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} Save
        </button>
      </>}>
      <div className="space-y-3.5">
        <Field label="Title *">
          <input className="field" value={form.title} onChange={set('title')} placeholder="Holiday Along Packages — Meghalaya (2026-2027)" />
        </Field>
        <Field label="Region / grouping">
          <input className="field" value={form.region} onChange={set('region')} placeholder="North East, Rajasthan…" />
        </Field>
        <Field label="PDF link *">
          <input className="field" value={form.fileUrl} onChange={set('fileUrl')} placeholder="https://…/brochure.pdf" />
          <p className="mt-1.5 text-[11.5px] text-slate-500">Paste a public link to the PDF (Drive, Dropbox or your own hosting).</p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><input type="number" className="field" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
