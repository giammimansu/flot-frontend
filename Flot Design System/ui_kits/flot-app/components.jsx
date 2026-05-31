/* Flot App — Shared UI Components */

const flotComponentStyles = {
  /* Will use inline styles referencing CSS vars */
};

/* ============ AVATAR ============ */
function Avatar({ name, size = 40, src, style }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const s = {
    width: size, height: size, borderRadius: '50%',
    background: 'var(--primary-100)', color: 'var(--primary-700)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-body)', fontSize: size * 0.38, fontWeight: 700,
    flexShrink: 0, overflow: 'hidden', ...style
  };
  if (src) return <div style={s}><img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
  return <div style={s}>{initials}</div>;
}

/* ============ BADGE ============ */
function Badge({ children, variant = 'info', style }) {
  const variants = {
    success: { background: 'var(--success-50)', color: 'var(--success-700)' },
    warning: { background: 'var(--warning-50)', color: 'var(--warning-700)' },
    error:   { background: 'var(--error-50)',   color: 'var(--error-700)' },
    info:    { background: 'var(--primary-50)', color: 'var(--primary-700)' },
    neutral: { background: 'var(--neutral-100)', color: 'var(--neutral-600)' },
    accent:  { background: 'var(--accent-50)',  color: 'var(--accent-700)' },
  };
  const s = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 4,
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
    ...variants[variant], ...style
  };
  return <span style={s}>{children}</span>;
}

/* ============ BUTTON ============ */
function Button({ children, variant = 'primary', size = 'md', full, onClick, disabled, icon, style }) {
  const sizes = {
    lg: { height: 52, padding: '0 24px', fontSize: 16, borderRadius: 12 },
    md: { height: 44, padding: '0 18px', fontSize: 14, borderRadius: 8 },
    sm: { height: 34, padding: '0 14px', fontSize: 12, borderRadius: 6 },
  };
  const variants = {
    primary:   { background: 'var(--primary-500)', color: '#fff', border: 'none' },
    accent:    { background: 'var(--accent-500)',  color: '#fff', border: 'none' },
    secondary: { background: 'var(--neutral-100)', color: 'var(--neutral-800)', border: 'none' },
    outline:   { background: 'transparent', color: 'var(--primary-600)', border: '1.5px solid var(--primary-300)' },
    ghost:     { background: 'transparent', color: 'var(--primary-600)', border: 'none' },
  };
  const s = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
    transition: 'all 150ms ease', width: full ? '100%' : 'auto',
    opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto',
    ...sizes[size], ...variants[variant], ...style
  };
  return <button style={s} onClick={onClick}>{icon && <i className={`icon-${icon}`} style={{ fontSize: sizes[size].fontSize + 2 }}></i>}{children}</button>;
}

