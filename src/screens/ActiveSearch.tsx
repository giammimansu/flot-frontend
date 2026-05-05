import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon, ComingSoonModal } from '../components/ui';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useMatchStore } from '../stores/matchStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCountdown } from '../hooks/useCountdown';
import { patchTrip } from '../services/trips';
import styles from './ActiveSearch.module.css';

const STATUS_MSGS = [
  'Scanning Terminal for fellow travelers…',
  'Checking nearby destinations…',
  'Calculating potential savings…',
  'Matching arrival times…',
  'Finalizing your pair…',
];

const TRAVELER_DOTS: Array<{ letter: string; top: string; left: string; anim: string }> = [
  { letter: 'L', top: '18%', left: '72%', anim: 'dotBlink0 4s infinite ease-in-out' },
  { letter: 'K', top: '65%', left: '15%', anim: 'dotBlink1 6s infinite ease-in-out 1s' },
  { letter: 'R', top: '75%', left: '68%', anim: 'dotBlink2 5s infinite ease-in-out 2s' },
];

export function ActiveSearch() {
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);
  const tripId = useTripStore((s) => s.tripId);
  const tripTerminal = useTripStore((s) => s.terminal);
  const tripDestination = useTripStore((s) => s.destination);
  const resetTrip = useTripStore((s) => s.reset);
  const setMatch = useMatchStore((s) => s.setMatch);
  const ws = useWebSocket();

  const timeoutSec = (airport as (typeof airport & { live_search_timeout_sec?: number }) | null)
    ?.live_search_timeout_sec ?? airport?.searchTimeoutSec ?? 180;
  const [mi, setMi] = useState(0);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [wsError, setWsError] = useState(false);

  const onCountdownComplete = useCallback(() => {
    // Trip stays in pool (live_pool_ttl_sec) — only hide UI
    navigate('/no-match', { replace: true });
  }, [navigate]);

  const { display } = useCountdown({
    totalSeconds: timeoutSec,
    onComplete: onCountdownComplete,
  });

  // Status msg rotation
  useEffect(() => {
    const t = window.setInterval(
      () => setMi((i) => (i + 1) % STATUS_MSGS.length),
      8000,
    );
    return () => window.clearInterval(t);
  }, []);

  // WebSocket: navigate on match_found
  useEffect(() => {
    const unsub = ws.on('match_found', (data) => {
      setMatch({
        matchId: data.matchId,
        status: 'pending',
        score: 0,
        savings: 0,
        partner: data.partner,
        unlockedBy: [],
      });
      navigate(`/match/${data.matchId}`, { replace: true });
    });
    return unsub;
    // ws is a stable singleton reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Surface WebSocket connection errors so user isn’t stuck on spinning radar
  useEffect(() => {
    const unsub = ws.on('error' as never, () => setWsError(true));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No tripId → bounce to check-in
  useEffect(() => {
    if (!tripId) navigate('/check-in', { replace: true });
  }, [tripId, navigate]);

  const handleCancel = async () => {
    if (tripId) {
      try {
        await patchTrip(tripId, { status: 'cancelled' });
      } catch {
        // Best-effort
      }
    }
    resetTrip();
    navigate('/check-in', { replace: true });
  };

  const fromLabel = tripTerminal ?? airport?.name ?? 'Airport';
  const toLabel = tripDestination ?? airport?.city ?? 'Destination';

  if (wsError) {
    return (
      <div className={styles.screen}>
        <div className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandDot} />
            <span className={styles.brandText}>FLOT</span>
          </div>
        </div>
        <div className={styles.statusBlock} style={{ marginTop: '80px' }}>
          <h2 className={styles.statusTitle}>Connection lost</h2>
          <p className={styles.statusMsg}>We couldn't connect to the matching service.</p>
        </div>
        <div className={styles.cancelWrap}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.brandDot} />
          <span className={styles.brandText}>FLOT</span>
        </div>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} />
          Searching · {display}
        </span>
      </div>

      <div className={styles.routeCard}>
        <div className={styles.routeCol}>
          <div className={styles.routeLabel}>From</div>
          <div className={styles.routeValue}>{fromLabel}</div>
        </div>
        <div className={styles.routeDivider} />
        <div className={styles.routeCol}>
          <div className={styles.routeLabel}>To</div>
          <div className={styles.routeValue}>{toLabel}</div>
        </div>
      </div>

      <div className={styles.radarWrap}>
        <div className={styles.radar}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={styles.radarRing}
              style={{ animation: `radarPulse 2400ms infinite ease-in-out ${i * 800}ms` }}
            />
          ))}
          <div className={styles.radarCore}>
            <MIcon name="search" size={34} sw={2.25} />
          </div>
          {TRAVELER_DOTS.map((d) => (
            <div
              key={d.letter}
              className={styles.dot}
              style={{ top: d.top, left: d.left, animation: d.anim }}
            >
              {d.letter}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.statusBlock}>
        <h2 className={styles.statusTitle}>Scanning for your ride partner</h2>
        <div key={mi} className={styles.statusMsg}>{STATUS_MSGS[mi]}</div>
      </div>

      <div className={styles.guarantee}>
        <div className={styles.guaranteeIcon}>
          <MIcon name="shield" size={16} sw={2} />
        </div>
        <div>
          <div className={styles.guaranteeTitle}>
            Guaranteed response in {Math.round(timeoutSec / 60)} minutes
          </div>
          <div className={styles.guaranteeBody}>
            We group passengers to maximise your savings.
          </div>
        </div>
      </div>

      {/* PRO Teaser */}
      <button
        type="button"
        className={styles.proTeaser}
        onClick={() => setProModalOpen(true)}
      >
        <div className={styles.proTeaserIcon}>
          <MIcon name="crown" size={16} sw={2} />
        </div>
        <div className={styles.proTeaserContent}>
          <div className={styles.proTeaserTitle}>PRO · €4.99/mo</div>
          <div className={styles.proTeaserCopy}>
            See travelers around you on a live map.
          </div>
        </div>
        <MIcon name="chevron-right" size={16} />
      </button>

      <div className={styles.cancelWrap}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleCancel}
        >
          Cancel search
        </button>
      </div>

      <ComingSoonModal
        open={proModalOpen}
        onClose={() => setProModalOpen(false)}
        title="Coming soon"
        message="The live radar map is part of FLOT PRO."
        badge="PRO"
      />
    </div>
  );
}
