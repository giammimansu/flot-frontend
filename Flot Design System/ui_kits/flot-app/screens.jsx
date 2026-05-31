/* Flot App — Screen Compositions */

/* ============ HOME SCREEN ============ */
function HomeScreen({ onNavigate, onCreateTrip, onTripClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--neutral-50)' }}>
      <TopBar
        title="flot"
        rightIcons={[{ icon: 'bell', badge: true }, { icon: 'settings' }]}
      />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
        {/* Hero CTA */}
        <div style={{ margin: '0 20px', background: 'var(--primary-500)', borderRadius: 16, padding: 22, color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Split the ride
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16, lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
            Share a taxi from Malpensa and save up to 50% on your fare.
          </div>
          <Button variant="accent" size="md" onClick={onCreateTrip} icon="plus" style={{ borderRadius: 10 }}>
            Create a trip
          </Button>
        </div>

        {/* Active Trips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionHeader title="Your trips" action="See all" />
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TripCard
              from="MXP" to="Duomo" terminal="Terminal 1" time="14:35"
              luggage="1 bag" price="60" originalPrice="120" status="matched"
              onClick={() => onTripClick && onTripClick('matched')}
            />
            <TripCard
              from="MXP" to="Centrale" terminal="Terminal 2" time="Tomorrow 09:15"
              luggage="2 bags" price="55" originalPrice="110" status="searching"
              onClick={() => onTripClick && onTripClick('searching')}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ padding: '0 20px' }}>
          <Card style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary-600)' }}>€180</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2, fontFamily: 'var(--font-body)' }}>Total saved</div>
            </div>
            <div style={{ width: 1, background: 'var(--neutral-100)' }}></div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary-600)' }}>4</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2, fontFamily: 'var(--font-body)' }}>Rides shared</div>
            </div>
            <div style={{ width: 1, background: 'var(--neutral-100)' }}></div>
            <div style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--primary-600)' }}>4.8</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2, fontFamily: 'var(--font-body)' }}>Your rating</div>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

/* ============ NEW TRIP SCREEN ============ */
function NewTripScreen({ onBack, onSubmit }) {
  const [destination, setDestination] = React.useState('');
  const [terminal, setTerminal] = React.useState('Terminal 1');
  const [flight, setFlight] = React.useState('');
  const [flexible, setFlexible] = React.useState(true);
  const [largeLuggage, setLargeLuggage] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <TopBar title="New trip" leftIcon="arrow-left" onLeft={onBack} transparent />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Airport indicator */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--primary-50)', border: '1.5px solid var(--primary-200)', boxShadow: 'none' }}>
          <i className="icon-plane" style={{ fontSize: 20, color: 'var(--primary-600)' }}></i>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'var(--font-body)' }}>Milano Malpensa (MXP)</div>
            <div style={{ fontSize: 11, color: 'var(--primary-500)' }}>Departure airport</div>
          </div>
        </Card>

        <InputField label="Destination" placeholder="e.g. Piazza Duomo, Milano" value={destination} onChange={setDestination} icon="map-pin" hint="Street address or landmark" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)', fontFamily: 'var(--font-body)' }}>Terminal</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Terminal 1', 'Terminal 2'].map(t => (
              <div key={t} onClick={() => setTerminal(t)} style={{
                flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                border: `1.5px solid ${terminal === t ? 'var(--primary-500)' : 'var(--neutral-200)'}`,
                background: terminal === t ? 'var(--primary-50)' : '#fff',
                color: terminal === t ? 'var(--primary-700)' : 'var(--neutral-600)',
                transition: 'all 150ms ease',
              }}>{t}</div>
            ))}
          </div>
        </div>

        <InputField label="Flight number" placeholder="e.g. AZ 1280" value={flight} onChange={setFlight} icon="plane" hint="We'll sync with your arrival time" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '6px 0' }}>
          <Toggle value={flexible} onChange={setFlexible} label="Flexible timing (±30 min)" />
          <Toggle value={largeLuggage} onChange={setLargeLuggage} label="Large luggage" />
        </div>

        {/* Price preview */}
        <Card style={{ background: 'var(--neutral-50)', boxShadow: 'none', border: '1px solid var(--neutral-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--neutral-500)', fontFamily: 'var(--font-body)' }}>Estimated fare (split)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--primary-600)' }}>€60</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--neutral-400)', textDecoration: 'line-through' }}>€120</span>
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="icon-percent" style={{ fontSize: 22, color: 'var(--primary-600)' }}></i>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ padding: '12px 20px 8px', borderTop: '1px solid var(--neutral-100)' }}>
        <Button variant="primary" size="lg" full onClick={onSubmit} style={{ borderRadius: 12 }}>
          Find a co-rider
        </Button>
      </div>
    </div>
  );
}

