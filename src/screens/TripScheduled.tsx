import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { PushPrompt } from '../components/trips/PushPrompt';
import { useTripStore } from '../stores/tripStore';
import { useAirportStore } from '../stores/airportStore';
import { cancelTrip, getMyTrips } from '../services/trips';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import type { Trip } from '../types/domain';
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

  // Fetch from API when store data doesn't match URL (refresh / direct link)
  useEffect(() => {
    if (!urlTripId) return;
    if (tripStore.tripId === urlTripId && tripStore.currentTrip && tripStore.destination) return;
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
    const unsub = ws.on('match_found', (data) => {
      setTimeout(() => {
        navigate(`/match/${data.matchId}`);
      }, 2000);
    });
    return unsub;
  }, [ws, navigate]);

  const resolvedTripId = urlTripId ?? tripStore.tripId;
  const trip = (tripStore.tripId === urlTripId && tripStore.currentTrip) ? tripStore.currentTrip : fetchedTrip;

  useEffect(() => {
    const airportCode = trip?.airportCode ?? tripStore.currentTrip?.airportCode;
    if (!airport && airports.length > 0 && airportCode) {
      selectAirport(airportCode);
    }
  }, [airports, trip, tripStore.currentTrip]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedTerminal = (tripStore.tripId === urlTripId ? tripStore.terminal : null) ?? trip?.terminal ?? null;
  const resolvedDestination = (tripStore.tripId === urlTripId ? tripStore.destination : null) ?? trip?.destination ?? null;
  const resolvedLuggage = (tripStore.tripId === urlTripId ? tripStore.luggage : null) ?? trip?.luggage ?? 1;

  const handleCancel = async () => {
    if (!resolvedTripId) return;
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelTrip(resolvedTripId);
      tripStore.reset();
      navigate('/my-trips');
    } catch {
      alert('Could not cancel the trip.');
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
      <div className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.brandDot} />
          <span className={styles.brandText}>FLOT</span>
        </div>
        {resolvedTripId && (
          <div className={styles.tripBadge}>
            #{resolvedTripId.slice(-6).toUpperCase()}
          </div>
        )}
      </div>

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
          <h1 className={styles.headline}>Trip booked!</h1>
          <p className={styles.subhead}>
            We'll find you a travel companion on the day. You'll get a notification as soon as we find a match.
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
                <span className={styles.routeLabel}>From</span>
                <span className={styles.routeValue}>{fromLabel}</span>
              </div>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>To</span>
                <span className={styles.routeValue}>{toLabel}</span>
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="calendar" size={14} sw={2} /></div>
              {trip?.flightTime ? formatDateShort(trip.flightTime) : 'Today'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="clock" size={14} sw={2} /></div>
              {trip?.flightTime ? formatTimeShort(trip.flightTime) : '--:--'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="users" size={14} sw={2} /></div>
              1 Passenger
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="luggage" size={14} sw={2} /></div>
              {resolvedLuggage} {resolvedLuggage === 1 ? 'Bag' : 'Bags'}
            </div>
          </div>
          <div className={styles.savingsStrip}>
            <div className={styles.savingsLabel}>
              <MIcon name="sparkles" size={16} sw={2} />
              Estimated savings
            </div>
            <div className={styles.savingsValue}>~{savingsDisplay}</div>
          </div>
        </div>

        <div className={styles.pushWrap}>
          <PushPrompt />
        </div>

        <div className={styles.stepsSection}>
          <div className={styles.stepsTitle}>What happens next</div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepText}>We'll look for companions heading to {toLabel.split(',')[0]}</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepText}>You'll get a push notification when a match is found</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepText}>You'll meet at the designated exit</div>
          </div>
        </div>
      </div>

      <div className={styles.actionArea}>
        <div className={styles.actionGrid}>
          <MBtn variant="dark" onClick={() => navigate('/my-trips')} icon="search">
            My trips
          </MBtn>
          <MBtn variant="outline" onClick={() => navigate('/check-in')} icon="plus">
            New trip
          </MBtn>
        </div>
        <button className={styles.cancelLink} onClick={handleCancel}>
          <MIcon name="trash" size={14} sw={2} />
          Cancel booking
        </button>
      </div>
    </div>
  );
}
