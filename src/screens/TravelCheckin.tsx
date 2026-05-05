import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MIcon, MSegment, MStepper, MBtn, MDestInput } from '../components/ui';
import { HomeIndicator, ProfileMenu } from '../components/layout';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { formatCurrency, calcSavings } from '../lib/formatters';
import type { TripDestination, TripMode } from '../types/domain';
import styles from './TravelCheckin.module.css';

// ── Zod schema ───────────────────────────────────────────────

const FLIGHT_NUMBER_RE = /^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?$/i;

const schema = z
  .object({
    mode: z.enum(['live', 'scheduled']),
    flightNumber: z.string().optional(),
    flightDate: z.string().optional(),
    terminal: z.string().min(1, 'Select a terminal'),
    destination: z
      .object({ label: z.string().min(1), lat: z.number(), lng: z.number(), placeId: z.string().min(1) })
      .nullable()
      .refine((v) => v !== null, { message: 'Select a destination from the list' }),
    luggage: z.number().min(0).max(3),
    paxCount: z.number().min(1).max(4),
  })
  .refine(
    (d) => d.mode !== 'scheduled' || (!!d.flightNumber && d.flightNumber.length >= 3),
    { message: 'Enter a valid flight number', path: ['flightNumber'] },
  )
  .refine(
    (d) => d.mode !== 'scheduled' || FLIGHT_NUMBER_RE.test(d.flightNumber ?? ''),
    { message: 'Format: AZ1234 or FR 9001', path: ['flightNumber'] },
  )
  .refine(
    (d) => d.mode !== 'scheduled' || !!d.flightDate,
    { message: 'Select a flight date', path: ['flightDate'] },
  );

type FormValues = z.infer<typeof schema>;

// ── Mode options ─────────────────────────────────────────────

const MODE_OPTIONS = [
  { value: 'scheduled' as TripMode, label: 'Schedule' },
  { value: 'live' as TripMode, label: 'Search now' },
] as const;


// ── Component ────────────────────────────────────────────────

