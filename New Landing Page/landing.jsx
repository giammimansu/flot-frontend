/* Flot — Landing Page (mobile-first, Italian) */
const { useState, useEffect, useRef } = React;

/* ============================================================
   Small helpers
   ============================================================ */
/* ============================================================
   Inline Lucide-style icons (reliable, no web font)
   ============================================================ */
const ICONS = {
  'plane': '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'navigation': '<path d="m3 11 19-9-9 19-2-8-8-2z"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
};
function Icon({ name, size = 20, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}

/* count-up animation, fires when scrolled into view */
function useCountUp(target, { duration = 1400, decimals = 0 } = {}) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const startNow = () => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(startNow, 500);
    return () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [target]);
  const fmt = decimals > 0
    ? val.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(val).toLocaleString('it-IT');
  return [fmt, ref];
}

/* reveal on mount — pure CSS entrance, always ends visible */
function Reveal({ children, delay = 0, style }) {
  return (
    <div className="reveal" style={{ animationDelay: `${delay}ms`, ...style }}>{children}</div>
  );
}

/* ============================================================
   Header (sticky)
   ============================================================ */
function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(255,255,255,0.86)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '54px 20px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <svg width="30" height="30" viewBox="0 0 64 64" style={{ display: 'block' }}>
          <rect width="64" height="64" rx="14" fill="var(--primary-500)"></rect>
          <circle cx="22" cy="32" r="8" fill="white"></circle>
          <circle cx="42" cy="32" r="8" fill="var(--accent-400)"></circle>
          <rect x="25" y="29" width="14" height="6" rx="3" fill="white" opacity="0.4"></rect>
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--neutral-900)' }}>flot</span>
      </div>
      <button className="btn-press" style={{
        height: 38, padding: '0 16px', borderRadius: 'var(--radius-full)',
        background: 'var(--primary-500)', color: '#fff', border: 'none',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}>Apri l'app</button>
    </header>
  );
}

/* ============================================================
   1. HERO
   ============================================================ */
function Hero() {
  return (
    <section style={{ padding: '32px 22px 38px', background: 'var(--bg-primary)' }}>
      <Reveal>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 'var(--radius-full)',
          background: 'var(--primary-50)', color: 'var(--primary-700)',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, marginBottom: 18,
        }}>
          <Icon name="plane" size={15} />
          Da Malpensa al centro di Milano
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 38, lineHeight: 1.12, letterSpacing: '-0.03em',
          color: 'var(--neutral-900)', margin: '0 0 16px',
        }}>
          Esci dall'aeroporto.<br />
          <span style={{ color: 'var(--primary-500)' }}>A metà prezzo.</span>
        </h1>
      </Reveal>

      <Reveal delay={120}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.55,
          color: 'var(--neutral-600)', margin: '0 0 24px', maxWidth: 360,
        }}>
          Inserisci il tuo volo in anticipo. Flot ti abbina a un viaggiatore diretto nella tua stessa zona. Dividete il taxi ufficiale a metà, direttamente col tassista.
        </p>
      </Reveal>

      {/* price visual */}
      <Reveal delay={180}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)',
          padding: '16px 18px', marginBottom: 24,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Da solo</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, color: 'var(--neutral-400)', textDecoration: 'line-through' }}>€120</div>
          </div>
          <Icon name="arrow-right" size={22} style={{ color: 'var(--primary-400)' }} />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--accent-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Con Flot</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, color: 'var(--primary-600)' }}>€60</div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <button className="btn-press" style={{
          width: '100%', height: 56, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-500)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(232,96,58,0.28)',
        }}>
          Trova un compagno di viaggio
          <Icon name="arrow-right" size={19} />
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          marginTop: 14, color: 'var(--neutral-500)',
          fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.4, textAlign: 'center',
        }}>
          <Icon name="shield-check" size={16} style={{ color: 'var(--success-500)', flexShrink: 0 }} />
          <span><strong style={{ color: 'var(--neutral-700)' }}>1,99€ solo a match trovato.</strong> Se non troviamo nessuno, è gratis.</span>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   2. LIVE FEED (animated, airport-board vibe)
   ============================================================ */
const FEED_POOL = [
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

function FeedRow({ item, fresh }) {
  let icon, color, primary, meta;
  if (item.type === 'match') {
    icon = 'circle-check'; color = 'var(--success-500)';
    primary = <>Match trovato</>;
    meta = <>{item.a} → {item.b}</>;
  } else if (item.type === 'save') {
    icon = 'users'; color = 'var(--accent-400)';
    primary = <>{item.who} dividono un taxi</>;
    meta = <span style={{ fontFamily: 'var(--font-mono)' }}>−€{item.amt} a testa</span>;
  } else {
    icon = 'search'; color = 'var(--primary-300)';
    primary = <>Nuovo viaggiatore in cerca</>;
    meta = <>Volo {item.flight} · Malpensa</>;
  }
  return (
    <div className={fresh ? 'feed-enter' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 14px', borderRadius: 'var(--radius-md)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--radius-full)', flexShrink: 0,
        background: 'rgba(255,255,255,0.08)', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primary}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{meta}</div>
      </div>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
        color: 'var(--accent-300)', flexShrink: 0,
      }}>ora</span>
    </div>
  );
}

