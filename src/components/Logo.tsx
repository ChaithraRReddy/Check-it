export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Check.it">
      <path d="M65 12 A53 53 0 1 1 18 78" stroke="#0F3F27" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="65" cy="12" r="7" fill="#3EC98A" stroke="#0F3F27" strokeWidth="2" />
      <circle cx="18" cy="78" r="7" fill="#3EC98A" stroke="#0F3F27" strokeWidth="2" />
      <line x1="18" y1="78" x2="32" y2="64" stroke="#3EC98A" strokeWidth="3" strokeLinecap="round" />
      <text x="66" y="78" textAnchor="middle" fontSize={42} fill="#0F3F27" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}>₹</text>
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold text-forest ${className}`} style={{ letterSpacing: '-0.02em' }}>
      Check<span className="text-mint">.</span>it
    </span>
  )
}

export function Logo({ markSize = 28, wordClass = 'text-[18px]' }: { markSize?: number; wordClass?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <LogoMark size={markSize} />
      <Wordmark className={wordClass} />
    </span>
  )
}