export function TravelCheckin() {
  const navigate = useNavigate();
  const location = useLocation();
  const airport = useAirportStore((s) => s.selectedAirport);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const airports = useAirportStore((s) => s.airports);
  const selectAirport = useAirportStore((s) => s.selectAirport);
  const submitTrip = useTripStore((s) => s.submitTrip);
  const tripStatus = useTripStore((s) => s.status);
  const preferredMode = useTripStore((s) => s.preferredMode);
  const user = useAuthStore((s) => s.user);

  // If airport is missing (e.g. after a page refresh), re-fetch and auto-select
  useEffect(() => {
    if (!airport) {
      loadAirports();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!airport && airports.length === 1) {
      selectAirport(airports[0].code);
    } else if (!airport && airports.length > 1) {
      navigate('/airport', { replace: true });
    }
  }, [airports, airport]); // eslint-disable-line react-hooks/exhaustive-deps

  const terminalOptions = airport?.terminals.map((t) => t.label) ?? ['Terminal 1', 'Terminal 2'];

  const defaultMode: TripMode =
    (location.state as { defaultMode?: TripMode } | null)?.defaultMode ?? preferredMode;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: defaultMode,
      flightNumber: '',
      flightDate: '',
      terminal: terminalOptions[0],
      destination: null,
      luggage: 1,
      paxCount: 1,
    },
  });

  const mode = watch('mode');

  const baseFare = airport?.baseFare ?? 12000;
  const currency = airport?.currency ?? 'EUR';
  const savings = calcSavings(baseFare, 1);
  const isSubmitting = tripStatus === 'creating';
  const showToast = useNotificationStore((s) => s.showToast);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase().trim() || '?'
    : '?';

  const ctaLabel = mode === 'scheduled' ? 'Schedule ride' : 'Find match now';

  const onError = (errs: object) => {
    const first = Object.values(errs)[0] as { message?: string } | undefined;
    showToast({ title: 'Check your fields', body: first?.message ?? 'Please fill in all required fields.' });
  };

  const onSubmit = async (data: FormValues) => {
    if (!airport) {
      showToast({ title: 'Error', body: 'No airport selected.' });
      return;
    }
    if (!data.destination) return;

    const terminalObj = airport.terminals.find((t) => t.label === data.terminal);
    const terminalCode = terminalObj?.code ?? 'T1';

    const result = await submitTrip({
      airportCode: airport.code,
      terminal: terminalCode,
      direction: airport.directionLabels[0] ?? 'TO_CITY',
      destination: data.destination.label,
      destLat: data.destination.lat,
      destLng: data.destination.lng,
      destPlaceId: data.destination.placeId,
      paxCount: data.paxCount,
      luggage: data.luggage,
      mode: data.mode,
      flightNumber: (data.flightNumber ?? '').replace(/\s/g, ''),
      flightDate: data.flightDate ?? '',
    });

    if (!result) {
      const tripError = useTripStore.getState().error;
      if (tripError === 'AUTH_REQUIRED') {
        navigate('/', { replace: true });
        return;
      }
      showToast({ title: 'Error', body: tripError ?? 'Could not create the trip. Please try again.' });
      return;
    }
    navigate(data.mode === 'live' ? '/search' : `/trip/${result.tripId}`);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.scrollable}>

        {/* Top nav */}
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <MIcon name="chevron-left" size={20} />
          </button>
          <span className={styles.navCenter}>FLOT</span>
          <button
            className={styles.avatar}
            onClick={() => setProfileMenuOpen(true)}
            aria-label="Open profile menu"
          >
            {initials}
          </button>
        </div>
        <ProfileMenu open={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} />

        {/* Hero */}
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>
            {mode === 'live' ? 'Find a shared taxi now.' : 'Schedule your shared taxi.'}
          </h2>
          <p className={styles.heroSub}>
            Tell us where you're heading — we'll match you with a traveler going your way.
          </p>
        </div>

        {/* 1. Mode */}
        <div className={styles.formSection}>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <MSegment
                options={MODE_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                aria-label="Search mode"
              />
            )}
          />
        </div>

        {/* 2. Flight info — only scheduled */}
        <AnimatePresence>
        {mode === 'scheduled' && (
        <motion.div
          key="flight-info"
          className={styles.overflowHidden}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
        <div className={styles.formSectionSm}>
          <div className={styles.fieldLabel}>Flight info</div>
          <div className={styles.flightRow}>
            <Controller
              control={control}
              name="flightNumber"
              render={({ field }) => (
                <div className={`${styles.textInputWrapper} ${errors.flightNumber ? styles.textInputError : ''}`}>
                  <MIcon name="plane-landing" size={18} className={styles.textInputIcon} />
                  <input
                    className={styles.textInput}
                    type="text"
                    placeholder="AZ 1234"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={8}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    aria-label="Flight number"
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="flightDate"
              render={({ field }) => (
                <div className={`${styles.textInputWrapper} ${errors.flightDate ? styles.textInputError : ''}`}>
                  <MIcon name="calendar" size={18} className={styles.textInputIcon} />
                  <input
                    className={styles.textInput}
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                    aria-label="Flight date"
                  />
                </div>
              )}
            />
          </div>
          {(errors.flightNumber || errors.flightDate) && (
            <div className={styles.fieldError}>
              {errors.flightNumber?.message ?? errors.flightDate?.message}
            </div>
          )}
        </div>
        </motion.div>
        )}
        </AnimatePresence>

        {/* 3. Terminal */}
        <div className={styles.formSectionSm}>
          <div className={styles.fieldLabel}>Terminal</div>
          <Controller
            control={control}
            name="terminal"
            render={({ field }) => (
              <MSegment
                options={terminalOptions.map(t => ({ id: t, label: t }))}
                value={field.value}
                onChange={field.onChange}
                aria-label="Select terminal"
              />
            )}
          />
        </div>

        {/* 4. Destination */}
        <div className={styles.formSectionSm}>
          <div className={styles.fieldLabel}>Where to?</div>
          <Controller
            control={control}
            name="destination"
            render={({ field }) => (
              <MDestInput
                value={field.value as TripDestination | null}
                onChange={field.onChange}
                placeholder="Search destination…"
                aria-label="Select destination"
              />
            )}
          />
          {errors.destination && (
            <div className={styles.fieldError}>{String(errors.destination.message)}</div>
          )}
        </div>

        {/* 5. Luggage */}
        <div className={styles.formSectionSm}>
          <div className={styles.stepperCard}>
            <div className={styles.stepperHeader}>
              <MIcon name="luggage" size={16} />
              <span className={styles.stepperLabel}>Luggage</span>
            </div>
            <Controller
              control={control}
              name="luggage"
              render={({ field }) => (
                <MStepper
                  value={field.value}
                  onChange={field.onChange}
                  min={0}
                  max={3}
                  aria-label="Number of luggage"
                />
              )}
            />
            <div className={styles.stepperHint}>Your match will know what to expect</div>
          </div>
        </div>

        {/* Savings card */}
        <div className={styles.savingsCard}>
          <div className={styles.savingsIcon}>
            <MIcon name="sparkles" size={18} sw={2} />
          </div>
          <div>
            <div className={styles.savingsText}>
              You could save{' '}
              <span className={styles.savingsAmount}>~{formatCurrency(savings, currency)}</span>
            </div>
            <div className={styles.savingsNote}>
              Flat fare {formatCurrency(baseFare, currency)} split in 2
            </div>
          </div>
        </div>

        <div className={styles.ctaSpacer} />
      </div>

      {/* 7. CTA */}
      <div className={styles.ctaBar}>
        <MBtn
          variant="primary"
          disabled={isSubmitting}
          icon={mode === 'live' ? 'search' : 'timer'}
          onClick={handleSubmit(onSubmit, onError)}
        >
          {isSubmitting ? 'Please wait…' : ctaLabel}
        </MBtn>
      </div>

      <HomeIndicator />
    </div>
  );
}
