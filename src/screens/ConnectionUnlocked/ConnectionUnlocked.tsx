/* ============================================================
   FLOT — ConnectionUnlocked Screen
   /connection/:matchId  (ProtectedRoute)
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useMatchStore } from '../../stores/matchStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchMatch } from '../../services/matches';
import type { UnlockedMatch } from '../../types/api';
import styles from './ConnectionUnlocked.module.css';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`Rating ${value}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ConnectionUnlocked() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { currentMatch, setMatch } = useMatchStore();
  const ws = useWebSocket();

  const [match, setLocalMatch] = useState<UnlockedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load match data
  useEffect(() => {
    if (!matchId) return;

    async function load() {
      try {
        setLoading(true);
        // Use cached match if available and unlocked
        const cached = currentMatch;
        if (cached && cached.matchId === matchId && cached.status === 'unlocked') {
          setLocalMatch(cached as UnlockedMatch);
          setLoading(false);
          return;
        }
        const data = await fetchMatch(matchId!);
        if (data.status === 'unlocked') {
          setLocalMatch(data as UnlockedMatch);
          setMatch(data);
        } else {
          setError('Connessione non ancora sbloccata.');
        }
      } catch {
        setError('Impossibile caricare la connessione.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [matchId, currentMatch, setMatch]);

  // WebSocket: subscribe to incoming chat messages
  useEffect(() => {
    ws.on('chat_message', (data) => {
      if (data.matchId !== matchId) return;
      const isOwn = data.senderId === currentUser?.userId;
      setMessages((prev) => [
        ...prev,
        {
          id: `${data.senderId}-${data.timestamp}`,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          isOwn,
        },
      ]);
    });
    // ws.on() auto-cleans on unmount via useWebSocket internals
  }, [matchId, currentUser?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Optimistic: add own message immediately
      const now = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `own-${now}`,
          senderId: currentUser?.userId ?? 'me',
          text,
          timestamp: now,
          isOwn: true,
        },
      ]);
      setInputText('');
    }
    setSending(false);
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

  if (error || !match) {
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

  const { partner, meetingPoint, savings, yourShare, fullFare } = match;
  const partnerInitials = `${partner.firstName[0] ?? ''}${partner.lastName[0] ?? ''}`.toUpperCase();

  const savingsFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(savings / 100);
  const yourShareFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(yourShare / 100);
  const fullFareFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fullFare / 100);

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
              {partner.firstName} {partner.lastName}
              {partner.age ? <span className={styles.age}>, {partner.age}</span> : null}
            </div>
            <div className={styles.partnerCity}>{partner.city}</div>

            <StarRating value={partner.rating} />

            {partner.languages.length > 0 && (
              <div className={styles.languageRow}>
                {partner.languages.map((lang) => (
                  <span key={lang} className={styles.langBadge}>{lang}</span>
                ))}
              </div>
            )}

            <div className={styles.statsRow}>
              <span className={styles.statItem}>
                <span className={styles.statValue}>{partner.totalTrips}</span>
                <span className={styles.statLabel}> viaggi</span>
              </span>
              <span className={styles.statDot} />
              <span className={styles.statItem}>
                <span className={styles.statValue}>{Math.round(partner.onTimeRate * 100)}%</span>
                <span className={styles.statLabel}> puntuale</span>
              </span>
            </div>
          </div>
        </div>

        {/* Meeting point */}
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
          {messages.length === 0 ? (
            <div className={styles.chatEmpty}>
              Nessun messaggio ancora. Di&apos; ciao a {partner.firstName}!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgBubble} ${msg.isOwn ? styles.msgOwn : styles.msgTheirs}`}
              >
                <span className={styles.msgText}>{msg.text}</span>
                <span className={styles.msgTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
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
          onChange={(e) => setInputText(e.target.value)}
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
