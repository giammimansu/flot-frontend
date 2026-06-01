import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import { useOnboarding } from './useOnboarding';
import { SelectPill } from './SelectPill';
import { MBtn } from '../../components/ui/MBtn';
import { MIcon } from '../../components/ui/MIcon';
import styles from './Onboarding.module.css';

export function Onboarding() {
  const {
    step,
    gender,
    ageGroup,
    lang,
    loading,
    error,
    next,
    back,
    setGender,
    setAgeGroup,
    setLang,
    submit,
  } = useOnboarding();

  const { user } = useAuthStore();
  const { logout } = useAuth();
  const isCompleted = useRef(false);

  // If the user navigates away (e.g. using browser back button on Step 1)
  // we log them out to trigger the landing page view in a logged out state.
  useEffect(() => {
    return () => {
      if (!isCompleted.current) {
        logout();
      }
    };
  }, [logout]);

  const welcomeTitle = user?.name ? `Ciao ${user.name.split(' ')[0]}!` : 'Prima di iniziare';

  const handleSubmit = async () => {
    isCompleted.current = true;
    await submit();
  };

  const totalSteps = 3;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={back} aria-label={step > 1 ? 'Torna indietro' : 'Annulla ed esci'}>
          <MIcon name="chevron-left" size={24} />
        </button>
        <span className={styles.logo}>flot</span>
      </header>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <div className={styles.stepIndicator}>
          {step} di {totalSteps}
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className={styles.stepContent}
          >
            {step === 1 && (
              <>
                <div className={styles.illustrationContainer}>
                  <span className={styles.illustration} role="img" aria-label="wave">👋</span>
                </div>
                <div className={styles.textGroup}>
                  <h1 className={styles.title}>{welcomeTitle}</h1>
                  <p className={styles.subtitle}>
                    Seleziona il tuo genere per aiutarci a trovare il compagno di viaggio più compatibile. Non sarà visibile al pubblico.
                  </p>
                </div>
                <div className={styles.optionsGroup} role="radiogroup" aria-label="Seleziona Genere">
                  <SelectPill
                    label="Uomo"
                    selected={gender === 'male'}
                    onSelect={() => setGender('male')}
                  />
                  <SelectPill
                    label="Donna"
                    selected={gender === 'female'}
                    onSelect={() => setGender('female')}
                  />
                  <SelectPill
                    label="Altro"
                    selected={gender === 'other'}
                    onSelect={() => setGender('other')}
                  />
                  <SelectPill
                    label="Preferisco non dirlo"
                    selected={gender === 'prefer_not_to_say'}
                    onSelect={() => setGender('prefer_not_to_say')}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.illustrationContainer}>
                  <span className={styles.illustration} role="img" aria-label="cake">🎂</span>
                </div>
                <div className={styles.textGroup}>
                  <h1 className={styles.title}>Quanti anni hai?</h1>
                  <p className={styles.subtitle}>
                    Questo ci aiuta a creare gruppi di viaggio più affini.
                  </p>
                </div>
                <div className={styles.optionsGroup} role="radiogroup" aria-label="Seleziona Fascia d'età">
                  <SelectPill
                    label="18-25"
                    selected={ageGroup === '18-25'}
                    onSelect={() => setAgeGroup('18-25')}
                  />
                  <SelectPill
                    label="26-35"
                    selected={ageGroup === '26-35'}
                    onSelect={() => setAgeGroup('26-35')}
                  />
                  <SelectPill
                    label="36-45"
                    selected={ageGroup === '36-45'}
                    onSelect={() => setAgeGroup('36-45')}
                  />
                  <SelectPill
                    label="46-55"
                    selected={ageGroup === '46-55'}
                    onSelect={() => setAgeGroup('46-55')}
                  />
                  <SelectPill
                    label="56+"
                    selected={ageGroup === '56+'}
                    onSelect={() => setAgeGroup('56+')}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className={styles.illustrationContainer}>
                  <span className={styles.illustration} role="img" aria-label="chat">💬</span>
                </div>
                <div className={styles.textGroup}>
                  <h1 className={styles.title}>In che lingua preferisci?</h1>
                  <p className={styles.subtitle}>
                    Useremo questa per le notifiche e la chat di viaggio.
                  </p>
                </div>
                <div className={styles.optionsGroup} role="radiogroup" aria-label="Seleziona Lingua preferita">
                  <SelectPill
                    label="Italiano"
                    selected={lang === 'it'}
                    onSelect={() => setLang('it')}
                  />
                  <SelectPill
                    label="English"
                    selected={lang === 'en'}
                    onSelect={() => setLang('en')}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <MIcon name="alert-circle" size={16} />
              <span>{error}</span>
            </div>
          )}

          {step < totalSteps ? (
            <MBtn
              variant="primary"
              disabled={step === 1 ? !gender : !ageGroup}
              onClick={next}
              icon="chevron-right"
              full
            >
              Continua
            </MBtn>
          ) : (
            <MBtn
              variant="primary"
              disabled={!lang || loading}
              loading={loading}
              onClick={handleSubmit}
              icon="arrow-right"
              full
            >
              Cerca il mio match
            </MBtn>
          )}
        </div>
      </footer>
    </div>
  );
}
