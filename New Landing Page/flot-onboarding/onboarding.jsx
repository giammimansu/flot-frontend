/* Flot Onboarding — carousel, footer, done state, Tweaks-wired app */

const { useState, useRef } = React;

/* ---- per-card body renderers ---- */
function StepsBody({ steps, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.4, color: 'var(--neutral-800)', textWrap: 'pretty' }}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

function PointsBody({ points }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {points.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="check" size={17} color="var(--primary-500)" style={{ marginTop: 1 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.45, color: 'var(--neutral-800)', textWrap: 'pretty' }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function CriteriaBody({ criteria }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--neutral-600)', marginTop: 1, textWrap: 'pretty' }}>{c.v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardNote({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 9, alignItems: 'flex-start',
      background: 'var(--neutral-50)', border: '1px solid var(--neutral-100)',
      borderRadius: 'var(--radius-md)', padding: '11px 13px',
    }}>
      <Icon name="info" size={15} color="var(--neutral-400)" style={{ marginTop: 1 }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.45, color: 'var(--neutral-600)', textWrap: 'pretty' }}>{children}</span>
    </div>
  );
}

/* ---- a single slide ---- */
function Slide({ card, index, showVisual, accent }) {
  const Scene = ONB_SCENES[index];
  return (
    <div style={{
      width: `${100 / 3}%`, flexShrink: 0, height: '100%',
      overflowY: 'auto', overflowX: 'hidden',
      padding: '4px 24px 8px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: 'var(--primary-600)',
      }}>{card.eyebrow}</div>
      {showVisual && <Scene accent={accent} />}
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1.25,
        letterSpacing: '-0.01em', color: 'var(--neutral-900)', margin: 0, textWrap: 'balance',
      }}>{card.title}</h2>
      {card.steps && <StepsBody steps={card.steps} accent={accent} />}
      {card.points && <PointsBody points={card.points} />}
      {card.criteria && <CriteriaBody criteria={card.criteria} />}
      <CardNote>{card.note}</CardNote>
    </div>
  );
}

/* ---- done / hand-off placeholder ---- */
function DoneScreen({ C, accent, onReset }) {
  return (
    <div style={{
      height: '100%', background: 'var(--neutral-0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 40px', gap: 16, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--primary-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="circle-check" size={32} color="var(--primary-500)" />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--neutral-900)' }}>{C.done.title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--neutral-500)', marginTop: 6 }}>{C.done.body}</div>
      </div>
      <button onClick={onReset} style={{
        marginTop: 4, background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: accent,
      }}>{C.done.reset}</button>
    </div>
  );
}

/* ---- main onboarding flow ---- */
function Onboarding({ t }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const trackRef = useRef(null);

  const locale = t.language === 'en' ? 'en' : 'it';
  const C = ONB_CONTENT[locale];
  const accent = t.accent;
  const last = C.cards.length - 1;
  const isFade = t.transition === 'fade';

  const go = (n) => setI(Math.max(0, Math.min(last, n)));

  const onDown = (e) => { dragging.current = true; startX.current = (e.touches ? e.touches[0].clientX : e.clientX); };
  const onMove = (e) => {
    if (!dragging.current) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - startX.current;
    if (!isFade) setDrag(dx);
  };
  const onUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    const w = trackRef.current ? trackRef.current.offsetWidth : 360;
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = x - startX.current;
    const threshold = Math.min(60, w * 0.18);
    if (dx <= -threshold) go(i + 1);
    else if (dx >= threshold) go(i - 1);
    setDrag(0);
  };

  if (done) return <DoneScreen C={C} accent={accent} onReset={() => { setDone(false); setI(0); }} />;

  const dots = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {C.cards.map((_, n) => (
        <button key={n} onClick={() => go(n)} aria-label={`card ${n + 1}`} style={{
          width: n === i ? 22 : 8, height: 8, borderRadius: 'var(--radius-full)', padding: 0, border: 'none', cursor: 'pointer',
          background: n === i ? 'var(--neutral-700)' : 'var(--neutral-300)',
          transition: 'width 250ms var(--ease-out), background 250ms var(--ease-out)',
        }}></button>
      ))}
    </div>
  );

  const advance = () => (i < last ? go(i + 1) : setDone(true));
  const ctaLabel = i < last ? C.next : CTA_TEXT[t.cta][locale];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--neutral-0)' }}>
      {/* header chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '50px 24px 6px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--primary-600)', letterSpacing: '-0.01em' }}>flot</span>
        {i < last && (
          <button onClick={() => setDone(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--neutral-400)',
          }}>{C.skipShort}</button>
        )}
      </div>

      {/* carousel */}
      <div
        ref={trackRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
      >
        {isFade ? (
          C.cards.map((card, n) => (
            <div key={n} style={{
              position: 'absolute', inset: 0,
              opacity: n === i ? 1 : 0, pointerEvents: n === i ? 'auto' : 'none',
              transition: 'opacity 300ms var(--ease-out)',
            }}>
              <div style={{ height: '100%', display: 'flex' }}>
                <div style={{ width: '100%', flexShrink: 0 }}>
                  <Slide card={card} index={n} showVisual={t.showVisual} accent={accent} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex', width: '300%', height: '100%',
            transform: `translateX(calc(${(-i * 100) / 3}% + ${drag}px))`,
            transition: dragging.current ? 'none' : 'transform 320ms var(--ease-out)',
          }}>
            {C.cards.map((card, n) => (
              <Slide key={n} card={card} index={n} showVisual={t.showVisual} accent={accent} />
            ))}
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ flexShrink: 0, padding: '12px 24px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dots}
        <button onClick={advance} style={{
          height: 52, width: '100%', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          background: accent, color: '#fff',
          fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: 'var(--shadow-2)', transition: 'filter 150ms ease, transform 100ms ease',
        }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.985)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {ctaLabel}
          <Icon name="arrow-right" size={18} color="#fff" />
        </button>
        <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {i === last && (
            <button onClick={() => setDone(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--neutral-500)',
            }}>{C.skipLong}</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
