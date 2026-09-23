const SIZE = { sm: 'h-6', md: 'h-8', lg: 'h-10' };

/**
 * Brand wordmark for the admin app. The label sits under the logo so the
 * whole block fits the 240px sidebar without overflowing.
 */
export function Wordmark({ size = 'md', tag = 'Admin panel', className = '' }) {
  return (
    <span className={`block ${className}`}>
      <img src="/logo.png" alt="Holiday Along Hotels" width="560" height="121"
        className={`${SIZE[size] || SIZE.md} w-auto max-w-full select-none`} />
      {tag && (
        <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
          {tag}
        </span>
      )}
    </span>
  );
}
