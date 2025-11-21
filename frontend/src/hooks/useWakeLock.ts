import { useEffect } from 'react';

export function useWakeLock() {
    useEffect(() => {
        let wakeLock: WakeLockSentinel | null = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('[WakeLock] Tela mantida ativa');
                }
            } catch (err) {
                console.warn('[WakeLock] Falha ao solicitar:', err);
            }
        };

        void requestWakeLock();

        // Re-solicita se a aba ficar visível novamente (o sistema solta o lock ao minimizar)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && wakeLock === null) {
                void requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLock) void wakeLock.release();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
}