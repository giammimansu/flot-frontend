import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GOOGLE_PLACES_API_KEY } from './constants';

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function ensurePlaces(): Promise<google.maps.PlacesLibrary> {
  if (placesLibraryPromise) return placesLibraryPromise;
  setOptions({ key: GOOGLE_PLACES_API_KEY, v: 'weekly' });
  placesLibraryPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  return placesLibraryPromise;
}
