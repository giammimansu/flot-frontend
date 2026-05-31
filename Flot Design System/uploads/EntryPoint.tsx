import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { ProfileMenu } from '../components/layout/ProfileMenu';
import { LiveMatchBanner } from '../components/ui/LiveMatchBanner';
import logoFull from '../assets/logo-full.svg';
import styles from './EntryPoint.module.css';

const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;

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


const FAQ_ITEMS = [
  {
    q: 'E se il mio volo è in ritardo?',
    a: 'Non c’è bisogno di preoccuparsi. Monitoriamo in tempo reale lo stato del tuo volo: se il tuo arrivo cambia e il match originale non è più compatibile, il nostro algoritmo si metterà subito al lavoro per trovarti automaticamente un nuovo compagno di viaggio per il tuo nuovo orario di atterraggio.',
  },
  {
    q: 'Come faccio a trovare il mio compagno di viaggio?',
    a: 'Una volta confermato il match, Flot vi suggerirà un punto di ritrovo specifico in aeroporto. Usate la chat interna per darvi un riferimento visivo (es. "ho una valigia rossa") e incontrarvi in pochi minuti.',
  },
  {
    q: 'È sicuro viaggiare con uno sconosciuto?',
    a: 'Flot ti connette solo con viaggiatori che erano sul tuo volo o su voli vicini al tuo. L’incontro avviene sempre in aeroporto, un luogo pubblico e sicuro. Inoltre, puoi contare sul nostro sistema di recensioni: dopo ogni viaggio, gli utenti si valutano a vicenda, permettendoti di viaggiare solo con persone affidabili e puntuali.',
  },
  {
    q: 'I tassisti accettano la divisione della spesa?',
    a: 'Certamente. Il tassista riceve l’intera tariffa ufficiale (es. €50), semplicemente la pagate in due (o più). Per loro è un normale servizio, noi siamo alleati dei taxi ufficiali.',
  },
  {
    q: 'Quanto costa il servizio?',
    a: 'Sbloccare un match trovato costa solo €0,99. Se non troviamo nessuno per te o se non decidi di sbloccare il profilo, il servizio è totalmente gratuito. Sempre.',
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
            <img src={logoFull} alt="Flot" className={styles.navLogoImg} />
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


            <h1 className={styles.heroH1}>
              Non pagare il taxi da solo. Unisciti alla community che dimezza le spese di viaggio.
            </h1>

            <p className={styles.heroSub}>
              Inserisci il tuo volo in anticipo. Flot ti connette con un viaggiatore diretto nella tua stessa zona di Milano. Viaggiate insieme, pagate il tassista a metà, e risparmiate fino a €60.
            </p>

            <LiveMatchBanner airport="Malpensa" />

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
                <p>Dicci quando atterri. Più prenoti in anticipo, più crescono le probabilità di trovare il compagno perfetto nella nostra rete.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>📱</div>
              <div className={styles.stepLine} />
              <div className={styles.stepBody}>
                <h3>Ricevi un Match</h3>
                <p>Coordinatevi tramite la <strong>chat in-app</strong> e raggiungete il <strong>punto di ritrovo</strong> che vi suggeriremo. Prendete un taxi insieme e dividete la spesa direttamente con il tassista.</p>
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
              <h3>Community Reale</h3>
              <p>Connettiti con persone che sono dirette verso la tua stessa zona. Coordinatevi in sicurezza tramite la chat interna prima di incontrarvi.</p>
            </div>
            <div className={styles.whyCard}>
              <h3>Zero Stress</h3>
        <p>Evita l'imbarazzo e le attese alla coda dei taxi. Sai già con chi viaggerai e dove trovarvi prima ancora di atterrare.</p>
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
