import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { fetchAirportStats } from '../services/airports';
import { ProfileMenu } from '../components/layout/ProfileMenu';
import styles from './EntryPoint.module.css';

const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
const STATS_TIMEOUT_MS = 2000;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="19" viewBox="0 0 18 22" fill="currentColor" aria-hidden="true">
      <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.71-1.75-3.29-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.82-.8-2.99-.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.27 1.23-2.5 1.25-2.57-.03-.01-2.4-.92-2.42-3.65l-.05-.08zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const FEED_EVENTS = [
  { icon: '✅', cls: 'green', text: 'Match trovato — Milano Sud', time: '2 min fa' },
  { icon: '✈️', cls: 'amber', text: 'Nuovo viaggio pianificato — Milano Centro', time: '7 min fa' },
  { icon: '✅', cls: 'green', text: 'Match trovato — Porta Garibaldi', time: '18 min fa' },
  { icon: '📅', cls: 'blue', text: 'Viaggio schedulato — Nord Milano', time: '34 min fa' },
  { icon: '✈️', cls: 'amber', text: 'Nuovo viaggio pianificato — Milano Est', time: '51 min fa' },
  { icon: '✅', cls: 'green', text: 'Match trovato — Navigli', time: '1 ora fa' },
  { icon: '📅', cls: 'blue', text: 'Viaggio schedulato — sabato mattina', time: '2 ore fa' },
  { icon: '👤', cls: 'gray', text: 'Nuovo membro verificato nella community', time: '3 ore fa' },
] as const;

