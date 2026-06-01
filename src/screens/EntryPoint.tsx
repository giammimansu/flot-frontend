import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { ProfileMenu } from '../components/layout/ProfileMenu';
import logoFull from '../assets/logo-full.svg';
import styles from './EntryPoint.module.css';

const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;

/* ── Icons ── */
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="16" height="19" viewBox="0 0 18 22" fill="currentColor" aria-hidden="true">
      <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.71-1.75-3.29-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.82-.8-2.99-.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.27 1.23-2.5 1.25-2.57-.03-.01-2.4-.92-2.42-3.65l-.05-.08zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z" />
    </svg>
  );
}

function IconArrowRight({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconPlane({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function IconShieldCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconCircleCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconUsers({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconNavigation({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function IconMapPin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMessageCircle({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ── Count-up hook ── */
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 500);
    return () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration]);
  return Math.round(val).toLocaleString('it-IT');
}

/* ── Live Feed ── */
type FeedItem =
  | { type: 'match'; a: string; b: string; key: number }
  | { type: 'save'; who: string; amt: number; key: number }
  | { type: 'search'; flight: string; key: number };

const FEED_POOL: Omit<FeedItem, 'key'>[] = [
  { type: 'match', a: 'Malpensa', b: 'Milano Centro' },
  { type: 'save',  who: 'Giulia & Marco', amt: 60 },
  { type: 'search', flight: 'AZ 1574' },
  { type: 'match', a: 'Malpensa', b: 'Navigli' },
  { type: 'save',  who: 'Sofia & Luca', amt: 58 },
  { type: 'match', a: 'Malpensa', b: 'Porta Nuova' },
  { type: 'search', flight: 'FR 8821' },
  { type: 'save',  who: 'Anna & Davide', amt: 60 },
  { type: 'match', a: 'Malpensa', b: 'Città Studi' },
];

function FeedRow({ item, fresh }: { item: FeedItem; fresh: boolean }) {
  let icon: React.ReactNode;
  let colorClass: string;
  let primary: React.ReactNode;
  let meta: React.ReactNode;

  if (item.type === 'match') {
    icon = <IconCircleCheck />;
    colorClass = styles.feedIconSuccess;
    primary = 'Match trovato';
    meta = `${item.a} → ${item.b}`;
  } else if (item.type === 'save') {
    icon = <IconUsers />;
    colorClass = styles.feedIconAccent;
    primary = `${item.who} dividono un taxi`;
    meta = <span className={styles.feedMono}>−€{item.amt} a testa</span>;
  } else {
    icon = <IconSearch />;
    colorClass = styles.feedIconPrimary;
    primary = 'Nuovo viaggiatore in cerca';
    meta = `Volo ${item.flight} · Malpensa`;
  }

  return (
    <div className={`${styles.feedRow} ${fresh ? styles.feedRowFresh : ''}`}>
      <div className={`${styles.feedIconWrap} ${colorClass}`}>{icon}</div>
      <div className={styles.feedContent}>
        <div className={styles.feedPrimary}>{primary}</div>
        <div className={styles.feedMeta}>{meta}</div>
      </div>
      <span className={styles.feedNow}>ora</span>
    </div>
  );
}

function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>(() =>
    FEED_POOL.slice(0, 4).map((it, i) => ({ ...it, key: i }) as FeedItem),
  );
  const counter = useRef(FEED_POOL.length);

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const next = FEED_POOL[counter.current % FEED_POOL.length];
        counter.current += 1;
        return [{ ...next, key: counter.current } as FeedItem, ...prev].slice(0, 4);
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const saved = useCountUp(8400);
  const rides = useCountUp(1240);

  return (
    <section className={styles.liveSection}>
      <div className={styles.wrap}>
        <div className={styles.liveLabel}>
          <span className={styles.liveDot} />
          <span>In tempo reale</span>
        </div>
        <h2 className={styles.liveH2}>La community è in movimento, ora.</h2>
        <div className={styles.feedList}>
          {items.map((it, i) => <FeedRow key={it.key} item={it} fresh={i === 0} />)}
        </div>
        <div className={styles.liveStats}>
          <div className={styles.statTile}>
            <div className={styles.statNum}>€{saved}</div>
            <div className={styles.statLbl}>risparmiati questa settimana</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statNum}>{rides}+</div>
            <div className={styles.statLbl}>corse condivise</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
const STEPS = [
  { icon: <IconPlane size={20} />, t: 'Pianifica in anticipo', d: 'Aggiungi numero del volo, terminal e zona di destinazione. Anche giorni prima di partire.' },
  { icon: <IconUsers size={20} />, t: 'Ricevi il match', d: 'Ti abbiniamo a chi è diretto nella tua stessa zona. Vi coordinate nella chat interna.' },
  { icon: <IconNavigation size={20} />, t: 'Dividete il taxi', d: 'Vi trovate al punto di ritrovo, salite sul taxi ufficiale e dividete la tariffa direttamente col tassista.' },
];

function HowItWorks() {
  return (
    <section className={styles.stepsSection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Come funziona" title="Tre passi, zero attriti" />
        <div className={styles.stepsList}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepLeft}>
                <div className={styles.stepNum}>{i + 1}</div>
                {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
              </div>
              <div className={`${styles.stepBody} ${i < STEPS.length - 1 ? styles.stepBodyGap : ''}`}>
                <div className={styles.stepTitleRow}>
                  <span className={styles.stepTitleIcon}>{s.icon}</span>
                  <h3 className={styles.stepTitle}>{s.t}</h3>
                </div>
                <p className={styles.stepDesc}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why Choose ── */
const REASONS = [
  { icon: <IconShieldCheck size={22} />, t: 'Sicurezza e community', d: 'Viaggi con chi era sul tuo stesso volo o su voli vicini. Profili verificati e recensioni reciproche dopo ogni corsa.' },
  { icon: <IconMessageCircle size={22} />, t: 'Zero stress', d: 'Sai con chi viaggi prima ancora di atterrare. Niente code impreviste, niente trattative al volo col tassista.' },
  { icon: <IconMapPin size={22} />, t: 'Ottimizzazione geografica', d: "L'algoritmo abbina solo chi è diretto nella tua stessa area. Nessuna deviazione, nessun tempo perso." },
];

function WhyChoose() {
  return (
    <section className={styles.whySection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Perché Flot" title="Pensato per chi viaggia di fretta" />
        <div className={styles.whyGrid}>
          {REASONS.map((r, i) => (
            <div key={i} className={styles.whyCard}>
              <div className={styles.whyCardIcon}>{r.icon}</div>
              <h3 className={styles.whyCardTitle}>{r.t}</h3>
              <p className={styles.whyCardDesc}>{r.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
const FAQS = [
  { q: 'Cosa succede se il mio volo è in ritardo?', a: "Niente panico. Flot monitora i voli in tempo reale: se il tuo è in ritardo, l'algoritmo riorganizza automaticamente il match e aggiorna l'orario del ritrovo. Tu e il tuo compagno ricevete una notifica e restate sincronizzati." },
  { q: 'Come trovo il mio compagno in aeroporto?', a: "Ti suggeriamo un punto di ritrovo preciso all'interno dell'aeroporto. Nella chat interna potete coordinarvi negli ultimi minuti. Semplice e diretto." },
  { q: 'È sicuro viaggiare con uno sconosciuto?', a: "Sì. La community Flot è fatta di viaggiatori verificati. Prima di salire vedete il profilo, la valutazione e le recensioni dell'altra persona. Dopo la corsa vi recensite a vicenda: chi non rispetta le regole esce dalla community." },
  { q: 'I tassisti accettano la divisione della spesa?', a: 'Assolutamente. Per il tassista è una normale corsa ufficiale, semplicemente pagata in due. Flot lavora solo con taxi ufficiali: nessuna trattativa, nessun servizio abusivo. Pagate ciascuno la vostra metà a fine corsa.' },
  { q: 'Quanto costa esattamente il servizio?', a: 'Solo 1,99€, e li paghi unicamente a match trovato. Se non troviamo nessuno per te, non paghi nulla. Flot non trattiene mai i soldi della corsa: quelli vanno direttamente al tassista.' },
];

function FAQItem({ item, open, onToggle }: { item: typeof FAQS[0]; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.faqItem}>
      <button onClick={onToggle} className={styles.faqQ} aria-expanded={open}>
        <span>{item.q}</span>
        <span className={`${styles.faqToggle} ${open ? styles.faqToggleOpen : ''}`}>
          <IconPlus />
        </span>
      </button>
      <div
        className={styles.faqA}
        style={{ maxHeight: open ? (bodyRef.current ? bodyRef.current.scrollHeight + 4 : 400) : 0 }}
      >
        <p ref={bodyRef} className={styles.faqAText}>{item.a}</p>
      </div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className={styles.faqSection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Domande frequenti" title="Tutto quello che vuoi sapere" />
        <div className={styles.faqList}>
          {FAQS.map((f, i) => (
            <FAQItem key={i} item={f} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section title helper ── */
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className={styles.sectionTitle}>
      <div className={styles.sectionEyebrow}>{eyebrow}</div>
      <h2 className={styles.sectionH2}>{title}</h2>
    </div>
  );
}

/* ── Main component ── */
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
      login(provider);
    },
    [login],
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
          <a href="#" className={styles.navLogo} aria-label="Flot home">
            <img src={logoFull} alt="Flot" className={styles.navLogoImg} />
          </a>
          {isAuthenticated ? (
            <button
              className={styles.navAvatar}
              onClick={() => setMenuOpen(true)}
              aria-label="Apri profilo"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <span className={styles.navAvatarInitials}>{initials}</span>
            </button>
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
          <div className={styles.heroBadge}>
            <IconPlane size={15} />
            Da Malpensa al centro di Milano
          </div>

          <h1 className={styles.heroH1}>
            Esci dall'aeroporto.<br />
            <span className={styles.heroAccent}>A metà prezzo.</span>
          </h1>

          <p className={styles.heroSub}>
            Inserisci il tuo volo in anticipo. Flot ti abbina a un viaggiatore diretto nella tua stessa zona. Dividete il taxi ufficiale a metà, direttamente col tassista.
          </p>

          <div className={styles.priceCard}>
            <div className={styles.priceCol}>
              <div className={styles.priceLabel}>Da solo</div>
              <div className={styles.priceStrike}>€120</div>
            </div>
            <div className={styles.priceArrow}>
              <IconArrowRight size={22} />
            </div>
            <div className={`${styles.priceCol} ${styles.priceColRight}`}>
              <div className={`${styles.priceLabel} ${styles.priceLabelAccent}`}>Con Flot</div>
              <div className={styles.priceValue}>€60</div>
            </div>
          </div>

          {isAuthenticated ? (
            <div className={styles.heroCta} id="hero-auth">
              <button className={styles.btnPrimary} onClick={handleFindRide}>
                Cerca il tuo compagno
                <IconArrowRight size={19} />
              </button>
            </div>
          ) : (
            <div className={styles.authRow} id="hero-auth">
              <button className={`${styles.btnAuth} ${styles.btnGoogle}`} onClick={() => handleLogin('Google')}>
                <IconGoogle />
                Continua con Google
              </button>
              <div className={styles.authDivider}><span>o</span></div>
              <button className={`${styles.btnAuth} ${styles.btnApple}`} onClick={() => handleLogin('Apple')}>
                <IconApple />
                Continua con Apple
              </button>
            </div>
          )}

          <div className={styles.trustBadge}>
            <span className={styles.trustIcon}><IconShieldCheck size={16} /></span>
            <span className={styles.trustText}><strong>1,99€ solo a match trovato.</strong> Se non troviamo nessuno, è gratis.</span>
          </div>
        </div>
      </section>

      {/* ── LIVE FEED ── */}
      <LiveFeed />

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── WHY CHOOSE ── */}
      <WhyChoose />

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.wrap}>
          <h2 className={styles.finalCtaH2}>
            Da solo paghi 120€.<br />Condividendo, solo 60€.
          </h2>
          <p className={styles.finalCtaSub}>
            Inserisci il tuo prossimo volo da Malpensa. Ci pensiamo noi a trovarti un compagno di viaggio diretto nella tua zona.
          </p>
          <button
            className={styles.btnPrimaryFull}
            onClick={isAuthenticated ? handleFindRide : scrollToAuth}
          >
            Trova il tuo compagno
            <IconArrowRight size={19} />
          </button>
          <div className={styles.finalGuarantee}>
            <IconShieldCheck size={16} />
            <span>Rischio zero: paghi 1,99€ solo a match avvenuto. Altrimenti, è gratis.</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerLogo}>
            <svg width="26" height="26" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="14" fill="var(--primary-500)" />
              <circle cx="22" cy="32" r="8" fill="white" />
              <circle cx="42" cy="32" r="8" fill="var(--accent-400)" />
              <rect x="25" y="29" width="14" height="6" rx="3" fill="white" opacity="0.4" />
            </svg>
            <span className={styles.footerBrand}>flot</span>
          </div>
          <p className={styles.footerTagline}>
            Dividi il taxi dall'aeroporto. Condividi il risparmio. Più semplice, più economico, più umano.
          </p>
          <div className={styles.footerLinks}>
            {['Termini di servizio', 'Privacy', 'Note legali', 'Cookie', 'Contatti'].map((l) => (
              <a key={l} href="#" className={styles.footerLink}>{l}</a>
            ))}
          </div>
          <div className={styles.footerCopy}>
            © 2026 Flot S.r.l. · Tutti i diritti riservati.<br />
            P.IVA 00000000000 · Milano, Italia. Flot opera esclusivamente con taxi ufficiali.
          </div>
        </div>
      </footer>
    </div>
  );
}
