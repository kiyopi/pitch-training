<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { PitchDetector } from 'pitchy';
  import VolumeBar from './VolumeBar.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let isActive = false;
  export let className = '';
  export let debugMode = false; // デバッグモード

  // 状態管理（改訂版）
  let componentState = 'uninitialized'; // 'uninitialized' | 'initializing' | 'ready' | 'detecting' | 'error'
  let lastError = null;
  let isInitialized = false;

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
  
  // 倍音補正用
  let previousFrequency = 0;
  let harmonicHistory = [];
  
  // デバッグ用
  let debugInterval = null;
  
  // マイク状態チェック関数（デバッグ用）
  function checkMicrophoneStatus() {
    if (!debugMode) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const status = {
      timestamp,
      componentState,
      isActive,
      isDetecting,
      isInitialized,
      mediaStreamActive: mediaStream ? mediaStream.active : null,
      mediaStreamTracks: mediaStream ? mediaStream.getTracks().length : 0,
      trackStates: mediaStream ? mediaStream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted
      })) : [],
      audioContextState: audioContext ? audioContext.state : null,
      hasAnalyser: !!analyser,
      currentVolume,
      currentFrequency
    };
    
    console.log(`🎤 [PitchDetector] ${timestamp}:`, status);
    
    // MediaStreamの状態が異常な場合は警告
    if (mediaStream && !mediaStream.active) {
      console.warn(`⚠️ [PitchDetector] MediaStream is inactive!`, mediaStream);
    }
    
    // AudioContextの状態が異常な場合は警告
    if (audioContext && audioContext.state === 'suspended') {
      console.warn(`⚠️ [PitchDetector] AudioContext is suspended!`, audioContext);
    }
    
    // トラックの状態をチェック
    if (mediaStream) {
      mediaStream.getTracks().forEach((track, index) => {
        if (track.readyState === 'ended') {
          console.error(`❌ [PitchDetector] Track ${index} has ended!`, track);
        }
      });
    }
  }
  
  // デバッグモードの監視
  $: if (debugMode && !debugInterval) {
    console.log('🔍 [PitchDetector] Debug mode enabled - starting status monitoring');
    debugInterval = setInterval(checkMicrophoneStatus, 3000); // 3秒間隔
    checkMicrophoneStatus(); // 即座に1回実行
  } else if (!debugMode && debugInterval) {
    console.log('🔍 [PitchDetector] Debug mode disabled - stopping status monitoring');
    clearInterval(debugInterval);
    debugInterval = null;
  }

  // 初期化（改訂版）
  export async function initialize(stream) {
    try {
      componentState = 'initializing';
      lastError = null;
      
      if (!stream) {
        throw new Error('MediaStream is required');
      }
      
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
      
      // 初期化完了
      componentState = 'ready';
      isInitialized = true;
      
      // 状態変更を通知
      dispatch('stateChange', { state: componentState });
      
      
    } catch (error) {
      componentState = 'error';
      lastError = error;
      isInitialized = false;
      
      // エラーを通知
      dispatch('error', { error, context: 'initialization' });
      
      throw error;
    }
  }

  // 検出開始（改訂版）
  export function startDetection() {
    if (componentState !== 'ready') {
      const error = new Error(`Cannot start detection: component state is ${componentState}`);
      dispatch('error', { error, context: 'start-detection' });
      return false;
    }
    
    if (!analyser || !pitchDetector || !audioContext) {
      const error = new Error('Required components not available');
      componentState = 'error';
      dispatch('error', { error, context: 'start-detection' });
      return false;
    }
    
    componentState = 'detecting';
    isDetecting = true;
    dispatch('stateChange', { state: componentState });
    detectPitch();
    return true;
  }

  // 検出停止（改訂版）
  export function stopDetection() {
    isDetecting = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    // 状態を ready に戻す（初期化済みの場合）
    if (componentState === 'detecting' && isInitialized) {
      componentState = 'ready';
      dispatch('stateChange', { state: componentState });
    }
    
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
    
    // 人間音域フィルタリング（実用調整）
    // 実際の人間の声域に最適化:
    // - 低域: 65Hz以上（C2以上、男性最低音域考慮）  
    // - 高域: 1200Hz以下（実用的な歌唱範囲）
    // - 極低音域ノイズ（G-1等）は確実に除外
    const isValidVocalRange = pitch >= 65 && pitch <= 1200;
    
    if (pitch && clarity > 0.6 && currentVolume > 10 && isValidVocalRange) {
      // 倍音補正システム適用
      const correctedFreq = correctHarmonicFrequency(pitch, previousFrequency);
      
      // 基音安定化システム適用
      const stabilizedFreq = stabilizeFrequency(correctedFreq);
      
      // 周波数表示を更新
      currentFrequency = Math.round(stabilizedFreq);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
      
      // 次回比較用に保存
      previousFrequency = currentFrequency;
      
    } else {
      // 信号が弱い場合は倍音履歴をクリア
      if (harmonicHistory.length > 0) {
        harmonicHistory = [];
      }
      
      // 音程がない場合は前回周波数をリセット
      if (currentFrequency === 0) {
        previousFrequency = 0;
      }
      
      // 周波数表示をクリア
      currentFrequency = 0;
      detectedNote = 'ーー';
      pitchClarity = 0;
    }
    
    // 音程が検出されない場合はVolumeBarも0に（極低音域ノイズ対策）
    const displayVolume = currentFrequency > 0 ? rawVolume : 0;
    
    
    // 親コンポーネントにデータを送信
    
    dispatch('pitchUpdate', {
      frequency: currentFrequency,
      note: detectedNote,
      volume: currentVolume,
      rawVolume: displayVolume,
      clarity: pitchClarity
    });
    
    animationFrame = requestAnimationFrame(detectPitch);
  }

  // 音楽的妥当性評価
  function calculateMusicalScore(frequency) {
    const C4 = 261.63; // Middle C
    
    // 最も近い半音階音名への距離を計算
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
    
    // 半音階に近いほど高スコア（±50セント以内で最高点）
    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
  }

  // 倍音補正システム
  function correctHarmonicFrequency(detectedFreq, previousFreq) {
    // 基音候補生成（オクターブ違いを考慮）
    const fundamentalCandidates = [
      detectedFreq,          // そのまま（基音の可能性）
      detectedFreq / 2.0,    // 1オクターブ下（2倍音 → 基音）
      detectedFreq / 3.0,    // 3倍音 → 基音
      detectedFreq / 4.0,    // 4倍音 → 基音
      detectedFreq * 2.0,    // 1オクターブ上（低く歌った場合）
    ];
    
    // 人間音域範囲（C3-C6）
    const vocalRangeMin = 130.81;
    const vocalRangeMax = 1046.50;
    
    // 各候補の妥当性評価
    const evaluateFundamental = (freq) => {
      // 人間音域範囲内チェック（40%重み）
      const inVocalRange = freq >= vocalRangeMin && freq <= vocalRangeMax;
      const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
      
      // 前回検出との連続性評価（40%重み）
      const continuityScore = previousFreq > 0
        ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
        : 0.5;
      
      // 音楽的妥当性評価（20%重み）
      const musicalScore = calculateMusicalScore(freq);
      
      const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
      return { freq, score: totalScore };
    };
    
    // 最高スコア候補を基音として採用
    const evaluatedCandidates = fundamentalCandidates.map(evaluateFundamental);
    const bestCandidate = evaluatedCandidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestCandidate.freq;
  }

  // 基音安定化システム
  function stabilizeFrequency(currentFreq, stabilityThreshold = 0.1) {
    // 履歴バッファに追加（最大5フレーム保持）
    harmonicHistory.push(currentFreq);
    if (harmonicHistory.length > 5) harmonicHistory.shift();
    
    // 中央値ベースの安定化（外れ値除去）
    const sorted = [...harmonicHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // 急激な変化を抑制（段階的変化）
    const maxChange = median * stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange 
      ? median + Math.sign(currentFreq - median) * maxChange
      : currentFreq;
      
    return stabilized;
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

  // 状態確認API（新規追加）
  export function getIsInitialized() {
    return isInitialized && componentState === 'ready';
  }
  
  export function getState() {
    return {
      componentState,
      isInitialized,
      isDetecting,
      lastError,
      hasRequiredComponents: !!(analyser && pitchDetector && audioContext && mediaStream)
    };
  }
  
  // 再初期化API（新規追加）
  export async function reinitialize(stream) {
    
    // 現在の状態をクリーンアップ
    cleanup();
    
    // 短い待機でリソース解放を確実に
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 再初期化実行
    await initialize(stream);
    
  }

  // クリーンアップ（改訂版）
  export function cleanup() {
    stopDetection();
    
    // 状態をリセット
    componentState = 'uninitialized';
    isInitialized = false;
    lastError = null;
    
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
    
    // 履歴クリア
    frequencyHistory = [];
    volumeHistory = [];
    harmonicHistory = [];
    
  }

  // isActiveの変更を監視（改善版）
  $: if (isActive && componentState === 'ready' && analyser && !isDetecting) {
    startDetection();
  } else if (!isActive && isDetecting) {
    stopDetection();
  }

  onDestroy(() => {
    // デバッグインターバルのクリア
    if (debugInterval) {
      clearInterval(debugInterval);
      debugInterval = null;
    }
    // 使い回し設計のためcleanupしない
    // MediaStreamとAudioContextをセッション間で保持
  });
</script>

<div class="pitch-detector {className}">
  <div class="detection-display">
    <div class="detection-card">
      <span class="detected-frequency">{currentFrequency > 0 ? Math.round(currentFrequency) : '---'}</span>
      <span class="hz-suffix">Hz</span>
      <span class="divider">|</span>
      <span class="detected-note">{detectedNote}</span>
    </div>
    
    <VolumeBar volume={currentFrequency > 0 ? rawVolume : 0} className="volume-bar" />
  </div>
</div>

<style>
  .pitch-detector {
    padding: 1rem;
  }

  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .detection-card {
    display: inline-flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: hsl(0 0% 100%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    width: fit-content;
  }

  .detected-frequency {
    font-weight: 600;
    font-size: 2rem;
    color: hsl(222.2 84% 4.9%);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', 
                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    min-width: 4ch;
    text-align: right;
    display: inline-block;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .hz-suffix {
    font-weight: 600;
    font-size: 2rem;
    color: hsl(222.2 84% 4.9%);
  }

  .divider {
    color: hsl(214.3 31.8% 70%);
    font-size: 1.5rem;
    margin: 0 0.25rem;
    font-weight: 300;
  }
  
  .detected-note {
    font-weight: 600;
    font-size: 2rem;
    color: hsl(215.4 16.3% 46.9%);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', 
                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    min-width: 3ch;
    display: inline-block;
    text-align: center;
  }

  :global(.volume-bar) {
    border-radius: 4px !important;
  }
</style>