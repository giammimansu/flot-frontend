/* ============================================================
   FLOT — Onboarding Screen
   ============================================================ */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAirportStore } from '../../stores/airportStore';

/* ---- Icon Component (Lucide SVGs) ---- */
const LUCIDE_PATHS: Record<string, React.ReactNode> = {
  plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  'circle-check': <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  'shield-check': <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {LUCIDE_PATHS[name] || null}
    </svg>
  );
}

/* ---- Localized Content Data ---- */
interface CardStep {
  icon: string;
  text: string;
}

interface CardCriteria {
  icon: string;
  k: string;
  v: string;
}

interface OnboardingCard {
  eyebrow: string;
  title: string;
  steps?: CardStep[];
  points?: string[];
  criteria?: CardCriteria[];
  note: string;
}

interface LocaleContent {
  skipShort: string;
  skipLong: string;
  next: string;
  cards: OnboardingCard[];
  done: {
    title: string;
    body: string;
    action: string;
    reset: string;
  };
}

const ONB_CONTENT: Record<'it' | 'en', LocaleContent> = {
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
          'Se l’altro non sblocca in tempo, nessuno viene addebitato',
        ],
        note: 'È un accordo reciproco: nessuno dei due paga se l’altro non vuole procedere.',
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
    done: {
      title: 'Tutto chiaro.',
      body: 'Qui inizia il check-in.',
      action: 'Inizia il check-in',
      reset: 'Rivedi l’introduzione'
    },
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
        note: 'We don’t drive. You call the taxi, you pay it — directly to the driver.',
      },
      {
        eyebrow: 'No risk',
        title: 'No match? No charge. Ever.',
        points: [
          'Searching for a match is free',
          'When one’s found, you see who it is — blurred photo — before deciding',
          'You pay €1.99 only if you both unlock',
          'If the other doesn’t unlock in time, nobody is charged',
        ],
        note: 'It’s a mutual deal: neither of you pays if the other won’t proceed.',
      },
      {
        eyebrow: 'Who you’re matched with',
        title: 'Your match is already at the airport, heading where you are.',
        criteria: [
          { icon: 'arrow-right',   k: 'Same direction', v: 'Matched only with people going to your area' },
          { icon: 'clock',         k: 'Same time',      v: 'A tight window, no waiting around' },
          { icon: 'shield-check',  k: 'Visible profile', v: 'Name, blurred photo and verification badge before deciding' },
        ],
        note: 'You can always decline a match. No pressure.',
      },
    ],
    done: {
      title: 'All clear.',
      body: 'Check-in starts here.',
      action: 'Start check-in',
      reset: 'Replay the intro'
    },
  },
};

const CTA_TEXT = {
  match:     { it: 'Cerca il mio match',     en: 'Find my match' },
  rideshare: { it: 'Prenota il mio ride-share', en: 'Book my ride-share' },
};

/* ---- Visual Scenes ---- */
interface SceneProps {
  accent: string;
}

function SceneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--primary-50)',
      border: '1px solid var(--primary-100)',
      height: 'clamp(130px, 26vh, 248px)',
      flexShrink: 0,
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
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

function SceneSplit({ accent }: SceneProps) {
  const half = (who: string, accentColor: string, initials: string, initBg: string, initFg: string) => (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--neutral-400)', textDecoration: 'line-through' }}>€120</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)' }}>taxi intero</span>
      </div>
      <div style={{
        width: '100%', maxWidth: 280, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
        display: 'flex', position: 'relative',
      }}>
        {half('Tu', accent, 'TU', 'var(--accent-50)', accent)}
        <div style={{ width: 0, borderLeft: '2px dashed var(--neutral-200)', margin: '14px 0' }}></div>
        {half('Match', 'var(--primary-600)', 'M', 'var(--primary-100)', 'var(--primary-700)')}
      </div>
    </SceneFrame>
  );
}

