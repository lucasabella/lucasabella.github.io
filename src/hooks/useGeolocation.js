import { useState, useCallback } from 'react';

/**
 * useGeolocation — lazy browser geolocation hook.
 *
 * Only requests the user's position when `requestPosition()` is called,
 * not on mount.  Caches the position for the lifetime of the component.
 */
export function useGeolocation() {
    const [position, setPosition] = useState(null);   // { lat, lng }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const requestPosition = useCallback(() => {
        if (position) return;                     // already cached
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    }, [position]);

    return { position, loading, error, requestPosition };
}
