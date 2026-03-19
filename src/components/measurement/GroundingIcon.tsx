/** Grounding / earthing symbol — clean technical icon */
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
      <line x1="12" y1="3" x2="12" y2="10" />
      <line x1="5" y1="10" x2="19" y2="10" />
      <line x1="7.5" y1="14" x2="16.5" y2="14" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

/** Animated grounding loader — subtle ripple */
export function GroundingLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center grounding-ripple">
        <div className="grounding-pulse">
          <GroundingIcon size={24} className="text-primary" />
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground tracking-wide">Laden…</span>
    </div>
  );
}
