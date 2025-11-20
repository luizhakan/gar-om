import { useEffect, useRef, useState } from 'react';

/**
 * Hook para tocar um som de alerta em loop.
 * Tenta usar um arquivo MP3 primeiro, se falhar usa Web Audio API (beep sintético).
 * @param devTocar - Se true, toca o som em loop
 */
export function useAlertaSonoro(devTocar: boolean) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const intervaloRef = useRef<number | null>(null);
    const [usarBeepSintetico, setUsarBeepSintetico] = useState(false);

    // Inicializar áudio
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/alerta.mp3');
            audioRef.current.loop = true;
            audioRef.current.volume = 0.5;

            // Detectar se o arquivo não existe
            audioRef.current.addEventListener('error', () => {
                console.warn('[DEBUG][useAlertaSonoro] Arquivo MP3 não encontrado, usando beep sintético');
                setUsarBeepSintetico(true);
            });
        }
    }, []);

    // Função para tocar beep sintético
    const tocarBeepSintetico = () => {
        if (intervaloRef.current !== null) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
        }

        if (!audioContextRef.current) {
            try {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
                console.log('[DEBUG][useAlertaSonoro] AudioContext criado para beep sintético');
            } catch (error) {
                console.error('[DEBUG][useAlertaSonoro] Erro ao criar AudioContext:', error);
                return;
            }
        }

        const audioContext = audioContextRef.current;

        const tocarBeep = async () => {
            try {
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                const now = audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
                gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

                oscillator.start(now);
                oscillator.stop(now + 0.25);
            } catch (error) {
                console.error('[DEBUG][useAlertaSonoro] Erro ao tocar beep:', error);
            }
        };

        tocarBeep();
        intervaloRef.current = window.setInterval(() => {
            tocarBeep();
        }, 1000);
    };

    // Tocar/parar áudio
    useEffect(() => {
        if (devTocar) {
            if (usarBeepSintetico) {
                console.log('[DEBUG][useAlertaSonoro] Usando beep sintético');
                tocarBeepSintetico();
            } else {
                console.log('[DEBUG][useAlertaSonoro] Tentando tocar MP3');
                audioRef.current?.play().catch(error => {
                    console.warn('[DEBUG][useAlertaSonoro] Erro ao tocar MP3:', error);
                    // Só faz fallback para beep se NÃO for erro de permissão (autoplay bloqueado)
                    if (error instanceof Error && error.name !== 'NotAllowedError') {
                        setUsarBeepSintetico(true);
                    }
                });
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            if (intervaloRef.current !== null) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
        }
    }, [devTocar, usarBeepSintetico]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (intervaloRef.current !== null) {
                clearInterval(intervaloRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        ativarAudio: async () => {
            // Sempre inicializa/resume o AudioContext na interação do usuário para garantir que o beep funcione
            if (!audioContextRef.current) {
                try {
                    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                    audioContextRef.current = new AudioContextClass();
                } catch (e) {
                    console.error('[DEBUG][useAlertaSonoro] Erro ao criar AudioContext:', e);
                }
            }
            
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                try {
                    await audioContextRef.current.resume();
                } catch (e) {
                    console.error('[DEBUG][useAlertaSonoro] Erro ao resumir AudioContext:', e);
                }
            }

            if (usarBeepSintetico) {
                console.log('[DEBUG][useAlertaSonoro] Áudio ativado (beep)');
            } else if (audioRef.current) {
                try {
                    await audioRef.current.play();
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    console.log('[DEBUG][useAlertaSonoro] Áudio ativado (MP3)');
                } catch (error) {
                    console.warn('[DEBUG][useAlertaSonoro] Falha ao ativar MP3:', error);
                    
                    // Se for erro de permissão, relança para que a UI saiba que precisa de interação
                    if (error instanceof Error && error.name === 'NotAllowedError') {
                        throw error;
                    }
                    
                    // Se for outro erro (ex: arquivo corrompido), tenta fallback
                    setUsarBeepSintetico(true);
                }
            }
        }
    };
}
