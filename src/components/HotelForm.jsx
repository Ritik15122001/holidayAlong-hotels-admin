import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../api';
import { Drawer, Field, Spinner } from './ui.jsx';

const AMENITIES = ['WiFi', 'Swimming Pool', 'Restaurant', 'Parking', 'Room Service', 'Air Conditioning', 'Gym', 'Spa'];

const blank = {
  name: '', city: '', location: '', starCategory: 4, description: '', address: '',
  phone: '', email: '', website: '', rating: 4.5, checkIn: '14:00', checkOut: '11:00',
  amenities: [], images: [], status: 'Active',
};

export default function HotelForm({ open, hotel, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...blank, ...(hotel || {}) }));
  const [imgInput, setImgInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addImage = () => {
    const url = imgInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setImgInput('');
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { ...form, starCategory: Number(form.starCategory), rating: Number(form.rating) };
    delete body._id; delete body.priceCount; delete body.createdAt; delete body.updatedAt; delete body.__v;
    try {
      const saved = hotel?._id ? await api.updateHotel(hotel._id, body) : await api.createHotel(body);
      onSaved(saved);
      onClose();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} width="max-w-xl"
      title={hotel?._id ? 'Edit hotel' : 'Add hotel'}
      subtitle={hotel?._id ? hotel.name : 'Create a new property in the hotel master'}
      footer={<>
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button form="hotel-form" disabled={busy} className="btn-primary">{busy && <Spinner />} Save hotel</button>
      </>}>
      <form id="hotel-form" onSubmit={save} className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <Field label="Hotel name *" className="col-span-2"><input required className="field" value={form.name} onChange={set('name')} /></Field>
        <Field label="City *"><input required className="field" value={form.city} onChange={set('city')} /></Field>
        <Field label="Location / area *"><input required className="field" value={form.location} onChange={set('location')} /></Field>
        <Field label="Star category *">
          <select className="field" value={form.starCategory} onChange={set('starCategory')}>
            {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} Star</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="field" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
        </Field>
        <Field label="Description" className="col-span-2"><textarea rows="3" className="field resize-none" value={form.description} onChange={set('description')} /></Field>
        <Field label="Address" className="col-span-2"><input className="field" value={form.address} onChange={set('address')} /></Field>
        <Field label="Contact phone"><input className="field" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Contact email"><input type="email" className="field" value={form.email} onChange={set('email')} /></Field>
        <Field label="Website"><input className="field" value={form.website} onChange={set('website')} placeholder="https://" /></Field>
        <Field label="Guest rating"><input type="number" step="0.1" min="0" max="5" className="field" value={form.rating} onChange={set('rating')} /></Field>
        <Field label="Check-in"><input type="time" className="field" value={form.checkIn} onChange={set('checkIn')} /></Field>
        <Field label="Check-out"><input type="time" className="field" value={form.checkOut} onChange={set('checkOut')} /></Field>

        <Field label="Amenities" className="col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES.map((a) => {
              const on = form.amenities.includes(a);
              return (
                <button type="button" key={a}
                  onClick={() => setForm((f) => ({ ...f, amenities: on ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }))}
                  className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${on ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {a}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Hotel images (URLs)" className="col-span-2">
          <div className="flex gap-2">
            <input className="field" value={imgInput} onChange={(e) => setImgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())} placeholder="https://images.pexels.com/…" />
            <button type="button" onClick={addImage} className="btn-outline shrink-0"><Plus size={15} /> Add</button>
          </div>
          {form.images.length > 0 && (
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {form.images.map((src, i) => (
                <div key={src + i} className="group relative overflow-hidden rounded-lg border border-slate-200">
                  <img src={src} alt="" className="h-16 w-full object-cover" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 opacity-0 transition group-hover:opacity-100"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </Field>

        {error && <p className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </form>
    </Drawer>
  );
}