function SceneFree({ accent }: SceneProps) {
  const blurBar = (w: string) => (
    <div style={{ height: 8, width: w, borderRadius: 'var(--radius-full)', background: 'var(--neutral-200)' }}></div>
  );
  return (
    <SceneFrame>
      <div style={{
        width: '100%', maxWidth: 264, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
        padding: 16, display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
      }}>
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-card)',
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

function SceneMatch({ accent }: SceneProps) {
  const chip = (icon: string, label: string) => (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'var(--neutral-0)',
      border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-full)',
      padding: '5px 11px',
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--neutral-700)',
    }}>
      <Icon name={icon} size={13} color="var(--primary-500)" />{label}
    </div>
  );
  return (
    <SceneFrame>
      <div style={{
        width: '100%', maxWidth: 268, background: 'var(--neutral-0)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

/* ---- Card Sub-renderers ---- */
function StepsBody({ steps, accent }: { steps: CardStep[]; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-full)', flexShrink: 0,
            background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <Icon name={s.icon} size={16} color="var(--primary-600)" />
            <span style={{
              position: 'absolute', top: -5, left: -5, width: 17, height: 17, borderRadius: 'var(--radius-full)',
              background: accent, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{i + 1}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.4, color: 'var(--neutral-800)' }}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

function PointsBody({ points }: { points: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flexShrink: 0 }}>
      {points.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="check" size={17} color="var(--primary-500)" style={{ marginTop: 1 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.45, color: 'var(--neutral-800)' }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function CriteriaBody({ criteria }: { criteria: CardCriteria[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      {criteria.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={c.icon} size={17} color="var(--primary-600)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--neutral-900)' }}>{c.k}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--neutral-600)', marginTop: 1 }}>{c.v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 9, alignItems: 'flex-start',
      background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)',
      borderRadius: 'var(--radius-md)', padding: '11px 13px',
      flexShrink: 0,
    }}>
      <Icon name="info" size={15} color="var(--neutral-400)" style={{ marginTop: 1 }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.45, color: 'var(--neutral-600)' }}>{children}</span>
    </div>
  );
}

/* ---- Single Slide Component ---- */
interface SlideProps {
  card: OnboardingCard;
  index: number;
  accent: string;
}

function Slide({ card, index, accent }: SlideProps) {
  const Scene = ONB_SCENES[index];
  return (
    <div style={{
      width: '33.333%', flexShrink: 0, height: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      padding: 'clamp(8px, 1.5vh, 16px) 24px 8px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vh, 18px)',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: 'var(--primary-600)',
        flexShrink: 0,
      }}>{card.eyebrow}</div>
      <Scene accent={accent} />
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.25,
        letterSpacing: '-0.01em', color: 'var(--neutral-900)', margin: 0,
        flexShrink: 0,
      }}>{card.title}</h2>
      {card.steps && <StepsBody steps={card.steps} accent={accent} />}
      {card.points && <PointsBody points={card.points} />}
      {card.criteria && <CriteriaBody criteria={card.criteria} />}
      <CardNote>{card.note}</CardNote>
    </div>
  );
}

/* ---- Done State Handoff Screen ---- */
interface DoneScreenProps {
  C: LocaleContent;
  accent: string;
  onReset: () => void;
  onConfirm: () => void;
}

function DoneScreen({ C, accent, onReset, onConfirm }: DoneScreenProps) {
  return (
    <div style={{
      height: '100%', background: 'var(--neutral-0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 40px', gap: 24, textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-full)', background: 'var(--primary-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="circle-check" size={36} color="var(--primary-500)" />
      </div>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>
          {C.done.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--neutral-500)', marginTop: 8, lineHeight: 1.5 }}>
          {C.done.body}
        </p>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
        <button
          onClick={onConfirm}
          style={{
            height: 52, width: '100%', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            background: accent, color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-card)', transition: 'transform 100ms ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {C.done.action}
          <Icon name="arrow-right" size={18} color="#fff" />
        </button>
        <button onClick={onReset} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)',
          padding: '8px 0',
        }}>
          {C.done.reset}
        </button>
      </div>
    </div>
  );
}

/* ---- Main Onboarding Screen Component ---- */
export function Onboarding() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isGestureStarted = useRef(false);
  const isSwipingHorizontal = useRef(false);
  const isSwipingVertical = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Set the locale based on user profile setting or browser language
  const userLang = user?.lang || '';
  const isIt = userLang.startsWith('it') || navigator.language.startsWith('it');
  const locale = isIt ? 'it' : 'en';

  const C = ONB_CONTENT[locale];
  const accent = 'var(--accent-500)'; // Cora accent defined in design tokens
  const last = C.cards.length - 1;

  const go = (n: number) => setI(Math.max(0, Math.min(last, n)));

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isGestureStarted.current = false;
    isSwipingHorizontal.current = false;
    isSwipingVertical.current = false;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Detect gesture direction on first significant movement
    if (!isGestureStarted.current) {
      const threshold = 8;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        isGestureStarted.current = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          isSwipingHorizontal.current = true;
          if (trackRef.current) {
            trackRef.current.setPointerCapture(e.pointerId);
          }
        } else {
          isSwipingVertical.current = true;
          dragging.current = false; // Discard horizontal drag to allow native vertical scroll
        }
      }
      return;
    }

    if (isSwipingHorizontal.current) {
      setDrag(dx);
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current && !isSwipingHorizontal.current) {
      dragging.current = false;
      return;
    }
    dragging.current = false;
    if (trackRef.current && isSwipingHorizontal.current) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
    const w = trackRef.current ? trackRef.current.offsetWidth : 360;
    const dx = e.clientX - startX.current;
    const threshold = Math.min(60, w * 0.18);
    if (isSwipingHorizontal.current) {
      if (dx <= -threshold) {
        go(i + 1);
      } else if (dx >= threshold) {
        go(i - 1);
      }
    }
    setDrag(0);
  };

  const finishOnboarding = () => {
    if (user?.userId) {
      localStorage.setItem(`onboarding_seen_${user.userId}`, 'true');
    }
    // Route matching redirectAfterAuth
    const selectedAirport = useAirportStore.getState().selectedAirport;
    if (selectedAirport) {
      navigate('/check-in', { replace: true });
    } else {
      navigate('/airport', { replace: true });
    }
  };

  if (done) {
    return (
      <DoneScreen
        C={C}
        accent={accent}
        onReset={() => { setDone(false); setI(0); }}
        onConfirm={finishOnboarding}
      />
    );
  }

  const advance = () => (i < last ? go(i + 1) : setDone(true));
  const ctaLabel = i < last ? C.next : CTA_TEXT.match[locale];

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--neutral-0)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(32px, 6vh, 54px) 24px 6px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--primary-600)', letterSpacing: '-0.01em' }}>flot</span>
        {i < last ? (
          <button onClick={finishOnboarding} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--neutral-400)',
          }}>{C.skipShort}</button>
        ) : null}
      </div>

      {/* Swipeable Carousel */}
      <div
        ref={trackRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'pan-y',
          cursor: dragging.current && isSwipingHorizontal.current ? 'grabbing' : 'grab',
        }}
      >
        <div style={{
          display: 'flex',
          width: '300%',
          height: '100%',
          transform: `translateX(calc(${(-i * 100) / 3}% + ${drag}px))`,
          transition: dragging.current && isSwipingHorizontal.current ? 'none' : 'transform 320ms var(--ease-out)',
        }}>
          {C.cards.map((card, n) => (
            <Slide key={n} card={card} index={n} accent={accent} />
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{ flexShrink: 0, padding: '12px 24px clamp(16px, 4vh, 34px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vh, 20px)' }}>
        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {C.cards.map((_, n) => (
            <button
              key={n}
              onClick={() => go(n)}
              aria-label={`card ${n + 1}`}
              style={{
                width: n === i ? 22 : 8,
                height: 8,
                borderRadius: 'var(--radius-full)',
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                background: n === i ? 'var(--neutral-700)' : 'var(--neutral-300)',
                transition: 'width 250ms var(--ease-out), background 250ms var(--ease-out)',
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={advance}
          style={{
            height: 52, width: '100%', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            background: accent, color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'var(--shadow-card)', transition: 'transform 100ms ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {ctaLabel}
          <Icon name="arrow-right" size={18} color="#fff" />
        </button>

        {/* Bottom Skip Link for final slide */}
        <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {i === last && (
            <button onClick={finishOnboarding} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)',
            }}>{C.skipLong}</button>
          )}
        </div>
      </div>
    </div>
  );
}
