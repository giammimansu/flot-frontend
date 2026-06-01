/* Flot Onboarding — content data (IT + EN) and geometric scene visuals */

/* ============================================================
   CONTENT — two locales. Default Italian (per brief).
   Pricing uses €1,99 (design-system value, per user choice).
   ============================================================ */
const ONB_CONTENT = {
  it: {
    skipShort: 'Salta',
    skipLong: "Salta l'introduzione",
    next: 'Avanti',
    cards: [
      {
        eyebrow: 'Come funziona',
        title: 'Da €120 a ~€60 — senza fare nulla di strano.',
        steps: [
          { icon: 'plane',   text: 'Inserisci il tuo volo e la tua destinazione' },
          { icon: 'search',  text: 'Flot cerca qualcuno diretto nella tua stessa zona' },
          { icon: 'users',   text: 'Vi incontrate al gate, prendete un taxi e dividete la spesa' },
        ],
        note: 'Noi non guidiamo. Il taxi lo chiamate voi, lo pagate voi, direttamente al tassista.',
      },
      {
        eyebrow: 'Nessun rischio',
        title: 'Nessun match? Nessun addebito. Mai.',
        points: [
          'Cercare un match è gratuito',
          'Quando viene trovato, vedi chi è — con foto sfocata — prima di decidere',
          'Paghi €1,99 solo se sbloccate entrambi',
          'Se l\u2019altro non sblocca in tempo, nessuno viene addebitato',
        ],
        note: 'È un accordo reciproco: nessuno dei due paga se l\u2019altro non vuole procedere.',
      },
      {
        eyebrow: 'Con chi ti abbiniamo',
        title: 'Il tuo match è già in aeroporto, diretto come te.',
        criteria: [
          { icon: 'arrow-right',   k: 'Stessa direzione', v: 'Abbinato solo con chi va nella tua stessa zona' },
          { icon: 'clock',         k: 'Stesso orario',    v: 'Finestra temporale stretta, niente attese' },
          { icon: 'shield-check',  k: 'Profilo visibile', v: 'Nome, foto sfocata e badge di verifica prima di decidere' },
        ],
        note: 'Puoi sempre rifiutare il match. Nessuna pressione.',
      },
    ],
    done: { title: 'Tutto chiaro.', body: 'Qui inizia il check-in.', reset: 'Rivedi l\u2019introduzione' },
  },
  en: {
    skipShort: 'Skip',
    skipLong: 'Skip the intro',
    next: 'Next',
    cards: [
      {
        eyebrow: 'How it works',
        title: 'From €120 to ~€60 — nothing weird about it.',
        steps: [
          { icon: 'plane',   text: 'Enter your flight and your destination' },
          { icon: 'search',  text: 'Flot finds someone heading to your area' },
          { icon: 'users',   text: 'Meet at the gate, take a taxi and split the fare' },
        ],
        note: 'We don\u2019t drive. You call the taxi, you pay it — directly to the driver.',
      },
      {
        eyebrow: 'No risk',
        title: 'No match? No charge. Ever.',
        points: [
          'Searching for a match is free',
          'When one\u2019s found, you see who it is — blurred photo — before deciding',
          'You pay €1.99 only if you both unlock',
          'If the other doesn\u2019t unlock in time, nobody is charged',
        ],
        note: 'It\u2019s a mutual deal: neither of you pays if the other won\u2019t proceed.',
      },
      {
        eyebrow: 'Who you\u2019re matched with',
        title: 'Your match is already at the airport, heading where you are.',
        criteria: [
          { icon: 'arrow-right',   k: 'Same direction', v: 'Matched only with people going to your area' },
          { icon: 'clock',         k: 'Same time',      v: 'A tight window, no waiting around' },
          { icon: 'shield-check',  k: 'Visible profile', v: 'Name, blurred photo and verification badge before deciding' },
        ],
        note: 'You can always decline a match. No pressure.',
      },
    ],
    done: { title: 'All clear.', body: 'Check-in starts here.', reset: 'Replay the intro' },
  },
};

const CTA_TEXT = {
  match:     { it: 'Cerca il mio match',     en: 'Find my match' },
  rideshare: { it: 'Prenota il mio ride-share', en: 'Book my ride-share' },
};

