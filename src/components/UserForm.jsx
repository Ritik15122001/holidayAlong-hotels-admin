import { useState } from 'react';
import { Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Drawer, Field } from './ui.jsx';

const BLANK = { name: '', email: '', phone: '', password: '', status: 'Active' };

const makePassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/** Create a website login, or edit one. Password is optional when editing. */
export default function UserForm({ open, user, onClose, onSaved }) {
  const editing = Boolean(user?._id);
  const [form, setForm] = useState(BLANK);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(null);

  // reset the fields whenever a different record is opened
  if (open && key !== (user?._id || 'new')) {
    setKey(user?._id || 'new');
    setForm(editing ? { ...BLANK, ...user, password: '' } : BLANK);
    setError(''); setShow(false);
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) await api.updateUser(user._id, body);
      else await api.createUser(body);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit user' : 'Add user'}
      subtitle={editing ? user.email : 'Creates a login for the customer website'}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy && <Loader2 size={15} className="animate-spin" />} {editing ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Full name *">
          <input className="field" placeholder="e.g. Ritik Kumar" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email *">
          <input type="email" className="field" placeholder="guest@email.com" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Phone">
          <input className="field" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
        </Field>

        <Field label={editing ? 'New password (leave blank to keep the current one)' : 'Password *'}>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} autoComplete="new-password"
              className="field !pr-20" placeholder={editing ? 'Unchanged' : 'At least 6 characters'}
              value={form.password} onChange={set('password')}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
              <button type="button" onClick={() => { setForm((f) => ({ ...f, password: makePassword() })); setShow(true); }}
                title="Generate a password" className="rounded p-1 text-slate-400 hover:text-slate-700"><RefreshCw size={14} /></button>
              <button type="button" onClick={() => setShow((v) => !v)}
                title={show ? 'Hide' : 'Show'} className="rounded p-1 text-slate-400 hover:text-slate-700">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11.5px] text-slate-500">Share this with the guest — they sign in on the website with their email and this password.</p>
        </Field>

        <Field label="Status">
          <select className="field" value={form.status} onChange={set('status')}>
            <option>Active</option>
            <option>Blocked</option>
          </select>
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
      </div>
    </Drawer>
  );
}