/* ============ MATCHING SCREEN ============ */
function MatchingScreen({ onBack, onMatchFound, matchFound }) {
  const [dots, setDots] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (matchFound) return;
    const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    const timeInterval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(dotInterval); clearInterval(timeInterval); };
  }, [matchFound]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <TopBar title="Finding a match" leftIcon="arrow-left" onLeft={onBack} transparent />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
        {!matchFound ? (
          <>
            {/* Searching animation */}
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '3px solid var(--primary-100)',
              }}></div>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '3px solid transparent', borderTopColor: 'var(--primary-500)',
                animation: 'spin 1.2s linear infinite',
              }}></div>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="icon-users" style={{ fontSize: 36, color: 'var(--primary-500)' }}></i>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--neutral-900)', marginBottom: 6 }}>
                Searching for riders{dots}
              </div>
              <div style={{ fontSize: 14, color: 'var(--neutral-500)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                We're looking for someone heading your way from Terminal 1.
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--neutral-400)' }}>{formatTime(elapsed)}</div>
            <Button variant="secondary" size="md" onClick={onMatchFound}>Match found</Button>
          </>
        ) : (
          <>
            {/* Match found */}
            <div style={{
              width: 100, height: 100, borderRadius: '50%', background: 'var(--success-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="icon-circle-check" style={{ fontSize: 48, color: 'var(--success-500)' }}></i>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 6 }}>
                Match found
              </div>
              <div style={{ fontSize: 14, color: 'var(--neutral-500)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                We found someone heading to a nearby destination. Unlock to connect.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ MATCH DETAIL SCREEN ============ */
function MatchDetailScreen({ onBack, onChat, onNavigate }) {
  const [unlocked, setUnlocked] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--neutral-50)' }}>
      <TopBar title="Match details" leftIcon="arrow-left" onLeft={onBack} transparent />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <MatchCard
          name="Sofia Lombardi" rating="4.9" rides="12"
          flight="AZ 1280" time="14:20"
          unlocked={unlocked}
          onUnlock={() => unlocked ? (onChat && onChat()) : setUnlocked(true)}
        />

        <TripCard
          from="MXP" to="Duomo" terminal="Terminal 1" time="14:35"
          luggage="1 bag" price="60" originalPrice="120" status="matched"
        />

        {/* Ride details */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--neutral-900)' }}>Ride details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: 'map-pin', label: 'Pickup', value: 'Terminal 1 — Taxi stand' },
              { icon: 'navigation', label: 'Drop-off', value: 'Piazza Duomo, Milano' },
              { icon: 'clock', label: 'Est. travel', value: '~50 min' },
              { icon: 'shield-check', label: 'Verified', value: 'Both riders verified' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`icon-${item.icon}`} style={{ fontSize: 16, color: 'var(--neutral-500)' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-400)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--neutral-800)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <BottomNav active="trips" onNavigate={onNavigate} />
    </div>
  );
}

/* ============ CHAT SCREEN ============ */
function ChatScreen({ onBack }) {
  const [message, setMessage] = React.useState('');
  const messages = [
    { from: 'them', text: 'Ciao! I just landed, heading to the taxi stand now.', time: '14:22' },
    { from: 'me', text: 'I\'m already here at Terminal 1. See you in a few minutes!', time: '14:23' },
    { from: 'them', text: 'I\'m the one with the red suitcase 😊', time: '14:25' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <TopBar title="Sofia L." subtitle="Your co-rider" leftIcon="arrow-left" onLeft={onBack} transparent />
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* System message */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--neutral-400)', background: 'var(--neutral-50)', padding: '4px 12px', borderRadius: 8, fontFamily: 'var(--font-body)' }}>
            Match unlocked · Today 14:20
          </span>
        </div>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
              borderBottomRightRadius: msg.from === 'me' ? 4 : 14,
              borderBottomLeftRadius: msg.from === 'them' ? 4 : 14,
              background: msg.from === 'me' ? 'var(--primary-500)' : 'var(--neutral-100)',
              color: msg.from === 'me' ? '#fff' : 'var(--neutral-800)',
              fontSize: 14, lineHeight: 1.45, fontFamily: 'var(--font-body)',
            }}>
              {msg.text}
              <div style={{
                fontSize: 10, marginTop: 4,
                color: msg.from === 'me' ? 'rgba(255,255,255,0.6)' : 'var(--neutral-400)',
                textAlign: 'right',
              }}>{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Message input */}
      <div style={{ padding: '10px 16px 6px', borderTop: '1px solid var(--neutral-100)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1, height: 44, padding: '0 16px', border: '1.5px solid var(--neutral-200)',
            borderRadius: 22, fontFamily: 'var(--font-body)', fontSize: 14,
            color: 'var(--neutral-900)', outline: 'none',
          }}
        />
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <i className="icon-send" style={{ fontSize: 18, color: '#fff' }}></i>
        </div>
      </div>
    </div>
  );
}

/* ============ PROFILE SCREEN ============ */
function ProfileScreen({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--neutral-50)' }}>
      <TopBar title="Profile" rightIcons={[{ icon: 'settings' }]} transparent />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 20px 20px' }}>
        {/* Profile header */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name="Marco Rossi" size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-900)', fontFamily: 'var(--font-display)' }}>Marco Rossi</div>
            <div style={{ fontSize: 13, color: 'var(--neutral-500)', fontFamily: 'var(--font-body)', marginTop: 2 }}>4.8 ★ · 4 rides · Member since 2025</div>
          </div>
          <Badge variant="accent">PRO</Badge>
        </Card>

        {/* Menu items */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { icon: 'credit-card', label: 'Payment methods', sub: 'Visa ••4821' },
            { icon: 'star', label: 'PRO subscription', sub: 'Active · €4.99/mo' },
            { icon: 'shield-check', label: 'Verification', sub: 'ID verified' },
            { icon: 'clock', label: 'Ride history', sub: '4 rides' },
            { icon: 'circle-help', label: 'Help & support', sub: '' },
          ].map((item, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--neutral-100)' : 'none',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--neutral-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className={`icon-${item.icon}`} style={{ fontSize: 18, color: 'var(--neutral-600)' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--neutral-800)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 12, color: 'var(--neutral-400)', fontFamily: 'var(--font-body)', marginTop: 1 }}>{item.sub}</div>}
              </div>
              <i className="icon-chevron-right" style={{ fontSize: 18, color: 'var(--neutral-300)' }}></i>
            </div>
          ))}
        </Card>
      </div>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}

Object.assign(window, {
  HomeScreen, NewTripScreen, MatchingScreen, MatchDetailScreen, ChatScreen, ProfileScreen
});