/* ============================================================
   SCENE VISUALS — geometric / iconographic, design-system palette
   Each scene fills a fixed hero band; accent color is themeable.
   ============================================================ */

function SceneFrame({ children }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-xl)',
      background: 'var(--primary-50)',
      border: '1px solid var(--primary-100)',
      height: 248, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* faint dotted-route texture, the Flot connected-dots motif */}
      <svg width="100%" height="100%" viewBox="0 0 360 248" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <path d="M-20 196 C 80 150, 130 196, 220 150 S 380 110, 420 150"
          fill="none" stroke="var(--primary-200)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

/* --- Scene 1: the split fare --- */
function SceneSplit({ accent }) {
  const half = (who, accentColor, initials, initBg, initFg) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 6px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-full)',
        background: initBg, color: initFg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
      }}>{initials}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)' }}>{who}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: accentColor }}>€60</div>
    </div>
  );
  return (
    <SceneFrame>
      {/* struck original fare */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--neutral-400)', textDecoration: 'line-through' }}>€120</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)' }}>taxi intero</span>
      </div>
      {/* the fare, split in two */}
      <div style={{
        width: '100%', maxWidth: 280, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-2)',
        display: 'flex', position: 'relative',
      }}>
        {half('Tu', accent, 'TU', 'var(--accent-50)', accent)}
        <div style={{ width: 0, borderLeft: '2px dashed var(--neutral-200)', margin: '14px 0' }}></div>
        {half('Match', 'var(--primary-600)', 'M', 'var(--primary-100)', 'var(--primary-700)')}
      </div>
    </SceneFrame>
  );
}

/* --- Scene 2: free until a mutual unlock --- */
function SceneFree({ accent }) {
  const blurBar = (w) => (
    <div style={{ height: 8, width: w, borderRadius: 'var(--radius-full)', background: 'var(--neutral-200)' }}></div>
  );
  return (
    <SceneFrame>
      <div style={{
        width: '100%', maxWidth: 264, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-2)',
        padding: 16, display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
      }}>
        {/* blurred avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-full)',
            background: 'conic-gradient(from 120deg, var(--primary-200), var(--accent-200), var(--primary-300))',
            filter: 'blur(5px)',
          }}></div>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 'var(--radius-full)', background: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-2)',
            }}>
              <Icon name="lock" size={12} color="#fff" />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {blurBar('64%')}
          {blurBar('44%')}
        </div>
      </div>
      {/* free-so-far indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--primary-600)' }}>€0,00</span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--primary-700)',
          background: 'var(--primary-100)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
        }}>finora</span>
      </div>
    </SceneFrame>
  );
}

/* --- Scene 3: the match profile + criteria --- */
function SceneMatch({ accent }) {
  const chip = (icon, label) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'var(--neutral-0)', border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-full)', padding: '5px 11px',
      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--neutral-700)',
    }}>
      <Icon name={icon} size={13} color="var(--primary-500)" />{label}
    </div>
  );
  return (
    <SceneFrame>
      <div style={{
        width: '100%', maxWidth: 268, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-2)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* slightly blurred avatar with verified badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 'var(--radius-full)',
              background: 'conic-gradient(from 200deg, var(--primary-300), var(--accent-200), var(--primary-200))',
              filter: 'blur(2.5px)',
            }}></div>
            <div style={{
              position: 'absolute', right: -3, bottom: -3,
              width: 20, height: 20, borderRadius: 'var(--radius-full)', background: 'var(--primary-500)',
              border: '2px solid var(--neutral-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="shield-check" size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--neutral-900)' }}>Marco V.</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>MXP T1 · Centrale</div>
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: accent,
            background: 'var(--accent-50)', padding: '4px 9px', borderRadius: 'var(--radius-xs)',
          }}>Verificato</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {chip('arrow-right', 'Stessa zona')}
          {chip('clock', 'Stesso orario')}
        </div>
      </div>
    </SceneFrame>
  );
}

const ONB_SCENES = [SceneSplit, SceneFree, SceneMatch];

Object.assign(window, {
  ONB_CONTENT, CTA_TEXT, ONB_SCENES,
  SceneFrame, SceneSplit, SceneFree, SceneMatch,
});