function LiveFeed() {
  const [items, setItems] = useState(() => FEED_POOL.slice(0, 4).map((it, i) => ({ ...it, key: i })));
  const counter = useRef(FEED_POOL.length);
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const next = FEED_POOL[counter.current % FEED_POOL.length];
        counter.current += 1;
        return [{ ...next, key: counter.current }, ...prev].slice(0, 4);
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const [saved, savedRef] = useCountUp(8400);
  const [rides, ridesRef] = useCountUp(1240);

  return (
    <section style={{ background: 'var(--neutral-900)', padding: '40px 22px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="live-dot"></span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--accent-300)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>In tempo reale</span>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
        La community è in movimento, ora.
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
        {items.map((it, i) => <FeedRow key={it.key} item={it} fresh={i === 0} />)}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div ref={savedRef} style={statTile}>
          <div style={statNum}>€{saved}</div>
          <div style={statLbl}>risparmiati questa settimana</div>
        </div>
        <div ref={ridesRef} style={statTile}>
          <div style={statNum}>{rides}+</div>
          <div style={statLbl}>corse condivise</div>
        </div>
      </div>
    </section>
  );
}
const statTile = { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '16px 14px' };
const statNum = { fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: 'var(--primary-200)' };
const statLbl = { fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.35 };

/* ============================================================
   3. COME FUNZIONA
   ============================================================ */
const STEPS = [
  { icon: 'plane', t: 'Pianifica in anticipo', d: 'Aggiungi numero del volo, terminal e zona di destinazione. Anche giorni prima di partire.' },
  { icon: 'users', t: 'Ricevi il match', d: 'Ti abbiniamo a chi è diretto nella tua stessa zona. Vi coordinate nella chat interna.' },
  { icon: 'navigation', t: 'Dividete il taxi', d: "Vi trovate al punto di ritrovo, salite sul taxi ufficiale e dividete la tariffa direttamente col tassista." },
];
function HowItWorks() {
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '44px 22px' }}>
      <SectionTitle eyebrow="Come funziona" title="Tre passi, zero attriti" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 24 }}>
        {STEPS.map((s, i) => (
          <Reveal key={i} delay={i * 80}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-500)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                }}>{i + 1}</div>
                {i < STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 28, background: 'var(--primary-100)', margin: '6px 0' }}></div>}
              </div>
              <div style={{ paddingBottom: i < STEPS.length - 1 ? 22 : 0, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Icon name={s.icon} size={17} style={{ color: 'var(--primary-500)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>{s.t}</h3>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--neutral-600)', margin: 0 }}>{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   4. PERCHÉ SCEGLIERE
   ============================================================ */
const REASONS = [
  { icon: 'shield-check', t: 'Sicurezza e community', d: 'Viaggi con chi era sul tuo stesso volo o su voli vicini. Profili verificati e recensioni reciproche dopo ogni corsa.' },
  { icon: 'message-circle', t: 'Zero stress', d: 'Sai con chi viaggi prima ancora di atterrare. Niente code impreviste, niente trattative al volo col tassista.' },
  { icon: 'map-pin', t: 'Ottimizzazione geografica', d: "L'algoritmo abbina solo chi è diretto nella tua stessa area. Nessuna deviazione, nessun tempo perso." },
];
function WhyChoose() {
  return (
    <section style={{ background: 'var(--primary-50)', padding: '44px 22px' }}>
      <SectionTitle eyebrow="Perché Flot" title="Pensato per chi viaggia di fretta" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {REASONS.map((r, i) => (
          <Reveal key={i} delay={i * 80}>
            <div style={{
              background: '#fff', borderRadius: 'var(--radius-lg)', padding: 20,
              boxShadow: 'var(--shadow-1)', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: 'var(--primary-50)', color: 'var(--primary-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Icon name={r.icon} size={22} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--neutral-900)', margin: '0 0 7px' }}>{r.t}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55, color: 'var(--neutral-600)', margin: 0 }}>{r.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   5. FAQ (accordion)
   ============================================================ */
const FAQS = [
  { q: 'Cosa succede se il mio volo è in ritardo?', a: "Niente panico. Flot monitora i voli in tempo reale: se il tuo è in ritardo, l'algoritmo riorganizza automaticamente il match e aggiorna l'orario del ritrovo. Tu e il tuo compagno ricevete una notifica e restate sincronizzati." },
  { q: 'Come trovo il mio compagno in aeroporto?', a: "Ti suggeriamo un punto di ritrovo preciso all'interno dell'aeroporto. Nella chat interna potete coordinarvi negli ultimi minuti: \"sono all'uscita 4\", \"arrivo tra 5 minuti\". Semplice e diretto." },
  { q: 'È sicuro viaggiare con uno sconosciuto?', a: 'Sì. La community Flot è fatta di viaggiatori verificati. Prima di salire vedete il profilo, la valutazione e le recensioni dell\'altra persona. Dopo la corsa vi recensite a vicenda: chi non rispetta le regole esce dalla community.' },
  { q: 'I tassisti accettano la divisione della spesa?', a: 'Assolutamente. Per il tassista è una normale corsa ufficiale, semplicemente pagata in due. Flot lavora solo con taxi ufficiali: nessuna trattativa, nessun servizio abusivo. Pagate ciascuno la vostra metà a fine corsa.' },
  { q: 'Quanto costa esattamente il servizio?', a: 'Solo 1,99€, e li paghi unicamente a match trovato. Se non troviamo nessuno per te, non paghi nulla. Flot non trattiene mai i soldi della corsa: quelli vanno direttamente al tassista.' },
];
function FAQItem({ item, open, onToggle }) {
  const bodyRef = useRef(null);
  return (
    <div style={{ borderBottom: '1px solid var(--border-default)' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '18px 0',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16.5, fontWeight: 600, color: 'var(--neutral-900)', lineHeight: 1.35 }}>{item.q}</span>
        <span style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 'var(--radius-full)',
          background: open ? 'var(--primary-500)' : 'var(--primary-50)',
          color: open ? '#fff' : 'var(--primary-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 200ms var(--ease-out)',
        }}>
          <Icon name="plus" size={16} style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms var(--ease-out)' }} />
        </span>
      </button>
      <div style={{
        maxHeight: open ? (bodyRef.current ? bodyRef.current.scrollHeight + 4 : 400) : 0,
        overflow: 'hidden', transition: 'max-height 300ms var(--ease-out)',
      }}>
        <p ref={bodyRef} style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, color: 'var(--neutral-600)', margin: '0 0 18px' }}>{item.a}</p>
      </div>
    </div>
  );
}
function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ background: 'var(--bg-primary)', padding: '44px 22px' }}>
      <SectionTitle eyebrow="Domande frequenti" title="Tutto quello che vuoi sapere" />
      <div style={{ marginTop: 18, borderTop: '1px solid var(--border-default)' }}>
        {FAQS.map((f, i) => (
          <FAQItem key={i} item={f} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   6. FINAL CTA
   ============================================================ */
function FinalCTA() {
  return (
    <section style={{ background: 'var(--primary-600)', padding: '48px 22px 52px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 18px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Da solo paghi 120€.<br />Condividendo, solo 60€.
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.55, color: 'rgba(255,255,255,0.8)', margin: '0 0 26px', maxWidth: 340 }}>
        Inserisci il tuo prossimo volo da Malpensa. Ci pensiamo noi a trovarti un compagno di viaggio diretto nella tua zona.
      </p>
      <button className="btn-press" style={{
        width: '100%', height: 56, borderRadius: 'var(--radius-md)',
        background: 'var(--accent-500)', color: '#fff', border: 'none',
        fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}>
        Trova il tuo compagno
        <Icon name="arrow-right" size={19} />
      </button>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        marginTop: 16, color: 'rgba(255,255,255,0.85)',
        fontFamily: 'var(--font-body)', fontSize: 13.5, textAlign: 'center',
      }}>
        <Icon name="shield-check" size={16} style={{ flexShrink: 0 }} />
        <span>Rischio zero: paghi 1,99€ solo a match avvenuto. Altrimenti, è gratis.</span>
      </div>
    </section>
  );
}

/* ============================================================
   7. FOOTER
   ============================================================ */
function Footer() {
  const links = ['Termini di servizio', 'Privacy', 'Note legali', 'Cookie', 'Contatti'];
  return (
    <footer style={{ background: 'var(--neutral-900)', padding: '36px 22px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <svg width="26" height="26" viewBox="0 0 64 64" style={{ display: 'block' }}>
          <rect width="64" height="64" rx="14" fill="var(--primary-500)"></rect>
          <circle cx="22" cy="32" r="8" fill="white"></circle>
          <circle cx="42" cy="32" r="8" fill="var(--accent-400)"></circle>
          <rect x="25" y="29" width="14" height="6" rx="3" fill="white" opacity="0.4"></rect>
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em' }}>flot</span>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 22px', maxWidth: 300 }}>
        Dividi il taxi dall'aeroporto. Condividi il risparmio. Più semplice, più economico, più umano.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', marginBottom: 24 }}>
        {links.map((l) => (
          <a key={l} href="#" style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{l}</a>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 18 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          © 2026 Flot S.r.l. · Tutti i diritti riservati.<br />
          P.IVA 00000000000 · Milano, Italia. Flot opera esclusivamente con taxi ufficiali.
        </p>
      </div>
    </footer>
  );
}

/* ============================================================
   Section title helper
   ============================================================ */
function SectionTitle({ eyebrow, title }) {
  return (
    <Reveal>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--accent-600)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--neutral-900)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
    </Reveal>
  );
}

/* ============================================================
   App
   ============================================================ */
function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <Hero />
      <LiveFeed />
      <HowItWorks />
      <WhyChoose />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <IOSDevice>
      <LandingPage />
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
