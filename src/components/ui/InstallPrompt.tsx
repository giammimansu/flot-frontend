import { useEffect, useState } from 'react';
import { MBtn } from './MBtn';
import { MIcon } from './MIcon';
import styles from './InstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  /** Rendered inside Profile screen — no auto-show logic needed */
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [outcome, setOutcome] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome: result } = await deferredPrompt.userChoice;
    setOutcome(result);
    setDeferredPrompt(null);
    if (result === 'accepted') setInstalled(true);
  }

  // Installed: show confirmation row
  if (installed || outcome === 'accepted') {
    return (
      <div className={`${styles.row} ${className ?? ''}`}>
        <div className={styles.iconWrap}>
          <MIcon name="check" size={20} className={styles.iconSuccess} />
        </div>
        <div className={styles.text}>
          <span className={styles.label}>App installed</span>
          <span className={styles.sub}>FLOT is on your home screen</span>
        </div>
      </div>
    );
  }

  // iOS Safari: no beforeinstallprompt, show manual instructions
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.matchMedia('(display-mode: standalone)').matches;

  if (isIos && !deferredPrompt) {
    return (
      <div className={`${styles.card} ${className ?? ''}`}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <MIcon name="zap" size={20} className={styles.iconAmber} />
          </div>
          <div className={styles.text}>
            <span className={styles.label}>Add to Home Screen</span>
            <span className={styles.sub}>
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // No prompt available (already installed, or browser doesn't support)
  if (!deferredPrompt) return null;

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <MIcon name="zap" size={20} className={styles.iconAmber} />
        </div>
        <div className={styles.text}>
          <span className={styles.label}>Add to Home Screen</span>
          <span className={styles.sub}>
            Install FLOT for faster access and offline support
          </span>
        </div>
      </div>
      <MBtn
        variant="primary"
        small
        onClick={handleInstall}
      >
        Install app
      </MBtn>
    </div>
  );
}
