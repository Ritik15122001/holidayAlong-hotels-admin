const SIZE = { sm: 'h-7', md: 'h-9', lg: 'h-11' };

/** Brand wordmark — orange "Holiday", navy "Along" with the rising swoosh. */
export function Wordmark({ size = 'md', tag = 'Admin', className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img src="/logo.png" alt="Holiday Along Hotels" width="560" height="121"
        className={`${SIZE[size] || SIZE.md} w-auto select-none`} />
      {tag && (
        <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700">
          {tag}
        </span>
      )}
    </span>
  );
}
