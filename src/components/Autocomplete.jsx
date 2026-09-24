import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/**
 * Text field with a suggestion list. `options` are matched locally and
 * `fetchOptions` (optional) adds remote results after a short pause.
 * The value is always free text, so anything can still be typed.
 */
export default function Autocomplete({
  value, onChange, options = [], fetchOptions, placeholder = '',
  icon: Icon, className = '', inputClassName = 'field', disabled = false, emptyHint,
}) {
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);

  const needle = String(value || '').trim().toLowerCase();
  const local = options.filter((o) => !needle || o.toLowerCase().includes(needle));
  const list = [...new Set([...local, ...remote])].slice(0, 8);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!fetchOptions || needle.length < 3) { setRemote([]); return; }
    let live = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetchOptions(needle);
        if (live) setRemote(res || []);
      } catch { if (live) setRemote([]); }
      finally { if (live) setLoading(false); }
    }, 350);
    return () => { live = false; clearTimeout(t); setLoading(false); };
  }, [needle, fetchOptions]);

  const pick = (v) => { onChange(v); setOpen(false); setActive(-1); };

  const onKey = (e) => {
    if (!open || !list.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % list.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + list.length) % list.length); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(list[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      {Icon && <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input
        className={`${inputClassName} ${Icon ? '!pl-9' : ''}`}
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}

      {open && (list.length > 0 || emptyHint) && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {list.map((o, i) => (
            <li key={o}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition ${
                  i === active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                <span className="truncate">{o}</span>
                {value === o && <Check size={13} className="shrink-0 text-brand-600" />}
              </button>
            </li>
          ))}
          {list.length === 0 && emptyHint && (
            <li className="px-3 py-2 text-[12.5px] text-slate-400">{emptyHint}</li>
          )}
        </ul>
      )}
    </div>
  );
}
