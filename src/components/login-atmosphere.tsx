import Image from "next/image";
import styles from "./login-atmosphere.module.css";

export function LoginAtmosphere() {
  return <div className={styles.atmosphere} aria-hidden="true" />;
}

export function LoginBrandScene() {
  return (
    <div className={styles.art} aria-hidden="true">
      <div className={styles.artMotion}>
        <Image
          src="/brand/axia-aperture-v1.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 60vw"
          className={styles.artImage}
        />
      </div>
      <div className={styles.artShade} />
    </div>
  );
}
