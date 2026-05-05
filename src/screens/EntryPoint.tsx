import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { TopNav, HomeIndicator } from '../components/layout';
import { TabBar } from '../components/layout/TabBar';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { fetchAirportStats } from '../services/airports';
import { useCarousel } from '../hooks/useCarousel';
import styles from './EntryPoint.module.css';

const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
const STATS_TIMEOUT_MS = 2000;

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

function AppleIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="#FFFFFF" aria-hidden="true">
      <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.71-1.75-3.29-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.82-.8-2.99-.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.27 1.23-2.5 1.25-2.57-.03-.01-2.4-.92-2.42-3.65l-.05-.08zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z" />
    </svg>
  );
}

/** Animated savings counter — counts from (target-200) to target in 1200ms */
function SavingsCounter({ targetCents }: { targetCents: number }) {
  const formatter = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const [displayCents, setDisplayCents] = useState(targetCents - 20000);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = targetCents - 20000;
    const end = targetCents;
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCents(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [targetCents]);

  return (
    <span className={styles.savingsAmount}>
      {formatter.format(displayCents / 100)}
    </span>
  );
}

const HOW_IT_WORKS = [
  {
    icon: 'plane-landing' as const,
    variant: 'amber' as const,
    title: 'Add your flight details',
    sub: 'Terminal, destination, arrival time',
    guide: null,
  },
  {
    icon: 'search' as const,
    variant: 'amber' as const,
    title: 'We search for your ride partner',
    sub: "We'll notify you as soon as we find a match",
    guide: null,
  },
  {
    icon: 'map-pin' as const,
    variant: 'success' as const,
    title: 'Meet at the airport & split the fare',
    sub: "Pay the driver together. We don't touch the fare.",
    guide: null,
  },
];

const AVATAR_GRADIENTS: Record<string, string> = {
  A: 'linear-gradient(135deg, #94A3B8, #64748B)',
  B: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  C: 'linear-gradient(135deg, #6EE7B7, #059669)',
  D: 'linear-gradient(135deg, #FCA5A5, #DC2626)',
  E: 'linear-gradient(135deg, #93C5FD, #2563EB)',
};

const PLACEHOLDER_MATCHES = [
  { id: 1, name: 'Marco R.',   zone: 'Navigli',      area: 'Milano Sud',    terminal: 'T1', timing: 'Just now',  avatarSeed: 'A' },
  { id: 2, name: 'Sofia B.',   zone: 'Centrale',     area: 'Milano Centro', terminal: 'T2', timing: '2 min ago', avatarSeed: 'B' },
  { id: 3, name: 'Luca M.',    zone: 'CityLife',     area: 'Milano Ovest',  terminal: 'T1', timing: 'Just now',  avatarSeed: 'C' },
  { id: 4, name: 'Giulia F.',  zone: 'Isola',        area: 'Milano Nord',   terminal: 'T2', timing: '4 min ago', avatarSeed: 'D' },
  { id: 5, name: 'Thomas K.',  zone: 'Città Studi',  area: 'Milano Est',    terminal: 'T1', timing: 'Just now',  avatarSeed: 'E' },
];

interface PlaceholderMatch {
  id: number;
  name: string;
  zone: string;
  area: string;
  terminal: string;
  timing: string;
  avatarSeed: string;
}

function MatchCard({ match, index, total }: { match: PlaceholderMatch; index: number; total: number }) {
  return (
    <div className={styles.matchCard}>
      <div className={styles.matchKicker}>
        <div className={styles.matchKickerLeft}>
          <MIcon name="eye" size={11} sw={2} />
          <span>Someone is heading your way</span>
        </div>
        <span className={styles.matchIndicator}>{index + 1}/{total}</span>
      </div>
      <div className={styles.matchRow}>
        <div
          className={styles.matchAvatar}
          style={{ background: AVATAR_GRADIENTS[match.avatarSeed] }}
          aria-hidden="true"
        />
        <div className={styles.matchInfo}>
          <div className={styles.matchName}>{match.name}</div>
          <div className={styles.matchZone}>{match.zone} · {match.area}</div>
          <div className={styles.matchTerminal}>
            <span className={styles.matchLiveDot} aria-hidden="true" />
            Terminal {match.terminal} · {match.timing}
          </div>
        </div>
      </div>
      <div className={styles.matchDivider} />
      <div className={styles.matchLock}>
        <MIcon name="lock" size={14} sw={2} />
        <div>
          <div className={styles.matchLockLine1}>Log in to unlock their contact</div>
          <div className={styles.matchLockLine2}>and your exact meeting point</div>
        </div>
      </div>
    </div>
  );
}

function MatchCarousel() {
  const current = useCarousel(PLACEHOLDER_MATCHES.length);
  return (
    <div className={styles.carouselOuter}>
      <div className={styles.carouselWrapper}>
        {PLACEHOLDER_MATCHES.map((match, i) => (
          <div
            key={match.id}
            className={styles.cardSlot}
            style={{
              opacity: i === current ? 1 : 0,
              position: i === 0 ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
              transition: 'opacity 500ms var(--ease-out)',
              pointerEvents: i === current ? 'auto' : 'none',
            }}
          >
            <MatchCard match={match} index={i} total={PLACEHOLDER_MATCHES.length} />
          </div>
        ))}
      </div>
      <div className={styles.dots} aria-hidden="true">
        {PLACEHOLDER_MATCHES.map((_, i) => (
          <div key={i} className={i === current ? `${styles.dot} ${styles.dotActive}` : styles.dot} />
        ))}
      </div>
    </div>
  );
}

