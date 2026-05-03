import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MIcon } from './MIcon';
import { GOOGLE_PLACES_API_KEY } from '../../lib/constants';
import type { TripDestination } from '../../types/domain';
import styles from './MDestInput.module.css';

interface MDestInputProps {
  value: TripDestination | null;
  onChange: (dest: TripDestination | null) => void;
  placeholder?: string;
  countryRestriction?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

function ensurePlaces(): Promise<google.maps.PlacesLibrary> {
  if (placesLibraryPromise) return placesLibraryPromise;
  setOptions({ key: GOOGLE_PLACES_API_KEY, v: 'weekly' });
  placesLibraryPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  return placesLibraryPromise;
}

export function MDestInput({
  value,
  onChange,
  placeholder = 'Search destination…',
  countryRestriction = 'it',
  disabled = false,
  'aria-label': ariaLabel,
}: MDestInputProps) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensurePlaces()
      .then((lib) => {
        autocompleteServiceRef.current = new lib.AutocompleteService();
        placesServiceRef.current = new lib.PlacesService(document.createElement('div'));
      })
      .catch(() => setApiError(true));
  }, []);

  // Sync query when parent clears value
  useEffect(() => {
    if (value === null && query !== '') setQuery('');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (input: string) => {
      if (!autocompleteServiceRef.current) return;
      if (input.length < 3) { setSuggestions([]); setIsOpen(false); setLoading(false); return; }

      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
        const response = await autocompleteServiceRef.current.getPlacePredictions({
          input,
          sessionToken: sessionTokenRef.current,
          componentRestrictions: { country: countryRestriction },
        });
        setSuggestions(response.predictions || []);
        setIsOpen((response.predictions || []).length > 0);
        setActiveIndex(-1);
      } catch {
        setApiError(true);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    [countryRestriction],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setApiError(false);
    if (val === '') {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    try {
      placesServiceRef.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
          sessionToken: sessionTokenRef.current ?? undefined,
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            const dest: TripDestination = {
              label: place.formatted_address ?? place.name ?? '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id ?? suggestion.place_id,
            };

            setQuery(dest.label);
            setSuggestions([]);
            setIsOpen(false);
            sessionTokenRef.current = null;
            onChange(dest);
          } else {
            setApiError(true);
          }
        }
      );
    } catch {
      setApiError(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      void handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, 150);
  };

  const hasFocus = isOpen || query.length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.root} ${hasFocus ? styles.focused : styles.idle}`}>
        <div className={styles.iconWrap}>
          <MIcon name="map-pin" size={20} />
        </div>
        <div className={styles.content}>
          <input
            ref={inputRef}
            className={query ? styles.valueText : styles.placeholderText}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: 0 }}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            aria-label={ariaLabel ?? placeholder}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-activedescendant={activeIndex >= 0 ? `dest-option-${activeIndex}` : undefined}
            role="combobox"
          />
        </div>
        <div className={styles.chevron}>
          {loading ? (
            <div className={styles.spinner} aria-hidden="true" />
          ) : (
            <MIcon name="chevron-right" size={18} color="var(--ink-subtle)" />
          )}
        </div>
      </div>

      {apiError && (
        <div className={styles.errorMsg} role="alert">
          Ricerca destinazioni non disponibile. Riprova.
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          className={styles.suggestions}
          role="listbox"
          aria-label="Destination suggestions"
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              id={`dest-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.suggestionItem} ${i === activeIndex ? styles.suggestionActive : ''}`}
              onPointerDown={() => void handleSelect(s)}
            >
              <div className={styles.destItemIcon}>
                <MIcon name="map-pin" size={18} />
              </div>
              <div className={styles.suggestionText}>
                <span className={styles.suggestionMain}>
                  {s.structured_formatting.main_text}
                </span>
                <span className={styles.suggestionSub}>
                  {s.structured_formatting.secondary_text}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
