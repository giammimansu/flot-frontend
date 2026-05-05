import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { PushPrompt } from '../components/trips/PushPrompt';
import { useTripStore } from '../stores/tripStore';
import { useAirportStore } from '../stores/airportStore';
import { cancelTrip } from '../services/trips';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import styles from './TripScheduled.module.css';

export function TripScheduled() {
  const navigate = useNavigate();
  const tripStore = useTripStore();
  const airport = useAirportStore((s) => s.selectedAirport);
  const ws = useWebSocket();

  // If matched via ws while on this screen
  useEffect(() => {
    const unsub = ws.on('match_found', (data) => {
      // In a real app we might show a celebration modal before navigating
      setTimeout(() => {
        navigate(`/match/${data.matchId}`);
      }, 2000);
    });
    return unsub;
  }, [ws, navigate]);

  const handleCancel = async () => {
    if (!tripStore.tripId) return;
    if (!window.confirm('Vuoi cancellare questa prenotazione?')) return;
    
    try {
      await cancelTrip(tripStore.tripId);
      tripStore.reset();
      navigate('/my-trips');
    } catch {
      alert('Impossibile cancellare il viaggio.');
    }
  };

  const fromLabel = airport?.terminals.find((t) => t.code === tripStore.terminal)?.label || tripStore.terminal || 'Terminal';
  const toLabel = tripStore.destination || 'Destination';

  const halfFareEur = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const savingsDisplay = new Intl.NumberFormat('it-IT', {
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
        {tripStore.tripId && (
          <div className={styles.tripBadge}>
            #{tripStore.tripId.slice(-6).toUpperCase()}
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
          <h1 className={styles.headline}>Viaggio prenotato!</h1>
          <p className={styles.subhead}>
            Ti cercheremo un compagno il giorno stesso. Riceverai una notifica appena troviamo un match.
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
          <div className={styles.divider} />
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="calendar" size={14} sw={2} /></div>
              {tripStore.currentTrip?.flightTime ? formatDateShort(tripStore.currentTrip.flightTime) : 'Oggi'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="clock" size={14} sw={2} /></div>
              {tripStore.currentTrip?.flightTime ? formatTimeShort(tripStore.currentTrip.flightTime) : '--:--'}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="users" size={14} sw={2} /></div>
              1 Passeggero
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}><MIcon name="luggage" size={14} sw={2} /></div>
              {tripStore.luggage ?? 1} {(tripStore.luggage ?? 1) === 1 ? 'Bagaglio' : 'Bagagli'}
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
            <div className={styles.stepText}>Cercheremo compagni diretti a {toLabel.split(',')[0]}</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepText}>Riceverai una notifica push con il match</div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepText}>Vi incontrerete all'uscita indicata</div>
          </div>
        </div>
      </div>

      <div className={styles.actionArea}>
        <div className={styles.actionGrid}>
          <MBtn variant="dark" onClick={() => navigate('/my-trips')} icon="search">
            I miei viaggi
          </MBtn>
          <MBtn variant="outline" onClick={() => navigate('/check-in')} icon="plus">
            Nuovo viaggio
          </MBtn>
        </div>
        <button className={styles.cancelLink} onClick={handleCancel}>
          <MIcon name="trash" size={14} sw={2} />
          Cancella prenotazione
        </button>
      </div>
    </div>
  );
}
