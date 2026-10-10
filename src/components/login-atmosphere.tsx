import styles from "./login-atmosphere.module.css";

export function LoginAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={styles.ambient} />
      <div className={styles.grid} />
      <div className={styles.horizon} />
      <div className={styles.arc} />
      <div className={styles.arcInner} />
    </div>
  );
}

export function LoginBrandScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <svg viewBox="0 0 560 300" fill="none" className={styles.sceneSvg}>
        <defs>
          <radialGradient id="axia-ground">
            <stop stopColor="#d8b978" stopOpacity="0.13" />
            <stop offset="1" stopColor="#d8b978" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="280" cy="255" rx="181" ry="27" fill="url(#axia-ground)" />
        <g stroke="#aac3c3" strokeOpacity="0.1" strokeWidth="0.75">
          <path d="M76 251h408M113 270h334M280 242v46M208 248l-51 35M352 248l51 35" />
          <ellipse cx="280" cy="251" rx="130" ry="15" />
          <ellipse cx="280" cy="251" rx="71" ry="8" />
        </g>

        <g stroke="#d8b978" strokeOpacity="0.35" strokeWidth="0.75">
          <path d="M137 121h16M145 113v16M402 206h12M408 200v12" />
          <circle cx="379" cy="58" r="2" />
        </g>
      </svg>
      <div className={styles.orbit}>
        <svg viewBox="0 0 560 300" fill="none" className={styles.sceneSvg}>
          <defs>
            <linearGradient
              id="axia-orbit"
              x1="71"
              y1="176"
              x2="473"
              y2="117"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#d8b978" stopOpacity="0" />
              <stop offset="0.4" stopColor="#d8b978" stopOpacity="0.55" />
              <stop offset="1" stopColor="#a7c7c5" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <g stroke="url(#axia-orbit)">
            <ellipse
              cx="280"
              cy="150"
              rx="213"
              ry="77"
              transform="rotate(-16 280 150)"
            />
            <path
              d="M87 87c60-49 226-60 341 2M80 204c61 48 226 59 348-1"
              strokeOpacity="0.3"
            />
            <circle cx="96" cy="191" r="3" fill="#d8b978" stroke="none" />
            <circle cx="456" cy="97" r="2" fill="#adc9c5" stroke="none" />
          </g>
        </svg>
      </div>
      <div className={styles.monolith}>
        <svg viewBox="0 0 560 300" fill="none" className={styles.sceneSvg}>
          <defs>
            <linearGradient
              id="axia-metal"
              x1="194"
              y1="66"
              x2="341"
              y2="234"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f4e1b4" />
              <stop offset="0.38" stopColor="#b89b62" />
              <stop offset="0.65" stopColor="#ead29c" />
              <stop offset="1" stopColor="#8a7045" />
            </linearGradient>
            <linearGradient
              id="axia-depth"
              x1="245"
              y1="81"
              x2="350"
              y2="241"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#79908e" />
              <stop offset="1" stopColor="#263e45" />
            </linearGradient>
          </defs>
          <g strokeLinejoin="round">
            <path
              d="m273 63 18 7 75 160-18-7-69-139Z"
              fill="url(#axia-depth)"
              stroke="#a7c7c5"
              strokeOpacity="0.16"
            />
            <path d="m196 223 18 7 53-116-9-21Z" fill="#263c41" />
            <path
              d="m258 63-77 160h27l63-133 63 133h27L284 63a14 14 0 0 0-26 0Z"
              fill="url(#axia-metal)"
              stroke="#f4e1b4"
              strokeOpacity="0.55"
              strokeWidth="0.7"
            />
            <path
              d="m258 63-77 160M271 90l63 133"
              stroke="#fff0cd"
              strokeOpacity="0.7"
              strokeWidth="0.8"
            />
            <path
              d="M223 171h96M271 132v76M253 215h36"
              stroke="url(#axia-metal)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="m223 171-13 25h26l-13-25Zm96 0-13 25h26l-13-25Z"
              fill="#d8b978"
              fillOpacity="0.04"
              stroke="#dcc38e"
              strokeWidth="1.6"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
