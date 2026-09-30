import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { downloadTemplate, exportVendors, parseSheet } from '../lib/vendorSheet.js';

/** Template / export / import controls for the vendor list. */
export default function VendorImport({ onImported }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const rows = await parseSheet(file);
      const res = await api.bulkVendors(rows);
      setResult({ ...res, fileName: file.name, total: rows.length });
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // the table is paginated, so the sheet is built from a fresh full fetch
  const allVendors = async () => (await api.vendors({ limit: 1000 })).data || [];

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(await allVendors()); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
          <FileSpreadsheet size={14} className="text-brand-600" /> Bulk vendor details
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button onClick={() => run(downloadTemplate)} disabled={busy} className="btn-outline btn-sm disabled:opacity-50">
            <Download size={13} /> Sample sheet
          </button>
          <button onClick={() => run(exportVendors)} disabled={busy} className="btn-outline btn-sm disabled:opacity-50">
            <Download size={13} /> Export all
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary btn-sm disabled:opacity-60">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Import
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={pick} className="hidden" />
        </div>
      </div>

      <p className="mt-2 text-[11.5px] text-slate-500">
        Export all vendors to get a sheet with every company name already filled in, add the GST / PAN and account
        columns, then import it back. Rows are matched on company name and blank cells are left untouched.
      </p>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {result && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-[12.5px] ${result.failed ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
          <p className="flex items-center gap-1.5 font-semibold">
            {result.failed ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {result.fileName}: {result.updated} updated
            {result.failed ? `, ${result.failed} skipped` : ''}
          </p>
          {result.errors?.length > 0 && (
            <ul className="mt-1.5 list-inside list-disc space-y-0.5">
              {result.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