function LiveFeed() {
  const [items, setItems] = useState(FEED_EVENTS.slice(0, 4).map((e, i) => ({ ...e, id: i, fresh: false })));
  const [vCount, setVCount] = useState(14);
  const [rCount, setRCount] = useState(182);
  const [vBump, setVBump] = useState(false);
  const [rBump, setRBump] = useState(false);
  const idxRef = useRef(4);

  useEffect(() => {
    const timer = setInterval(() => {
      const ev = FEED_EVENTS[idxRef.current % FEED_EVENTS.length];
      idxRef.current++;
      setItems((prev) => [{ ...ev, id: Date.now(), fresh: true }, ...prev.slice(0, 4)]);
      setVCount((v) => v + 1);
      setRCount((r) => r + 60);
      setVBump(true); setTimeout(() => setVBump(false), 350);
      setRBump(true); setTimeout(() => setRBump(false), 350);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.liveSection}>
      <div className={styles.wrap}>
        <div className={styles.liveHeader}>
          <div className={styles.liveLabel}>
            <span className={styles.liveDot} />
            Aggiornato in tempo reale
          </div>
          <div className={styles.liveStats}>
            <div className={styles.liveStat}>
              <div className={`${styles.liveStatVal} ${vBump ? styles.liveStatBump : ''}`}>{vCount}</div>
              <div className={styles.liveStatLbl}>questa settimana</div>
            </div>
            <div className={styles.liveStat}>
              <div className={`${styles.liveStatVal} ${rBump ? styles.liveStatBump : ''}`}>€{rCount}</div>
              <div className={styles.liveStatLbl}>risparmiati</div>
            </div>
          </div>
        </div>
        <div className={styles.feedList}>
          {items.map((ev) => (
            <div key={ev.id} className={`${styles.feedItem} ${ev.fresh ? styles.feedItemFresh : ''}`}>
              <div className={`${styles.feedIcon} ${styles[`feedIcon_${ev.cls}` as keyof typeof styles]}`}>{ev.icon}</div>
              <div className={styles.feedText}>{ev.text}</div>
              <div className={styles.feedTime}>{ev.fresh ? 'proprio ora' : ev.time}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SavingsCounter({ targetCents }: { targetCents: number }) {
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCents(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [targetCents]);

  return (
    <span className={styles.savingsAmount}>
      {'€' + Math.round(displayCents / 100).toLocaleString('it-IT')}
    </span>
  );
}

const FAQ_ITEMS = [
  {
    q: 'E se il mio volo è in ritardo?',
    a: 'Flot considera finestre temporali di ±60 minuti. Se i piani saltano, puoi cancellare gratuitamente prima dell\'incontro.',
  },
  {
    q: 'I tassisti si arrabbiano?',
    a: 'No. Il tassista riceve la sua intera tariffa (es. €120), semplicemente la pagate in due. Siamo alleati dei taxi, non competitor.',
  },
  {
    q: 'Quanto costa il servizio?',
    a: '€0,99 una tantum solo se il match viene trovato e tu lo sblocchi. Zero costi in caso contrario. Mai.',
  },
  {
    q: 'Come funziona la verifica dell\'identità?',
    a: 'Tramite Stripe Identity — lo stesso sistema usato dalle banche. Veloce, sicuro, richiesto prima di ogni primo match.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.faqItem}>
      <button
        className={styles.faqQ}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <span className={open ? `${styles.faqChevron} ${styles.faqChevronOpen}` : styles.faqChevron}>
          <ChevronDown />
        </span>
      </button>
      <div
        className={styles.faqA}
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 200) + 'px' : '0' }}
      >
        <div className={styles.faqAInner} ref={bodyRef}>{a}</div>
      </div>
    </div>
  );
}

export function EntryPoint() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const selectedAirport = useAirportStore((s) => s.selectedAirport);
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase().trim() || '?'
    : '?';

  const [savingsCents, setSavingsCents] = useState<number | null>(null);

  useEffect(() => {
    const statsAirport = selectedAirport?.code ?? 'MXP';
    let cancelled = false;
    const timer = setTimeout(() => { if (!cancelled) setSavingsCents(null); }, STATS_TIMEOUT_MS);

    fetchAirportStats(statsAirport)
      .then((stats) => {
        clearTimeout(timer);
        if (!cancelled) setSavingsCents(stats.totalSavingsMonth);
      })
      .catch(() => clearTimeout(timer));

    return () => { cancelled = true; clearTimeout(timer); };
  }, [selectedAirport?.code]);

  const handleLogin = useCallback(
    (provider: 'Google' | 'Apple') => {
      if (isDevBypass) navigate('/airport');
      else login(provider);
    },
    [login, navigate],
  );

  const scrollToAuth = () => {
    document.getElementById('hero-auth')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFindRide = () => {
    navigate(selectedAirport ? '/check-in' : '/airport');
  };

  if (isLoading && !isDevBypass) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader} />
      </div>
    );
  }

  return (
    <div className={`${styles.screen} ${isAuthenticated ? styles.screenWithTabBar : ''}`}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <a href="#" className={styles.navLogo}>
            <span className={styles.navLogoDot} />
            <span className={styles.navLogoText}>FLOT</span>
          </a>
          {isAuthenticated ? (
            <div className={styles.navRight}>
              <button
                className={styles.navAvatar}
                onClick={() => setMenuOpen(true)}
                aria-label="Apri profilo"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
              >
                <span className={styles.navAvatarInitials}>{initials}</span>
              </button>
            </div>
          ) : (
            <button className={styles.navCta} onClick={scrollToAuth}>
              Inizia gratis
            </button>
          )}
        </div>
      </nav>
      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── HERO ── */}
      <section className={styles.heroSection}>
        <div className={styles.wrap}>
          <div className={styles.heroInner}>
            <div className={styles.kicker}>
              <span className={styles.kickerDot} />
              📍 Oltre 1.200 viaggiatori stanno già risparmiando su Malpensa → Milano
            </div>

            <h1 className={styles.heroH1}>
              Non pagare il taxi da solo. Unisciti alla community che dimezza le spese di viaggio.
            </h1>

            <p className={styles.heroSub}>
              Inserisci il tuo volo in anticipo. Flot ti connette con un viaggiatore verificato diretto nella tua stessa zona di Milano. Viaggiate insieme, pagate il tassista a metà, e risparmiate fino a €60.
            </p>

            {/* Savings counter */}
            <div className={styles.savingsWidget}>
              <div className={styles.savingsIconCircle}>
                <ZapIcon />
              </div>
              <div>
                {savingsCents !== null
                  ? <SavingsCounter targetCents={savingsCents} />
                  : <span className={styles.savingsAmount}>€12.847</span>
                }
                <div className={styles.savingsLabel}>risparmiati dai viaggiatori</div>
              </div>
            </div>

            {/* CTA */}
            {isAuthenticated ? (
              <div>
                <button className={styles.btnPrimaryHero} onClick={handleFindRide}>
                  Cerca il tuo compagno di viaggio →
                </button>
              </div>
            ) : (
              <div className={styles.authRow} id="hero-auth">
                <button className={`${styles.btnAuth} ${styles.btnGoogle}`} onClick={() => handleLogin('Google')}>
                  <GoogleIcon />
                  Continua con Google
                </button>
                <div className={styles.authDivider}>o</div>
                <button className={`${styles.btnAuth} ${styles.btnApple}`} onClick={() => handleLogin('Apple')}>
                  <AppleIcon />
                  Continua con Apple
                </button>
              </div>
            )}

            {/* Trust badge */}
            <div className={styles.trustBadge}>
              <ShieldIcon />
              <span className={styles.trustBadgeText}>€0,99 solo se trovi un compagno. Zero costi se non matchiamo.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF — LIVE FEED ── */}
      <LiveFeed />

      {/* ── HOW IT WORKS ── */}
      <section className={styles.stepsSection}>
        <div className={styles.wrap}>
          <h2 className={styles.sectionH2}>Come funziona</h2>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>✈️</div>
              <div className={styles.stepLine} />
              <div className={styles.stepBody}>
                <h3>Pianifica in anticipo</h3>
                <p>Dicci quando atterri — fino a 7 giorni prima. Più prenoti in anticipo, più crescono le probabilità di trovare il compagno perfetto nella nostra rete.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>🛡️</div>
              <div className={styles.stepLine} />
              <div className={styles.stepBody}>
                <h3>Match verificato</h3>
                <p>Ti connettiamo solo con membri la cui identità è verificata tramite Stripe Identity — obbligatoria prima di sbloccare ogni match.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>🤝</div>
              <div className={styles.stepBody}>
                <h3>Dividi la spesa, non l'esperienza</h3>
                <p>Incontratevi al punto di ritrovo in aeroporto. Prendete un taxi ufficiale insieme e dividete la tariffa con il tassista. Noi non tocchiamo i soldi della corsa.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className={styles.whySection}>
        <div className={styles.wrap}>
          <h2 className={styles.sectionH2}>Perché scegliere Flot</h2>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <h3>Sicurezza</h3>
              <p>Profili verificati tramite Stripe Identity, recensioni della community e supporto dedicato per ogni viaggio.</p>
            </div>
            <div className={styles.whyCard}>
              <h3>Efficienza</h3>
              <p>Zero imbarazzo alla coda dei taxi. Sai già con chi dividerai la spesa prima ancora di atterrare.</p>
            </div>
            <div className={styles.whyCard}>
              <h3>Logica di rete</h3>
              <p>Flot accoppia solo persone dirette nello stesso raggio geografico, ottimizzando il tragitto senza deviazioni.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection}>
        <div className={styles.wrap}>
          <h2 className={styles.sectionH2}>Domande frequenti</h2>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.wrap}>
          <h2 className={styles.finalCtaH2}>
            Il tuo prossimo volo da Malpensa ti aspetta.<br />Vuoi davvero pagare €120 da solo?
          </h2>
          <button
            className={styles.btnPrimary}
            onClick={isAuthenticated ? handleFindRide : scrollToAuth}
          >
            Trova il tuo compagno di viaggio
          </button>
          <div className={styles.finalGuarantee}>
            <ShieldIcon />
            <span className={styles.finalGuaranteeText}>€0,99 solo a match avvenuto. Nessun rischio.</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <p className={styles.footerText}>
            © 2026 Flot ·{' '}
            <a href="#" className={styles.footerLink}>Termini</a>
            {' · '}
            <a href="#" className={styles.footerLink}>Privacy</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
