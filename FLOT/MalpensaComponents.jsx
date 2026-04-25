// MalpensaComponents.jsx — FLOT Malpensa shared components

const MIcon = ({ name, size = 24, sw = 1.75, color }) => {
  const d = {
    'plane-landing': <g><path d="M2 22h20"/><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L22 7v14"/></g>,
    'users': <g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
    'luggage': <g><rect x="6" y="8" width="12" height="13" rx="2"/><path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/><path d="M9 21v1M15 21v1"/></g>,
    'search': <g><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></g>,
    'map-pin': <g><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></g>,
    'phone': <g><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g>,
    'message-circle': <g><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></g>,
    'timer': <g><circle cx="12" cy="14" r="8"/><path d="M12 10v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></g>,
    'chevron-left': <path d="m15 18-6-6 6-6"/>,
    'chevron-right': <path d="m9 18 6-6-6-6"/>,
    'check': <path d="M20 6 9 17l-5-5"/>,
    'help-circle': <g><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></g>,
    'plus': <g><path d="M12 5v14"/><path d="M5 12h14"/></g>,
    'minus': <path d="M5 12h14"/>,
    'sparkles': <g><path d="M9.94 5.17 8.5 2l-1.44 3.17L4 6.5l3.06 1.33L8.5 11l1.44-3.17L13 6.5z"/><path d="m19 3-1.26 2.74L15 7l2.74 1.26L19 11l1.26-2.74L23 7l-2.74-1.26z"/><path d="m19 16-1.26 2.74L15 20l2.74 1.26L19 24"/></g>,
    'arrow-right': <g><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></g>,
    'shield': <g><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></g>,
    'crown': <g><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L20.183 6.2a.5.5 0 0 1 .798.519l-1.494 7.6a1 1 0 0 1-.981.8H5.494a1 1 0 0 1-.981-.8L3.02 6.72a.5.5 0 0 1 .798-.519l3.276 2.962a1 1 0 0 0 1.516-.294z"/><path d="M5.494 15.118h13.012"/></g>,
    'eye': <g><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></g>,
    'x': <g><path d="M18 6 6 18"/><path d="m6 6 12 12"/></g>,
    'info': <g><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></g>,
    'zap': <g><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></g>,
    'navigation': <g><polygon points="3 11 22 2 13 21 11 13 3 11"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color || 'currentColor'} strokeWidth={sw}
         strokeLinecap="round" strokeLinejoin="round">
      {d[name]}
    </svg>
  );
};

// ─── Segment Control ───
const MSegment = ({ options, value, onChange }) => (
  <div style={{
    display: 'flex', background: '#F1F5F9', borderRadius: 16, padding: 4, gap: 4,
  }}>
    {options.map(opt => {
      const active = opt === value;
      return (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, height: 44, border: 'none', borderRadius: 12, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: active ? 600 : 500,
          color: active ? '#0F172A' : '#64748B',
          background: active ? '#FFFFFF' : 'transparent',
          boxShadow: active ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
          transition: 'all 200ms cubic-bezier(0.22,0.61,0.36,1)',
        }}>{opt}</button>
      );
    })}
  </div>
);

// ─── Button ───
const MBtn = ({ variant = 'primary', children, onClick, icon, full = true, disabled, small }) => {
  const [pr, setPr] = React.useState(false);
  const base = {
    primary: { background: '#F59E0B', color: '#0F172A', boxShadow: '0 1px 3px rgba(245,158,11,0.25)' },
    dark: { background: '#0F172A', color: '#FFFFFF' },
    secondary: { background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0' },
    ghost: { background: 'transparent', color: '#475569' },
    outline: { background: 'transparent', color: '#0F172A', border: '1.5px solid #0F172A' },
  }[variant];
  return (
    <button
      onPointerDown={() => setPr(true)} onPointerUp={() => setPr(false)} onPointerLeave={() => setPr(false)}
      onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        width: full ? '100%' : 'auto',
        height: small ? 44 : 56,
        padding: small ? '0 16px' : '0 24px',
        fontFamily: "'Inter', sans-serif", fontSize: small ? 14 : 16, fontWeight: 600,
        borderRadius: 24, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transform: pr && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms cubic-bezier(0.22,0.61,0.36,1)',
        opacity: disabled ? 0.4 : 1,
        ...base,
      }}
    >
      {icon && <MIcon name={icon} size={small ? 18 : 20} />}
      {children}
    </button>
  );
};

// ─── Stepper ───
const MStepper = ({ value, onChange, min = 1, max = 4 }) => {
  const btn = (dir, dis, ico) => (
    <button onClick={() => !dis && onChange(value + dir)} disabled={dis} style={{
      width: 36, height: 36, borderRadius: 999, border: '1px solid #E2E8F0',
      background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.35 : 1, color: '#0F172A',
    }}>
      <MIcon name={ico} size={16} sw={2.25}/>
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {btn(-1, value <= min, 'minus')}
      <div style={{
        fontFamily: "'Bricolage Grotesque', sans-serif", fontFeatureSettings: '"tnum" 1',
        fontSize: 28, fontWeight: 700, color: '#0F172A', minWidth: 32, textAlign: 'center',
      }}>{value}</div>
      {btn(1, value >= max, 'plus')}
    </div>
  );
};

// ─── Pill ───
const MPill = ({ variant = 'neutral', children, icon, live }) => {
  const s = {
    neutral: { background: '#F1F5F9', color: '#475569' },
    success: { background: '#DCFCE7', color: '#15803D' },
    live: { background: '#FEF3C7', color: '#92400E' },
    error: { background: '#FEE2E2', color: '#B91C1C' },
    amber: { background: '#FEF3C7', color: '#92400E' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
      ...s,
    }}>
      {live && <span style={{ width: 6, height: 6, borderRadius: 999, background: '#F59E0B', animation: 'mPulse 1.4s infinite' }}/>}
      {icon && <MIcon name={icon} size={14} />}
      {children}
    </span>
  );
};

// ─── Destination Input ───
const MDestInput = ({ value, placeholder, onClick, focused }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
    background: focused ? '#FFFFFF' : '#F1F5F9',
    border: focused ? '1.5px solid #E2E8F0' : '1.5px solid transparent',
    boxShadow: focused ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
    borderRadius: 20, cursor: 'pointer',
    transition: 'all 180ms cubic-bezier(0.22,0.61,0.36,1)',
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400E', flexShrink: 0 }}>
      <MIcon name="map-pin" size={20}/>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: value ? 16 : 15, fontWeight: value ? 600 : 400, color: value ? '#0F172A' : '#94A3B8' }}>
        {value || placeholder}
      </div>
    </div>
    <MIcon name="chevron-right" size={18} color="#94A3B8" />
  </div>
);

Object.assign(window, { MIcon, MSegment, MBtn, MStepper, MPill, MDestInput });
