import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MBtn } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { useTripStore } from '../stores/tripStore';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { cancelTrip, getMyTrips } from '../services/trips';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import type { Trip } from '../types/domain';
import styles from './TripScheduled.module.css';

/* ── Inline icons (lucide-style) ── */
type IconProps = { size?: number };
function svg(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
}
function IconCircleCheck({ size = 46 }: IconProps) {
  return <svg {...svg(size)} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}
function IconRadar({ size = 20 }: IconProps) {
  return <svg {...svg(size)}><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" /></svg>;
}
function IconClock({ size = 13 }: IconProps) {
  return <svg {...svg(size)}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
function IconPlaneTakeoff({ size = 19 }: IconProps) {
  return <svg {...svg(size)}><path d="M2 22h20" /><path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l1.9-.95a2 2 0 0 1 1.8 0l5.6 2.8a8 8 0 0 1 2.74 2.18l3.16 4.42a1 1 0 0 1-.84 1.58H12.5" /></svg>;
}
function IconCalendar({ size = 18 }: IconProps) {
  return <svg {...svg(size)}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
}
function IconUser({ size = 18 }: IconProps) {
  return <svg {...svg(size)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function IconBriefcase({ size = 18 }: IconProps) {
  return <svg {...svg(size)}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>;
}
function IconPiggyBank({ size = 21 }: IconProps) {
  return <svg {...svg(size)}><path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-3V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" /><path d="M16 10h.01" /><path d="M2 8v1a2 2 0 0 0 2 2h1" /></svg>;
}
function IconLockOpen({ size = 15 }: IconProps) {
  return <svg {...svg(size)}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
}
function IconPencil({ size = 17 }: IconProps) {
  return <svg {...svg(size)}><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>;
}
function IconCircleX({ size = 17 }: IconProps) {
  return <svg {...svg(size)}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;
}
function IconShare({ size = 16 }: IconProps) {
  return <svg {...svg(size)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>;
}
function IconRoute({ size = 16 }: IconProps) {
  return <svg {...svg(size)}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>;
}
function IconBellRing({ size = 23 }: IconProps) {
  return <svg {...svg(size)}><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M22 8c0-2.3-.8-4.3-2-6" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /><path d="M4 2C2.8 3.7 2 5.7 2 8" /></svg>;
}
function IconMapPin({ size = 20 }: IconProps) {
  return <svg {...svg(size)}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function IconPlane({ size = 20 }: IconProps) {
  return <svg {...svg(size)}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
}
function IconChevronRight({ size = 18 }: IconProps) {
  return <svg {...svg(size)}><path d="m9 18 6-6-6-6" /></svg>;
}
function IconArrowLeft({ size = 20 }: IconProps) {
  return <svg {...svg(size)}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
}

function initialsOf(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

/* ── Notification card (design), wired to push hook ── */
function NotifCard() {
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (permission === 'granted') {
    return (
      <div className={styles.notifDone}>
        <IconBellRing size={22} />
        <div className={styles.notifDoneText}>Notifiche attive — ti avviseremo al match</div>
        <span className={styles.notifDoneCheck}><IconCircleCheck size={20} /></span>
      </div>
    );
  }
  if (dismissed || permission === 'denied' || !isSupported) return null;

  return (
    <div className={styles.notifCard}>
      <div className={styles.notifIcon}><IconBellRing size={23} /></div>
      <div className={styles.notifBody}>
        <div className={styles.notifTitle}>Attiva le notifiche</div>
        <div className={styles.notifSub}>È così che ti avvisiamo appena troviamo il match.</div>
      </div>
      <button className={styles.notifBtn} onClick={() => requestPermission().catch(() => setDismissed(true))}>Attiva</button>
    </div>
  );
}

export function TripScheduled() {
  const navigate = useNavigate();
  const { tripId: urlTripId } = useParams<{ tripId: string }>();
  const tripStore = useTripStore();
  const airport = useAirportStore((s) => s.selectedAirport);
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const selectAirport = useAirportStore((s) => s.selectAirport);
  const currentUser = useAuthStore((s) => s.user);
  const ws = useWebSocket();
  const [fetchedTrip, setFetchedTrip] = useState<Trip | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showManageSheet, setShowManageSheet] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  // Animated "searching" dots
  useEffect(() => {
    const t = setInterval(() => setDotCount((d) => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);

  // Fetch from API when store data doesn't match URL (refresh / direct link)
  useEffect(() => {
    if (!urlTripId) return;
    getMyTrips()
      .then((res) => {
        const found = res.trips.find((t) => t.tripId === urlTripId);
        if (found) setFetchedTrip(found as unknown as Trip);
      })
      .catch(() => {});
  }, [urlTripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load airports if missing (page refresh)
  useEffect(() => {
    if (!airport && airports.length === 0) {
      loadAirports();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If matched via ws while on this screen
  useEffect(() => {
    const unsub = ws.on('match.found', (data) => {
      setTimeout(() => {
        navigate(`/match/${data.matchId}`);
      }, 2000);
    });
    return unsub;
  }, [ws, navigate]);

  const resolvedTripId = urlTripId ?? tripStore.tripId;
  const storeTrip = tripStore.tripId === urlTripId ? tripStore.currentTrip : null;
  const trip = fetchedTrip ?? storeTrip;

  useEffect(() => {
    const airportCode = trip?.airportCode ?? tripStore.currentTrip?.airportCode;
    if (!airport && airports.length > 0 && airportCode) {
      selectAirport(airportCode);
    }
  }, [airports, trip, tripStore.currentTrip]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedTerminal = (tripStore.tripId === urlTripId ? tripStore.terminal : null) ?? trip?.terminal ?? null;
  const resolvedDestination = (tripStore.tripId === urlTripId ? tripStore.destination : null) ?? trip?.destination ?? null;
  const resolvedLuggage = (tripStore.tripId === urlTripId ? tripStore.luggage : null) ?? trip?.luggage ?? 1;

  const confirmCancel = async () => {
    if (!resolvedTripId) return;
    setCancelling(true);
    try {
      await cancelTrip(resolvedTripId);
      setShowCancelSheet(false);
      tripStore.reset();
      navigate('/my-trips', { state: { cancelledTripId: resolvedTripId } });
    } catch {
      setShowCancelSheet(false);
    } finally {
      setCancelling(false);
    }
  };

  const terminalLabel = airport?.terminals.find((t) => t.code === resolvedTerminal)?.label ?? resolvedTerminal ?? 'Terminal';
  const originLabel = trip?.originLabel ?? null;
  const isFromMilan = (trip?.direction ?? tripStore.currentTrip?.direction) === 'FROM_MILAN';
  const fromLabel = isFromMilan ? (originLabel || 'Milano') : terminalLabel;
  const toLabel = isFromMilan ? (resolvedDestination || 'Milano Malpensa') : (resolvedDestination || 'Destinazione');
  // Split "Street, City" → primary line + secondary line for the route card.
  const [fromMain, ...fromRest] = fromLabel.split(',');
  const fromSub = fromRest.join(',').trim();
  const [toMain, ...toRest] = toLabel.split(',');
  const toSub = toRest.join(',').trim() || (resolvedTerminal ? `Terminal ${airport?.code ?? resolvedTerminal}` : '');

  const halfFareEur = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const savingsDisplay = new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: airport?.currency ?? 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(halfFareEur);

  const dateLabel = trip?.flightTime ? formatDateShort(trip.flightTime) : 'Oggi';
  const departTime = trip?.flightTime ? formatTimeShort(trip.flightTime) : null;

  const NEXT_STEPS = [
    { n: '1', title: 'Cerchiamo un compagno', body: 'Un viaggiatore diretto al tuo stesso terminal, con orari compatibili al tuo volo.', fee: false },
    { n: '2', title: 'Ti avvisiamo al match', body: "Appena lo troviamo ricevi una notifica: nessun bisogno di restare nell'app.", fee: false },
    { n: '3', title: 'Sblocchi il match', body: 'Ottieni chat, punto di ritrovo e orario di ritrovo per coordinarvi.', fee: true },
    { n: '4', title: 'Prendete il taxi insieme', body: 'Vi accordate, salite sul taxi ufficiale e dividete il costo direttamente tra voi.', fee: false },
  ];

  const userInitials = initialsOf(currentUser?.firstName, currentUser?.lastName);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.headerBtn} onClick={() => navigate(-1)} aria-label="Indietro">
          <IconArrowLeft size={20} />
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerKicker}>Prenotazione</div>
          {resolvedTripId && <div className={styles.headerCode}>#{resolvedTripId.slice(-6).toUpperCase()}</div>}
        </div>
        {currentUser?.photoUrl ? (
          <img src={currentUser.photoUrl} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.userAvatar}>{userInitials}</div>
        )}
      </header>

      <div className={styles.scrollArea}>
        <div className={styles.content}>

          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroBadge}>
              <span className={styles.heroPulse} />
              <span className={`${styles.heroPulse} ${styles.heroPulse2}`} />
              <span className={styles.heroBadgeInner}><IconCircleCheck size={46} /></span>
            </div>
            <div className={styles.heroTitle}>Ci siamo! Stiamo cercando<br />un compagno di viaggio</div>
            <div className={styles.heroSub}>La tua prenotazione è registrata. Cerchiamo un viaggiatore diretto al tuo stesso terminal e ti avvisiamo appena troviamo un match.</div>
          </div>

          {/* Active search status */}
          <div className={styles.searchCard}>
            <div className={styles.searchRow}>
              <div className={styles.searchIcon}><IconRadar size={20} /></div>
              <div className={styles.searchText}>
                <div className={styles.searchTitleRow}>
                  <span className={styles.searchDot} />
                  <span className={styles.searchTitle}>Ricerca in corso</span>
                </div>
                <div className={styles.searchSub}>In media troviamo un compagno in poche ore</div>
              </div>
              <span className={styles.searchDots}>{'.'.repeat(dotCount)}</span>
            </div>
            <div className={styles.scanTrack}><div className={styles.scanBar} /></div>
          </div>

          {/* Trip summary */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHead}>
              <span className={styles.summaryLabel}>Il tuo viaggio</span>
              <span className={styles.statusBadge}><IconClock size={13} />In attesa di match</span>
            </div>

            <div className={styles.route}>
              <div className={styles.routeRail}>
                <div className={styles.routeDotFill} />
                <div className={styles.routeLine} />
                <div className={styles.routeDotOutline} />
              </div>
              <div className={styles.routeBody}>
                <div className={styles.routeStep}>
                  <div className={styles.routeKey}>Da</div>
                  <div className={styles.routeMain}>{fromMain}</div>
                  {fromSub && <div className={styles.routeSub}>{fromSub}</div>}
                </div>
                <div className={styles.routeStep}>
                  <div className={styles.routeKey}>A</div>
                  <div className={styles.routeMain}>{toMain}</div>
                  {toSub && <div className={styles.routeSub}>{toSub}</div>}
                </div>
              </div>
            </div>

            {trip?.mode === 'scheduled' && trip?.flightNumber && (
              <>
                <div className={styles.hr} />
                <div className={styles.flightRow}>
                  <div className={styles.flightIcon}><IconPlaneTakeoff size={19} /></div>
                  <div className={styles.flightInfo}>
                    <div className={styles.flightCaption}>Volo{departTime ? ` · decollo ${departTime}` : ''}</div>
                    <div className={styles.flightNo}>{trip.flightNumber}</div>
                  </div>
                  <span className={styles.flightDate}>{dateLabel}</span>
                </div>
              </>
            )}

            <div className={styles.hr} />
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}><IconCalendar size={18} /></span>
                <div>
                  <div className={styles.metaKey}>Data</div>
                  <div className={styles.metaVal}>{dateLabel}</div>
                </div>
              </div>
              <div className={styles.metaSep} />
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}><IconUser size={18} /></span>
                <div>
                  <div className={styles.metaKey}>Passeggeri</div>
                  <div className={styles.metaVal}>{trip?.paxCount ?? 1}</div>
                </div>
              </div>
              <div className={styles.metaSep} />
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}><IconBriefcase size={18} /></span>
                <div>
                  <div className={styles.metaKey}>Bagagli</div>
                  <div className={styles.metaVal}>{resolvedLuggage}</div>
                </div>
              </div>
            </div>

            <div className={styles.savings}>
              <div className={styles.savingsIcon}><IconPiggyBank size={21} /></div>
              <div className={styles.savingsText}>
                <div className={styles.savingsTitle}>Risparmio stimato</div>
                <div className={styles.savingsNote}>Stima — si applica quando trovi un compagno</div>
              </div>
              <span className={styles.savingsValue}>~{savingsDisplay}</span>
            </div>
          </div>

          {/* Cosa succede ora */}
          <div className={styles.stepsCard}>
            <div className={styles.stepsTitle}>Cosa succede ora</div>
            {NEXT_STEPS.map((s, i) => (
              <div key={s.n} className={styles.step}>
                <div className={styles.stepRail}>
                  <div className={`${styles.stepBadge} ${s.fee ? styles.stepBadgeFee : ''}`}>
                    {s.fee ? <IconLockOpen size={15} /> : s.n}
                  </div>
                  {i < NEXT_STEPS.length - 1 && <div className={styles.stepLine} />}
                </div>
                <div className={styles.stepBody}>
                  <div className={styles.stepTitleRow}>
                    <span className={styles.stepTitle}>{s.title}</span>
                    {s.fee && <span className={styles.stepFee}>1,99 €</span>}
                  </div>
                  <div className={styles.stepText}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications */}
          <NotifCard />

          {/* Manage actions */}
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={() => setShowManageSheet(true)}>
              <IconPencil size={17} />Modifica
            </button>
            <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => setShowCancelSheet(true)}>
              <IconCircleX size={17} />Annulla
            </button>
          </div>
          <div className={styles.links}>
            <button className={styles.link}><IconShare size={16} />Condividi dettagli</button>
            <span className={styles.linkSep} />
            <button className={styles.link} onClick={() => navigate('/my-trips')}><IconRoute size={16} />I miei viaggi</button>
          </div>

        </div>
      </div>

      {/* Cancel confirm sheet */}
      <BottomSheet open={showCancelSheet} onClose={() => setShowCancelSheet(false)} aria-label="Annulla prenotazione">
        <div className={styles.cancelSheet}>
          <div className={styles.cancelIcon}><IconCircleX size={26} /></div>
          <h2 className={styles.cancelTitle}>Annullare la prenotazione?</h2>
          <p className={styles.cancelText}>Interromperemo la ricerca del compagno. Puoi annullare gratuitamente finché non c'è un match — non è stato addebitato nulla.</p>
          <MBtn variant="dark" onClick={confirmCancel} loading={cancelling}>Sì, annulla prenotazione</MBtn>
          <MBtn variant="secondary" onClick={() => setShowCancelSheet(false)} disabled={cancelling}>Continua la ricerca</MBtn>
        </div>
      </BottomSheet>

      {/* Manage sheet */}
      <BottomSheet open={showManageSheet} onClose={() => setShowManageSheet(false)} aria-label="Modifica prenotazione">
        <div className={styles.manageSheet}>
          <h2 className={styles.manageTitle}>Modifica prenotazione</h2>
          {/* TODO: wire each action to its edit flow once trip-edit endpoints exist. */}
          <button className={styles.manageItem} onClick={() => setShowManageSheet(false)}>
            <IconMapPin size={20} /><span>Cambia indirizzo di partenza</span><span className={styles.manageChevron}><IconChevronRight size={18} /></span>
          </button>
          <button className={styles.manageItem} onClick={() => setShowManageSheet(false)}>
            <IconPlane size={20} /><span>Modifica volo o data</span><span className={styles.manageChevron}><IconChevronRight size={18} /></span>
          </button>
          <button className={styles.manageItem} onClick={() => setShowManageSheet(false)}>
            <IconBriefcase size={20} /><span>Aggiorna passeggeri e bagagli</span><span className={styles.manageChevron}><IconChevronRight size={18} /></span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
