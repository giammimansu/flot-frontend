/* ============================================================
   FLOT — ConnectionUnlocked Screen
   /connection/:matchId  (ProtectedRoute)
   Design: Match sbloccato.dc.html
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MIcon } from '../../components/ui';
import { PartnerProfileSheet } from '../../components/PartnerProfileSheet/PartnerProfileSheet';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useMatchStore } from '../../stores/matchStore';
import { useAuthStore } from '../../stores/authStore';
import { useAirportStore } from '../../stores/airportStore';
import {
  fetchMatch,
  fetchPartnerProfile,
  partnerIdOf,
  composeConnectionView,
  getFullChatHistory,
} from '../../services/matches';
import { getUserRating } from '../../services/reviews';
import type {
  ConnectionView,
  ChatHistoryMessage,
  Match,
  MatchTrip,
  UserRating,
  ReviewDimensionName,
} from '../../types/api';
import type { IconName } from '../../components/ui/MIcon';
import styles from './ConnectionUnlocked.module.css';

const DIMENSIONS: { key: ReviewDimensionName; label: string; icon: IconName }[] = [
  { key: 'punctuality', label: 'Puntualità', icon: 'clock' },
  { key: 'sociability', label: 'Socialità', icon: 'message-circle' },
  { key: 'reliability', label: 'Affidabilità', icon: 'shield-check' },
  { key: 'cleanliness', label: 'Comfort', icon: 'sparkles' },
];

interface ChatMessage {
  id: string;
  messageId?: string;
  kind: 'user' | 'system';
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  pending?: boolean;
}

function historyToMessage(m: ChatHistoryMessage, myId: string | undefined): ChatMessage {
  return {
    id: m.messageId,
    messageId: m.messageId,
    kind: m.type,
    senderId: m.senderId ?? '',
    text: m.text,
    timestamp: m.createdAt,
    isOwn: !!m.senderId && m.senderId === myId,
  };
}

function initialsOf(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

/** "★★★★★" style row from a 0–5 value. */
function starString(value: number): string {
  const n = Math.round(value);
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

/** Format a future-time gap as "1g 18h 45m" / "18h 45m" / "45m". */
function formatGap(ms: number): string | null {
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}g ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ConnectionUnlocked() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { setMatch } = useMatchStore();
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const ws = useWebSocket();

  const [view, setView] = useState<ConnectionView | null>(null);
  const [match, setMatchState] = useState<Match | null>(null);
  const [partnerRating, setPartnerRating] = useState<UserRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      if (incoming.messageId && prev.some((m) => m.messageId === incoming.messageId)) {
        return prev;
      }
      if (incoming.isOwn && incoming.messageId) {
        const idx = prev.findIndex((m) => m.pending && m.isOwn && m.text === incoming.text);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...incoming, pending: false };
          return next;
        }
      }
      return [...prev, incoming];
    });
  }, []);

  // Load match → compose view → load chat history.
  useEffect(() => {
    if (!matchId || !currentUser) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const m = await fetchMatch(matchId!);
        setMatch(m);
        if (!cancelled) setMatchState(m);

        if (m.status !== 'unlocked' && m.status !== 'completed') {
          if (!cancelled) setError('Connessione non ancora sbloccata.');
          return;
        }

        let pool = airports;
        if (pool.length === 0) {
          await loadAirports();
          pool = useAirportStore.getState().airports;
        }
        const airport = pool.find((a) => a.code === m.airportCode) ?? null;

        const partnerId = partnerIdOf(m, currentUser!.userId);
        const partner = await fetchPartnerProfile(partnerId);
        const composed = composeConnectionView(m, currentUser!.userId, partner, airport);
        if (cancelled) return;
        setView(composed);

        try {
          const rating = await getUserRating(partnerId);
          if (!cancelled) setPartnerRating(rating);
        } catch { /* breakdown optional */ }

        try {
          const history = await getFullChatHistory(matchId!);
          if (!cancelled) setMessages(history.map((mm) => historyToMessage(mm, currentUser!.userId)));
        } catch { /* best-effort */ } finally {
          if (!cancelled) setHistoryLoaded(true);
        }
      } catch (err) {
        console.error('[ConnectionUnlocked] load error:', err);
        if (!cancelled) setError('Impossibile caricare la connessione.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, currentUser?.userId]);

  // WebSocket: incoming chat + system messages.
  useEffect(() => {
    const myId = currentUser?.userId;
    const offMsg = ws.on('chat.message', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({ id: data.messageId, messageId: data.messageId, kind: 'user', senderId: data.senderId, text: data.text, timestamp: data.createdAt, isOwn: data.senderId === myId });
    });
    const offSent = ws.on('chat.message.sent', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({ id: data.messageId, messageId: data.messageId, kind: 'user', senderId: data.senderId, text: data.text, timestamp: data.createdAt, isOwn: true });
    });
    const offSys = ws.on('chat.system', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({ id: data.messageId, messageId: data.messageId, kind: 'system', senderId: '', text: data.text, timestamp: data.createdAt, isOwn: false });
    });
    const offTyping = ws.on('typing', (data) => {
      if (data.matchId !== matchId || data.userId === myId) return;
      setPartnerTyping(true);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setPartnerTyping(false), 3000);
    });
    return () => {
      offMsg(); offSent(); offSys(); offTyping();
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [matchId, currentUser?.userId, ws, upsertMessage]);

  // Tick the countdown once a minute.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Scroll chat to bottom on new messages while open.
  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !matchId || sending) return;
    setSending(true);
    const sent = ws.send({ action: 'chat_message', matchId, text });
    if (sent) {
      const ts = new Date().toISOString();
      setMessages((prev) => [...prev, { id: `pending-${ts}`, kind: 'user', senderId: currentUser?.userId ?? 'me', text, timestamp: ts, isOwn: true, pending: true }]);
      setInputText('');
    }
    setSending(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
    if (!matchId) return;
    const ts = Date.now();
    if (ts - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = ts;
      ws.send({ action: 'typing', matchId });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  }

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.center}>Caricamento…</div>
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button type="button" className={styles.headerBtn} onClick={() => navigate(-1)} aria-label="Indietro">
            <MIcon name="chevron-left" size={20} sw={2} />
          </button>
        </header>
        <div className={styles.center}>
          <p>{error ?? 'Connessione non trovata.'}</p>
          <button className={styles.linkBtn} onClick={() => navigate(-1)}>Torna indietro</button>
        </div>
      </div>
    );
  }

  const { partner, pickupPoint, pickupTime, fullFare, yourShare, meetingPoint } = view;
  const userMessages = messages.filter((m) => m.kind !== 'system');

  const myTrip: MatchTrip | null = match && currentUser
    ? (match.userId1 === currentUser.userId ? match.trip1 : match.trip2)
    : null;
  const airport = airports.find((a) => a.code === (match?.airportCode)) ?? null;

  // Route labels.
  const isFromMilan = (myTrip?.direction ?? 'FROM_MILAN') === 'FROM_MILAN';
  const cityLabel = myTrip?.originLabel || 'Milano';
  const airportName = airport?.name || myTrip?.destination || match?.airportCode || 'Aeroporto';
  const airportCode = airport?.code || match?.airportCode || '';
  const fromTitle = isFromMilan ? cityLabel : `${airportName}${airportCode ? ` · ${airportCode}` : ''}`;
  const toTitle = isFromMilan ? `${airportName}${airportCode ? ` · ${airportCode}` : ''}` : cityLabel;

  // Pickup / meeting.
  const pickupAddress = pickupPoint?.address?.trim()
    || meetingPoint?.label
    || (pickupPoint?.zoneLabel ? `Zona ${pickupPoint.zoneLabel}` : null);
  const pickupDesc = meetingPoint?.description || (pickupPoint?.landmarks?.length ? pickupPoint.landmarks.join(' · ') : null);
  const pickupTimeFmt = pickupTime ? new Date(pickupTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;
  const pickupDateFmt = pickupTime ? new Date(pickupTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : null;

  const hasCoords = pickupPoint?.lat != null && pickupPoint?.lng != null && pickupPoint.lat !== '' && pickupPoint.lng !== '';
  const directionsDest = hasCoords ? `${pickupPoint!.lat},${pickupPoint!.lng}` : pickupAddress;
  const directionsUrl = directionsDest
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDest)}`
    : null;

  // Countdown to meeting.
  const gap = pickupTime ? formatGap(new Date(pickupTime).getTime() - now) : null;

  // Add-to-calendar (Google) link.
  let calendarUrl: string | null = null;
  if (pickupTime) {
    const start = new Date(pickupTime);
    const end = new Date(start.getTime() + 60 * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const text = encodeURIComponent('Flot · ritrovo taxi condiviso');
    const details = encodeURIComponent(`Ritrovo con ${partner.firstName} — ${pickupAddress ?? ''}`);
    calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  }

  // Fares (cents → euros).
  const fullEur = Math.round(fullFare / 100);
  const yourEur = Math.round(yourShare / 100);

  // Flight / meta.
  const flightTimeFmt = myTrip?.flightTime ? new Date(myTrip.flightTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;
  const flightDateFmt = myTrip?.flightTime ? new Date(myTrip.flightTime).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : null;

  const partnerName = `${partner.firstName} ${partner.lastName ?? ''}`.trim();
  const partnerInitials = initialsOf(partner.firstName, partner.lastName);
  const userInitials = initialsOf(currentUser?.firstName, currentUser?.lastName);
  const overallAvg = partner.rating?.average ?? null;
  const overallCount = partner.rating?.count ?? 0;

  // Per-dimension stars (fall back to overall average when a dimension has no votes).
  const dimRows = DIMENSIONS.map(({ key, label, icon }) => {
    const dim = partnerRating?.dimensions?.[key];
    const avg = (dim && dim.count > 0 && dim.average != null) ? dim.average : overallAvg;
    return { label, icon, stars: avg != null ? starString(avg) : '☆☆☆☆☆' };
  });

  const actions: { icon: IconName; label: string; danger?: boolean; onClick: () => void }[] = [
    { icon: 'user', label: 'Vedi profilo completo', onClick: () => setProfileOpen(true) },
    { icon: 'shield-check', label: 'Sicurezza e supporto', onClick: () => {} },
    { icon: 'alert-circle', label: 'Segnala un problema', onClick: () => {} },
  ];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.headerBtn} onClick={() => navigate(-1)} aria-label="Indietro">
          <MIcon name="chevron-left" size={20} sw={2} />
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerKicker}>Prenotazione</div>
          {matchId && <div className={styles.headerCode}>#{matchId.slice(-6).toUpperCase()}</div>}
        </div>
        {currentUser?.photoUrl ? (
          <img src={currentUser.photoUrl} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.userAvatar}>{userInitials}</div>
        )}
      </header>

      <div className={styles.scrollArea}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroPill}>
            <MIcon name="check-circle" size={15} sw={2} color="var(--success-500)" />
            Match confermato · sbloccato
          </div>
          <div className={styles.heroTitle}>Tutto pronto per il viaggio</div>
          <div className={styles.heroSub}>Hai sbloccato chat, punto e orario di ritrovo. Mettetevi d'accordo e condividete il taxi.</div>

          {gap && (
            <div className={styles.countdown}>
              <div className={styles.countdownIcon}><MIcon name="clock" size={22} sw={2} /></div>
              <div className={styles.countdownText}>
                <div className={styles.countdownLabel}>Ritrovo tra</div>
                <div className={styles.countdownValue}>{gap}</div>
              </div>
              {calendarUrl && (
                <a className={styles.calBtn} href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <MIcon name="calendar" size={16} sw={2} />Calendario
                </a>
              )}
            </div>
          )}
        </div>

        <div className={styles.body}>
          {/* Co-rider card */}
          <div className={styles.partnerCard}>
            <div className={styles.partnerTop}>
              <button className={styles.avatarWrap} onClick={() => setProfileOpen(true)} aria-label={`Profilo di ${partner.firstName}`}>
                {(partner.photoUrl || partner.blurredPhotoUrl) ? (
                  <img src={partner.photoUrl || partner.blurredPhotoUrl} alt={partnerName} className={styles.avatar} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.avatarInitials}>{partnerInitials}</div>
                )}
                {partner.verified && <span className={styles.verifiedDot}><MIcon name="check" size={13} sw={3} /></span>}
              </button>
              <div className={styles.partnerInfo}>
                <div className={styles.partnerName}>{partnerName}</div>
                {overallAvg != null && overallCount > 0 ? (
                  <div className={styles.ratingRow}>
                    <span className={styles.starsGold}>{starString(overallAvg)}</span>
                    <span className={styles.ratingNum}>{overallAvg.toFixed(1)}</span>
                    <span className={styles.ratingCount}>· {partner.tripCount ?? overallCount} viaggi</span>
                  </div>
                ) : (
                  <div className={styles.ratingCount}>Nessuna recensione</div>
                )}
                {partner.verified && (
                  <div className={styles.verifiedPill}>
                    <MIcon name="shield-check" size={12} sw={2} />Identità verificata
                  </div>
                )}
              </div>
            </div>

            <button className={styles.chatCta} onClick={() => setChatOpen(true)}>
              <MIcon name="message-circle" size={20} sw={2} />Apri la chat con {partner.firstName}
            </button>

            <div className={styles.hr} />

            <div>
              <div className={styles.subHead}>
                <span className={styles.subHeadLabel}>Valutazioni</span>
                <button className={styles.subHeadLink} onClick={() => setProfileOpen(true)}>
                  Profilo e recensioni<MIcon name="arrow-right" size={14} sw={2} />
                </button>
              </div>
              <div className={styles.dimGrid}>
                {dimRows.map((d) => (
                  <div key={d.label} className={styles.dimRow}>
                    <span className={styles.dimLeft}>
                      <MIcon name={d.icon} size={16} sw={2} color="var(--primary-500)" />
                      <span className={styles.dimLabel}>{d.label}</span>
                    </span>
                    <span className={styles.dimStars}>{d.stars}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting details */}
          {(pickupAddress || pickupTimeFmt) && (
            <div className={styles.meetCard}>
              <div className={styles.meetHead}>
                <MIcon name="lock" size={16} sw={2} color="var(--primary-600)" />
                <span>Dove e quando vedervi</span>
              </div>
              <div className={styles.meetBody}>
                {pickupAddress && (
                  <div className={styles.meetItem}>
                    <div className={styles.meetIcon}><MIcon name="map-pin" size={21} sw={2} color="var(--primary-600)" /></div>
                    <div>
                      <div className={styles.meetKey}>Punto di ritrovo</div>
                      <div className={styles.meetVal}>{pickupAddress}</div>
                      {pickupDesc && <div className={styles.meetSub}>{pickupDesc}</div>}
                    </div>
                  </div>
                )}
                {directionsUrl && (
                  <a className={styles.mapBtn} href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <MIcon name="navigation" size={17} sw={2} />Apri mappa e indicazioni
                  </a>
                )}
                {pickupTimeFmt && (
                  <>
                    {pickupAddress && <div className={styles.hr} />}
                    <div className={styles.meetItem}>
                      <div className={styles.meetIcon}><MIcon name="clock" size={21} sw={2} color="var(--primary-600)" /></div>
                      <div>
                        <div className={styles.meetKey}>Orario di ritrovo</div>
                        <div className={styles.meetVal}>{pickupTimeFmt}{pickupDateFmt ? ` · ${pickupDateFmt}` : ''}</div>
                        <div className={styles.meetSub}>Prima del decollo, per fare insieme il check-in</div>
                      </div>
                    </div>
                  </>
                )}
                <div className={styles.recognize}>
                  <MIcon name="info" size={17} sw={2} color="var(--primary-500)" />
                  <div>Scrivetevi in chat appena arrivate per riconoscervi al punto di ritrovo.</div>
                </div>
              </div>
            </div>
          )}

          {/* Mutual confirmation (local) */}
          <div className={styles.confirmBanner}>
            <MIcon name="users" size={20} sw={2} color="var(--success-700)" />
            <div className={styles.confirmText}>Conferma il punto di ritrovo per rassicurare {partner.firstName}.</div>
            <button
              className={`${styles.confirmBtn} ${confirmed ? styles.confirmBtnOn : ''}`}
              onClick={() => setConfirmed((c) => !c)}
            >
              {confirmed ? 'Confermato ✓' : 'Conferma'}
            </button>
          </div>

          {/* Trip summary */}
          <div className={styles.summaryCard}>
            <span className={styles.subHeadLabel}>Riepilogo viaggio</span>
            <div className={styles.route}>
              <div className={styles.routeRail}>
                <div className={styles.routeDotStart} />
                <div className={styles.routeLine} />
                <div className={styles.routeDotEnd} />
              </div>
              <div className={styles.routeBody}>
                <div>
                  <div className={styles.routeKey}>Da</div>
                  <div className={styles.routeVal}>{fromTitle}</div>
                </div>
                <div>
                  <div className={styles.routeKey}>A</div>
                  <div className={styles.routeVal}>{toTitle}</div>
                </div>
              </div>
            </div>
            <div className={styles.hr} />
            <div className={styles.metaRow}>
              {myTrip?.flightNumber && (
                <div className={styles.metaFlight}>
                  <MIcon name="plane-takeoff" size={17} sw={2} color="var(--neutral-400)" />
                  <div>
                    <div className={styles.metaKey}>Volo{flightTimeFmt ? ` · ${flightTimeFmt}` : ''}</div>
                    <div className={styles.metaMono}>{myTrip.flightNumber}</div>
                  </div>
                </div>
              )}
              <div className={styles.metaStats}>
                {flightDateFmt && <div className={styles.metaStat}><div className={styles.metaKey}>Data</div><div className={styles.metaStrong}>{flightDateFmt}</div></div>}
                <div className={styles.metaStat}><div className={styles.metaKey}>Pax</div><div className={styles.metaStrong}>{myTrip?.paxCount ?? 1}</div></div>
                <div className={styles.metaStat}><div className={styles.metaKey}>Bagagli</div><div className={styles.metaStrong}>{myTrip?.luggage ?? 1}</div></div>
              </div>
            </div>
            <div className={styles.splitBox}>
              <div className={styles.splitRow}>
                <span className={styles.splitLabel}>Tariffa taxi intera</span>
                <span className={styles.splitStrike}>€{fullEur}</span>
              </div>
              <div className={styles.splitRowMain}>
                <span className={styles.splitLabelMain}>La tua quota · diviso in 2</span>
                <span className={styles.splitValue}>€{yourEur}</span>
              </div>
            </div>
          </div>

          {/* How it works reminder */}
          <div className={styles.howCard}>
            <MIcon name="info" size={20} sw={2} color="var(--primary-300)" />
            <div><b>Flot ha fatto il match.</b> La corsa la organizzate voi: prendete il taxi ufficiale dell'aeroporto e dividete il costo direttamente col tassista. Flot non gestisce né corsa né pagamento.</div>
          </div>

          {/* Management actions */}
          <div className={styles.actionList}>
            {actions.map((a) => (
              <button key={a.label} className={styles.actionRow} onClick={a.onClick}>
                <MIcon name={a.icon} size={20} sw={2} color={a.danger ? 'var(--error-500)' : 'var(--primary-600)'} />
                <span className={`${styles.actionLabel} ${a.danger ? styles.actionDanger : ''}`}>{a.label}</span>
                <MIcon name="chevron-right" size={18} sw={2} color="var(--neutral-300)" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat sheet */}
      {chatOpen && (
        <>
          <div className={styles.chatScrim} onClick={() => setChatOpen(false)} />
          <div className={styles.chatSheet}>
            <div className={styles.chatHeader}>
              <button className={styles.chatClose} onClick={() => setChatOpen(false)} aria-label="Chiudi chat">
                <MIcon name="chevron-left" size={20} sw={2} />
              </button>
              {(partner.photoUrl || partner.blurredPhotoUrl) ? (
                <img src={partner.photoUrl || partner.blurredPhotoUrl} alt={partnerName} className={styles.chatAvatar} referrerPolicy="no-referrer" />
              ) : (
                <div className={styles.chatAvatarInitials}>{partnerInitials}</div>
              )}
              <div className={styles.chatHeadInfo}>
                <div className={styles.chatHeadName}>{partnerName}</div>
                {partnerTyping
                  ? <div className={styles.chatTyping}>sta scrivendo…</div>
                  : <div className={styles.chatPresence}><span className={styles.presenceDot} />Connessione attiva</div>}
              </div>
            </div>

            <div className={styles.chatBox}>
              {historyLoaded && userMessages.length === 0 ? (
                <div className={styles.chatEmpty}>Nessun messaggio ancora. Di&apos; ciao a {partner.firstName}!</div>
              ) : (
                userMessages.map((msg) => (
                  <div key={msg.id} className={`${styles.bubble} ${msg.isOwn ? styles.bubbleOwn : styles.bubbleTheirs} ${msg.pending ? styles.bubblePending : ''}`}>
                    <span className={styles.bubbleText}>{msg.text}</span>
                    <span className={styles.bubbleTime}>{new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputBar}>
              <input
                ref={inputRef}
                className={styles.chatInput}
                placeholder={`Messaggio a ${partner.firstName}…`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={500}
              />
              <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim() || sending} aria-label="Invia">
                <MIcon name="arrow-right" size={20} sw={2.4} />
              </button>
            </div>
          </div>
        </>
      )}

      <PartnerProfileSheet open={profileOpen} partner={partner} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
