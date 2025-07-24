'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, MicOff, CheckCircle, AlertCircle } from 'lucide-react';
import { PitchDetector } from 'pitchy';

export default function UnifiedAudioTestPage() {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  // Audio refs (Direct DOM Audio System)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Buffer refs
  const bufferLengthRef = useRef<number>(0);
  const byteDataArrayRef = useRef<Uint8Array | null>(null);
  const floatDataArrayRef = useRef<Float32Array | null>(null);
  
  // Smoothing ref
  const previousVolumeRef = useRef<number>(0);
  
  // DOM refs
  const volumeBarRef = useRef<HTMLDivElement | null>(null);
  const frequencyDisplayRef = useRef<HTMLDivElement | null>(null);
  const noteDisplayRef = useRef<HTMLDivElement | null>(null);
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-9), message]);
  };
  
  // Frequency to note conversion (matching microphone-test)
  const getNoteName = (frequency: number): string => {
    const noteFrequencies = [
      { note: 'ド', freq: 261.63 }, { note: 'ド#', freq: 277.18 }, { note: 'レ', freq: 293.66 },
      { note: 'レ#', freq: 311.13 }, { note: 'ミ', freq: 329.63 }, { note: 'ファ', freq: 349.23 },
      { note: 'ファ#', freq: 369.99 }, { note: 'ソ', freq: 392.00 }, { note: 'ソ#', freq: 415.30 },
      { note: 'ラ', freq: 440.00 }, { note: 'ラ#', freq: 466.16 }, { note: 'シ', freq: 493.88 },
      { note: 'ド（高）', freq: 523.25 }
    ];
    
    let closestNote = noteFrequencies[0];
    let minDiff = Math.abs(frequency - closestNote.freq);
    
    for (const note of noteFrequencies) {
      const diff = Math.abs(frequency - note.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }
    
    return closestNote.note;
  };
  
  // DOM update functions (matching microphone-test exactly)
  const updateVolumeDisplay = useCallback((volume: number) => {
    if (!volumeBarRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(100, volume));
    volumeBarRef.current.style.width = `${clampedVolume}%`;
  }, []);
  
  const updateFrequencyDisplay = useCallback((frequency: number | null) => {
    if (!frequencyDisplayRef.current) return;
    
    if (frequency) {
      frequencyDisplayRef.current.textContent = `${frequency.toFixed(1)} Hz`;
    } else {
      frequencyDisplayRef.current.textContent = '-- Hz';
    }
  }, []);
  
  const updateNoteDisplay = useCallback((frequency: number | null) => {
    if (!noteDisplayRef.current) return;
    
    if (frequency) {
      const noteName = getNoteName(frequency);
      noteDisplayRef.current.textContent = noteName;
    } else {
      noteDisplayRef.current.textContent = '--';
    }
  }, []);
  
  // Initialize microphone (matching microphone-test)
  const initializeMicrophone = async () => {
    try {
      addLog('🎤 マイク初期化開始...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      micStreamRef.current = stream;
      addLog('✅ マイクストリーム取得成功');
      
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // Create source and connect
      const source = audioContext.createMediaStreamSource(stream);
      
      // Platform-specific filter setup (matching microphone-test)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // iOS: Light filter only
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(60, audioContext.currentTime);
        highPassFilter.Q.setValueAtTime(0.5, audioContext.currentTime);
        
        source.connect(highPassFilter);
        highPassFilter.connect(analyser);
        
        addLog('📱 iOS軽量フィルター適用');
      } else {
        // PC: Standard 3-stage filter
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(80, audioContext.currentTime);
        highPassFilter.Q.setValueAtTime(1.0, audioContext.currentTime);
        
        const lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
        lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
        
        const notchFilter = audioContext.createBiquadFilter();
        notchFilter.type = 'notch';
        notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
        notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        
        source.connect(highPassFilter);
        highPassFilter.connect(lowPassFilter);
        lowPassFilter.connect(notchFilter);
        notchFilter.connect(gainNode);
        gainNode.connect(analyser);
        
        addLog('💻 PC標準3段階フィルター適用');
      }
      
      // Initialize buffers
      bufferLengthRef.current = analyser.frequencyBinCount;
      byteDataArrayRef.current = new Uint8Array(bufferLengthRef.current);
      floatDataArrayRef.current = new Float32Array(analyser.fftSize);
      
      // Initialize Pitchy
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      
      addLog('✅ 初期化完了');
      return true;
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
      return false;
    }
  };
  
  // Audio processing loop (matching microphone-test exactly)
  const processAudio = () => {
    if (!analyserRef.current || !byteDataArrayRef.current || 
        !floatDataArrayRef.current || !pitchDetectorRef.current) {
      return;
    }
    
    const bufferLength = bufferLengthRef.current;
    const byteTimeDomainData = byteDataArrayRef.current;
    
    // Get byte time domain data
    analyserRef.current.getByteTimeDomainData(byteTimeDomainData);
    
    // Calculate RMS and max amplitude (matching microphone-test)
    let sum = 0;
    let maxAmplitude = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const sample = (byteTimeDomainData[i] - 128) / 128;  // -1 to 1 normalization
      sum += sample * sample;
      maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
    }
    
    const rms = Math.sqrt(sum / bufferLength);
    
    // Platform-specific parameters (matching microphone-test)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const microphoneSpec = {
      divisor: isIOS ? 4.0 : 6.0,
      gainCompensation: isIOS ? 1.5 : 1.0,
      noiseThreshold: isIOS ? 12 : 15,
      smoothingFactor: 0.2
    };
    
    // Volume calculation (matching microphone-test formula)
    const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
    
    // Platform adaptation
    const rawVolumePercent = Math.min(Math.max(calculatedVolume / microphoneSpec.divisor * 100, 0), 100);
    
    // Gain compensation
    const compensatedVolume = rawVolumePercent * microphoneSpec.gainCompensation;
    
    // Smoothing (matching microphone-test)
    const smoothedVolume = previousVolumeRef.current + 
      microphoneSpec.smoothingFactor * (compensatedVolume - previousVolumeRef.current);
    previousVolumeRef.current = smoothedVolume;
    
    // Get float data for pitch detection
    analyserRef.current.getFloatTimeDomainData(floatDataArrayRef.current);
    
    // Pitch detection
    const [frequency, clarity] = pitchDetectorRef.current.findPitch(
      floatDataArrayRef.current, 
      44100
    );
    
    // Display logic (matching microphone-test specification)
    if (frequency && clarity > 0.6 && frequency >= 80 && frequency <= 2000) {
      // Sound detected: show volume
      const finalVolume = smoothedVolume > microphoneSpec.noiseThreshold ? smoothedVolume : 0;
      
      updateVolumeDisplay(finalVolume);
      updateFrequencyDisplay(frequency);
      updateNoteDisplay(frequency);
      
      // Log high precision detections
      if (clarity > 0.9 && Date.now() % 1000 < 17) {
        addLog(`🎵 検出: ${frequency.toFixed(1)}Hz - ${getNoteName(frequency)} (clarity=${clarity.toFixed(3)})`);
      }
    } else {
      // No sound: force 0%
      updateVolumeDisplay(0);
      updateFrequencyDisplay(null);
      updateNoteDisplay(null);
    }
    
    // Continue loop
    animationFrameRef.current = requestAnimationFrame(processAudio);
  };
  
  // Start listening
  const startListening = async () => {
    if (isListening) return;
    
    const success = await initializeMicrophone();
    if (!success) return;
    
    setIsListening(true);
    addLog('🎤 音声処理開始');
    processAudio();
  };
  
  // Stop listening
  const stopListening = () => {
    if (!isListening) return;
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Reset displays
    updateVolumeDisplay(0);
    updateFrequencyDisplay(null);
    updateNoteDisplay(null);
    
    // Reset refs
    previousVolumeRef.current = 0;
    
    setIsListening(false);
    addLog('⏹️ 音声処理停止');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);
  
  // Initialize DOM styles
  useEffect(() => {
    if (volumeBarRef.current) {
      volumeBarRef.current.style.width = '0%';
      volumeBarRef.current.style.backgroundColor = '#10b981';
      volumeBarRef.current.style.height = '100%';
      volumeBarRef.current.style.borderRadius = '9999px';
      volumeBarRef.current.style.transition = 'width 0.1s ease-out';
    }
  }, []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/test" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#4b5563',
            textDecoration: 'none',
            marginBottom: '16px'
          }}>
            <ArrowLeft size={20} />
            テストページ一覧に戻る
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            統一音響処理テスト
          </h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            マイクテストページの音響処理を完全再現
          </p>
        </div>
        
        {/* Main Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          {/* Control Button */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: isListening ? '#dc2626' : '#2563eb',
                color: 'white'
              }}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              {isListening ? '停止' : 'マイクテスト開始'}
            </button>
          </div>
          
          {/* Audio Display */}
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Volume Display */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                音量レベル
              </h3>
              <div style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e5e7eb',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div ref={volumeBarRef} />
              </div>
            </div>
            
            {/* Frequency and Note Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  検出周波数
                </h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  fontFamily: 'monospace'
                }}>
                  <span ref={frequencyDisplayRef}>-- Hz</span>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  音名
                </h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  <span ref={noteDisplayRef}>--</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Implementation Details */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
            実装詳細（マイクテストページ準拠）
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle size={20} />
              <span>データ取得: getByteTimeDomainData() + 手動正規化</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle size={20} />
              <span>音量計算: Math.max(rms * 200, maxAmplitude * 100)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle size={20} />
              <span>スムージング: 0.2係数の指数移動平均</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle size={20} />
              <span>周波数範囲: 80-2000Hz, clarity &gt; 0.6</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
              <CheckCircle size={20} />
              <span>プラットフォーム対応: iOS/PC別パラメータ</span>
            </div>
          </div>
        </div>
        
        {/* Debug Log */}
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
            デバッグログ
          </h3>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px', 
            color: '#4b5563',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}