import { useEffect, useState } from 'react';
import { api, toInput } from '../api';
import { Drawer, Field, Spinner } from './ui.jsx';
import { useMasters } from '../store/useAdmin';

const PRICE_FIELDS = [
  ['singlePrice', 'Single'], ['doublePrice', 'Double'], ['triplePrice', 'Triple'], ['quadPrice', 'Quad'],
];
const EXTRA_FIELDS = [
  ['cnbPrice', 'CNB (child no bed)'], ['cwbPrice', 'CWB (child with bed)'],
  ['adultExtraBedPrice', 'Adult extra bed'], ['childExtraBedPrice', 'Child extra bed'],
];

const blank = {
  roomTypeId: '', mealPlanId: '',
  singlePrice: 0, doublePrice: 0, triplePrice: 0, quadPrice: 0,
  cnbPrice: 0, cwbPrice: 0, adultExtraBedPrice: 0, childExtraBedPrice: 0,
  currency: 'INR', startDate: '', endDate: '', status: 'Active',
};

export default function PriceForm({ open, hotel, price, onClose, onSaved }) {
  const { roomTypes, mealPlans, load } = useMasters();
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(price
      ? {
          ...blank, ...price,
          roomTypeId: price.roomTypeId?._id || price.roomTypeId || '',
          mealPlanId: price.mealPlanId?._id || price.mealPlanId || '',
          startDate: toInput(price.startDate), endDate: toInput(price.endDate),
        }
      : { ...blank, startDate: toInput(new Date()), endDate: toInput(new Date(Date.now() + 365 * 864e5)) });
  }, [open, price]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.roomTypeId || !form.mealPlanId) return setError('Room type and meal plan are required.');
    if (!form.startDate || !form.endDate) return setError('Start and end date are required.');
    if (new Date(form.endDate) < new Date(form.startDate)) return setError('End date must be on or after the start date.');
    const nums = [...PRICE_FIELDS, ...EXTRA_FIELDS].map(([k]) => Number(form[k] || 0));
    if (nums.some((n) => Number.isNaN(n) || n < 0)) return setError('Prices must be valid non-negative numbers.');
    if (nums.every((n) => n === 0)) return setError('Enter at least one price.');

    setBusy(true);
    const body = { ...form };
    [...PRICE_FIELDS, ...EXTRA_FIELDS].forEach(([k]) => { body[k] = Number(body[k] || 0); });
    delete body._id; delete body.hotelId; delete body.createdAt; delete body.updatedAt; delete body.__v;
    try {
      price?._id ? await api.updatePrice(price._id, body) : await api.createPrice(hotel._id, body);
      await onSaved();
      onClose();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} width="max-w-lg"
      title={price ? 'Edit price' : 'Add price'} subtitle={hotel?.name}
      footer={<>
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button form="price-form" disabled={busy} className="btn-primary">{busy && <Spinner />} Save price</button>
      </>}>
      <form id="price-form" onSubmit={save} className="space-y-5">
        <Section title="Room & meal plan">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room type *">
              <select required className="field" value={form.roomTypeId} onChange={set('roomTypeId')}>
                <option value="">Select</option>
                {roomTypes.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Meal plan *">
              <select required className="field" value={form.mealPlanId} onChange={set('mealPlanId')}>
                <option value="">Select</option>
                {mealPlans.map((m) => <option key={m._id} value={m._id}>{m.code} — {m.name}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Room selling price">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRICE_FIELDS.map(([k, l]) => (
              <Field key={k} label={l}><input type="number" min="0" className="field" value={form[k]} onChange={num(k)} /></Field>
            ))}
          </div>
        </Section>

        <Section title="Child & extra bed">
          <div className="grid grid-cols-2 gap-3">
            {EXTRA_FIELDS.map(([k, l]) => (
              <Field key={k} label={l}><input type="number" min="0" className="field" value={form[k]} onChange={num(k)} /></Field>
            ))}
          </div>
        </Section>

        <Section title="Validity">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <select className="field" value={form.currency} onChange={set('currency')}>
                {['INR', 'AED', 'USD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
            </Field>
            <Field label="Start date *"><input required type="date" className="field" value={form.startDate} onChange={set('startDate')} /></Field>
            <Field label="End date *"><input required type="date" className="field" min={form.startDate} value={form.endDate} onChange={set('endDate')} /></Field>
          </div>
        </Section>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </form>
    </Drawer>
  );
}

const Section = ({ title, children }) => (
  <div>
    <p className="mb-2.5 border-b border-slate-200 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{title}</p>
    {children}
  </div>
);
