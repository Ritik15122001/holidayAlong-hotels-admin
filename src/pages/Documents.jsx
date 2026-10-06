import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FolderOpen, Upload, Search, Download, Pencil, Trash2, FileText, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { api, uploadFiles, fmtDate } from '../api';
import { Drawer, Field, Empty, confirmDelete } from '../components/ui.jsx';

export const DOC_CATEGORIES = [
  'General',
  'Brochures & flyers',
  'Checklists',
  'Agreements & contracts',
  'Rate cards',
  'Vendor documents',
  'Fees & finance',
  'Training & process',
];

const BLANK = { title: '', category: 'General', fileUrl: '', fileName: '', fileType: '', size: 0, notes: '', status: 'Active' };

const prettySize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const isImage = (t) => String(t || '').startsWith('image/');

export default function Documents() {
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const p = {};
    if (q) p.q = q;
    if (category) p.category = category;
    const r = await api.documents(p);
    setRows(r.data);
    setCounts(r.counts || {});
  }, [q, category]);

  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load]); // eslint-disable-line

  const del = async (d) => {
    if (!confirmDelete(`the document “${d.title}”`)) return;
    await api.deleteDocument(d._id);
    load();
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <h1 className="mt-1 text-[24px] font-extrabold text-slate-900">Important documents</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-slate-500">
            The shared library — brochures, checklists, agreements and rate cards. Upload once and the whole team can download it.
          </p>
        </div>
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Upload size={15} /> Upload document</button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field !pl-9" placeholder="Search titles, notes and filenames…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip active={!category} onClick={() => setCategory('')} label="All" count={total} />
          {DOC_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)} label={c} count={counts[c] || 0} />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <Empty icon={FolderOpen} title={q || category ? 'Nothing matches that' : 'The library is empty'}
              sub={q || category ? 'Try another search or category.' : 'Upload the files the team keeps asking for — rate cards, checklists, agreements.'} />
            {!q && !category && (
              <div className="mt-4 flex justify-center">
                <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Upload size={15} /> Upload document</button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((d) => (
              <div key={d._id} className="flex flex-wrap items-center gap-3 p-3.5 hover:bg-slate-50/70">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  {isImage(d.fileType) ? <ImageIcon size={18} /> : <FileText size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-slate-900">{d.title}</p>
                  <p className="truncate text-[12px] text-slate-500">
                    {[d.category, d.fileName, prettySize(d.size), fmtDate(d.createdAt)].filter(Boolean).join(' · ')}
                  </p>
                  {d.notes && <p className="mt-0.5 truncate text-[12px] text-slate-500">{d.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" title="Download"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Download size={15} /></a>
                  <button onClick={() => setEditing(d)} title="Edit"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                  <button onClick={() => del(d)} title="Delete"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-rose-200 hover:text-rose-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <DocForm doc={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

const Chip = ({ active, onClick, label, count }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
    {label}
    <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
  </button>
);

function DocForm({ doc, onClose, onSaved }) {
  const [form, setForm] = useState(doc);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const take = async (file) => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const [url] = await uploadFiles([file]);
      setForm((f) => ({
        ...f,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        // an untouched title follows the filename, minus its extension
        title: f.title || file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Give the document a title.');
    if (!form.fileUrl) return setError('Choose a file to upload.');
    setSaving(true);
    try {
      if (form._id) await api.updateDocument(form._id, form);
      else await api.createDocument(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open onClose={onClose} title={form._id ? 'Edit document' : 'Upload document'}
      subtitle="PDF, Word or an image, up to 25 MB."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving || busy} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }>
      <form onSubmit={save} className="space-y-3.5">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>}

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
            drag ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>
          {busy ? (
            <p className="flex items-center justify-center gap-2 text-[13px] text-slate-600"><Loader2 size={15} className="animate-spin" /> Uploading…</p>
          ) : form.fileUrl ? (
            <>
              <p className="flex items-center justify-center gap-2 text-[13px] font-semibold text-slate-800">
                <FileText size={15} className="text-brand-600" /> {form.fileName || 'File attached'}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">{prettySize(form.size)} · click to replace</p>
            </>
          ) : (
            <>
              <Upload size={20} className="mx-auto text-slate-400" />
              <p className="mt-2 text-[13px] font-semibold text-slate-700">Drop a file here, or click to choose</p>
              <p className="mt-0.5 text-[12px] text-slate-500">PDF, DOC, DOCX, JPG, PNG — max 25 MB</p>
            </>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.avif"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; take(f); }} />
        </div>

        <Field label="Title"><input className="field" value={form.title} onChange={set('title')} placeholder="What the team will search for" /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className="field" value={form.category} onChange={set('category')}>
              {DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
        </div>

        <Field label="Notes"><textarea rows="2" className="field resize-none" value={form.notes} onChange={set('notes')} placeholder="When to use it, who it is for…" /></Field>
      </form>
    </Drawer>
  );
}
