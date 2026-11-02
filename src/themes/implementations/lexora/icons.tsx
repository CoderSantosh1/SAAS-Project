// Lexora's line icons, from the original design.
type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const ArrowRight = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Phone = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" />
  </svg>
);

export const Mail = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const Pin = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const Clock = ({ className }: IconProps) => (
  <svg {...base} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Star = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
  </svg>
);

export const Quote = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
    <path d="M10 36c-3 0-6-3-6-8 0-9 6-16 14-18l1 3c-5 2-8 6-8 10 3 0 6 3 6 6.5S14 36 10 36zm22 0c-3 0-6-3-6-8 0-9 6-16 14-18l1 3c-5 2-8 6-8 10 3 0 6 3 6 6.5S36 36 32 36z" />
  </svg>
);

export const Pillar = ({ className }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="currentColor" className={className} aria-hidden="true">
    <path d="M4 7h32v3H4zM6 4h28l2 3H4zM7 11h26v2H7z" />
    <path d="M9 14h3v19H9zM15.5 14h3v19h-3zM21.5 14h3v19h-3zM28 14h3v19h-3z" />
    <path d="M7 33h26v2H7zM4 35.5h32V38H4z" />
  </svg>
);

export const PRACTICE_ICONS = ["briefcase", "scales", "family", "home", "doc"] as const;
export type PracticeIconName = (typeof PRACTICE_ICONS)[number];

export function PracticeIcon({ name, className }: IconProps & { name: PracticeIconName }) {
  const paths: Record<PracticeIconName, React.ReactNode> = {
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 12h18M11 12v2h2v-2" />
      </>
    ),
    scales: (
      <>
        <path d="M12 3v18M7 21h10M5 6h14M12 4.5l0 1.5" />
        <path d="M5 6l-3 7a3 3 0 006 0zM19 6l-3 7a3 3 0 006 0z" />
      </>
    ),
    family: (
      <>
        <circle cx="8" cy="7" r="2.5" />
        <circle cx="16" cy="7" r="2.5" />
        <circle cx="12" cy="12" r="2" />
        <path d="M3 19c0-3 2.2-5.5 5-5.5M21 19c0-3-2.2-5.5-5-5.5M8 20c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5" />
      </>
    ),
    home: (
      <>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10M10 20v-6h4v6" />
      </>
    ),
    doc: (
      <>
        <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" />
        <path d="M14 3v5h5M8.5 12h7M8.5 15h7M8.5 18h4" />
      </>
    ),
  };
  return (
    <svg {...base} className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
