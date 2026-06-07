/* ============================================================
   FLOT — ConnectionUnlocked Screen
   /connection/:matchId  (ProtectedRoute)
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
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

        if (match.status !== 'unlocked') {
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
      } catch {
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

  const { partner, meetingPoint, savings, yourShare, fullFare } = view;
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
        showAvatar={false}
        right={
          <span className={styles.matchBadge}>#{matchId?.slice(-6).toUpperCase()}</span>
        }
      />

      <div className={styles.scrollArea}>
        {/* Partner card */}
        <div className={styles.partnerCard}>
          <div className={styles.avatarWrap}>
            {partner.photoUrl ? (
              <img src={partner.photoUrl} alt={partner.firstName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarInitials}>{partnerInitials}</div>
            )}
            {partner.verified && (
              <span className={styles.verifiedBadge} aria-label="Verificato">✓</span>
            )}
          </div>

          <div className={styles.partnerInfo}>
            <div className={styles.partnerName}>
              {partner.firstName} {partner.lastName ?? ''}
              {partner.age ? <span className={styles.age}>, {partner.age}</span> : null}
            </div>
            {partner.city && <div className={styles.partnerCity}>{partner.city}</div>}

            <StarRating value={partner.rating?.average ?? null} count={partner.rating?.count ?? 0} />

            {partner.languages && partner.languages.length > 0 && (
              <div className={styles.languageRow}>
                {partner.languages.map((lang) => (
                  <span key={lang} className={styles.langBadge}>{lang}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meeting point */}
        {meetingPoint && (
          <>
            <div className={styles.sectionLabel}>Punto d&apos;incontro</div>
            <div className={styles.meetingCard}>
              <div className={styles.meetingIcon}>📍</div>
              <div className={styles.meetingInfo}>
                <div className={styles.meetingLabel}>{meetingPoint.label}</div>
                <div className={styles.meetingDesc}>{meetingPoint.description}</div>
                <div className={styles.walkTime}>
                  🚶 {meetingPoint.walkMinutes} min a piedi
                </div>
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

        {/* Chat */}
        <div className={styles.sectionLabel}>Chat</div>
        <div className={styles.chatBox}>
          {historyLoaded && messages.length === 0 ? (
            <div className={styles.chatEmpty}>
              Nessun messaggio ancora. Di&apos; ciao a {partner.firstName}!
            </div>
          ) : (
            messages.map((msg) =>
              msg.kind === 'system' ? (
                <div key={msg.id} className={styles.systemMsg}>
                  {msg.text}
                </div>
              ) : (
                <div
                  key={msg.id}
                  className={`${styles.msgBubble} ${msg.isOwn ? styles.msgOwn : styles.msgTheirs} ${msg.pending ? styles.msgPending : ''}`}
                >
                  <span className={styles.msgText}>{msg.text}</span>
                  <span className={styles.msgTime}>
                    {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ),
            )
          )}
          {partnerTyping && (
            <div className={styles.typing}>{partner.firstName} sta scrivendo…</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <HomeIndicator />
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
    </div>
  );
}
