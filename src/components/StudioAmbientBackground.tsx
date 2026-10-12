/** Декоративный фон сайта: сетка, свечение, wireframe-фигуры. */
export function StudioAmbientBackground() {
  return (
    <div className="studio-ambient" aria-hidden>
      <div className="studio-ambient__base" />
      <div className="studio-ambient__orb studio-ambient__orb--a" />
      <div className="studio-ambient__orb studio-ambient__orb--b" />
      <div className="studio-ambient__orb studio-ambient__orb--c" />
      <div className="studio-ambient__grid-floor" />
      <div className="studio-ambient__horizon" />

      <div className="studio-ambient__shape studio-ambient__shape--1">
        <WireCube />
      </div>
      <div className="studio-ambient__shape studio-ambient__shape--2">
        <WireIcosahedron />
      </div>
      <div className="studio-ambient__shape studio-ambient__shape--3">
        <WireTorus />
      </div>

      <div className="studio-ambient__scanlines" />
      <div className="studio-ambient__vignette" />
    </div>
  );
}

function WireCube() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" fill="none">
      <g
        stroke="url(#wireGrad)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.85"
      >
        <path d="M36 44 L84 44 L84 92 L36 92 Z" />
        <path d="M44 28 L92 28 L92 76 L44 76 Z" />
        <path d="M36 44 L44 28" />
        <path d="M84 44 L92 28" />
        <path d="M84 92 L92 76" />
        <path d="M36 92 L44 76" />
      </g>
      <defs>
        <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.75" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WireIcosahedron() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" fill="none">
      <g stroke="#a78bfa" strokeWidth="1" opacity="0.7">
        <polygon points="60,18 95,42 82,82 38,82 25,42" />
        <line x1="60" y1="18" x2="60" y2="102" />
        <line x1="25" y1="42" x2="95" y2="42" />
        <line x1="38" y1="82" x2="82" y2="82" />
        <line x1="60" y1="18" x2="38" y2="82" />
        <line x1="60" y1="18" x2="82" y2="82" />
        <line x1="25" y1="42" x2="60" y2="102" />
        <line x1="95" y1="42" x2="60" y2="102" />
      </g>
    </svg>
  );
}

function WireTorus() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" fill="none">
      <ellipse
        cx="60"
        cy="60"
        rx="42"
        ry="16"
        stroke="#2dd4bf"
        strokeWidth="1.1"
        opacity="0.65"
      />
      <ellipse
        cx="60"
        cy="60"
        rx="28"
        ry="38"
        stroke="#2dd4bf"
        strokeWidth="0.9"
        opacity="0.45"
        transform="rotate(35 60 60)"
      />
      <ellipse
        cx="60"
        cy="60"
        rx="28"
        ry="38"
        stroke="#a78bfa"
        strokeWidth="0.9"
        opacity="0.35"
        transform="rotate(-25 60 60)"
      />
    </svg>
  );
}
