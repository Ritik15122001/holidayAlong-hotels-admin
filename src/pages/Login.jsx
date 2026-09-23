import { useState } from 'react';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Wordmark } from '../components/Logo.jsx';
import { useAuth } from '../store/useAdmin';

export default function Login() {
  const login = useAuth((s) => s.login);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(form.username, form.password); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-white p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-lift">
        <div className="mb-5"><Wordmark /></div>
        <h1 className="text-lg font-bold text-slate-900">Sign in</h1>
        <p className="mb-5 text-[13px] text-slate-500">Sign in to manage hotels, rates and leads.</p>
        <div className="space-y-3">
          <div>
            <label className="label">Username</label>
            <div className="relative">
              <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required autoFocus autoComplete="username" className="field !pl-9" placeholder="Your username"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required type={show ? 'text' : 'password'} autoComplete="current-password"
                className="field !pl-9 !pr-9" placeholder="Your password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
        <button disabled={busy} className="btn-primary mt-5 w-full !py-3 disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />} {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
