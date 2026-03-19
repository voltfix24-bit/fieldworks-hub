/** Grounding / earthing symbol as SVG icon */
export function GroundingIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="2" x2="12" y2="10" />
      <line x1="5" y1="10" x2="19" y2="10" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="11" y1="22" x2="13" y2="22" />
    </svg>
  );
}

/** Animated grounding loader */
export function GroundingLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="grounding-pulse">
          <GroundingIcon size={32} className="text-primary" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground animate-pulse">Laden…</p>
    </div>
  );
}
