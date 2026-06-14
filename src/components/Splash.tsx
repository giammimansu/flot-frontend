import logoFull from '../assets/logo-splash.svg';
import styles from './Splash.module.css';

/** Full-screen launch splash shown during app boot. Displays the app version. */
export function Splash() {
  return (
    <div className={styles.splash} role="status" aria-live="polite" aria-label="Caricamento">
      <img src={logoFull} alt="Flot" className={styles.logo} />
      <div className={styles.spinner} />
      <span className={styles.version}>v{__APP_VERSION__}</span>
    </div>
  );
}
