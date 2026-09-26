import { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Search, Briefcase, ChevronDown, Building2, Loader2,
  Phone, Mail, Globe, MapPin, Landmark, CreditCard,
} from 'lucide-react';
import { api } from '../api';
import { Drawer, Field, Empty, StatusBadge, Pager, confirmDelete } from '../components/ui.jsx';

export const VENDOR_TYPES = ['Cab', 'Hotel', 'Flight', 'Bus', 'Activities', 'Cruises', 'Visa', 'Insurance'];

const BLANK = {
  companyName: '', contactPerson: '', phones: '', emails: '', website: '',
  vendorType: 'Hotel', sectors: '', gstPan: '', accountNumber: '', bankName: '',
  ifsc: '', upi: '', status: 'Active',
};

const toList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

export default function Vendors() {
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [hotels, setHotels] = useState({});

  const load = async () => {
    const r = await api.vendors({ q, type, page, limit: 10 });
    setRows(r.data); setTotal(r.total); setPages(r.pages);
  };
  useEffect(() => { const t = setTimeout(load, q ? 350 : 0); return () => clearTimeout(t); }, [q, type, page]); // eslint-disable-line

  const del = async (v) => {
    if (!confirmDelete(`the vendor “${v.companyName}”`)) return;
    try { await api.deleteVendor(v._id); load(); }
    catch (e) { alert(e.message); }
  };

  const toggle = async (v) => {
    if (expanded === v._id) return setExpanded(null);
    setExpanded(v._id);
    if (!hotels[v._id]) {
      const list = await api.vendorHotels(v._id).catch(() => []);
      setHotels((h) => ({ ...h, [v._id]: list }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field !pl-9" placeholder="Search company, contact or sector" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <select className="field !w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {VENDOR_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="text-[12px] text-slate-500">{total} vendor{total === 1 ? '' : 's'}</span>
        <button onClick={() => setEditing({})} className="btn-primary ml-auto !py-2.5"><Plus size={15} /> Add vendor</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={Briefcase} title="No vendors yet" sub="Add the suppliers you work with — hotels, cabs, activities and more." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50"><tr>
                {['Company', 'Type', 'Contact', 'Sectors', 'Hotels', 'Status', ''].map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((v) => (
                  <>
                    <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="td">
                        <p className="font-semibold text-slate-900">{v.companyName}</p>
                        {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="text-[11.5px] text-brand-700 hover:underline">{v.website}</a>}
                      </td>
                      <td className="td"><span className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">{v.vendorType}</span></td>
                      <td className="td">
                        <p className="text-slate-800">{v.contactPerson || '—'}</p>
                        <p className="text-[11.5px] text-slate-500">{[...(v.phones || []), ...(v.emails || [])].slice(0, 2).join(' · ') || '—'}</p>
                      </td>
                      <td className="td text-slate-600">{(v.sectors || []).join(', ') || '—'}</td>
                      <td className="td">
                        <button onClick={() => toggle(v)} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[12px] font-bold text-slate-700 hover:bg-slate-200">
                          <Building2 size={12} /> {v.hotelCount}
                          <ChevronDown size={12} className={expanded === v._id ? 'rotate-180' : ''} />
                        </button>
                      </td>
                      <td className="td"><StatusBadge status={v.status} /></td>
                      <td className="td">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEditing(v)} title="Edit" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                          <button onClick={() => del(v)} title="Delete" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                    {expanded === v._id && (
                      <tr key={v._id + '-h'} className="bg-slate-50/70">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              <CreditCard size={13} className="text-brand-600" /> Account details
                            </p>
                            {[v.gstPan, v.accountNumber, v.bankName, v.ifsc, v.upi].some(Boolean) ? (
                              <dl className="grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-3 lg:grid-cols-5">
                                {[['GST / PAN', v.gstPan], ['Account number', v.accountNumber], ['Bank', v.bankName],
                                  ['IFSC', v.ifsc], ['UPI', v.upi]].map(([k, val]) => (
                                  <div key={k}>
                                    <dt className="text-[10.5px] uppercase tracking-wide text-slate-400">{k}</dt>
                                    <dd className="font-semibold text-slate-800">{val || '—'}</dd>
                                  </div>
                                ))}
                              </dl>
                            ) : (
                              <p className="text-[12.5px] text-slate-500">No account details saved yet — add them with Edit.</p>
                            )}
                            <p className="mt-2 text-[11px] text-slate-400">Admin only — these are never sent to the website.</p>
                          </div>

                          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            <Building2 size={13} className="text-brand-600" /> Linked hotels
                          </p>
                          {!hotels[v._id] ? (
                            <p className="flex items-center gap-2 text-[13px] text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading hotels…</p>
                          ) : hotels[v._id].length === 0 ? (
                            <p className="text-[13px] text-slate-500">No hotels linked to this vendor yet. Set the vendor on a hotel to link it.</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {hotels[v._id].map((h) => (
                                <div key={h._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[13px] font-semibold text-slate-900">{h.name}</p>
                                  <p className="text-[11.5px] text-slate-500">{h.location}, {h.city} · {h.starCategory}★ · {h.status}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pager page={page} pages={pages} onChange={setPage} />

      {editing && <VendorForm vendor={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function VendorForm({ vendor, onClose, onSaved }) {
  const editing = Boolean(vendor._id);
  const [form, setForm] = useState({
    ...BLANK, ...vendor,
    phones: (vendor.phones || []).join(', '),
    emails: (vendor.emails || []).join(', '),
    sectors: (vendor.sectors || []).join(', '),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = {
        ...form,
        phones: toList(form.phones), emails: toList(form.emails), sectors: toList(form.sectors),
      };
      delete body._id; delete body.hotelCount; delete body.createdAt; delete body.updatedAt; delete body.__v;
      if (!body.companyName.trim()) throw new Error('Company name is required');
      if (editing) await api.updateVendor(vendor._id, body);
      else await api.createVendor(body);
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-xl"
      title={editing ? 'Edit vendor' : 'Add vendor'}
      subtitle={editing ? vendor.companyName : 'Suppliers you buy from — hotels, cabs, activities and more'}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} {editing ? 'Save changes' : 'Create vendor'}
        </button>
      </>}>
      <div className="space-y-5">
        <Group icon={Briefcase} title="Company">
          <Field label="Vendor company *"><input className="field" value={form.companyName} onChange={set('companyName')} placeholder="e.g. Northeast Travels Pvt Ltd" /></Field>
          <Field label="Contact person"><input className="field" value={form.contactPerson} onChange={set('contactPerson')} placeholder="Full name" /></Field>
          <Field label="Vendor type *">
            <select className="field" value={form.vendorType} onChange={set('vendorType')}>
              {VENDOR_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
        </Group>

        <Group icon={Phone} title="Contact">
          <Field label="Contact numbers"><input className="field" value={form.phones} onChange={set('phones')} placeholder="Comma separated" /></Field>
          <Field label="Email IDs"><input className="field" value={form.emails} onChange={set('emails')} placeholder="Comma separated" /></Field>
          <Field label="Website" className="sm:col-span-2"><input className="field" value={form.website} onChange={set('website')} placeholder="https://" /></Field>
        </Group>

        <Group icon={MapPin} title="Coverage">
          <Field label="Sectors served" className="sm:col-span-2">
            <input className="field" value={form.sectors} onChange={set('sectors')} placeholder="Delhi, Rajasthan, Meghalaya" />
            <p className="mt-1.5 text-[11.5px] text-slate-500">Separate each sector with a comma.</p>
          </Field>
        </Group>

        <Group icon={Landmark} title="Billing & bank">
          <Field label="GST / PAN number"><input className="field" value={form.gstPan} onChange={set('gstPan')} /></Field>
          <Field label="Account number"><input className="field" value={form.accountNumber} onChange={set('accountNumber')} /></Field>
          <Field label="Bank name"><input className="field" value={form.bankName} onChange={set('bankName')} /></Field>
          <Field label="IFSC code"><input className="field" value={form.ifsc} onChange={set('ifsc')} /></Field>
          <Field label="UPI ID / number" className="sm:col-span-2"><input className="field" value={form.upi} onChange={set('upi')} /></Field>
          <p className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
            Bank, GST/PAN and UPI details stay in the admin panel — they are never sent to the website.
          </p>
        </Group>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Drawer>
  );
}

const Group = ({ icon: Icon, title, children }) => (
  <div>
    <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
      <Icon size={13} className="text-brand-600" /> {title}
    </p>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </div>
);
