import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { TopNav, HomeIndicator } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import styles from './EntryPoint.module.css';

/** True when Cognito env vars are not configured (local dev) */
const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;

/** Google "G" logo SVG */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z" />
      <path fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Apple logo SVG */
function AppleIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="#FFFFFF" aria-hidden="true">
      <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.71-1.75-3.29-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.82-.8-2.99-.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.27 1.23-2.5 1.25-2.57-.03-.01-2.4-.92-2.42-3.65l-.05-.08zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z" />
    </svg>
  );
}

/**
 * Entry Point screen — landing page with social login.
 * Connected to Cognito: redirects if already authenticated.
 * Dynamic content comes from airport config (Sprint 2).
 */
export function EntryPoint() {
  const { isAuthenticated, isLoading, login, redirectAfterAuth } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      redirectAfterAuth();
    }
  }, [isAuthenticated, redirectAfterAuth]);

  /** Dev bypass: skip Cognito, go straight to /airport */
  const handleLogin = useCallback(
    (provider: 'Google' | 'Apple') => {
      if (isDevBypass) {
        navigate('/airport');
      } else {
        login(provider);
      }
    },
    [login, navigate],
  );

  // Show a loading pulse while checking auth (skip in dev bypass)
  if (isLoading && !isDevBypass) {
    return (
      <div className={`${styles.screen} ${styles.loadingScreen}`}>
        <div className={styles.kickerDot} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Top Navigation */}
      <TopNav
        showLogo
        actions={[
          {
            icon: 'help-circle',
            onClick: () => { /* Help — future sprint */ },
            'aria-label': 'Help',
          },
        ]}
      />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.kicker}>
          <div className={styles.kickerDot} />
          <span className={styles.kickerText}>Malpensa · Milano</span>
        </div>

        <h1 className={styles.headline}>
          Split the{' '}
          <span className={styles.amberAccent}>€120</span>
          <br />
          Malpensa fare.
        </h1>

        <p className={styles.subtitle}>
          We match you with a traveler heading your way. No match, no charge — ever.
        </p>
      </section>

      {/* Savings Card */}
      <div className={styles.savingsCard}>
        <div className={styles.savingsIcon}>
          <MIcon name="sparkles" size={20} sw={2} />
        </div>
        <div>
          <div className={styles.savingsLabel}>You save up to</div>
          <div className={styles.savingsAmount}>€60.00</div>
          <div className={styles.savingsNote}>on every matched ride · fixed fare</div>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.dividerRow}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerLabel}>Get started</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Auth Buttons — connected to Cognito */}
      <div className={styles.authSection}>
        <button
          id="btn-google-login"
          className={styles.googleBtn}
          onClick={() => handleLogin('Google')}
          aria-label="Continue with Google"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <button
          id="btn-apple-login"
          className={styles.appleBtn}
          onClick={() => handleLogin('Apple')}
          aria-label="Continue with Apple"
        >
          <AppleIcon />
          <span>Continue with Apple</span>
        </button>
      </div>

      {/* Terms */}
      <div className={styles.terms}>
        <span>
          By continuing you agree to our{' '}
          <span className={styles.link}>Terms</span> and{' '}
          <span className={styles.link}>Privacy Policy</span>.
        </span>
        <div className={styles.signIn}>
          Already have an account?{' '}
          <span className={styles.signInLink}>Sign in</span>
        </div>
      </div>

      <div className={styles.spacer} />
      <HomeIndicator />
    </div>
  );
}