function AuthenticatedCTA() {
  const navigate = useNavigate();
  const selectedAirport = useAirportStore((s) => s.selectedAirport);

  const handleFindRide = () => {
    navigate(selectedAirport ? '/check-in' : '/airport');
  };

  return (
    <div className={styles.authSection}>
      <MBtn variant="primary" icon="search" onClick={handleFindRide}>
        Find a ride partner
      </MBtn>
    </div>
  );
}

export function EntryPoint() {
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const navigate = useNavigate();
  const selectedAirport = useAirportStore((s) => s.selectedAirport);
  const baseFare = selectedAirport?.baseFare ?? 12000; // cents, fallback MXP default
  const halfSaveEur = Math.round(baseFare / 2 / 100);
  const savingsFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: selectedAirport?.currency ?? 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const savingsDisplay = savingsFormatter.format(halfSaveEur);

  const [savingsCents, setSavingsCents] = useState<number | null>(null);
  const [weeklyMatches, setWeeklyMatches] = useState<number | null>(null);

  useEffect(() => {
    const statsAirport = selectedAirport?.code ?? 'MXP';
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setSavingsCents(null);
    }, STATS_TIMEOUT_MS);

    fetchAirportStats(statsAirport)
      .then((stats) => {
        clearTimeout(timer);
        if (!cancelled) {
          setSavingsCents(stats.totalSavingsMonth);
          if (stats.weeklyMatches >= 5) setWeeklyMatches(stats.weeklyMatches);
        }
      })
      .catch(() => {
        clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedAirport?.code]);

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

  if (isLoading && !isDevBypass) {
    return (
      <div className={`${styles.screen} ${styles.loadingScreen}`}>
        <div className={styles.kickerDot} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <TopNav
        showLogo
        showAvatar={isAuthenticated}
        actions={[
          {
            icon: 'help-circle',
            onClick: () => { /* Help — future sprint */ },
            'aria-label': 'Help',
          },
        ]}
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.kicker}>
          <div className={styles.kickerDot} />
          <span className={styles.kickerText}>Malpensa · Milano</span>
        </div>

        <h1 className={styles.headline}>
          {isAuthenticated && user?.firstName
            ? <>Welcome back, {user.firstName}.<br />Ready to split?</>
            : <>Plan your shared ride<br />from the airport.</>
          }
        </h1>

        <p className={styles.heroSavings}>
          Save up to {savingsDisplay} on every ride
        </p>

        <p className={styles.subtitle}>
          Add your flight, we'll find a traveler heading your way. You share a standard taxi together —{' '}
          <strong>we don't drive you.</strong>
        </p>
      </section>

      {/* Live Savings Counter */}
      {savingsCents !== null && (
        <div className={styles.savingsCard}>
          <div className={styles.savingsIconWrap}>
            <MIcon name="sparkles" size={20} sw={2} />
          </div>
          <div className={styles.savingsBody}>
            <div className={styles.savingsLabel}>TRAVELERS HAVE SAVED</div>
            <div className={styles.savingsRow}>
              <SavingsCounter targetCents={savingsCents} />
              <span className={styles.savingsPulseDot} aria-hidden="true" />
            </div>
            <div className={styles.savingsNote}>since launch at Malpensa</div>
            {weeklyMatches !== null && (
              <div className={styles.weeklyMatches}>{weeklyMatches} travelers matched this week</div>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className={styles.howCard}>
        <div className={styles.howLabel}>How it works</div>
        {HOW_IT_WORKS.map((step, i) => (
          <div key={step.title}>
            <div className={styles.howStep}>
              <div className={step.variant === 'success' ? styles.howIconSuccess : styles.howIconAmber}>
                <MIcon name={step.icon} size={18} sw={2} />
              </div>
              <div className={styles.howContent}>
                <div className={styles.howTitle}>{step.title}</div>
                <div className={styles.howSub}>{step.sub}</div>
                {step.guide && (
                  <div className={styles.howGuide}>
                    <MIcon name="navigation" size={11} sw={2} />
                    <span>{step.guide}</span>
                  </div>
                )}
              </div>
            </div>
            {i < HOW_IT_WORKS.length - 1 && (
              <div className={styles.stepConnector} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* Match Carousel — only for non-authenticated users */}
      {!isAuthenticated && <MatchCarousel />}

      {/* Guarantee banner */}
      <div className={styles.guaranteeBanner}>
        <div className={styles.guaranteeIcon}>
          <MIcon name="shield" size={18} sw={2} />
        </div>
        <div>
          <div className={styles.guaranteeTitle}>No match? No charge. Ever.</div>
          <div className={styles.guaranteeSub}>We only connect you — zero taxi risk</div>
        </div>
      </div>

      {/* Pricing hook */}
      <p className={styles.pricingHook}>
        Standard Malpensa taxi:{' '}
        <span className={styles.strikethrough}>€{Math.round(baseFare / 100)}</span>.{' '}
        Your share with FLOT:{' '}
        <span className={styles.savingsHighlight}>€{halfSaveEur}</span>.
      </p>

      {/* CTA */}
      {isAuthenticated ? (
        <AuthenticatedCTA />
      ) : (
        <>
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

          <div className={styles.privacyNote}>
            <MIcon name="lock" size={12} sw={2} />
            <span>We never post on your behalf or share your data.</span>
          </div>

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
        </>
      )}

      <div className={styles.spacer} />
      <div className={styles.tabBarSpacer} />
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
