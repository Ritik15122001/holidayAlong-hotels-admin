import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, ArrowRight } from 'lucide-react';
import 'react-day-picker/style.css';

const parse = (s) => (s ? new Date(`${s}T00:00:00`) : undefined);
const fmt = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');
const label = (d) => (d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/**
 * Validity picker. Two dates chosen on one calendar, so the range is
 * obvious and the end can never land before the start.
 */
export default function DateRange({ from, to, onChange, placeholder = 'Pick a date range' }) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(2);
  const [flip, setFlip] = useState(false);
  const [offset, setOffset] = useState(0);
  const boxRef = useRef(null);
  const popRef = useRef(null);
  const range = { from: parse(from), to: parse(to) };

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  // keep the popover inside the viewport
  useEffect(() => {
    if (!open || !popRef.current) return;
    setOffset(0);
    const id = requestAnimationFrame(() => {
      const r = popRef.current?.getBoundingClientRect();
      if (!r) return;
      const pad = 12;
      if (r.right > window.innerWidth - pad) setOffset(Math.round(window.innerWidth - pad - r.right));
      else if (r.left < pad) setOffset(Math.round(pad - r.left));
    });
    return () => cancelAnimationFrame(id);
  }, [open, months, flip]);

  const toggle = () => {
    if (!open && boxRef.current) {
      const r = boxRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setMonths(window.innerWidth >= 640 && Math.max(below, r.top) >= 380 ? 2 : 1);
      setFlip(below < r.top);
    }
    setOpen((v) => !v);
  };

  const pick = (next) => {
    if (!next?.from) return;
    const end = next.to && next.to < next.from ? undefined : next.to;
    onChange({ startDate: fmt(next.from), endDate: fmt(end) });
    if (next.from && end) setOpen(false);
  };

  const nights = range.from && range.to ? Math.round((range.to - range.from) / 864e5) : 0;

  return (
    <div ref={boxRef} className="relative">
      <button type="button" onClick={toggle} className="field flex w-full items-center gap-2 text-left">
        <CalendarDays size={15} className="shrink-0 text-brand-600" />
        {range.from || range.to ? (
          <span className="text-[13px] text-slate-800">
            {label(range.from)} <ArrowRight size={11} className="inline -mt-0.5 text-slate-400" /> {label(range.to)}
          </span>
        ) : <span className="text-[13px] text-slate-400">{placeholder}</span>}
        {nights > 0 && <span className="ml-auto shrink-0 text-[11px] font-semibold text-slate-400">{nights}d</span>}
      </button>

      {open && (
        <div ref={popRef} style={{ marginLeft: offset }}
          className={`absolute left-0 z-50 max-h-[78vh] max-w-[calc(100vw-1.5rem)] overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-lift ${flip ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <DayPicker
            mode="range"
            numberOfMonths={months}
            selected={range}
            onSelect={pick}
            defaultMonth={range.from || new Date()}
            showOutsideDays
            modifiersClassNames={{
              selected: 'rdp-ha-selected',
              range_start: 'rdp-ha-edge',
              range_end: 'rdp-ha-edge',
              range_middle: 'rdp-ha-middle',
              today: 'rdp-ha-today',
            }}
          />
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2.5">
            <p className="text-[12px] text-slate-500">
              {nights > 0 ? `${nights} day${nights > 1 ? 's' : ''} of validity` : 'Pick the first day the rate applies'}
            </p>
            <button type="button" onClick={() => setOpen(false)} className="btn-primary !px-4 !py-1.5 !text-[12px]">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
