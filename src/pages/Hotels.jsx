import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Tags, Pencil, Trash2, ChevronDown, Building2, Star } from 'lucide-react';
import { api, money, fmtDate } from '../api';
import { useHotels } from '../store/useAdmin';
import { Pager, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';
import HotelForm from '../components/HotelForm.jsx';
import PriceForm from '../components/PriceForm.jsx';

export default function Hotels() {
  const st = useHotels();
  const { rows, total, page, pages, q, status, loading, expanded, pricesByHotel } = st;
  const [hotelForm, setHotelForm] = useState(null);   // {} for new, hotel for edit
  const [priceForm, setPriceForm] = useState(null);   // { hotel, price }
  const first = useRef(true);

  useEffect(() => {
    const t = setTimeout(st.fetch, first.current ? 0 : 350);
    first.current = false;
    return () => clearTimeout(t);
  }, [q, status, page]); // eslint-disable-line

  const del = async (h) => {
    if (!confirmDelete(`“${h.name}” and all its price records`)) return;
    await api.deleteHotel(h._id);
    st.fetch();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field !pl-9" placeholder="Search hotel, city or area" value={q} onChange={(e) => st.setQuery({ q: e.target.value })} />
        </div>
        <select className="field !w-auto" value={status} onChange={(e) => st.setQuery({ status: e.target.value })}>
          <option value="">All statuses</option><option>Active</option><option>Inactive</option>
        </select>
        <span className="hidden text-[12px] text-slate-500 sm:block">{total} record{total === 1 ? '' : 's'} found</span>
        <button onClick={() => setHotelForm({})} className="btn-primary ml-auto"><Plus size={15} /> Add hotel</button>
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card"><Empty icon={Building2} title="No hotels found" sub="Add your first property to get started." /></div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((h) => (
            <div key={h._id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-3">
                <img src={h.images?.[0]} alt="" className="h-16 w-20 shrink-0 rounded-lg bg-slate-100 object-cover" />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-bold text-slate-900">{h.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                    {h.location}, {h.city}
                    <span className="inline-flex items-center gap-0.5 text-amber-500"><Star size={11} className="fill-amber-500" />{h.starCategory} Star</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusBadge status={h.status} />
                    <span className="badge bg-slate-100 text-slate-600">{h.priceCount} price{h.priceCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => st.toggleExpand(h._id)} className="btn-outline btn-sm">
                    <Tags size={13} /> Prices <ChevronDown size={13} className={`transition ${expanded === h._id ? 'rotate-180' : ''}`} />
                  </button>
                  <button onClick={() => setPriceForm({ hotel: h, price: null })} className="btn-outline btn-sm"><Plus size={13} /> Add price</button>
                  <button onClick={() => setHotelForm(h)} className="btn-outline btn-sm"><Pencil size={13} /> Edit</button>
                  <button onClick={() => del(h)} className="btn-danger btn-sm"><Trash2 size={13} /></button>
                </div>
              </div>

              {expanded === h._id && (
                <div className="border-t border-slate-200 bg-slate-50/70 px-3 py-3">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">{h.name} — prices</p>
                  <PriceRows hotel={h} prices={pricesByHotel[h._id]} onEdit={(p) => setPriceForm({ hotel: h, price: p })} reload={() => st.reloadPrices(h._id)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pager page={page} pages={pages} onChange={st.setPage} />

      {hotelForm && (
        <HotelForm open hotel={hotelForm._id ? hotelForm : null} onClose={() => setHotelForm(null)} onSaved={() => st.fetch()} />
      )}
      {priceForm && (
        <PriceForm open hotel={priceForm.hotel} price={priceForm.price}
          onClose={() => setPriceForm(null)} onSaved={() => st.reloadPrices(priceForm.hotel._id)} />
      )}
    </div>
  );
}

function PriceRows({ prices, onEdit, reload }) {
  if (!prices) return <p className="py-3 text-[13px] text-slate-500">Loading prices…</p>;
  if (!prices.length) return <p className="py-3 text-[13px] text-slate-500">No price records yet. Use “Add price” to create one.</p>;

  const del = async (p) => {
    if (!confirmDelete(`the ${p.roomTypeId?.name} / ${p.mealPlanId?.code} price record`)) return;
    await api.deletePrice(p._id);
    reload();
  };
  const toggle = async (p) => {
    await api.updatePrice(p._id, { status: p.status === 'Active' ? 'Inactive' : 'Active' });
    reload();
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[820px]">
        <thead className="bg-slate-50">
          <tr>{['Room type', 'Meal', 'Price details', 'Currency', 'Validity', 'Status', ''].map((h, i) => <th key={i} className="th">{h}</th>)}</tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p._id} className="border-t border-slate-100">
              <td className="td"><span className="badge bg-navy-900 text-white">{p.roomTypeId?.name || '—'}</span></td>
              <td className="td"><span className="badge bg-brand-50 text-brand-700">{p.mealPlanId?.code || '—'}</span></td>
              <td className="td text-slate-600">
                <span className="font-semibold text-slate-900">{money(p.doublePrice, p.currency)}</span> double
                <span className="text-slate-400"> · </span>S {money(p.singlePrice, p.currency)}
                <span className="text-slate-400"> · </span>T {money(p.triplePrice, p.currency)}
                <span className="text-slate-400"> · </span>Q {money(p.quadPrice, p.currency)}
              </td>
              <td className="td">{p.currency}</td>
              <td className="td text-slate-600">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
              <td className="td"><button onClick={() => toggle(p)} title="Toggle status"><StatusBadge status={p.status} /></button></td>
              <td className="td">
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => onEdit(p)} className="btn-outline btn-sm"><Pencil size={12} /> Edit</button>
                  <button onClick={() => del(p)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
