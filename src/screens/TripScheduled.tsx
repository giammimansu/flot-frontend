import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { PushPrompt } from '../components/trips/PushPrompt';
import { useTripStore } from '../stores/tripStore';
import { useAirportStore } from '../stores/airportStore';
import { cancelTrip, getMyTrips } from '../services/trips';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import type { Trip } from '../types/domain';
import { TopNav } from '../components/layout/TopNav';
import styles from './TripScheduled.module.css';

export function TripScheduled() {
  const navigate = useNavigate();
  const { tripId: urlTripId } = useParams<{ tripId: string }>();
  const tripStore = useTripStore();
  const airport = useAirportStore((s) => s.selectedAirport);
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const selectAirport = useAirportStore((s) => s.selectAirport);
  const ws = useWebSocket();
  const [fetchedTrip, setFetchedTrip] = useState<Trip | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = () => {
    setShowCancelSheet(true);
  };

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

  const resolvedAirportCode = trip?.airportCode ?? tripStore.currentTrip?.airportCode ?? airport?.code;
  const terminalLabel = airport?.terminals.find((t) => t.code === resolvedTerminal)?.label ?? resolvedTerminal ?? 'Terminal';
  const fromLabel = resolvedAirportCode ? `${resolvedAirportCode} - ${terminalLabel}` : terminalLabel;
  const toLabel = resolvedDestination || 'Destination';

  const halfFareEur = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const savingsDisplay = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: airport?.currency ?? 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(halfFareEur);


  return (
    <div className={styles.screen}>
      <TopNav showBack right={resolvedTripId ? <div className={styles.tripBadge}>#{resolvedTripId.slice(-6).toUpperCase()}</div> : undefined} />

      <div className={styles.scrollArea}>
        <div className={styles.successAnim}>
          <div className={styles.outerRing} />
          <div className={styles.innerCircle}>
            <MIcon name="check" size={42} sw={2.5} />
          </div>
          <div className={`${styles.confetti} ${styles.confetti1}`} />
          <div className={`${styles.confetti} ${styles.confetti2}`} />
          <div className={`${styles.confetti} ${styles.confetti3}`} />
        </div>

        <div className={styles.textCenter}>
          <h1 className={styles.headline}>Viaggio prenotato!</h1>
          <p className={styles.subhead}>
            Cercheremo un compagno di viaggio per te. Riceverai una notifica non appena troviamo un match.
          </p>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.routeSection}>
            <div className={styles.routeVisual}>
              <div className={styles.routeDotOutline} />
              <div className={styles.routeLine} />
              <div className={styles.routeDotFill} />
            </div>
            <div className={styles.routeDetails}>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>Da</span>
                <span className={styles.routeValue}>{fromLabel}</span>
              </div>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>A</span>
                <span className={styles.routeValue}>{toLabel}</span>
              </div>
            </div>
          </div>
          {trip?.mode === 'scheduled' && trip?.flightNumber && (
            <>
              <div className={styles.divider} />
              <div className={styles.flightRow}>
                <div className={styles.flightIcon}><MIcon name="plane-landing" size={14} sw={2} /></div>
                <span className={styles.flightNumber}>{trip.flightNumber}</span>
                {trip.flightTime && (
                  <span className={styles.flightTime}>· partenza {formatTimeShort(trip.flightTime)}</span>
                )}
              </div>
            </>
          )}
          <div className={styles.divider} />
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="calendar" size={14} sw={2} /></div>
              {trip?.flightTime ? formatDateShort(trip.flightTime) : 'Oggi'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="clock" size={14} sw={2} /></div>
              {trip?.flightTime ? formatTimeShort(trip.flightTime) : '--:--'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="users" size={14} sw={2} /></div>
              1 Passeggero
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="luggage" size={14} sw={2} /></div>
              {resolvedLuggage} {resolvedLuggage === 1 ? 'Bagaglio' : 'Bagagli'}
            </div>
          </div>
          <div className={styles.savingsStrip}>
            <div className={styles.savingsLabel}>
              <MIcon name="sparkles" size={16} sw={2} />
              Risparmio stimato
            </div>
            <div className={styles.savingsValue}>~{savingsDisplay}</div>
          </div>
        </div>

        <div className={styles.pushWrap}>
          <PushPrompt />
        </div>

        <div className={styles.stepsSection}>
          <div className={styles.stepsTitle}>Cosa succede ora</div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepText}>Cerchiamo compagni diretti a {toLabel.split(',')[0]}</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepText}>Ricevi una notifica push quando troviamo un match</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepText}>Vi trovate al punto di ritiro assegnato</div>
          </div>
        </div>
      </div>

      <div className={styles.actionArea}>
        <button className={styles.cancelLink} onClick={handleCancel}>
          <MIcon name="trash" size={14} sw={2} />
          Cancella prenotazione
        </button>
      </div>

      <BottomSheet
        open={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        aria-label="Cancel booking"
      >
        <div className={styles.cancelSheet}>
          <h2 className={styles.cancelTitle}>Vuoi davvero cancellare il viaggio?</h2>
          <MBtn variant="dark" onClick={confirmCancel} loading={cancelling}>
            Sì
          </MBtn>
          <MBtn variant="secondary" onClick={() => setShowCancelSheet(false)} disabled={cancelling}>
            No
          </MBtn>
        </div>
      </BottomSheet>
    </div>
  );
}
