import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { useAuthStore, useCreditStore } from '../store';
import { getUserProfile } from '../services/authService';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setUser, setLoading: setAuthLoading, setUserProfile } = useAuthStore();
  const { setCredits } = useCreditStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        // Load user profile and credits into store
        (async () => {
          try {
            const profile = await getUserProfile(user.uid);
            if (profile) {
              try {
                setUserProfile(profile);
              } catch (e) {
                // ignore
              }
              setCredits(profile.credits || 0);
            }
          } catch (err) {
            console.error('Failed loading profile in auth hook', err);
          }
        })();
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading, setUserProfile, setCredits]);

  return { loading };
}

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        (error) => {
          setError(error.message);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  return { location, error, loading, getLocation };
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
