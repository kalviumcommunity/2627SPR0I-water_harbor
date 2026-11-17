/**
 * Signature WaterDrop SVG component with animated expressions.
 * Three statuses:
 * - 'reported_unavailable': Coral sad drop with tear, bobs faster
 * - 'staff_confirmed_resolved': Mint smiling drop with sparkle
 * - 'no_recent_report': Lilac sleepy drop with resting face
 */
export function WaterDrop({ status = 'no_recent_report', size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const isUnavailable = status === 'reported_unavailable';
  const isResolved = status === 'staff_confirmed_resolved';

  const fillColor = isUnavailable ? '#ff5a4e' : isResolved ? '#35d99a' : '#c9b8ff';
  const bobClass = isUnavailable ? 'animate-bob-fast' : 'animate-bob';
  const label = isUnavailable
    ? 'Reported unavailable drop'
    : isResolved
    ? 'Staff-confirmed resolved drop'
    : 'No recent report drop';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size] || sizeMap.md} ${bobClass} ${className}`}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 64 74"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[2px_2px_0px_#10132b]"
      >
        {/* Main Droplet Body */}
        <path
          d="M32 4 C32 4, 10 32, 10 48 C10 60.15 19.85 70 32 70 C44.15 70 54 60.15 54 48 C54 32, 32 4 32 4 Z"
          fill={fillColor}
          stroke="#10132b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Highlight sheen */}
        <path
          d="M22 28 C18 36, 17 46, 19 54"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />

        {/* Expressions based on status */}
        {isUnavailable && (
          <g>
            {/* Sad downturned eyebrows */}
            <path d="M21 27 L28 29" stroke="#10132b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M43 27 L36 29" stroke="#10132b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Worried eyes */}
            <circle cx="25" cy="34" r="3.2" fill="#10132b" />
            <circle cx="39" cy="34" r="3.2" fill="#10132b" />

            {/* Sad mouth */}
            <path
              d="M24 48 Q32 38 40 48"
              stroke="#10132b"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Teardrop falling from left eye */}
            <path
              d="M17 38 C17 38, 14 43, 14 46 C14 47.7 15.3 49 17 49 C18.7 49 20 47.7 20 46 C20 43, 17 38 17 38 Z"
              fill="#d9f1ff"
              stroke="#10132b"
              strokeWidth="2"
            />
          </g>
        )}

        {isResolved && (
          <g>
            {/* Happy arch eyes */}
            <path
              d="M21 33 Q25 27 29 33"
              stroke="#10132b"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M35 33 Q39 27 43 33"
              stroke="#10132b"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {/* Blushing cheeks */}
            <ellipse cx="20" cy="40" rx="3.5" ry="2" fill="#ff5a4e" fillOpacity="0.4" />
            <ellipse cx="44" cy="40" rx="3.5" ry="2" fill="#ff5a4e" fillOpacity="0.4" />

            {/* Joyful open smile */}
            <path
              d="M23 41 Q32 53 41 41"
              stroke="#10132b"
              strokeWidth="3"
              strokeLinecap="round"
              fill="#10132b"
            />
            <path
              d="M26 43 Q32 50 38 43"
              fill="#ff5a4e"
            />

            {/* 4-point Sparkle Star */}
            <path
              d="M54 18 L55.5 22.5 L60 24 L55.5 25.5 L54 30 L52.5 25.5 L48 24 L52.5 22.5 Z"
              fill="#ffd23f"
              stroke="#10132b"
              strokeWidth="1.8"
            />
          </g>
        )}

        {!isUnavailable && !isResolved && (
          <g>
            {/* Sleeping closed curve eyes */}
            <path
              d="M21 34 Q25 39 29 34"
              stroke="#10132b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M35 34 Q39 39 43 34"
              stroke="#10132b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Calm little smile / sleepy dot */}
            <path
              d="M28 45 Q32 47 36 45"
              stroke="#10132b"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Little floating 'z' bubble */}
            <path
              d="M50 14 H55 L50 20 H55"
              stroke="#10132b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M44 22 H47 L44 26 H47"
              stroke="#10132b"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default WaterDrop;
