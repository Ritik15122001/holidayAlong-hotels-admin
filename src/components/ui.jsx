import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`flex h-full w-full ${width} flex-col bg-white shadow-lift`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${width} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lift`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export const Field = ({ label, className = '', children }) => (
  <div className={className}><label className="label">{label}</label>{children}</div>
);

export const Pager = ({ page, pages, onChange }) =>
  pages > 1 ? (
    <div className="flex items-center justify-center gap-1.5 py-4">
      <PBtn disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={15} /></PBtn>
      {Array.from({ length: pages }).map((_, i) => (
        <PBtn key={i} active={page === i + 1} onClick={() => onChange(i + 1)}>{i + 1}</PBtn>
      ))}
      <PBtn disabled={page === pages} onClick={() => onChange(page + 1)}><ChevronRight size={15} /></PBtn>
    </div>
  ) : null;

const PBtn = ({ children, active, disabled, onClick }) => (
  <button disabled={disabled} onClick={onClick}
    className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2.5 text-[13px] font-semibold transition disabled:opacity-35 ${
      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{children}</button>
);

export const Spinner = () => <Loader2 size={15} className="animate-spin" />;

export const Empty = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    {Icon && <Icon size={30} className="mb-3 text-slate-300" />}
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {sub && <p className="mt-1 text-[13px] text-slate-500">{sub}</p>}
  </div>
);

export const StatusBadge = ({ status }) => (
  <span className={status === 'Active' ? 'badge-active' : 'badge-inactive'}>{status}</span>
);

export function confirmDelete(what) {
  return window.confirm(`Delete ${what}? This cannot be undone.`);
}
