/* ============================================================
   FLOT — ConnectionUnlocked Screen
   /connection/:matchId  (ProtectedRoute)
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
import { PartnerProfileSheet } from '../../components/PartnerProfileSheet/PartnerProfileSheet';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
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
import type { ConnectionView, ChatHistoryMessage } from '../../types/api';
import styles from './ConnectionUnlocked.module.css';

interface ChatMessage {
  id: string;            // messageId when confirmed, else a temp id
  messageId?: string;    // backend id once confirmed
  kind: 'user' | 'system';
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  pending?: boolean;     // optimistic, not yet echoed by the server
}

/* ── Inline vector icons (stroke = currentColor, coherent set) ── */
function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function StarRating({ value, count }: { value: number | null; count: number }) {
  if (value == null || count === 0) {
    return <span className={styles.noRating}>Nessuna recensione</span>;
  }
  return (
    <span className={styles.stars} aria-label={`Rating ${value} su 5, ${count} recensioni`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      ))}
      <span className={styles.ratingCount}>({count})</span>
    </span>
  );
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

export function ConnectionUnlocked() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { setMatch } = useMatchStore();
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const ws = useWebSocket();

  const [view, setView] = useState<ConnectionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef(0);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Insert or replace a message, deduping by messageId.
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      if (incoming.messageId && prev.some((m) => m.messageId === incoming.messageId)) {
        return prev; // already have it (e.g. history + WS race)
      }
      // Confirm an optimistic own message: same sender + text, still pending.
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
        const match = await fetchMatch(matchId!);
        setMatch(match);

        if (match.status !== 'unlocked' && match.status !== 'completed') {
          if (!cancelled) setError('Connessione non ancora sbloccata.');
          return;
        }

        let pool = airports;
        if (pool.length === 0) {
          await loadAirports();
          pool = useAirportStore.getState().airports;
        }
        const airport = pool.find((a) => a.code === match.airportCode) ?? null;

        const partner = await fetchPartnerProfile(partnerIdOf(match, currentUser!.userId));
        const composed = composeConnectionView(match, currentUser!.userId, partner, airport);
        if (cancelled) return;
        setView(composed);

        // Chat history (oldest-first), mapped to view-model.
        try {
          const history = await getFullChatHistory(matchId!);
          if (!cancelled) {
            setMessages(history.map((m) => historyToMessage(m, currentUser!.userId)));
          }
        } catch {
          // History is best-effort; real-time still works.
        } finally {
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, currentUser?.userId]);

  // WebSocket: incoming chat + system messages (deduped by messageId).
  useEffect(() => {
    const myId = currentUser?.userId;

    const offMsg = ws.on('chat.message', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({
        id: data.messageId,
        messageId: data.messageId,
        kind: 'user',
        senderId: data.senderId,
        text: data.text,
        timestamp: data.createdAt,
        isOwn: data.senderId === myId,
      });
    });

    const offSent = ws.on('chat.message.sent', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({
        id: data.messageId,
        messageId: data.messageId,
        kind: 'user',
        senderId: data.senderId,
        text: data.text,
        timestamp: data.createdAt,
        isOwn: true,
      });
    });

    const offSys = ws.on('chat.system', (data) => {
      if (data.matchId !== matchId) return;
      upsertMessage({
        id: data.messageId,
        messageId: data.messageId,
        kind: 'system',
        senderId: '',
        text: data.text,
        timestamp: data.createdAt,
        isOwn: false,
      });
    });

    const offTyping = ws.on('typing', (data) => {
      if (data.matchId !== matchId || data.userId === myId) return;
      setPartnerTyping(true);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setPartnerTyping(false), 3000);
    });

    return () => {
      offMsg();
      offSent();
      offSys();
      offTyping();
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [matchId, currentUser?.userId, ws, upsertMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !matchId || sending) return;
    setSending(true);
    const sent = ws.send({ action: 'chat_message', matchId, text });
    if (sent) {
      // Optimistic: temp message, confirmed/replaced by chat.message.sent echo.
      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `pending-${now}`,
          kind: 'user',
          senderId: currentUser?.userId ?? 'me',
          text,
          timestamp: now,
          isOwn: true,
          pending: true,
        },
      ]);
      setInputText('');
    }
    setSending(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
    if (!matchId) return;
    // Throttle typing pings to at most one every 2s.
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      ws.send({ action: 'typing', matchId });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <TopNav showBack showLogo={false} title="Connessione" />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 120, marginTop: 8 }} />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className={styles.root}>
        <TopNav showBack showLogo={false} title="Connessione" />
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error ?? 'Connessione non trovata.'}</p>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  const { partner, pickupPoint, pickupTime, savings, yourShare, fullFare } = view;
  // Hide system messages (match confirmed / unlock notices) — chat only.
  const userMessages = messages.filter((m) => m.kind !== 'system');

  // Pickup address: prefer the resolved address, fall back to zone + landmarks.
  const pickupAddress =
    pickupPoint?.address?.trim() ||
    (pickupPoint?.zoneLabel ? `Zona ${pickupPoint.zoneLabel}` : null) ||
    null;
  const pickupTimeFmt = pickupTime
    ? new Date(pickupTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : null;
  const pickupDateFmt = pickupTime
    ? new Date(pickupTime).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  // Google Maps directions: prefer lat,lng (more precise), fall back to address.
  const hasCoords =
    pickupPoint?.lat != null && pickupPoint?.lng != null &&
    pickupPoint.lat !== '' && pickupPoint.lng !== '';
  const directionsDest = hasCoords
    ? `${pickupPoint!.lat},${pickupPoint!.lng}`
    : pickupAddress;
  const directionsUrl = directionsDest
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDest)}`
    : null;
  const partnerInitials = `${partner.firstName?.[0] ?? ''}${partner.lastName?.[0] ?? ''}`.toUpperCase();

  const eur = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
  const savingsFmt = eur(savings);
  const yourShareFmt = eur(yourShare);
  const fullFareFmt = eur(fullFare);

  return (
    <div className={styles.root}>
      <TopNav
        showBack
        showLogo={false}
        title="Connessione"
        showAvatar
        right={
          <span className={styles.matchBadge}>Codice #{matchId?.slice(-6).toUpperCase()}</span>
        }
      />

      <div className={styles.topSection}>
        {/* Partner card */}
        <div className={styles.partnerCard}>
          <button
            className={styles.avatarWrap}
            onClick={() => setProfileOpen(true)}
            aria-label={`Vedi profilo di ${partner.firstName}`}
          >
            {partner.photoUrl ? (
              <img src={partner.photoUrl} alt={partner.firstName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarInitials}>{partnerInitials}</div>
            )}
            {partner.verified && (
              <span className={styles.verifiedBadge} aria-label="Verificato">✓</span>
            )}
          </button>

          <div className={styles.partnerInfo}>
            <button className={styles.partnerNameBtn} onClick={() => setProfileOpen(true)}>
              <span className={styles.partnerName}>
                {partner.firstName} {partner.lastName ?? ''}
                {partner.ageGroup ? <span className={styles.age}>, {partner.ageGroup}</span> : null}
              </span>
            </button>
            {partner.city && <div className={styles.partnerCity}>{partner.city}</div>}

            <StarRating value={partner.rating?.average ?? null} count={partner.rating?.count ?? 0} />
          </div>
        </div>

        {/* Pickup point — computed for this match */}
        {pickupAddress && (
          <>
            <div className={styles.sectionLabel}>Punto di ritrovo</div>
            <div className={styles.meetingCard}>
              <PinIcon className={styles.meetingIcon} />
              <div className={styles.meetingInfo}>
                <div className={styles.meetingLabel}>{pickupAddress}</div>
                {pickupTimeFmt && (
                  <div className={styles.pickupTime}>
                    <ClockIcon className={styles.pickupTimeIcon} />
                    <div className={styles.pickupTimeText}>
                      <span className={styles.pickupTimeLabel}>Ritrovo</span>
                      <span className={styles.pickupTimeValue}>
                        {pickupDateFmt} · ore {pickupTimeFmt}
                      </span>
                    </div>
                  </div>
                )}
                {directionsUrl && (
                  <a
                    className={styles.directionsBtn}
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowIcon /> Come arrivare
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        {/* Savings row */}
        <div className={styles.savingsRow}>
          <div className={styles.savingsLeft}>
            <div className={styles.savingsAmount}>{savingsFmt} risparmiati</div>
            <div className={styles.fareLine}>
              La tua quota <strong>{yourShareFmt}</strong>{' '}
              <span className={styles.fullFareStrike}>{fullFareFmt}</span>
            </div>
          </div>
          <div className={styles.savingsIcon}>🎉</div>
        </div>
      </div>

      {/* Chat — only scrolling area */}
      <div className={styles.chatBox}>
          {historyLoaded && userMessages.length === 0 ? (
            <div className={styles.chatEmpty}>
              Nessun messaggio ancora. Di&apos; ciao a {partner.firstName}!
            </div>
          ) : (
            userMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgBubble} ${msg.isOwn ? styles.msgOwn : styles.msgTheirs} ${msg.pending ? styles.msgPending : ''}`}
              >
                <span className={styles.msgText}>{msg.text}</span>
                <span className={styles.msgTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          {partnerTyping && (
            <div className={styles.typing}>{partner.firstName} sta scrivendo…</div>
          )}
          <div ref={messagesEndRef} />
        </div>

      {/* Chat input — sticky at bottom */}
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
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          aria-label="Invia messaggio"
        >
          ➤
        </button>
      </div>
      <HomeIndicator />

      <PartnerProfileSheet
        open={profileOpen}
        partner={partner}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
