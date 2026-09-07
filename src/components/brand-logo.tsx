interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export default function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="ScoutIQ">
      <svg
        viewBox="0 0 48 48"
        role="img"
        aria-label="ScoutIQ radar mark"
        className={`${compact ? "h-9 w-9" : "h-11 w-11"} shrink-0 drop-shadow-[0_10px_22px_rgba(61,220,132,0.24)]`}
      >
        <rect width="48" height="48" rx="14" fill="#3ddc84" />
        <circle cx="24" cy="24" r="13" fill="none" stroke="#07101c" strokeWidth="1.5" opacity="0.32" />
        <circle cx="24" cy="24" r="7" fill="none" stroke="#07101c" strokeWidth="1.5" opacity="0.42" />
        <path d="M24 24 35.5 13.5" stroke="#07101c" strokeWidth="2" strokeLinecap="round" />
        <path d="M15.5 29.5c1.7 3.1 4.5 4.8 8.4 4.8 4.8 0 8.2-2.2 8.2-5.7 0-3.1-2.1-4.7-6.8-5.8l-2.9-.7c-2.7-.7-3.8-1.4-3.8-2.8 0-1.5 1.5-2.6 4-2.6 2.8 0 4.9 1 6.2 3" fill="none" stroke="#07101c" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="35.5" cy="13.5" r="2.8" fill="#fff" />
      </svg>
      <div className="leading-none">
        <p className={`${compact ? "text-base" : "text-lg"} font-display font-bold tracking-[-0.035em] text-white`}>
          Scout<span className="text-accent">IQ</span>
        </p>
        <p className={`${compact ? "text-[8px]" : "text-[9px]"} mt-1 font-semibold uppercase tracking-[0.22em] text-text-faint`}>
          Recruitment intelligence
        </p>
      </div>
    </div>
  );
}
