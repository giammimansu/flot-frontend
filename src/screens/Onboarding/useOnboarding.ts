import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile } from '../../services/users';

export function useOnboarding() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get('step');
  const step = (stepParam === '2' ? 2 : stepParam === '3' ? 3 : 1) as 1 | 2 | 3;

  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { logout } = useAuth();

  const [gender, setGender] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(user?.lang || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = useCallback(() => {
    if (step === 1 && gender) {
      setSearchParams({ step: '2' });
    } else if (step === 2 && ageGroup) {
      setSearchParams({ step: '3' });
    }
  }, [step, gender, ageGroup, setSearchParams]);

  const back = useCallback(() => {
    if (step === 2) {
      setSearchParams({});
    } else if (step === 3) {
      setSearchParams({ step: '2' });
    } else if (step === 1) {
      logout();
    }
  }, [step, setSearchParams, logout]);

  const submit = useCallback(async () => {
    if (!gender || !ageGroup || !lang) {
      setError('Tutti i campi sono obbligatori.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        gender,
        ageGroup,
        lang,
        onboarding: true,
      };

      const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
      let updatedUser;
      if (isDevBypass) {
        // Dev bypass fallback in case backend is not running/mocked
        updatedUser = {
          ...user,
          ...payload,
        };
        // Update dev session local storage
        localStorage.setItem('dev_user_session', JSON.stringify(updatedUser));
      } else {
        updatedUser = await updateProfile(payload);
      }

      updateUser(updatedUser as any);

      // Back to EntryPoint: if a booking draft survived the login redirect it
      // creates the trip from the draft and redirects to /trip/:id; otherwise
      // '/' is the home screen.
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[Onboarding] Error submitting onboarding:', err);
      let errorMsg = 'Si è verificato un errore durante il salvataggio.';
      if (err.response) {
        try {
          const body = await err.response.json();
          if (body.error) {
            errorMsg = body.error;
          }
        } catch {
          // ignore
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [gender, ageGroup, lang, user, updateUser, navigate]);

  return {
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
  };
}
