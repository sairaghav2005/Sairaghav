import React from 'react';

export default function SentinelLogo({ size = 'default', showText = true }) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 36 : 28;

  return (
    <div className="flex items-center gap-3">
      {/* Bespoke Classy Cyber Defense Crest */}
      <div className="relative flex-shrink-0 group">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="coreGlow" x1="16" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="125%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1e3a8a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Outer Shield Boundary */}
          <path
            d="M24 4L7 11V22C7 33.2 14.3 43.1 24 45.8C33.7 43.1 41 33.2 41 22V11L24 4Z"
            fill="url(#shieldGrad)"
            filter="url(#shadowFilter)"
          />

          {/* Inner Inset Facet */}
          <path
            d="M24 7.5L10 13.5V22C10 31.4 16 39.8 24 42.2C32 39.8 38 31.4 38 22V13.5L24 7.5Z"
            fill="#ffffff"
            fillOpacity="0.12"
          />

          {/* Center Sentinel Core Diamond & Cross-Hatch Grid */}
          <path
            d="M24 13L32 21L24 29L16 21L24 13Z"
            fill="url(#coreGlow)"
          />

          {/* Network Node Lines */}
          <line x1="24" y1="4" x2="24" y2="13" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="24" y1="29" x2="24" y2="44" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="7" y1="21" x2="16" y2="21" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="32" y1="21" x2="41" y2="21" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />

          {/* Inner Pulsing Radar Core */}
          <circle cx="24" cy="21" r="3.5" fill="#ffffff" />
          <circle cx="24" cy="21" r="1.5" fill="#0284c7" />

          {/* Perimeter Corner Node Accents */}
          <circle cx="16" cy="21" r="1.8" fill="#93c5fd" />
          <circle cx="32" cy="21" r="1.8" fill="#93c5fd" />
          <circle cx="24" cy="13" r="1.8" fill="#93c5fd" />
          <circle cx="24" cy="29" r="1.8" fill="#93c5fd" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wider text-slate-900 leading-tight">
              SENTINEL
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 rounded uppercase">
              DEFENSE
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 leading-none mt-0.5">
            Intrusion Network
          </span>
        </div>
      )}
    </div>
  );
}
