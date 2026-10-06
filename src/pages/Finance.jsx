import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, Plus, Download, TrendingUp, TrendingDown, PiggyBank, Archive,
  Search, Pencil, Trash2, BookOpen,
} from 'lucide-react';
import { api, money, fmtDate, toInput } from '../api';
import { Drawer, Field, Empty, Pager, confirmDelete } from '../components/ui.jsx';

export const PL_HEADS = ['Revenue', 'Other income', 'Direct cost', 'Operating expense', 'Not in P&L'];
const INCOME_HEADS = ['Revenue', 'Other income'];

const PERIODS = [
  ['this-month', 'This month'],
  ['last-month', 'Last month'],
  ['fy', 'This FY'],
  ['fy-prev', 'Last FY'],
  ['all', 'All time'],
  ['custom', 'Custom'],
];

const BLANK = {
  date: toInput(new Date()), type: 'Expense', amount: '', currency: 'INR',
  plHead: 'Operating expense', category: '', party: '', invoiceNo: '', method: '', notes: '',
};

export default function Finance() {
  const [period, setPeriod] = useState('fy');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [tab, setTab] = useState('entries');

  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [plHead, setPlHead] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState(null);
  const [meta, setMeta] = useState({ total: 0, pages: 1, in: 0, out: 0 });
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);

  const params = useMemo(() => {
    const p = { period };
    if (period === 'custom') { if (custom.from) p.from = custom.from; if (custom.to) p.to = custom.to; }
    return p;
  }, [period, custom]);

  const load = useCallback(async () => {
    const listParams = { ...params, page, limit: 50 };
    if (q) listParams.q = q;
    if (type) listParams.type = type;
    if (plHead) listParams.plHead = plHead;
    if (category) listParams.category = category;
    const [list, sum] = await Promise.all([
      api.finEntries(listParams),
      api.finSummary(params),
    ]);
    setRows(list.data);
    setMeta({ total: list.total, pages: list.pages, in: list.in, out: list.out });
    setSummary(sum);
  }, [params, page, q, type, plHead, category]);

  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load]); // eslint-disable-line
  useEffect(() => { api.finCategories().then(setCategories).catch(() => setCategories([])); }, [rows]);
  useEffect(() => { setPage(1); }, [period, custom, q, type, plHead, category]);

  const del = async (e) => {
    if (!confirmDelete(`this ${e.type.toLowerCase()} of ${money(e.amount, e.currency)}`)) return;
    await api.deleteFinEntry(e._id);
    load();
  };

  const exportCsv = () => {
    const head = ['Date', 'Type', 'Amount', 'Currency', 'P&L head', 'Category', 'Party', 'Invoice no', 'Method', 'Notes'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = (rows || []).map((r) => [
      toInput(r.date), r.type, r.amount, r.currency, r.plHead,
      r.category, r.party, r.invoiceNo, r.method, r.notes,
    ].map(esc).join(','));
    const blob = new Blob([[head.map(esc).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finance-${period}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Finance</p>
          <h1 className="mt-1 text-[24px] font-extrabold text-slate-900">Expenses &amp; P&amp;L</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] text-slate-500">
            Record income and expenses, tag each one to a profit &amp; loss head, and read the statement for any period.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} disabled={!rows?.length} className="btn-outline disabled:opacity-50"><Download size={15} /> Export CSV</button>
          <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Plus size={15} /> Add entry</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
              period === key ? 'bg-navy-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
            {label}
          </button>
        ))}
        {period === 'custom' && (
          <span className="flex items-center gap-2">
            <input type="date" className="field !w-auto" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            <span className="text-slate-400">–</span>
            <input type="date" className="field !w-auto" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={TrendingUp} tone="emerald" label="Income" value={summary?.income}
          sub={`${money(summary?.revenue || 0)} revenue`} />
        <Card icon={TrendingDown} tone="rose" label="Expenses" value={summary?.expenses}
          sub={`${money(summary?.operatingExpense || 0)} operating · ${money(summary?.directCost || 0)} direct`} />
        <Card icon={PiggyBank} tone="brand" label="Net profit" value={summary?.netProfit}
          sub={summary?.income ? `${money(summary.grossProfit)} gross profit` : 'No revenue in this period'} />
        <Card icon={Archive} tone="slate" label="Not in P&L" value={summary?.notInPL}
          sub="Assets, loans & transfers" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3">
          {[['entries', 'Entries'], ['statement', 'P&L statement'], ['guide', 'Tagging guide']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-[13.5px] font-bold transition ${
                tab === key ? 'border-navy-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {key === 'guide' && <BookOpen size={14} />} {label}
            </button>
          ))}
        </div>

        {tab === 'entries' && (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
              <div className="relative min-w-[200px] flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="field !pl-9" placeholder="Search notes, party, invoice no…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="field !w-auto" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All types</option><option>Income</option><option>Expense</option>
              </select>
              <select className="field !w-auto" value={plHead} onChange={(e) => setPlHead(e.target.value)}>
                <option value="">Any P&amp;L head</option>
                {PL_HEADS.map((h) => <option key={h}>{h}</option>)}
              </select>
              <select className="field !w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Any category</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className="ml-auto text-[12.5px] text-slate-500">
                In <b className="text-emerald-700">{money(meta.in)}</b> · Out <b className="text-rose-700">{money(meta.out)}</b>
              </span>
            </div>

            {rows === null ? (
              <div className="space-y-px">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
            ) : rows.length === 0 ? (
              <Empty icon={Wallet} title="No entries in this period"
                sub="Add your first income or expense — tag it to a P&L head and the statement builds itself." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50"><tr>
                    {['Date', 'Type', 'P&L head', 'Category', 'Party / notes', 'Amount', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                        <td className="td whitespace-nowrap text-slate-600">{fmtDate(e.date)}</td>
                        <td className="td">
                          <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                            e.type === 'Income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{e.type}</span>
                        </td>
                        <td className="td">
                          <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                            e.plHead === 'Not in P&L' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700'}`}>{e.plHead}</span>
                        </td>
                        <td className="td text-slate-600">{e.category || '—'}</td>
                        <td className="td">
                          <p className="font-medium text-slate-800">{e.party || '—'}</p>
                          {(e.notes || e.invoiceNo) && (
                            <p className="text-[11.5px] text-slate-500">{[e.invoiceNo, e.notes].filter(Boolean).join(' · ')}</p>
                          )}
                        </td>
                        <td className={`td whitespace-nowrap font-bold ${e.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {e.type === 'Income' ? '+' : '−'}{money(e.amount, e.currency)}
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditing({ ...e, date: toInput(e.date) })} title="Edit"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                            <button onClick={() => del(e)} title="Delete"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-rose-200 hover:text-rose-600"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={page} pages={meta.pages} onChange={setPage} />
          </>
        )}

        {tab === 'statement' && <Statement summary={summary} />}
        {tab === 'guide' && <Guide />}
      </div>

      {editing && (
        <EntryForm entry={editing} categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  brand: 'bg-brand-50 text-brand-600',
  slate: 'bg-slate-100 text-slate-500',
};

const Card = ({ icon: Icon, tone, label, value, sub }) => (
  <div className="card p-4">
    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
      <span className={`grid h-7 w-7 place-items-center rounded-lg ${TONES[tone]}`}><Icon size={15} /></span>
      {label}
    </p>
    <p className="mt-2.5 text-[26px] font-extrabold leading-none text-slate-900">{value == null ? '—' : money(value)}</p>
    <p className="mt-1.5 text-[12px] text-slate-500">{sub}</p>
  </div>
);

function Statement({ summary }) {
  if (!summary) return <div className="p-10 text-center text-[13px] text-slate-500">Loading…</div>;
  const line = (label, value, opts = {}) => ({ label, value, ...opts });
  const lines = [
    line('Revenue', summary.revenue),
    line('Other income', summary.otherIncome),
    line('Total income', summary.income, { strong: true }),
    line('Direct cost', -summary.directCost),
    line('Gross profit', summary.grossProfit, { strong: true, rule: true }),
    line('Operating expense', -summary.operatingExpense),
    line('Net profit', summary.netProfit, { strong: true, rule: true, big: true }),
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-xl">
        {lines.map((l) => (
          <div key={l.label}
            className={`flex items-center justify-between gap-4 py-2.5 ${l.rule ? 'border-t border-slate-300' : 'border-b border-slate-100'}`}>
            <span className={`text-[13.5px] ${l.strong ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{l.label}</span>
            <span className={`${l.big ? 'text-[18px]' : 'text-[14px]'} font-bold ${
              l.value < 0 ? 'text-rose-700' : l.strong ? 'text-slate-900' : 'text-slate-700'}`}>
              {l.value < 0 ? `(${money(Math.abs(l.value))})` : money(l.value)}
            </span>
          </div>
        ))}
        {summary.notInPL > 0 && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-600">
            <b>{money(summary.notInPL)}</b> is tagged <b>Not in P&amp;L</b> and sits outside this statement — assets,
            loans and owner transfers are movements of money, not profit or loss.
          </p>
        )}

        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">By category</p>
          <div className="mt-2 space-y-4">
            {PL_HEADS.map((head) => {
              const h = summary.heads?.[head];
              if (!h?.categories?.length) return null;
              return (
                <div key={head}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[12.5px] font-bold text-slate-800">{head}</span>
                    <span className="text-[12.5px] font-bold text-slate-800">{money(h.total)}</span>
                  </div>
                  {h.categories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between py-1.5 text-[13px]">
                      <span className="text-slate-600">{c.category} <span className="text-slate-400">· {c.count}</span></span>
                      <span className="text-slate-700">{money(c.total)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const GUIDE = [
  ['Revenue', 'What the business earns from its own trade — commission or margin on a booking, service fees.'],
  ['Other income', 'Earnings outside the core trade — bank interest, a refund of a cost, foreign exchange gain.'],
  ['Direct cost', 'Money spent to deliver a specific sale — the hotel payout, a cab charged to one booking. Revenue minus direct cost is gross profit.'],
  ['Operating expense', 'Running the business whether or not you sell — salaries, rent, hosting, phone, marketing.'],
  ['Not in P&L', 'Movements that are not profit or loss — buying equipment, a loan received or repaid, owner drawings, transfers between your own accounts.'],
];

const Guide = () => (
  <div className="p-4 sm:p-6">
    <div className="mx-auto max-w-2xl space-y-3">
      <p className="text-[13.5px] text-slate-600">
        Every entry carries one P&amp;L head. The head is what the statement groups on, so tagging it correctly is
        the whole job — the rest builds itself.
      </p>
      {GUIDE.map(([head, text]) => (
        <div key={head} className="rounded-lg border border-slate-200 p-3.5">
          <p className="text-[13px] font-bold text-slate-900">{head}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{text}</p>
        </div>
      ))}
      <p className="rounded-lg bg-amber-50 px-3.5 py-3 text-[12.5px] text-amber-900">
        Unsure? If the money changes what you <i>own or owe</i> rather than what you <i>earned or spent</i>,
        it belongs in <b>Not in P&amp;L</b>.
      </p>
    </div>
  </div>
);

function EntryForm({ entry, categories, onClose, onSaved }) {
  const [form, setForm] = useState(entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // income and expense never share a head, so keep the choice honest
  const heads = form.type === 'Income'
    ? [...INCOME_HEADS, 'Not in P&L']
    : ['Direct cost', 'Operating expense', 'Not in P&L'];

  useEffect(() => {
    if (!heads.includes(form.plHead)) setForm((f) => ({ ...f, plHead: heads[0] }));
  }, [form.type]); // eslint-disable-line

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.date) return setError('Date is required.');
    if (!(Number(form.amount) > 0)) return setError('Amount must be more than zero.');
    setSaving(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      if (form._id) await api.updateFinEntry(form._id, body);
      else await api.createFinEntry(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open onClose={onClose} title={form._id ? 'Edit entry' : 'Add entry'}
      subtitle="Tag it to a P&L head so the statement stays right."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save entry'}</button>
        </div>
      }>
      <form onSubmit={save} className="space-y-3.5">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-700">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className="field" value={form.date} onChange={set('date')} /></Field>
          <Field label="Type">
            <select className="field" value={form.type} onChange={set('type')}><option>Expense</option><option>Income</option></select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input type="number" min="0" step="0.01" className="field" value={form.amount} onChange={set('amount')} placeholder="0" />
          </Field>
          <Field label="Currency">
            <select className="field" value={form.currency} onChange={set('currency')}><option>INR</option><option>AED</option><option>USD</option></select>
          </Field>
        </div>

        <Field label="P&L head">
          <select className="field" value={form.plHead} onChange={set('plHead')}>
            {heads.map((h) => <option key={h}>{h}</option>)}
          </select>
        </Field>

        <Field label="Category">
          <input className="field" list="fin-categories" value={form.category} onChange={set('category')} placeholder="e.g. Hotel payout, Salaries, Hosting" />
          <datalist id="fin-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Party"><input className="field" value={form.party} onChange={set('party')} placeholder="Who it was paid to or received from" /></Field>
          <Field label="Invoice no."><input className="field" value={form.invoiceNo} onChange={set('invoiceNo')} /></Field>
        </div>

        <Field label="Paid by"><input className="field" value={form.method} onChange={set('method')} placeholder="Bank, UPI, cash…" /></Field>
        <Field label="Notes"><textarea rows="2" className="field resize-none" value={form.notes} onChange={set('notes')} /></Field>
      </form>
    </Drawer>
  );
}
