import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Building2, Loader2 } from 'lucide-react';
import { api } from '../api';
import { Modal, Field, Empty, StatusBadge, confirmDelete } from '../components/ui.jsx';
import { fetchStates, fetchCities } from '../lib/geo.js';
import Autocomplete from '../components/Autocomplete.jsx';
import { searchPlaces } from '../lib/places.js';

const CONFIG = {
  cities: { label: 'City', title: 'Cities', icon: Building2, hint: 'Pick a state, then a city from the free location directory' },
  locations: { label: 'Location', title: 'Locations', icon: MapPin, hint: 'Areas and landmarks inside a city — e.g. Police Bazar, Candolim Beach' },
};

export default function Places({ kind }) {
  const cfg = CONFIG[kind];
  const [rows, setRows] = useState(null);
  const [cities, setCities] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [list, cityList] = await Promise.all([api.list(kind), kind === 'locations' ? api.cities() : Promise.resolve([])]);
    setRows(list); setCities(cityList);
  };
  useEffect(() => { setRows(null); load(); }, [kind]); // eslint-disable-line

  const del = async (row) => {
    if (!confirmDelete(`“${row.name}”`)) return;
    await api.remove(kind, row._id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{cfg.title}</p>
          <p className="text-[12px] text-slate-500">{cfg.hint}</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus size={15} /> Add {cfg.label.toLowerCase()}</button>
      </div>

      <div className="card overflow-hidden">
        {rows === null ? (
          <div className="space-y-px">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100" />)}</div>
        ) : rows.length === 0 ? (
          <Empty icon={cfg.icon} title={`No ${cfg.title.toLowerCase()} yet`} sub={cfg.hint} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-slate-50"><tr>
                {(kind === 'cities' ? ['City', 'State', 'Status', ''] : ['Location', 'City', 'Status', '']).map((h, i) => <th key={i} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="td font-semibold text-slate-900">{row.name}</td>
                    <td className="td text-slate-600">
                      {kind === 'cities' ? (row.state || '—') : (row.cityId?.name || '—')}
                    </td>
                    <td className="td"><StatusBadge status={row.status} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setEditing(row)} title="Edit"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-brand-200 hover:text-brand-700"><Pencil size={15} /></button>
                        <button onClick={() => del(row)} title="Delete"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <PlaceForm kind={kind} row={editing} cities={cities} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function PlaceForm({ kind, row, cities, onClose, onSaved }) {
  const editing = Boolean(row._id);
  const isCity = kind === 'cities';
  const [form, setForm] = useState({
    name: row.name || '', state: row.state || '', country: row.country || 'India',
    cityId: row.cityId?._id || row.cityId || '', status: row.status || 'Active',
  });
  const [states, setStates] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isCity) return;
    fetchStates().then(setStates).catch((e) => setGeoError(e.message));
  }, [isCity]);

  const pickState = async (state) => {
    setForm((f) => ({ ...f, state, name: '' }));
    setOptions([]); setGeoError('');
    if (!state) return;
    setLoadingGeo(true);
    try { setOptions(await fetchCities(state)); }
    catch (e) { setGeoError(e.message); }
    finally { setLoadingGeo(false); }
  };

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = isCity
        ? { name: form.name.trim(), state: form.state, country: form.country, status: form.status }
        : { name: form.name.trim(), cityId: form.cityId, status: form.status };
      if (!body.name) throw new Error('Name is required');
      if (!isCity && !body.cityId) throw new Error('Please choose a city');
      if (editing) await api.update(kind, row._id, body);
      else await api.create(kind, body);
      onSaved();
    } catch (e) {
      setError(e.message.includes('duplicate') ? 'That entry already exists' : e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${editing ? 'Edit' : 'Add'} ${isCity ? 'city' : 'location'}`}
      footer={<>
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} Save
        </button>
      </>}>
      <div className="space-y-3.5">
        {isCity ? (
          <>
            <Field label="State">
              <select className="field" value={form.state} onChange={(e) => pickState(e.target.value)}>
                <option value="">Select a state…</option>
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City *">
              <Autocomplete
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                options={options}
                fetchOptions={(q) => searchPlaces(q, form.state)}
                placeholder={loadingGeo ? 'Loading cities…' : 'Start typing a city…'}
                emptyHint="Keep typing to search the map"
              />
              {geoError && <p className="mt-1.5 text-[11.5px] text-amber-700">{geoError} — you can still type the city by hand.</p>}
            </Field>
          </>
        ) : (
          <>
            <Field label="City *">
              <select className="field" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
                <option value="">Select a city…</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}{c.state ? ` — ${c.state}` : ''}</option>)}
              </select>
            </Field>
            <Field label="Location *">
              <Autocomplete
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                fetchOptions={(q) => searchPlaces(q, cities.find((c) => c._id === form.cityId)?.name || '')}
                placeholder="e.g. Police Bazar, Candolim Beach"
                emptyHint="Keep typing to search the map"
              />
            </Field>
          </>
        )}

        <Field label="Status">
          <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Active</option><option>Inactive</option>
          </select>
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
