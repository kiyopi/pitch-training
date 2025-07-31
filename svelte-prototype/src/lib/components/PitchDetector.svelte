<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { PitchDetector } from 'pitchy';
  import VolumeBar from './VolumeBar.svelte';
  import { audioManager } from '$lib/audio/AudioManager.js';
  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';
  import { logger } from '$lib/utils/debugUtils.js';

  const dispatch = createEventDispatcher();

  // Props
  export let isActive = false;
  export let className = '';
  export let debugMode = false; // デバッグモード
  export let trainingPhase = ''; // トレーニングフェーズ（ログ制御用、削除済み）

  // 状態管理（改訂版）
  let componentState = 'uninitialized'; // 'uninitialized' | 'initializing' | 'ready' | 'detecting' | 'error'
  let lastError = null;
  let isInitialized = false;

  // 音程検出状態（外部AudioContext対応）
  let audioContext = null;        // AudioManagerから取得
  let mediaStream = null;         // AudioManagerから取得
  let sourceNode = null;          // AudioManagerから取得
  let analyser = null;            // AudioManagerから取得
  let rawAnalyser = null;         // AudioManagerから取得
  let pitchDetector = null;
  let animationFrame = null;
  let isDetecting = false;

  // AudioManager関連
  let analyserIds = [];           // 作成したAnalyserのID管理
  let mediaStreamListeners = new Map(); // MediaStreamイベントリスナー管理

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
  
  // 倍音補正用（統一モジュール使用）
  // previousFrequency, harmonicHistory は HarmonicCorrection.js で管理
  
  // デバッグ用
  let debugInterval = null;
  
  // 倍音補正ログ制御用変数は削除済み
  
  // 表示状態リセット関数（外部から呼び出し可能）
  export function resetDisplayState() {
    currentVolume = 0;
    rawVolume = 0;
    currentFrequency = 0;
    detectedNote = 'ーー';
    pitchClarity = 0;
    stableFrequency = 0;
    stableVolume = 0;
    
    // バッファクリア
    frequencyHistory = [];
    volumeHistory = [];
    
    // 統一倍音補正モジュールのリセット
    harmonicCorrection.resetHistory();
    
    if (debugMode) {
      console.log('🔄 [PitchDetector] Display state reset');
    }
  }
  
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
    
    logger.realtime(`[PitchDetector] ${timestamp}:`, status);
    
    // マイク状態の異常を検知して親に通知
    let microphoneHealthy = true;
    let errorDetails = [];
    
    // MediaStreamの状態が異常な場合は警告
    if (mediaStream && !mediaStream.active) {
      console.warn(`⚠️ [PitchDetector] MediaStream is inactive!`, mediaStream);
      microphoneHealthy = false;
      errorDetails.push('MediaStream inactive');
    }
    
    // AudioContextの状態が異常な場合は警告
    if (audioContext && audioContext.state === 'suspended') {
      console.warn(`⚠️ [PitchDetector] AudioContext is suspended!`, audioContext);
      microphoneHealthy = false;
      errorDetails.push('AudioContext suspended');
    }
    
    // トラックの状態をチェック
    if (mediaStream) {
      mediaStream.getTracks().forEach((track, index) => {
        if (track.readyState === 'ended') {
          console.error(`❌ [PitchDetector] Track ${index} has ended!`, track);
          microphoneHealthy = false;
          errorDetails.push(`Track ${index} ended`);
        }
      });
    }
    
    // マイク状態変化を親に通知
    dispatch('microphoneHealthChange', {
      healthy: microphoneHealthy,
      errors: errorDetails,
      details: status
    });
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

  // 初期化（AudioManager対応版）
  export async function initialize() {
    try {
      componentState = 'initializing';
      lastError = null;
      
      console.log('🎙️ [PitchDetector] AudioManager経由で初期化開始');
      
      // AudioManagerから共有リソースを取得
      const resources = await audioManager.initialize();
      audioContext = resources.audioContext;
      mediaStream = resources.mediaStream;
      sourceNode = resources.sourceNode;
      
      console.log('✅ [PitchDetector] AudioManager リソース取得完了');
      
      // 専用のAnalyserを作成（フィルター付き）
      const filteredAnalyserId = `pitch-detector-filtered-${Date.now()}`;
      analyser = audioManager.createAnalyser(filteredAnalyserId, {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
        useFilters: true
      });
      analyserIds.push(filteredAnalyserId);
      
      // 生信号用Analyser（比較用）
      const rawAnalyserId = `pitch-detector-raw-${Date.now()}`;
      rawAnalyser = audioManager.createAnalyser(rawAnalyserId, {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
        useFilters: false
      });
      analyserIds.push(rawAnalyserId);
      
      console.log('✅ [PitchDetector] Analyser作成完了:', analyserIds);
      
      // PitchDetector初期化
      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
      
      // 初期化完了
      componentState = 'ready';
      isInitialized = true;
      
      // 状態変更を通知
      dispatch('stateChange', { state: componentState });
      
      // MediaStreamの健康状態監視を開始
      setupMediaStreamMonitoring();
      
      console.log('✅ [PitchDetector] 初期化完了');
      
    } catch (error) {
      console.error('❌ [PitchDetector] 初期化エラー:', error);
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
      // 統一倍音補正システム適用
      const correctedFreq = harmonicCorrection.correctHarmonic(pitch);
      
      // 補正ログは削除 - ユーザーには補正済み結果のみ表示
      
      // 周波数表示を更新
      currentFrequency = Math.round(correctedFreq);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
      
    } else {
      // 信号が弱い場合は統一倍音補正モジュールの履歴をクリア
      if (currentFrequency === 0) {
        harmonicCorrection.resetHistory();
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

  // 旧倍音補正関数は削除済み - HarmonicCorrection.js モジュールを使用

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
  
  // 再初期化API（AudioManager対応版）
  export async function reinitialize() {
    console.log('🔄 [PitchDetector] 再初期化開始');
    
    // 現在の状態をクリーンアップ
    cleanup();
    
    // 短い待機でリソース解放を確実に
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 再初期化実行
    await initialize();
    
    console.log('✅ [PitchDetector] 再初期化完了');
  }

  // クリーンアップ（AudioManager対応版）
  export function cleanup() {
    console.log('🧹 [PitchDetector] クリーンアップ開始');
    
    stopDetection();
    
    // MediaStreamイベントリスナーをクリーンアップ
    if (mediaStreamListeners.size > 0) {
      mediaStreamListeners.forEach((handlers, track) => {
        track.removeEventListener('ended', handlers.endedHandler);
        track.removeEventListener('mute', handlers.muteHandler);
        track.removeEventListener('unmute', handlers.unmuteHandler);
      });
      mediaStreamListeners.clear();
      console.log('🔄 [PitchDetector] MediaStreamイベントリスナー削除');
    }
    
    // AudioManagerに作成したAnalyserを解放通知
    if (analyserIds.length > 0) {
      audioManager.release(analyserIds);
      console.log('📤 [PitchDetector] AudioManagerにAnalyser解放通知:', analyserIds);
      analyserIds = [];
    }
    
    // 状態をリセット
    componentState = 'uninitialized';
    isInitialized = false;
    lastError = null;
    
    // 参照をクリア（実際のリソースはAudioManagerが管理）
    audioContext = null;
    mediaStream = null;
    sourceNode = null;
    analyser = null;
    rawAnalyser = null;
    pitchDetector = null;
    
    // 履歴クリア
    frequencyHistory = [];
    volumeHistory = [];
    
    // 統一倍音補正モジュールのリセット
    harmonicCorrection.resetHistory();
    
    console.log('✅ [PitchDetector] クリーンアップ完了');
  }

  /**
   * MediaStreamの健康状態監視セットアップ
   * Safari環境でのMediaStreamTrack終了検出
   */
  function setupMediaStreamMonitoring() {
    if (!mediaStream) return;
    
    const tracks = mediaStream.getTracks();
    tracks.forEach(track => {
      // トラック終了イベントの監視
      const endedHandler = () => {
        console.error('🚨 [PitchDetector] MediaStreamTrack終了検出:', track.kind);
        componentState = 'error';
        lastError = new Error(`MediaStreamTrack (${track.kind}) ended`);
        
        // エラー状態を通知
        dispatch('error', { 
          error: lastError, 
          reason: 'mediastream_ended',
          recovery: 'restart_required'
        });
        
        // 検出停止
        if (isDetecting) {
          stopDetection();
        }
      };
      
      // トラックの無効化検出
      const muteHandler = () => {
        console.warn('⚠️ [PitchDetector] MediaStreamTrack muted:', track.kind);
        dispatch('warning', { 
          reason: 'track_muted', 
          track: track.kind 
        });
      };
      
      const unmuteHandler = () => {
        console.log('✅ [PitchDetector] MediaStreamTrack unmuted:', track.kind);
        dispatch('info', { 
          reason: 'track_unmuted', 
          track: track.kind 
        });
      };
      
      // イベントリスナーを追加
      track.addEventListener('ended', endedHandler);
      track.addEventListener('mute', muteHandler);
      track.addEventListener('unmute', unmuteHandler);
      
      // リスナー参照を保存（後で削除するため）
      mediaStreamListeners.set(track, { endedHandler, muteHandler, unmuteHandler });
    });
    
    console.log('🔍 [PitchDetector] MediaStream監視開始:', tracks.length + ' tracks');
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
    
    // AudioManager使用時は自動クリーンアップしない
    // （他のコンポーネントが使用中の可能性があるため）
    // 明示的なcleanup()呼び出しが必要
    console.log('🔄 [PitchDetector] onDestroy - AudioManagerリソースは保持');
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