/* ============ INPUT FIELD ============ */
function InputField({ label, placeholder, value, onChange, error, hint, type = 'text', icon, style }) {
  const [focused, setFocused] = React.useState(false);
  const inputStyle = {
    height: 48, padding: icon ? '0 14px 0 42px' : '0 14px',
    border: `1.5px solid ${error ? 'var(--error-500)' : focused ? 'var(--primary-500)' : 'var(--neutral-200)'}`,
    borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 15,
    color: 'var(--neutral-900)', background: '#fff', outline: 'none', width: '100%',
    boxShadow: focused ? '0 0 0 3px var(--primary-100)' : 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)', fontFamily: 'var(--font-body)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <i className={`icon-${icon}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--neutral-400)' }}></i>}
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={inputStyle}
        />
      </div>
      {(hint || error) && <span style={{ fontSize: 11, color: error ? 'var(--error-500)' : 'var(--neutral-500)', fontFamily: 'var(--font-body)' }}>{error || hint}</span>}
    </div>
  );
}

/* ============ CARD ============ */
function Card({ children, onClick, style }) {
  const s = {
    background: '#fff', borderRadius: 14, padding: 18,
    boxShadow: '0 2px 8px rgba(10,22,36,0.07)',
    border: '1px solid var(--neutral-100)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'box-shadow 200ms ease', ...style
  };
  return <div style={s} onClick={onClick}>{children}</div>;
}

/* ============ TOP BAR ============ */
function TopBar({ title, subtitle, leftIcon, rightIcons, onLeft, onRight, transparent }) {
  const s = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '58px 20px 10px',
    background: transparent ? 'transparent' : 'var(--primary-500)',
    color: transparent ? 'var(--neutral-900)' : '#fff',
  };
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {leftIcon && <i className={`icon-${leftIcon}`} style={{ fontSize: 22, cursor: 'pointer' }} onClick={onLeft}></i>}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {rightIcons && (
        <div style={{ display: 'flex', gap: 18 }}>
          {rightIcons.map((ic, i) => <i key={i} className={`icon-${ic.icon}`} style={{ fontSize: 21, cursor: 'pointer', position: 'relative' }} onClick={() => onRight && onRight(ic.icon)}>
            {ic.badge && <span style={{ position: 'absolute', top: -3, right: -5, width: 8, height: 8, background: 'var(--accent-500)', borderRadius: '50%', border: '1.5px solid var(--primary-500)' }}></span>}
          </i>)}
        </div>
      )}
    </div>
  );
}

/* ============ BOTTOM NAV ============ */
function BottomNav({ active, onNavigate }) {
  const tabs = [
    { id: 'home', icon: 'house', label: 'Home' },
    { id: 'trips', icon: 'search', label: 'Trips' },
    { id: 'chat', icon: 'message-circle', label: 'Chat', badge: true },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '7px 0 2px', background: '#fff',
      borderTop: '1px solid var(--neutral-100)',
    }}>
      {tabs.map(tab => (
        <div key={tab.id} onClick={() => onNavigate(tab.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          cursor: 'pointer', padding: '4px 12px',
        }}>
          <div style={{ position: 'relative' }}>
            <i className={`icon-${tab.icon}`} style={{
              fontSize: 22,
              color: active === tab.id ? 'var(--primary-500)' : 'var(--neutral-400)',
            }}></i>
            {tab.badge && active !== 'chat' && <span style={{
              position: 'absolute', top: -2, right: -5,
              width: 7, height: 7, background: 'var(--accent-500)',
              borderRadius: '50%', border: '1.5px solid #fff',
            }}></span>}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600,
            fontFamily: 'var(--font-body)',
            color: active === tab.id ? 'var(--primary-500)' : 'var(--neutral-400)',
          }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ============ TRIP CARD ============ */
function TripCard({ from, to, terminal, time, luggage, price, originalPrice, status, onClick }) {
  return (
    <Card onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--neutral-900)' }}>{from} → {to}</span>
        <Badge variant={status === 'matched' ? 'success' : status === 'searching' ? 'info' : status === 'pending' ? 'warning' : 'neutral'}>
          {status === 'matched' ? 'Matched' : status === 'searching' ? 'Searching' : status === 'pending' ? 'Pending' : 'Draft'}
        </Badge>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)' }}></div>
        <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{terminal}</span>
        <div style={{ flex: 1, height: 2, background: 'var(--neutral-200)', borderRadius: 1 }}></div>
        <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{to}</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-500)' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--neutral-500)', fontFamily: 'var(--font-body)' }}>
          <span><i className="icon-clock" style={{ fontSize: 14, verticalAlign: -2, marginRight: 3 }}></i>{time}</span>
          <span><i className="icon-briefcase" style={{ fontSize: 14, verticalAlign: -2, marginRight: 3 }}></i>{luggage}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--primary-600)' }}>€{price}</span>
          {originalPrice && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--neutral-400)', textDecoration: 'line-through' }}>€{originalPrice}</span>}
        </div>
      </div>
    </Card>
  );
}

/* ============ MATCH CARD ============ */
function MatchCard({ name, rating, rides, flight, time, onUnlock, unlocked }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--neutral-900)' }}>Your match</span>
        <Badge variant={unlocked ? 'success' : 'warning'}>{unlocked ? 'Connected' : 'Pending unlock'}</Badge>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={name} size={44} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--neutral-800)', fontFamily: 'var(--font-body)' }}>{unlocked ? name : name.split(' ')[0].slice(0, 1) + '.'}</div>
          <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{rating} ★ · {rides} rides</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--neutral-500)' }}>
        <span><i className="icon-plane" style={{ fontSize: 14, verticalAlign: -2, marginRight: 3 }}></i>{flight}</span>
        <span><i className="icon-clock" style={{ fontSize: 14, verticalAlign: -2, marginRight: 3 }}></i>{time}</span>
      </div>
      {!unlocked && (
        <Button variant="primary" full size="md" onClick={onUnlock}>
          Unlock match · €1.99
        </Button>
      )}
      {unlocked && (
        <Button variant="primary" full size="md" icon="message-circle" onClick={onUnlock}>
          Start chatting
        </Button>
      )}
    </Card>
  );
}

/* ============ TOGGLE ============ */
function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => onChange && onChange(!value)}>
      <div style={{
        width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
        background: value ? 'var(--primary-500)' : 'var(--neutral-200)',
        transition: 'background 200ms', position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 24 : 2,
          width: 22, height: 22, background: '#fff', borderRadius: '50%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 200ms',
        }}></div>
      </div>
      {label && <span style={{ fontSize: 14, color: 'var(--neutral-700)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>{label}</span>}
    </div>
  );
}

/* ============ SECTION HEADER ============ */
function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--neutral-900)' }}>{title}</span>
      {action && <span onClick={onAction} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-500)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>{action}</span>}
    </div>
  );
}

/* Export to window */
Object.assign(window, {
  Avatar, Badge, Button, InputField, Card, TopBar, BottomNav,
  TripCard, MatchCard, Toggle, SectionHeader
});
