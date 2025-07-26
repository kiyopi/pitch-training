<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { PitchDetector } from 'pitchy';
  import VolumeBar from './VolumeBar.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let isActive = false;
  export let className = '';

  // 音程検出状態
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let rawAnalyser = null;
  let pitchDetector = null;
  let animationFrame = null;
  let isDetecting = false;

  // フィルター
  let highpassFilter = null;
  let lowpassFilter = null;
  let notchFilter = null;

  // 検出データ
  let currentVolume = 0;
  let rawVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchClarity = 0;
  
  // 安定化用バッファ
  let frequencyHistory = [];
  let volumeHistory = [];
  let stableFrequency = 0;
  let stableVolume = 0;

  // 初期化
  export async function initialize(stream) {
    try {
      mediaStream = stream;
      
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // 3段階ノイズリダクション実装
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      // フィルター前の信号解析用（比較用）
      rawAnalyser = audioContext.createAnalyser();
      rawAnalyser.fftSize = 2048;
      rawAnalyser.smoothingTimeConstant = 0.8;
      rawAnalyser.minDecibels = -90;
      rawAnalyser.maxDecibels = -10;
      source.connect(rawAnalyser);
      
      // 1. ハイパスフィルター（低周波ノイズ除去: 80Hz以下カット）
      highpassFilter = audioContext.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(80, audioContext.currentTime);
      highpassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // 2. ローパスフィルター（高周波ノイズ除去: 800Hz以上カット）
      lowpassFilter = audioContext.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(800, audioContext.currentTime);
      lowpassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // 3. ノッチフィルター（電源ノイズ除去: 50Hz/60Hz）
      notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(10, audioContext.currentTime);
      
      // フィルター後の信号解析用（メイン）
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // フィルターチェーン接続: source → highpass → lowpass → notch → analyser
      source.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(notchFilter);
      notchFilter.connect(analyser);
      
      // PitchDetector初期化
      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
      
      console.log('PitchDetectorコンポーネント初期化完了 - 3段階ノイズリダクション有効');
      
    } catch (error) {
      console.error('PitchDetector初期化エラー:', error);
      throw error;
    }
  }

  // 検出開始
  export function startDetection() {
    if (!analyser || !pitchDetector || !audioContext) {
      console.error('PitchDetector未初期化 - 必要なコンポーネント:', {
        analyser: !!analyser,
        pitchDetector: !!pitchDetector,
        audioContext: !!audioContext,
        mediaStream: !!mediaStream
      });
      return;
    }
    
    isDetecting = true;
    detectPitch();
    console.log('音程検出開始');
  }

  // 検出停止
  export function stopDetection() {
    isDetecting = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    console.log('音程検出停止');
  }

  // リアルタイム音程検出
  function detectPitch() {
    if (!isDetecting || !analyser || !rawAnalyser || !pitchDetector) return;
    
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    const rawBuffer = new Float32Array(rawAnalyser.fftSize);
    
    analyser.getFloatTimeDomainData(buffer);
    rawAnalyser.getFloatTimeDomainData(rawBuffer);
    
    // 音量計算（フィルター後）
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += Math.abs(buffer[i]);
    }
    const rms = Math.sqrt(sum / bufferLength);
    const logVolume = Math.log10(rms + 0.001) * 50 + 100;
    const rawCurrentVolume = Math.max(0, Math.min(100, logVolume));
    
    // 生音量計算（フィルター前）
    let rawSum = 0;
    for (let i = 0; i < rawBuffer.length; i++) {
      rawSum += Math.abs(rawBuffer[i]);
    }
    const rawRms = Math.sqrt(rawSum / rawBuffer.length);
    const rawLogVolume = Math.log10(rawRms + 0.001) * 50 + 100;
    rawVolume = Math.max(0, Math.min(100, rawLogVolume));
    
    // 音量の安定化（5フレーム移動平均）
    volumeHistory.push(rawCurrentVolume);
    if (volumeHistory.length > 5) {
      volumeHistory.shift();
    }
    stableVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;
    currentVolume = stableVolume;
    
    // 音程検出（PitchDetector使用）
    const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContext.sampleRate);
    
    // より厳しい閾値でノイズを除去
    if (pitch && clarity > 0.8 && currentVolume > 10) {
      // 周波数の安定化（3フレーム移動平均）
      frequencyHistory.push(pitch);
      if (frequencyHistory.length > 3) {
        frequencyHistory.shift();
      }
      
      // 平均周波数計算
      const avgFreq = frequencyHistory.reduce((sum, f) => sum + f, 0) / frequencyHistory.length;
      
      // 急激な変化を抑制（±15%以内の変化に制限）
      if (stableFrequency > 0) {
        const changeRatio = Math.abs(avgFreq - stableFrequency) / stableFrequency;
        if (changeRatio > 0.15) {
          // 段階的に近づける（20%ずつ）
          stableFrequency = stableFrequency + (avgFreq - stableFrequency) * 0.2;
        } else {
          stableFrequency = avgFreq;
        }
      } else {
        stableFrequency = avgFreq;
      }
      
      currentFrequency = Math.round(stableFrequency);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
    } else {
      // 信号が弱い場合は徐々にフェードアウト
      if (stableFrequency > 0) {
        stableFrequency *= 0.95; // 5%ずつ減衰
        if (stableFrequency < 10) {
          stableFrequency = 0;
          currentFrequency = 0;
          detectedNote = 'ーー';
          pitchClarity = 0;
        } else {
          currentFrequency = Math.round(stableFrequency);
          detectedNote = frequencyToNote(currentFrequency);
        }
      }
    }
    
    // 親コンポーネントにデータを送信
    dispatch('pitchUpdate', {
      frequency: currentFrequency,
      note: detectedNote,
      volume: currentVolume,
      rawVolume: rawVolume,
      clarity: pitchClarity
    });
    
    animationFrame = requestAnimationFrame(detectPitch);
  }

  // 周波数から音程名に変換
  function frequencyToNote(frequency) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    
    if (frequency <= 0) return 'ーー';
    
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    return noteNames[noteIndex] + octave;
  }

  // クリーンアップ
  export function cleanup() {
    stopDetection();
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    analyser = null;
    rawAnalyser = null;
    pitchDetector = null;
    highpassFilter = null;
    lowpassFilter = null;
    notchFilter = null;
  }

  // isActiveの変更を監視
  $: if (isActive && analyser) {
    startDetection();
  } else if (!isActive) {
    stopDetection();
  }

  onDestroy(() => {
    cleanup();
  });
