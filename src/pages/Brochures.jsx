import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Loader2, ExternalLink, Upload } from 'lucide-react';
import { api, uploadFiles } from '../api';
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
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const [url] = await uploadFiles([file]);
      setForm((f) => ({ ...f, fileUrl: url, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  };

  const pickFile = (e) => { const file = e.target.files?.[0]; e.target.value = ''; send(file); };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    send(e.dataTransfer?.files?.[0]);
  };

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = { title: form.title.trim(), region: form.region.trim(), fileUrl: form.fileUrl.trim(), sortOrder: Number(form.sortOrder) || 0, status: form.status };
      if (!body.title) throw new Error('Title is required');
      if (!body.fileUrl) throw new Error('Upload a file or paste a link');
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
        <Field label="File *">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-[13px] font-semibold transition disabled:opacity-60 ${
              dragging ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-brand-400 hover:text-brand-700'}`}>
            {uploading ? (
              <><Loader2 size={18} className="animate-spin" /> Uploading…</>
            ) : (
              <>
                <Upload size={18} />
                {form.fileUrl ? 'Replace file' : 'Drag a PDF or Word file here'}
                <span className="text-[11.5px] font-normal text-slate-500">or click to browse your computer</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" onChange={pickFile} className="hidden"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          {form.fileUrl && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-emerald-700">
              <FileText size={12} /> <a href={form.fileUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">{form.fileUrl.split('/').pop()}</a>
            </p>
          )}
          <input className="field mt-2" value={form.fileUrl} onChange={set('fileUrl')} placeholder="…or paste a link instead" />
          <p className="mt-1.5 text-[11.5px] text-slate-500">PDF, DOC or DOCX up to 25 MB. Uploaded files download straight away.</p>
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
