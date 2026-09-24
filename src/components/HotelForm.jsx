import { useEffect, useRef, useState } from 'react';
import { Trash2, Plus, Upload, Loader2, ImagePlus } from 'lucide-react';
import { api, uploadFiles } from '../api';
import { Drawer, Field, Spinner } from './ui.jsx';

const AMENITIES = ['WiFi', 'Swimming Pool', 'Restaurant', 'Parking', 'Room Service', 'Air Conditioning', 'Gym', 'Spa'];

const blank = {
  name: '', city: '', location: '', starCategory: 4, description: '', address: '',
  phone: '', email: '', website: '', rating: 4.5, checkIn: '14:00', checkOut: '11:00',
  amenities: [], images: [], vendorId: '', status: 'Active',
};

export default function HotelForm({ open, hotel, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...blank, ...(hotel || {}) }));
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState('');

  const pickFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setUploading(true); setImgError('');
    try {
      const urls = await uploadFiles(files);
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setImgError(err.message);
    } finally {
      setUploading(false);
    }
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [cities, setCities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    Promise.all([api.cities(), api.locations(), api.vendors({ limit: 200, type: 'Hotel' })])
      .then(([c, l, v]) => { setCities(c); setLocations(l); setVendors(v.data || []); })
      .catch(() => {});
  }, []);
  const cityLocations = locations.filter((l) => (l.cityId?.name || '') === form.city);


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
        <Field label="City *">
          <select required className="field" value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, location: '' }))}>
            <option value="">Select a city…</option>
            {cities.map((c) => <option key={c._id} value={c.name}>{c.name}{c.state ? ` — ${c.state}` : ''}</option>)}
            {form.city && !cities.some((c) => c.name === form.city) && <option value={form.city}>{form.city}</option>}
          </select>
        </Field>
        <Field label="Vendor">
          <select className="field" value={form.vendorId || ''} onChange={set('vendorId')}>
            <option value="">Not linked</option>
            {vendors.map((v) => <option key={v._id} value={v._id}>{v.companyName}</option>)}
          </select>
        </Field>
        <Field label="Location / area *">
          <select required className="field" value={form.location} onChange={set('location')} disabled={!form.city}>
            <option value="">{form.city ? 'Select a location…' : 'Choose a city first'}</option>
            {cityLocations.map((l) => <option key={l._id} value={l.name}>{l.name}</option>)}
            {form.location && !cityLocations.some((l) => l.name === form.location) && <option value={form.location}>{form.location}</option>}
          </select>
        </Field>
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

        <Field label="Hotel images" className="col-span-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-[13px] font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-60">
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><ImagePlus size={17} /> Choose images to upload</>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickFiles} className="hidden" />
          <p className="mt-1.5 text-[11.5px] text-slate-500">JPG, PNG, WebP, GIF or AVIF · up to 5 MB each · select several at once.</p>
          {imgError && <p className="mt-1.5 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{imgError}</p>}
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
