import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MIcon, MSegment, MStepper, MBtn, MDestInput } from '../components/ui';
import { MDateTimePicker } from '../components/ui/MDateTimePicker';
import { HomeIndicator, ProfileMenu } from '../components/layout';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, calcSavings } from '../lib/formatters';
import type { TripDestination, TripMode } from '../types/domain';
import styles from './TravelCheckin.module.css';

// ── Zod schema ───────────────────────────────────────────────

const schema = z
  .object({
    mode: z.enum(['live', 'scheduled']),
    flightTime: z.string().optional(),
    terminal: z.string().min(1, 'Select a terminal'),
    destination: z
      .object({ label: z.string().min(1), lat: z.number(), lng: z.number(), placeId: z.string().min(1) })
      .nullable()
      .refine((v) => v !== null, { message: 'Select a destination from the list' }),
    luggage: z.number().min(0).max(3),
    paxCount: z.number().min(1).max(4),
  })
  .refine(
    (data) => !(data.mode === 'scheduled' && !data.flightTime),
    { message: 'Select a flight date and time', path: ['flightTime'] },
  );

type FormValues = z.infer<typeof schema>;

// ── Mode options ─────────────────────────────────────────────

const MODE_OPTIONS = [
  { value: 'scheduled' as TripMode, label: 'Schedule' },
  { value: 'live' as TripMode, label: 'Search now' },
] as const;

// ── Framer motion variants ───────────────────────────────────

const slideIn = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit:    { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: 'easeInOut' as const },
};

// ── Component ────────────────────────────────────────────────

export function TravelCheckin() {
  const navigate = useNavigate();
  const location = useLocation();
  const airport = useAirportStore((s) => s.selectedAirport);
  const submitTrip = useTripStore((s) => s.submitTrip);
  const tripStatus = useTripStore((s) => s.status);
  const preferredMode = useTripStore((s) => s.preferredMode);
  const user = useAuthStore((s) => s.user);

  const terminalOptions = airport?.terminals.map((t) => t.label) ?? ['Terminal 1', 'Terminal 2'];

  const defaultMode: TripMode =
    (location.state as { defaultMode?: TripMode } | null)?.defaultMode ?? preferredMode;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: defaultMode,
      flightTime: undefined,
      terminal: terminalOptions[0],
      destination: null,
      luggage: 1,
      paxCount: 1,
    },
  });

  const mode = watch('mode');
  const destination = watch('destination') as TripDestination | null;

  const baseFare = airport?.baseFare ?? 12000;
  const currency = airport?.currency ?? 'EUR';
  const savings = calcSavings(baseFare, 1);
  const isSubmitting = tripStatus === 'creating';

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase().trim() || '?'
    : '?';

  const ctaLabel = mode === 'scheduled' ? 'Schedule ride' : 'Find match now';

  const onSubmit = async (data: FormValues) => {
    if (!airport || !data.destination) return;

    const terminalObj = airport.terminals.find((t) => t.label === data.terminal);
    const terminalCode = terminalObj?.code ?? 'T1';

    const result = await submitTrip({
      airportCode: airport.code,
      terminal: terminalCode,
      destination: data.destination.label,
      destLat: data.destination.lat,
      destLng: data.destination.lng,
      destPlaceId: data.destination.placeId,
      paxCount: data.paxCount,
      luggage: data.luggage,
      mode: data.mode,
      ...(data.mode === 'scheduled' && { flightTime: data.flightTime }),
    });

    if (result) {
      navigate(data.mode === 'live' ? '/search' : `/trip/${result.tripId}`);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.scrollable}>

        {/* Top nav */}
        <div className={styles.topNav}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Torna indietro">
            <MIcon name="chevron-left" size={20} />
          </button>
          <span className={styles.navCenter}>FLOT</span>
          <button
            className={styles.avatar}
            onClick={() => setProfileMenuOpen(true)}
            aria-label="Apri menu profilo"
          >
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.firstName} className={styles.avatarImg} />
            ) : (
              initials
            )}
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
                aria-label="Modalità di ricerca"
              />
            )}
          />
        </div>

        {/* 2. Slot picker — only scheduled */}
        <AnimatePresence>
          {mode === 'scheduled' && (
            <motion.div
              key="slot-picker"
              className={styles.overflowHidden}
              {...slideIn}
            >
              <div className={styles.formSectionSm}>
                <div className={styles.fieldLabel}>Flight time</div>
                <Controller
                  control={control}
                  name="flightTime"
                  render={({ field }) => (
                    <MDateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.flightTime}
                    />
                  )}
                />
                {errors.flightTime && (
                  <div className={styles.fieldError}>{errors.flightTime.message}</div>
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
          disabled={!destination || isSubmitting}
          icon={mode === 'live' ? 'search' : 'timer'}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? 'Attendere…' : ctaLabel}
        </MBtn>
      </div>

      <HomeIndicator />
    </div>
  );
}
