import styles from "./login-atmosphere.module.css";

export function LoginAtmosphere() {
  return <div className={styles.atmosphere} aria-hidden="true" />;
}

export function LoginBrandScene() {
  return (
    <div className={styles.art} aria-hidden="true">
      <div className={styles.artMotion}>
        <svg viewBox="0 0 1600 1000" fill="none" className={styles.contours}>
          {Array.from({ length: 24 }, (_, index) => (
            <path
              key={index}
              d={`M-180 ${840 + index * 14} C220 ${1120 + index * 9} 390 ${160 + index * 12} 810 ${160 + index * 13} S1320 ${720 + index * 9} 1740 ${180 + index * 10}`}
              stroke="currentColor"
              strokeWidth={index % 6 === 0 ? 1.4 : 0.6}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
