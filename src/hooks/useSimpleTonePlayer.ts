import { useState, useCallback, useRef, useEffect } from 'react';

// Type definitions
interface BaseTone {
  note: string;
  octave: number;
  frequency: number;
}

interface SimpleTonePlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTone: BaseTone | null;
  error: string | null;
}

interface SimpleTonePlayerHook {
  playerState: SimpleTonePlayerState;
  playTone: (tone: BaseTone, duration?: number) => Promise<void>;
  stopTone: () => void;
  initialize: () => Promise<boolean>;
  cleanup: () => void;
}

export const useSimpleTonePlayer = (): SimpleTonePlayerHook => {
  const [playerState, setPlayerState] = useState<SimpleTonePlayerState>({
    isLoaded: false,
    isPlaying: false,
    currentTone: null,
    error: null,
  });

  // Refs for Web Audio API components
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Audio API
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setPlayerState(prev => ({ ...prev, error: null }));

      // Create AudioContext
      const audioContext = new AudioContext();
      
      // Start context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      audioContextRef.current = audioContext;

      setPlayerState(prev => ({
        ...prev,
        isLoaded: true,
      }));

      console.log('🎵 SimpleTonePlayer初期化完了');
      return true;
    } catch (error) {
      console.error('SimpleTonePlayer初期化失敗:', error);
      setPlayerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize simple tone player',
      }));
      return false;
    }
  }, []);

  // Play a tone using Oscillator
  const playTone = useCallback(async (tone: BaseTone, duration: number = 2): Promise<void> => {
    try {
      if (!audioContextRef.current) {
        throw new Error('Audio context not initialized');
      }

      // Stop any currently playing tone
      if (playerState.isPlaying) {
        stopTone();
      }

      const audioContext = audioContextRef.current;

      // Ensure context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Configure oscillator
      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;

      // Configure envelope
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1); // Attack
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2); // Decay
      gainNode.gain.setValueAtTime(0.2, now + duration - 0.3); // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      setPlayerState(prev => ({
        ...prev,
        isPlaying: true,
        currentTone: tone,
      }));

      // Start oscillator
      oscillator.start(now);
      oscillator.stop(now + duration);

      // Handle oscillator end
      oscillator.onended = () => {
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentTone: null,
        }));
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };

      // Set timeout for state cleanup
      timeoutRef.current = setTimeout(() => {
        setPlayerState(prev => ({
          ...prev,
          isPlaying: false,
          currentTone: null,
        }));
      }, duration * 1000);

      console.log('🎵 SimpleTonePlayer再生開始:', tone);

    } catch (error) {
      console.error('SimpleTonePlayer再生失敗:', error);
      setPlayerState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to play tone',
        isPlaying: false,
      }));
    }
  }, [playerState.isPlaying]);

  // Stop currently playing tone
  const stopTone = useCallback(() => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current = null;
      }

      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
        currentTone: null,
      }));

      console.log('🎵 SimpleTonePlayer停止');
    } catch (error) {
      console.error('SimpleTonePlayer停止失敗:', error);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    try {
      stopTone();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setPlayerState({
        isLoaded: false,
        isPlaying: false,
        currentTone: null,
        error: null,
      });

      console.log('🎵 SimpleTonePlayer クリーンアップ完了');
    } catch (error) {
      console.error('SimpleTonePlayer クリーンアップ失敗:', error);
    }
  }, [stopTone]);

  // Initialize on mount
  useEffect(() => {
    if (!playerState.isLoaded && !playerState.error) {
      initialize();
    }
  }, [initialize, playerState.isLoaded, playerState.error]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    playerState,
    playTone,
    stopTone,
    initialize,
    cleanup,
  };
};