</script>

<div class="pitch-detector {className}">
  <div class="detection-display">
    <div class="detected-info">
      <span class="detected-label">検出中:</span>
      <span class="detected-frequency">{currentFrequency > 0 ? Math.round(currentFrequency) + 'Hz' : '---Hz'}</span>
      <span class="detected-note">({detectedNote})</span>
      <span class="clarity">品質: {Math.round(pitchClarity * 100)}%</span>
    </div>
    
    <div class="volume-section">
      <div class="volume-label">音量レベル: {Math.round(currentVolume)}%</div>
      <VolumeBar volume={currentVolume} className="volume-bar" />
      
      {#if rawVolume > 0}
        <div class="noise-reduction-info">
          <span class="noise-label">ノイズ除去効果: {Math.round(rawVolume - currentVolume)}%削減</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pitch-detector {
    padding: 1rem;
  }

  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .detected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .detected-label {
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .detected-frequency {
    font-weight: 700;
    font-size: 1.25rem;
    color: hsl(222.2 84% 4.9%);
    margin-right: 0.5rem;
  }
  
  .detected-note {
    font-weight: 500;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin-right: 0.25rem;
  }

  .clarity {
    color: hsl(142.1 76.2% 36.3%);
    font-weight: 500;
    font-size: 0.75rem;
  }
  
  .volume-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .volume-label {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  .noise-reduction-info {
    font-size: 0.75rem;
    color: hsl(142.1 76.2% 36.3%);
  }

  :global(.volume-bar) {
    border-radius: 4px !important;
  }
</style>