import { c as create_ssr_component, b as add_attribute, e as escape, d as createEventDispatcher, o as onDestroy, v as validate_component, a as subscribe } from "../../../chunks/ssr.js";
import { p as page } from "../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/state.svelte.js";
import { C as Card } from "../../../chunks/Card.js";
import { P as PageLayout } from "../../../chunks/PageLayout.js";
import { PitchDetector } from "pitchy";
import { h as harmonicCorrection, l as logger, a as audioManager } from "../../../chunks/PitchDetectionDisplay.svelte_svelte_type_style_lang.js";
const css$3 = {
  code: ".volume-bar-container.svelte-13z7ppf{position:relative;width:100%}.threshold-indicator.svelte-13z7ppf{opacity:0.6;pointer-events:none}",
  map: `{"version":3,"file":"VolumeBar.svelte","sources":["VolumeBar.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  \\n  export let volume = 0; // 0-100の音量値\\n  export let threshold = 30; // しきい値\\n  export let height = '12px';\\n  export let className = '';\\n  \\n  let barElement;\\n  \\n  // 音量レベルに応じた色の計算（青透過グラデーション）\\n  function getVolumeColor(volume) {\\n    if (volume < threshold) {\\n      // 低音量時: 透過率高い青\\n      const alpha = Math.max(0.2, volume / threshold * 0.8);\\n      return \`rgba(37, 99, 235, \${alpha})\`;\\n    }\\n    // 高音量時: 透過率0（完全な青）\\n    return '#2563eb';\\n  }\\n  \\n  // 音量バーの更新（DOM直接操作）\\n  function updateVolumeBar(newVolume) {\\n    if (barElement) {\\n      const clampedVolume = Math.max(0, Math.min(100, newVolume));\\n      const color = getVolumeColor(clampedVolume);\\n      \\n      // ログ削除\\n      \\n      barElement.style.width = \`\${clampedVolume}%\`;\\n      barElement.style.backgroundColor = color;\\n    }\\n  }\\n  \\n  // volumeプロパティの変更を監視\\n  $: updateVolumeBar(volume);\\n  \\n  onMount(() => {\\n    // 初期スタイル設定（iPhone WebKit対応）\\n    if (barElement) {\\n      barElement.style.width = '0%';\\n      barElement.style.backgroundColor = '#2563eb';\\n      barElement.style.height = height;\\n      barElement.style.borderRadius = '9999px';\\n      barElement.style.transition = 'width 0.2s ease-out, background-color 0.2s ease-out'; // より滑らかなトランジション\\n    }\\n  });\\n<\/script>\\n\\n<div class=\\"volume-bar-container {className}\\">\\n  <div class=\\"volume-bar-bg\\" style=\\"height: {height}; border-radius: 9999px; background-color: #e2e8f0; position: relative; overflow: hidden;\\">\\n    <div \\n      bind:this={barElement}\\n      class=\\"volume-bar-fill\\"\\n      style=\\"position: absolute; top: 0; left: 0; height: 100%;\\"\\n    ></div>\\n  </div>\\n  \\n  <!-- しきい値インジケーター -->\\n  <div \\n    class=\\"threshold-indicator\\" \\n    style=\\"position: absolute; top: 0; left: {threshold}%; width: 2px; height: {height}; background-color: #64748b; border-radius: 1px;\\"\\n  ></div>\\n</div>\\n\\n<style>\\n  .volume-bar-container {\\n    position: relative;\\n    width: 100%;\\n  }\\n  \\n  .threshold-indicator {\\n    opacity: 0.6;\\n    pointer-events: none;\\n  }\\n</style>"],"names":[],"mappings":"AAkEE,oCAAsB,CACpB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IACT,CAEA,mCAAqB,CACnB,OAAO,CAAE,GAAG,CACZ,cAAc,CAAE,IAClB"}`
};
const VolumeBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { volume = 0 } = $$props;
  let { threshold = 30 } = $$props;
  let { height = "12px" } = $$props;
  let { className = "" } = $$props;
  let barElement;
  if ($$props.volume === void 0 && $$bindings.volume && volume !== void 0) $$bindings.volume(volume);
  if ($$props.threshold === void 0 && $$bindings.threshold && threshold !== void 0) $$bindings.threshold(threshold);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$3);
  return `<div class="${"volume-bar-container " + escape(className, true) + " svelte-13z7ppf"}"><div class="volume-bar-bg" style="${"height: " + escape(height, true) + "; border-radius: 9999px; background-color: #e2e8f0; position: relative; overflow: hidden;"}"><div class="volume-bar-fill" style="position: absolute; top: 0; left: 0; height: 100%;"${add_attribute("this", barElement, 0)}></div></div>  <div class="threshold-indicator svelte-13z7ppf" style="${"position: absolute; top: 0; left: " + escape(threshold, true) + "%; width: 2px; height: " + escape(height, true) + "; background-color: #64748b; border-radius: 1px;"}"></div> </div>`;
});
const css$2 = {
  code: ".pitch-detector.svelte-vc1bho{padding:1rem}.detection-display.svelte-vc1bho{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-vc1bho{display:inline-flex;align-items:baseline;gap:0.5rem;padding:1rem 1.5rem;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;width:fit-content}.detected-frequency.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(222.2 84% 4.9%);font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;min-width:4ch;text-align:right;display:inline-block;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.hz-suffix.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(222.2 84% 4.9%)}.divider.svelte-vc1bho{color:hsl(214.3 31.8% 70%);font-size:1.5rem;margin:0 0.25rem;font-weight:300}.detected-note.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(215.4 16.3% 46.9%);font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;min-width:3ch;display:inline-block;text-align:center}.volume-bar{border-radius:4px !important}",
  map: `{"version":3,"file":"PitchDetector.svelte","sources":["PitchDetector.svelte"],"sourcesContent":["<script>\\n  import { onMount, onDestroy, createEventDispatcher } from 'svelte';\\n  import { PitchDetector } from 'pitchy';\\n  import VolumeBar from './VolumeBar.svelte';\\n  import { audioManager } from '$lib/audio/AudioManager.js';\\n  import { harmonicCorrection } from '$lib/audio/HarmonicCorrection.js';\\n  import { logger } from '$lib/utils/debugUtils.js';\\n\\n  const dispatch = createEventDispatcher();\\n\\n  // Props\\n  export let isActive = false;\\n  export let className = '';\\n  export let debugMode = false; // デバッグモード\\n  export const trainingPhase = ''; // トレーニングフェーズ（ログ制御用、削除済み）\\n  export let disableHarmonicCorrection = false; // ハーモニック補正無効化フラグ（230Hz固着問題対策）\\n\\n  // 状態管理（改訂版）\\n  let componentState = 'uninitialized'; // 'uninitialized' | 'initializing' | 'ready' | 'detecting' | 'error'\\n  let lastError = null;\\n  let isInitialized = false;\\n\\n  // 音程検出状態（外部AudioContext対応）\\n  let audioContext = null;        // AudioManagerから取得\\n  let mediaStream = null;         // AudioManagerから取得\\n  let sourceNode = null;          // AudioManagerから取得\\n  let analyser = null;            // AudioManagerから取得\\n  let rawAnalyser = null;         // AudioManagerから取得\\n  let pitchDetector = null;\\n  let animationFrame = null;\\n  let isDetecting = false;\\n\\n  // AudioManager関連\\n  let analyserIds = [];           // 作成したAnalyserのID管理\\n  let mediaStreamListeners = new Map(); // MediaStreamイベントリスナー管理\\n\\n  // 検出データ\\n  let currentVolume = 0;\\n  let rawVolume = 0;\\n  let currentFrequency = 0;\\n  let detectedNote = 'ーー';\\n  let pitchClarity = 0;\\n  \\n  // 安定化用バッファ\\n  let frequencyHistory = [];\\n  let volumeHistory = [];\\n  let stableFrequency = 0;\\n  let stableVolume = 0;\\n  \\n  // 倍音補正用（統一モジュール使用）\\n  // previousFrequency, harmonicHistory は HarmonicCorrection.js で管理\\n  \\n  // デバッグ用\\n  let debugInterval = null;\\n  \\n  // 倍音補正ログ制御用変数は削除済み\\n  \\n  // 表示状態リセット関数（外部から呼び出し可能）\\n  export function resetDisplayState() {\\n    currentVolume = 0;\\n    rawVolume = 0;\\n    currentFrequency = 0;\\n    detectedNote = 'ーー';\\n    pitchClarity = 0;\\n    stableFrequency = 0;\\n    stableVolume = 0;\\n    \\n    // バッファクリア\\n    frequencyHistory = [];\\n    volumeHistory = [];\\n    \\n    // 統一倍音補正モジュールのリセット\\n    harmonicCorrection.resetHistory();\\n    \\n    if (debugMode) {\\n      console.log('🔄 [PitchDetector] Display state reset');\\n    }\\n  }\\n  \\n  // マイク状態チェック関数（デバッグ用）\\n  function checkMicrophoneStatus() {\\n    if (!debugMode) return;\\n    \\n    const timestamp = new Date().toLocaleTimeString();\\n    const status = {\\n      timestamp,\\n      componentState,\\n      isActive,\\n      isDetecting,\\n      isInitialized,\\n      mediaStreamActive: mediaStream ? mediaStream.active : null,\\n      mediaStreamTracks: mediaStream ? mediaStream.getTracks().length : 0,\\n      trackStates: mediaStream ? mediaStream.getTracks().map(track => ({\\n        kind: track.kind,\\n        enabled: track.enabled,\\n        readyState: track.readyState,\\n        muted: track.muted\\n      })) : [],\\n      audioContextState: audioContext ? audioContext.state : null,\\n      hasAnalyser: !!analyser,\\n      currentVolume,\\n      currentFrequency\\n    };\\n    \\n    logger.realtime(\`[PitchDetector] \${timestamp}:\`, status);\\n    \\n    // マイク状態の異常を検知して親に通知\\n    let microphoneHealthy = true;\\n    let errorDetails = [];\\n    \\n    // MediaStreamの状態が異常な場合は警告\\n    if (mediaStream && !mediaStream.active) {\\n      console.warn(\`⚠️ [PitchDetector] MediaStream is inactive!\`, mediaStream);\\n      microphoneHealthy = false;\\n      errorDetails.push('MediaStream inactive');\\n    }\\n    \\n    // AudioContextの状態が異常な場合は警告\\n    if (audioContext && audioContext.state === 'suspended') {\\n      console.warn(\`⚠️ [PitchDetector] AudioContext is suspended!\`, audioContext);\\n      microphoneHealthy = false;\\n      errorDetails.push('AudioContext suspended');\\n    }\\n    \\n    // トラックの状態をチェック\\n    if (mediaStream) {\\n      mediaStream.getTracks().forEach((track, index) => {\\n        if (track.readyState === 'ended') {\\n          console.error(\`❌ [PitchDetector] Track \${index} has ended!\`, track);\\n          microphoneHealthy = false;\\n          errorDetails.push(\`Track \${index} ended\`);\\n        }\\n      });\\n    }\\n    \\n    // マイク状態変化を親に通知\\n    dispatch('microphoneHealthChange', {\\n      healthy: microphoneHealthy,\\n      errors: errorDetails,\\n      details: status\\n    });\\n  }\\n  \\n  // デバッグモードの監視\\n  $: if (debugMode && !debugInterval) {\\n    console.log('🔍 [PitchDetector] Debug mode enabled - starting status monitoring');\\n    debugInterval = setInterval(checkMicrophoneStatus, 3000); // 3秒間隔\\n    checkMicrophoneStatus(); // 即座に1回実行\\n  } else if (!debugMode && debugInterval) {\\n    console.log('🔍 [PitchDetector] Debug mode disabled - stopping status monitoring');\\n    clearInterval(debugInterval);\\n    debugInterval = null;\\n  }\\n\\n  // 初期化（AudioManager対応版）\\n  export async function initialize() {\\n    try {\\n      componentState = 'initializing';\\n      lastError = null;\\n      \\n      console.log('🎙️ [PitchDetector] AudioManager経由で初期化開始');\\n      \\n      // AudioManagerから共有リソースを取得\\n      const resources = await audioManager.initialize();\\n      audioContext = resources.audioContext;\\n      mediaStream = resources.mediaStream;\\n      sourceNode = resources.sourceNode;\\n      \\n      console.log('✅ [PitchDetector] AudioManager リソース取得完了');\\n      \\n      // 専用のAnalyserを作成（フィルター付き）\\n      const filteredAnalyserId = \`pitch-detector-filtered-\${Date.now()}\`;\\n      analyser = audioManager.createAnalyser(filteredAnalyserId, {\\n        fftSize: 2048,\\n        smoothingTimeConstant: 0.8,\\n        minDecibels: -90,\\n        maxDecibels: -10,\\n        useFilters: true\\n      });\\n      analyserIds.push(filteredAnalyserId);\\n      \\n      // 生信号用Analyser（比較用）\\n      const rawAnalyserId = \`pitch-detector-raw-\${Date.now()}\`;\\n      rawAnalyser = audioManager.createAnalyser(rawAnalyserId, {\\n        fftSize: 2048,\\n        smoothingTimeConstant: 0.8,\\n        minDecibels: -90,\\n        maxDecibels: -10,\\n        useFilters: false\\n      });\\n      analyserIds.push(rawAnalyserId);\\n      \\n      console.log('✅ [PitchDetector] Analyser作成完了:', analyserIds);\\n      \\n      // PitchDetector初期化\\n      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);\\n      \\n      // 初期化完了\\n      componentState = 'ready';\\n      isInitialized = true;\\n      \\n      // 状態変更を通知\\n      dispatch('stateChange', { state: componentState });\\n      \\n      // MediaStreamの健康状態監視を開始\\n      setupMediaStreamMonitoring();\\n      \\n      console.log('✅ [PitchDetector] 初期化完了');\\n      \\n    } catch (error) {\\n      console.error('❌ [PitchDetector] 初期化エラー:', error);\\n      componentState = 'error';\\n      lastError = error;\\n      isInitialized = false;\\n      \\n      // エラーを通知\\n      dispatch('error', { error, context: 'initialization' });\\n      \\n      throw error;\\n    }\\n  }\\n\\n  // 検出開始（改訂版）\\n  export function startDetection() {\\n    if (componentState !== 'ready') {\\n      const error = new Error(\`Cannot start detection: component state is \${componentState}\`);\\n      dispatch('error', { error, context: 'start-detection' });\\n      return false;\\n    }\\n    \\n    if (!analyser || !pitchDetector || !audioContext) {\\n      const error = new Error('Required components not available');\\n      componentState = 'error';\\n      dispatch('error', { error, context: 'start-detection' });\\n      return false;\\n    }\\n    \\n    componentState = 'detecting';\\n    isDetecting = true;\\n    dispatch('stateChange', { state: componentState });\\n    detectPitch();\\n    return true;\\n  }\\n\\n  // 検出停止（改訂版）\\n  export function stopDetection() {\\n    isDetecting = false;\\n    if (animationFrame) {\\n      cancelAnimationFrame(animationFrame);\\n      animationFrame = null;\\n    }\\n    \\n    // 状態を ready に戻す（初期化済みの場合）\\n    if (componentState === 'detecting' && isInitialized) {\\n      componentState = 'ready';\\n      dispatch('stateChange', { state: componentState });\\n    }\\n    \\n  }\\n\\n  // リアルタイム音程検出\\n  function detectPitch() {\\n    if (!isDetecting || !analyser || !rawAnalyser || !pitchDetector) return;\\n    \\n    const bufferLength = analyser.fftSize;\\n    const buffer = new Float32Array(bufferLength);\\n    const rawBuffer = new Float32Array(rawAnalyser.fftSize);\\n    \\n    analyser.getFloatTimeDomainData(buffer);\\n    rawAnalyser.getFloatTimeDomainData(rawBuffer);\\n    \\n    // 音量計算（フィルター後）\\n    let sum = 0;\\n    for (let i = 0; i < bufferLength; i++) {\\n      sum += Math.abs(buffer[i]);\\n    }\\n    const rms = Math.sqrt(sum / bufferLength);\\n    const logVolume = Math.log10(rms + 0.001) * 50 + 100;\\n    const rawCurrentVolume = Math.max(0, Math.min(100, logVolume));\\n    \\n    // 生音量計算（フィルター前）\\n    let rawSum = 0;\\n    for (let i = 0; i < rawBuffer.length; i++) {\\n      rawSum += Math.abs(rawBuffer[i]);\\n    }\\n    const rawRms = Math.sqrt(rawSum / rawBuffer.length);\\n    const rawLogVolume = Math.log10(rawRms + 0.001) * 50 + 100;\\n    rawVolume = Math.max(0, Math.min(100, rawLogVolume));\\n    \\n    // 音量の安定化（5フレーム移動平均）\\n    volumeHistory.push(rawCurrentVolume);\\n    if (volumeHistory.length > 5) {\\n      volumeHistory.shift();\\n    }\\n    stableVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;\\n    currentVolume = stableVolume;\\n    \\n    // 音程検出（PitchDetector使用）\\n    const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContext.sampleRate);\\n    \\n    // 人間音域フィルタリング（実用調整）\\n    // 実際の人間の声域に最適化:\\n    // - 低域: 65Hz以上（C2以上、男性最低音域考慮）  \\n    // - 高域: 1200Hz以下（実用的な歌唱範囲）\\n    // - 極低音域ノイズ（G-1等）は確実に除外\\n    const isValidVocalRange = pitch >= 65 && pitch <= 1200;\\n    \\n    if (pitch && clarity > 0.8 && currentVolume > 30 && isValidVocalRange) {\\n      let finalFreq = pitch;\\n      \\n      // ハーモニック補正の有効/無効を制御（230Hz固着問題デバッグ用）\\n      if (!disableHarmonicCorrection) {\\n        // 統一倍音補正システム適用（音量情報も渡す）\\n        const normalizedVolume = Math.min(currentVolume / 100, 1.0); // 0-1に正規化\\n        finalFreq = harmonicCorrection.correctHarmonic(pitch, normalizedVolume);\\n      } else if (debugMode) {\\n        console.log('🔧 [PitchDetector] ハーモニック補正無効化中 - 生値使用:', pitch);\\n      }\\n      \\n      // 周波数表示を更新\\n      currentFrequency = Math.round(finalFreq);\\n      detectedNote = frequencyToNote(currentFrequency);\\n      pitchClarity = clarity;\\n      \\n    } else {\\n      // 信号が弱い場合は統一倍音補正モジュールの履歴をクリア\\n      if (currentFrequency === 0) {\\n        harmonicCorrection.resetHistory();\\n      }\\n      \\n      // 周波数表示をクリア\\n      currentFrequency = 0;\\n      detectedNote = 'ーー';\\n      pitchClarity = 0;\\n    }\\n    \\n    // 音程が検出されない場合はVolumeBarも0に（極低音域ノイズ対策）\\n    const displayVolume = currentFrequency > 0 ? rawVolume : 0;\\n    \\n    \\n    // 親コンポーネントにデータを送信\\n    \\n    dispatch('pitchUpdate', {\\n      frequency: currentFrequency,\\n      note: detectedNote,\\n      volume: displayVolume, // displayVolumeに統一（無音時は0）\\n      rawVolume: displayVolume,\\n      clarity: pitchClarity\\n    });\\n    \\n    animationFrame = requestAnimationFrame(detectPitch);\\n  }\\n\\n  // 旧倍音補正関数は削除済み - HarmonicCorrection.js モジュールを使用\\n\\n  // 周波数から音程名に変換\\n  function frequencyToNote(frequency) {\\n    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];\\n    const A4 = 440;\\n    \\n    if (frequency <= 0) return 'ーー';\\n    \\n    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));\\n    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;\\n    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;\\n    \\n    return noteNames[noteIndex] + octave;\\n  }\\n\\n  // 状態確認API（新規追加）\\n  export function getIsInitialized() {\\n    return isInitialized && componentState === 'ready';\\n  }\\n  \\n  export function getState() {\\n    return {\\n      componentState,\\n      isInitialized,\\n      isDetecting,\\n      lastError,\\n      hasRequiredComponents: !!(analyser && pitchDetector && audioContext && mediaStream)\\n    };\\n  }\\n  \\n  // 再初期化API（AudioManager対応版）\\n  export async function reinitialize() {\\n    console.log('🔄 [PitchDetector] 再初期化開始');\\n    \\n    // 現在の状態をクリーンアップ\\n    cleanup();\\n    \\n    // 短い待機でリソース解放を確実に\\n    await new Promise(resolve => setTimeout(resolve, 100));\\n    \\n    // 再初期化実行\\n    await initialize();\\n    \\n    console.log('✅ [PitchDetector] 再初期化完了');\\n  }\\n\\n  // クリーンアップ（AudioManager対応版）\\n  export function cleanup() {\\n    console.log('🧹 [PitchDetector] クリーンアップ開始');\\n    \\n    stopDetection();\\n    \\n    // MediaStreamイベントリスナーをクリーンアップ\\n    if (mediaStreamListeners.size > 0) {\\n      mediaStreamListeners.forEach((handlers, track) => {\\n        track.removeEventListener('ended', handlers.endedHandler);\\n        track.removeEventListener('mute', handlers.muteHandler);\\n        track.removeEventListener('unmute', handlers.unmuteHandler);\\n      });\\n      mediaStreamListeners.clear();\\n      console.log('🔄 [PitchDetector] MediaStreamイベントリスナー削除');\\n    }\\n    \\n    // AudioManagerに作成したAnalyserを解放通知\\n    if (analyserIds.length > 0) {\\n      audioManager.release(analyserIds);\\n      console.log('📤 [PitchDetector] AudioManagerにAnalyser解放通知:', analyserIds);\\n      analyserIds = [];\\n    }\\n    \\n    // 状態をリセット\\n    componentState = 'uninitialized';\\n    isInitialized = false;\\n    lastError = null;\\n    \\n    // 参照をクリア（実際のリソースはAudioManagerが管理）\\n    audioContext = null;\\n    mediaStream = null;\\n    sourceNode = null;\\n    analyser = null;\\n    rawAnalyser = null;\\n    pitchDetector = null;\\n    \\n    // 履歴クリア\\n    frequencyHistory = [];\\n    volumeHistory = [];\\n    \\n    // 統一倍音補正モジュールのリセット\\n    harmonicCorrection.resetHistory();\\n    \\n    console.log('✅ [PitchDetector] クリーンアップ完了');\\n  }\\n\\n  /**\\n   * MediaStreamの健康状態監視セットアップ\\n   * Safari環境でのMediaStreamTrack終了検出\\n   */\\n  function setupMediaStreamMonitoring() {\\n    if (!mediaStream) return;\\n    \\n    const tracks = mediaStream.getTracks();\\n    tracks.forEach(track => {\\n      // トラック終了イベントの監視\\n      const endedHandler = () => {\\n        console.error('🚨 [PitchDetector] MediaStreamTrack終了検出:', track.kind);\\n        componentState = 'error';\\n        lastError = new Error(\`MediaStreamTrack (\${track.kind}) ended\`);\\n        \\n        // エラー状態を通知\\n        dispatch('error', { \\n          error: lastError, \\n          reason: 'mediastream_ended',\\n          recovery: 'restart_required'\\n        });\\n        \\n        // 検出停止\\n        if (isDetecting) {\\n          stopDetection();\\n        }\\n      };\\n      \\n      // トラックの無効化検出\\n      const muteHandler = () => {\\n        console.warn('⚠️ [PitchDetector] MediaStreamTrack muted:', track.kind);\\n        dispatch('warning', { \\n          reason: 'track_muted', \\n          track: track.kind \\n        });\\n      };\\n      \\n      const unmuteHandler = () => {\\n        console.log('✅ [PitchDetector] MediaStreamTrack unmuted:', track.kind);\\n        dispatch('info', { \\n          reason: 'track_unmuted', \\n          track: track.kind \\n        });\\n      };\\n      \\n      // イベントリスナーを追加\\n      track.addEventListener('ended', endedHandler);\\n      track.addEventListener('mute', muteHandler);\\n      track.addEventListener('unmute', unmuteHandler);\\n      \\n      // リスナー参照を保存（後で削除するため）\\n      mediaStreamListeners.set(track, { endedHandler, muteHandler, unmuteHandler });\\n    });\\n    \\n    console.log('🔍 [PitchDetector] MediaStream監視開始:', tracks.length + ' tracks');\\n  }\\n\\n  // isActiveの変更を監視（改善版）\\n  $: if (isActive && componentState === 'ready' && analyser && !isDetecting) {\\n    startDetection();\\n  } else if (!isActive && isDetecting) {\\n    stopDetection();\\n  }\\n\\n  onDestroy(() => {\\n    // デバッグインターバルのクリア\\n    if (debugInterval) {\\n      clearInterval(debugInterval);\\n      debugInterval = null;\\n    }\\n    \\n    // AudioManager使用時は自動クリーンアップしない\\n    // （他のコンポーネントが使用中の可能性があるため）\\n    // 明示的なcleanup()呼び出しが必要\\n    console.log('🔄 [PitchDetector] onDestroy - AudioManagerリソースは保持');\\n  });\\n<\/script>\\n\\n<div class=\\"pitch-detector {className}\\">\\n  <div class=\\"detection-display\\">\\n    <div class=\\"detection-card\\">\\n      <span class=\\"detected-frequency\\">{currentFrequency > 0 ? Math.round(currentFrequency) : '---'}</span>\\n      <span class=\\"hz-suffix\\">Hz</span>\\n      <span class=\\"divider\\">|</span>\\n      <span class=\\"detected-note\\">{detectedNote}</span>\\n    </div>\\n    \\n    <VolumeBar volume={currentFrequency > 0 ? rawVolume : 0} className=\\"volume-bar\\" />\\n  </div>\\n</div>\\n\\n<style>\\n  .pitch-detector {\\n    padding: 1rem;\\n  }\\n\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n  \\n  .detection-card {\\n    display: inline-flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n    padding: 1rem 1.5rem;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    width: fit-content;\\n  }\\n\\n  .detected-frequency {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(222.2 84% 4.9%);\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;\\n    min-width: 4ch;\\n    text-align: right;\\n    display: inline-block;\\n    font-variant-numeric: tabular-nums;\\n    -webkit-font-smoothing: antialiased;\\n    -moz-osx-font-smoothing: grayscale;\\n  }\\n\\n  .hz-suffix {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n\\n  .divider {\\n    color: hsl(214.3 31.8% 70%);\\n    font-size: 1.5rem;\\n    margin: 0 0.25rem;\\n    font-weight: 300;\\n  }\\n  \\n  .detected-note {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;\\n    min-width: 3ch;\\n    display: inline-block;\\n    text-align: center;\\n  }\\n\\n  :global(.volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n</style>"],"names":[],"mappings":"AA2hBE,6BAAgB,CACd,OAAO,CAAE,IACX,CAEA,gCAAmB,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IACP,CAEA,6BAAgB,CACd,OAAO,CAAE,WAAW,CACpB,WAAW,CAAE,QAAQ,CACrB,GAAG,CAAE,MAAM,CACX,OAAO,CAAE,IAAI,CAAC,MAAM,CACpB,UAAU,CAAE,IAAI,CAAC,CAAC,EAAE,CAAC,IAAI,CAAC,CAC1B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CACxC,aAAa,CAAE,GAAG,CAClB,KAAK,CAAE,WACT,CAEA,iCAAoB,CAClB,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAAC,CAC1B,WAAW,CAAE,SAAS,CAAC,CAAC,QAAQ,CAAC,CAAC,eAAe,CAAC,CAAC,aAAa,CAAC;AACrE,iBAAiB,gBAAgB,CAAC,CAAC,WAAW,CAAC,CAAC,UAAU,CAAC,CAAC,SAAS,CACjE,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,YAAY,CACrB,oBAAoB,CAAE,YAAY,CAClC,sBAAsB,CAAE,WAAW,CACnC,uBAAuB,CAAE,SAC3B,CAEA,wBAAW,CACT,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAC3B,CAEA,sBAAS,CACP,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,GAAG,CAAC,CAC3B,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,OAAO,CACjB,WAAW,CAAE,GACf,CAEA,4BAAe,CACb,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC7B,WAAW,CAAE,SAAS,CAAC,CAAC,QAAQ,CAAC,CAAC,eAAe,CAAC,CAAC,aAAa,CAAC;AACrE,iBAAiB,gBAAgB,CAAC,CAAC,WAAW,CAAC,CAAC,UAAU,CAAC,CAAC,SAAS,CACjE,SAAS,CAAE,GAAG,CACd,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,MACd,CAEQ,WAAa,CACnB,aAAa,CAAE,GAAG,CAAC,UACrB"}`
};
function frequencyToNote(frequency) {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  if (frequency <= 0) return "ーー";
  const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
  const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
  const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
  return noteNames[noteIndex] + octave;
}
const PitchDetector_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const dispatch = createEventDispatcher();
  let { isActive = false } = $$props;
  let { className = "" } = $$props;
  let { debugMode = false } = $$props;
  const trainingPhase = "";
  let { disableHarmonicCorrection = false } = $$props;
  let componentState = "uninitialized";
  let lastError = null;
  let isInitialized = false;
  let audioContext = null;
  let mediaStream = null;
  let sourceNode = null;
  let analyser = null;
  let rawAnalyser = null;
  let pitchDetector = null;
  let animationFrame = null;
  let isDetecting = false;
  let analyserIds = [];
  let mediaStreamListeners = /* @__PURE__ */ new Map();
  let currentVolume = 0;
  let rawVolume = 0;
  let currentFrequency = 0;
  let detectedNote = "ーー";
  let pitchClarity = 0;
  let volumeHistory = [];
  let stableVolume = 0;
  let debugInterval = null;
  function resetDisplayState() {
    currentVolume = 0;
    rawVolume = 0;
    currentFrequency = 0;
    detectedNote = "ーー";
    pitchClarity = 0;
    stableVolume = 0;
    volumeHistory = [];
    harmonicCorrection.resetHistory();
    if (debugMode) {
      console.log("🔄 [PitchDetector] Display state reset");
    }
  }
  function checkMicrophoneStatus() {
    if (!debugMode) return;
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const status = {
      timestamp,
      componentState,
      isActive,
      isDetecting,
      isInitialized,
      mediaStreamActive: mediaStream ? mediaStream.active : null,
      mediaStreamTracks: mediaStream ? mediaStream.getTracks().length : 0,
      trackStates: mediaStream ? mediaStream.getTracks().map((track) => ({
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
    let microphoneHealthy = true;
    let errorDetails = [];
    if (mediaStream && !mediaStream.active) {
      console.warn(`⚠️ [PitchDetector] MediaStream is inactive!`, mediaStream);
      microphoneHealthy = false;
      errorDetails.push("MediaStream inactive");
    }
    if (audioContext && audioContext.state === "suspended") {
      console.warn(`⚠️ [PitchDetector] AudioContext is suspended!`, audioContext);
      microphoneHealthy = false;
      errorDetails.push("AudioContext suspended");
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track, index) => {
        if (track.readyState === "ended") {
          console.error(`❌ [PitchDetector] Track ${index} has ended!`, track);
          microphoneHealthy = false;
          errorDetails.push(`Track ${index} ended`);
        }
      });
    }
    dispatch("microphoneHealthChange", {
      healthy: microphoneHealthy,
      errors: errorDetails,
      details: status
    });
  }
  async function initialize() {
    try {
      componentState = "initializing";
      lastError = null;
      console.log("🎙️ [PitchDetector] AudioManager経由で初期化開始");
      const resources = await audioManager.initialize();
      audioContext = resources.audioContext;
      mediaStream = resources.mediaStream;
      sourceNode = resources.sourceNode;
      console.log("✅ [PitchDetector] AudioManager リソース取得完了");
      const filteredAnalyserId = `pitch-detector-filtered-${Date.now()}`;
      analyser = audioManager.createAnalyser(filteredAnalyserId, {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
        useFilters: true
      });
      analyserIds.push(filteredAnalyserId);
      const rawAnalyserId = `pitch-detector-raw-${Date.now()}`;
      rawAnalyser = audioManager.createAnalyser(rawAnalyserId, {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
        useFilters: false
      });
      analyserIds.push(rawAnalyserId);
      console.log("✅ [PitchDetector] Analyser作成完了:", analyserIds);
      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
      componentState = "ready";
      isInitialized = true;
      dispatch("stateChange", { state: componentState });
      setupMediaStreamMonitoring();
      console.log("✅ [PitchDetector] 初期化完了");
    } catch (error) {
      console.error("❌ [PitchDetector] 初期化エラー:", error);
      componentState = "error";
      lastError = error;
      isInitialized = false;
      dispatch("error", { error, context: "initialization" });
      throw error;
    }
  }
  function startDetection() {
    if (componentState !== "ready") {
      const error = new Error(`Cannot start detection: component state is ${componentState}`);
      dispatch("error", { error, context: "start-detection" });
      return false;
    }
    if (!analyser || !pitchDetector || !audioContext) {
      const error = new Error("Required components not available");
      componentState = "error";
      dispatch("error", { error, context: "start-detection" });
      return false;
    }
    componentState = "detecting";
    isDetecting = true;
    dispatch("stateChange", { state: componentState });
    detectPitch();
    return true;
  }
  function stopDetection() {
    isDetecting = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (componentState === "detecting" && isInitialized) {
      componentState = "ready";
      dispatch("stateChange", { state: componentState });
    }
  }
  function detectPitch() {
    if (!isDetecting || !analyser || !rawAnalyser || !pitchDetector) return;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    const rawBuffer = new Float32Array(rawAnalyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    rawAnalyser.getFloatTimeDomainData(rawBuffer);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += Math.abs(buffer[i]);
    }
    const rms = Math.sqrt(sum / bufferLength);
    const logVolume = Math.log10(rms + 1e-3) * 50 + 100;
    const rawCurrentVolume = Math.max(0, Math.min(100, logVolume));
    let rawSum = 0;
    for (let i = 0; i < rawBuffer.length; i++) {
      rawSum += Math.abs(rawBuffer[i]);
    }
    const rawRms = Math.sqrt(rawSum / rawBuffer.length);
    const rawLogVolume = Math.log10(rawRms + 1e-3) * 50 + 100;
    rawVolume = Math.max(0, Math.min(100, rawLogVolume));
    volumeHistory.push(rawCurrentVolume);
    if (volumeHistory.length > 5) {
      volumeHistory.shift();
    }
    stableVolume = volumeHistory.reduce((sum2, v) => sum2 + v, 0) / volumeHistory.length;
    currentVolume = stableVolume;
    const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContext.sampleRate);
    const isValidVocalRange = pitch >= 65 && pitch <= 1200;
    if (pitch && clarity > 0.8 && currentVolume > 30 && isValidVocalRange) {
      let finalFreq = pitch;
      if (!disableHarmonicCorrection) {
        const normalizedVolume = Math.min(currentVolume / 100, 1);
        finalFreq = harmonicCorrection.correctHarmonic(pitch, normalizedVolume);
      } else if (debugMode) {
        console.log("🔧 [PitchDetector] ハーモニック補正無効化中 - 生値使用:", pitch);
      }
      currentFrequency = Math.round(finalFreq);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
    } else {
      if (currentFrequency === 0) {
        harmonicCorrection.resetHistory();
      }
      currentFrequency = 0;
      detectedNote = "ーー";
      pitchClarity = 0;
    }
    const displayVolume = currentFrequency > 0 ? rawVolume : 0;
    dispatch("pitchUpdate", {
      frequency: currentFrequency,
      note: detectedNote,
      volume: displayVolume,
      // displayVolumeに統一（無音時は0）
      rawVolume: displayVolume,
      clarity: pitchClarity
    });
    animationFrame = requestAnimationFrame(detectPitch);
  }
  function getIsInitialized() {
    return isInitialized && componentState === "ready";
  }
  function getState() {
    return {
      componentState,
      isInitialized,
      isDetecting,
      lastError,
      hasRequiredComponents: !!(analyser && pitchDetector && audioContext && mediaStream)
    };
  }
  async function reinitialize() {
    console.log("🔄 [PitchDetector] 再初期化開始");
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await initialize();
    console.log("✅ [PitchDetector] 再初期化完了");
  }
  function cleanup() {
    console.log("🧹 [PitchDetector] クリーンアップ開始");
    stopDetection();
    if (mediaStreamListeners.size > 0) {
      mediaStreamListeners.forEach((handlers, track) => {
        track.removeEventListener("ended", handlers.endedHandler);
        track.removeEventListener("mute", handlers.muteHandler);
        track.removeEventListener("unmute", handlers.unmuteHandler);
      });
      mediaStreamListeners.clear();
      console.log("🔄 [PitchDetector] MediaStreamイベントリスナー削除");
    }
    if (analyserIds.length > 0) {
      audioManager.release(analyserIds);
      console.log("📤 [PitchDetector] AudioManagerにAnalyser解放通知:", analyserIds);
      analyserIds = [];
    }
    componentState = "uninitialized";
    isInitialized = false;
    lastError = null;
    audioContext = null;
    mediaStream = null;
    sourceNode = null;
    analyser = null;
    rawAnalyser = null;
    pitchDetector = null;
    volumeHistory = [];
    harmonicCorrection.resetHistory();
    console.log("✅ [PitchDetector] クリーンアップ完了");
  }
  function setupMediaStreamMonitoring() {
    if (!mediaStream) return;
    const tracks = mediaStream.getTracks();
    tracks.forEach((track) => {
      const endedHandler = () => {
        console.error("🚨 [PitchDetector] MediaStreamTrack終了検出:", track.kind);
        componentState = "error";
        lastError = new Error(`MediaStreamTrack (${track.kind}) ended`);
        dispatch("error", {
          error: lastError,
          reason: "mediastream_ended",
          recovery: "restart_required"
        });
        if (isDetecting) {
          stopDetection();
        }
      };
      const muteHandler = () => {
        console.warn("⚠️ [PitchDetector] MediaStreamTrack muted:", track.kind);
        dispatch("warning", { reason: "track_muted", track: track.kind });
      };
      const unmuteHandler = () => {
        console.log("✅ [PitchDetector] MediaStreamTrack unmuted:", track.kind);
        dispatch("info", {
          reason: "track_unmuted",
          track: track.kind
        });
      };
      track.addEventListener("ended", endedHandler);
      track.addEventListener("mute", muteHandler);
      track.addEventListener("unmute", unmuteHandler);
      mediaStreamListeners.set(track, { endedHandler, muteHandler, unmuteHandler });
    });
    console.log("🔍 [PitchDetector] MediaStream監視開始:", tracks.length + " tracks");
  }
  onDestroy(() => {
    if (debugInterval) {
      clearInterval(debugInterval);
      debugInterval = null;
    }
    console.log("🔄 [PitchDetector] onDestroy - AudioManagerリソースは保持");
  });
  if ($$props.isActive === void 0 && $$bindings.isActive && isActive !== void 0) $$bindings.isActive(isActive);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  if ($$props.debugMode === void 0 && $$bindings.debugMode && debugMode !== void 0) $$bindings.debugMode(debugMode);
  if ($$props.trainingPhase === void 0 && $$bindings.trainingPhase && trainingPhase !== void 0) $$bindings.trainingPhase(trainingPhase);
  if ($$props.disableHarmonicCorrection === void 0 && $$bindings.disableHarmonicCorrection && disableHarmonicCorrection !== void 0) $$bindings.disableHarmonicCorrection(disableHarmonicCorrection);
  if ($$props.resetDisplayState === void 0 && $$bindings.resetDisplayState && resetDisplayState !== void 0) $$bindings.resetDisplayState(resetDisplayState);
  if ($$props.initialize === void 0 && $$bindings.initialize && initialize !== void 0) $$bindings.initialize(initialize);
  if ($$props.startDetection === void 0 && $$bindings.startDetection && startDetection !== void 0) $$bindings.startDetection(startDetection);
  if ($$props.stopDetection === void 0 && $$bindings.stopDetection && stopDetection !== void 0) $$bindings.stopDetection(stopDetection);
  if ($$props.getIsInitialized === void 0 && $$bindings.getIsInitialized && getIsInitialized !== void 0) $$bindings.getIsInitialized(getIsInitialized);
  if ($$props.getState === void 0 && $$bindings.getState && getState !== void 0) $$bindings.getState(getState);
  if ($$props.reinitialize === void 0 && $$bindings.reinitialize && reinitialize !== void 0) $$bindings.reinitialize(reinitialize);
  if ($$props.cleanup === void 0 && $$bindings.cleanup && cleanup !== void 0) $$bindings.cleanup(cleanup);
  $$result.css.add(css$2);
  {
    if (debugMode && !debugInterval) {
      console.log("🔍 [PitchDetector] Debug mode enabled - starting status monitoring");
      debugInterval = setInterval(checkMicrophoneStatus, 3e3);
      checkMicrophoneStatus();
    } else if (!debugMode && debugInterval) {
      console.log("🔍 [PitchDetector] Debug mode disabled - stopping status monitoring");
      clearInterval(debugInterval);
      debugInterval = null;
    }
  }
  {
    if (isActive && componentState === "ready" && analyser && !isDetecting) {
      startDetection();
    } else if (!isActive && isDetecting) {
      stopDetection();
    }
  }
  return `<div class="${"pitch-detector " + escape(className, true) + " svelte-vc1bho"}"><div class="detection-display svelte-vc1bho"><div class="detection-card svelte-vc1bho"><span class="detected-frequency svelte-vc1bho">${escape(currentFrequency > 0 ? Math.round(currentFrequency) : "---")}</span> <span class="hz-suffix svelte-vc1bho" data-svelte-h="svelte-5uyilv">Hz</span> <span class="divider svelte-vc1bho" data-svelte-h="svelte-1dytxz4">|</span> <span class="detected-note svelte-vc1bho">${escape(detectedNote)}</span></div> ${validate_component(VolumeBar, "VolumeBar").$$render(
    $$result,
    {
      volume: currentFrequency > 0 ? rawVolume : 0,
      className: "volume-bar"
    },
    {},
    {}
  )}</div> </div>`;
});
const css$1 = {
  code: ".card-header.svelte-apkxqk{padding-bottom:1rem;border-bottom:1px solid hsl(214.3 31.8% 91.4%);margin-bottom:1.5rem}.section-title.svelte-apkxqk{font-size:1.125rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin:0}.card-content.svelte-apkxqk{display:flex;flex-direction:column;gap:1rem}.pitch-detector.svelte-apkxqk{display:flex;flex-direction:column;gap:1rem}.detection-display.svelte-apkxqk{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-apkxqk{background:hsl(210 40% 96.1%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;padding:1.5rem;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.5rem;font-weight:600;color:hsl(222.2 84% 4.9%);min-height:80px}.detection-values.svelte-apkxqk{display:flex;align-items:baseline;gap:0.5rem}.muted-message.svelte-apkxqk{font-size:1.125rem;color:hsl(215.4 16.3% 46.9%);font-weight:500}.detected-frequency.svelte-apkxqk{font-size:2rem;font-weight:700;color:hsl(142.1 76.2% 36.3%)}.hz-suffix.svelte-apkxqk{font-size:1rem;color:hsl(215.4 16.3% 46.9%);font-weight:400}.divider.svelte-apkxqk{color:hsl(214.3 31.8% 91.4%);margin:0 0.5rem}.detected-note.svelte-apkxqk{font-size:1.5rem;font-weight:600;color:hsl(222.2 84% 4.9%)}.guidance-section.svelte-apkxqk{margin-top:1rem;display:flex;flex-direction:column;gap:0.5rem;width:100%}.target-info.svelte-apkxqk{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:hsl(215.4 16.3% 46.9%)}.target-label.svelte-apkxqk{font-weight:600}.target-frequency.svelte-apkxqk{font-weight:700;color:hsl(217.2 32.6% 17.5%)}.target-note.svelte-apkxqk{font-weight:600;color:hsl(217.2 32.6% 17.5%)}.accuracy-feedback.svelte-apkxqk{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 1rem;border-radius:6px;font-size:0.875rem;font-weight:600}.cent-diff.svelte-apkxqk{font-family:monospace;font-size:1rem;font-weight:700}.accuracy-excellent.svelte-apkxqk{background-color:#d1fae5;color:#065f46;border:1px solid #34d399}.accuracy-good.svelte-apkxqk{background-color:#dbeafe;color:#1e40af;border:1px solid #60a5fa}.accuracy-okay.svelte-apkxqk{background-color:#fef3c7;color:#92400e;border:1px solid #fcd34d}.accuracy-poor.svelte-apkxqk{background-color:#fed7d7;color:#c53030;border:1px solid #fc8181}.accuracy-very-poor.svelte-apkxqk{background-color:#fecaca;color:#991b1b;border:1px solid #f87171}.volume-bar{margin-top:0.5rem}@media(max-width: 768px){.detection-card.svelte-apkxqk{font-size:1.25rem;padding:1rem;min-height:60px}.detected-frequency.svelte-apkxqk{font-size:1.5rem}.detected-note.svelte-apkxqk{font-size:1.25rem}.muted-message.svelte-apkxqk{font-size:1rem}}",
  map: `{"version":3,"file":"PitchDetectionDisplay.svelte","sources":["PitchDetectionDisplay.svelte"],"sourcesContent":["<script>\\n  import Card from './Card.svelte';\\n  import VolumeBar from './VolumeBar.svelte';\\n  \\n  // Props\\n  export let frequency = 0;\\n  export let note = 'ーー';\\n  export let volume = 0;\\n  export let isMuted = false;\\n  export let muteMessage = '待機中...';\\n  export let className = '';\\n  \\n  // 音程ガイダンス用\\n  export let targetFrequency = 0;  // 目標周波数\\n  export let targetNote = '';      // 目標音程\\n  export let centDiff = 0;         // セント差\\n  export let showGuidance = false; // ガイダンス表示フラグ\\n  \\n  // セント差による色分け\\n  $: accuracyLevel = getAccuracyLevel(centDiff);\\n  \\n  function getAccuracyLevel(cent) {\\n    const abs = Math.abs(cent);\\n    if (abs <= 30) return 'excellent';\\n    if (abs <= 60) return 'good';\\n    if (abs <= 120) return 'okay';\\n    if (abs <= 200) return 'poor';\\n    return 'very-poor';\\n  }\\n  \\n  function getAccuracyMessage(level, cent) {\\n    const abs = Math.abs(cent);\\n    \\n    if (level === 'excellent') return '🎯 完璧！';\\n    if (level === 'good') return '✅ とても良い';\\n    if (level === 'okay') return '🔶 もう少し';\\n    if (level === 'poor') return cent > 0 ? '📈 もっと高く' : '📉 もっと低く';\\n    return cent > 0 ? '⬆️ かなり高く' : '⬇️ かなり低く';\\n  }\\n<\/script>\\n\\n<Card class=\\"main-card {className}\\">\\n  <div class=\\"card-header\\">\\n    <h3 class=\\"section-title\\">🎙️ リアルタイム音程検出</h3>\\n  </div>\\n  <div class=\\"card-content\\">\\n    <div class=\\"pitch-detector\\">\\n      <div class=\\"detection-display\\">\\n        <div class=\\"detection-card\\">\\n          {#if isMuted}\\n            <span class=\\"muted-message\\">{muteMessage}</span>\\n          {:else}\\n            <div class=\\"detection-values\\">\\n              <span class=\\"detected-frequency\\">{frequency > 0 ? Math.round(frequency) : '---'}</span>\\n              <span class=\\"hz-suffix\\">Hz</span>\\n              <span class=\\"divider\\">|</span>\\n              <span class=\\"detected-note\\">{note}</span>\\n            </div>\\n            \\n            {#if showGuidance && targetFrequency > 0}\\n              <div class=\\"guidance-section\\">\\n                <div class=\\"target-info\\">\\n                  <span class=\\"target-label\\">目標:</span>\\n                  <span class=\\"target-frequency\\">{Math.round(targetFrequency)}Hz</span>\\n                  <span class=\\"target-note\\">({targetNote})</span>\\n                </div>\\n                {#if frequency > 0}\\n                  <div class=\\"accuracy-feedback accuracy-{accuracyLevel}\\">\\n                    <span class=\\"cent-diff\\">{centDiff > 0 ? '+' : ''}{Math.round(centDiff)}¢</span>\\n                    <span class=\\"accuracy-message\\">{getAccuracyMessage(accuracyLevel, centDiff)}</span>\\n                  </div>\\n                {/if}\\n              </div>\\n            {/if}\\n          {/if}\\n        </div>\\n        \\n        <VolumeBar volume={!isMuted && frequency > 0 ? volume : 0} className=\\"volume-bar\\" />\\n      </div>\\n    </div>\\n  </div>\\n</Card>\\n\\n<style>\\n  /* カードヘッダー */\\n  .card-header {\\n    padding-bottom: 1rem;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  .section-title {\\n    font-size: 1.125rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin: 0;\\n  }\\n\\n  /* カードコンテンツ */\\n  .card-content {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  /* 音程検出表示 */\\n  .pitch-detector {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  .detection-card {\\n    background: hsl(210 40% 96.1%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    padding: 1.5rem;\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    justify-content: center;\\n    font-size: 1.5rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    min-height: 80px;\\n  }\\n\\n  /* 検出値のコンテナ */\\n  .detection-values {\\n    display: flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n  }\\n\\n  /* ミュート時のメッセージ */\\n  .muted-message {\\n    font-size: 1.125rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n\\n  /* 周波数表示 */\\n  .detected-frequency {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n\\n  .hz-suffix {\\n    font-size: 1rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 400;\\n  }\\n\\n  .divider {\\n    color: hsl(214.3 31.8% 91.4%);\\n    margin: 0 0.5rem;\\n  }\\n\\n  .detected-note {\\n    font-size: 1.5rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n\\n  /* ガイダンスセクション */\\n  .guidance-section {\\n    margin-top: 1rem;\\n    display: flex;\\n    flex-direction: column;\\n    gap: 0.5rem;\\n    width: 100%;\\n  }\\n  \\n  .target-info {\\n    display: flex;\\n    align-items: center;\\n    gap: 0.5rem;\\n    font-size: 0.875rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n  }\\n  \\n  .target-label {\\n    font-weight: 600;\\n  }\\n  \\n  .target-frequency {\\n    font-weight: 700;\\n    color: hsl(217.2 32.6% 17.5%);\\n  }\\n  \\n  .target-note {\\n    font-weight: 600;\\n    color: hsl(217.2 32.6% 17.5%);\\n  }\\n  \\n  .accuracy-feedback {\\n    display: flex;\\n    align-items: center;\\n    gap: 0.75rem;\\n    padding: 0.5rem 1rem;\\n    border-radius: 6px;\\n    font-size: 0.875rem;\\n    font-weight: 600;\\n  }\\n  \\n  .cent-diff {\\n    font-family: monospace;\\n    font-size: 1rem;\\n    font-weight: 700;\\n  }\\n  \\n  /* 精度レベル別の色分け */\\n  .accuracy-excellent {\\n    background-color: #d1fae5;\\n    color: #065f46;\\n    border: 1px solid #34d399;\\n  }\\n  \\n  .accuracy-good {\\n    background-color: #dbeafe;\\n    color: #1e40af;\\n    border: 1px solid #60a5fa;\\n  }\\n  \\n  .accuracy-okay {\\n    background-color: #fef3c7;\\n    color: #92400e;\\n    border: 1px solid #fcd34d;\\n  }\\n  \\n  .accuracy-poor {\\n    background-color: #fed7d7;\\n    color: #c53030;\\n    border: 1px solid #fc8181;\\n  }\\n  \\n  .accuracy-very-poor {\\n    background-color: #fecaca;\\n    color: #991b1b;\\n    border: 1px solid #f87171;\\n  }\\n\\n  /* VolumeBar用のスタイル */\\n  :global(.volume-bar) {\\n    margin-top: 0.5rem;\\n  }\\n\\n  /* レスポンシブ対応 */\\n  @media (max-width: 768px) {\\n    .detection-card {\\n      font-size: 1.25rem;\\n      padding: 1rem;\\n      min-height: 60px;\\n    }\\n\\n    .detected-frequency {\\n      font-size: 1.5rem;\\n    }\\n\\n    .detected-note {\\n      font-size: 1.25rem;\\n    }\\n\\n    .muted-message {\\n      font-size: 1rem;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"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"}`
};
function getAccuracyLevel(cent) {
  const abs = Math.abs(cent);
  if (abs <= 30) return "excellent";
  if (abs <= 60) return "good";
  if (abs <= 120) return "okay";
  if (abs <= 200) return "poor";
  return "very-poor";
}
function getAccuracyMessage(level, cent) {
  if (level === "excellent") return "🎯 完璧！";
  if (level === "good") return "✅ とても良い";
  if (level === "okay") return "🔶 もう少し";
  if (level === "poor") return cent > 0 ? "📈 もっと高く" : "📉 もっと低く";
  return cent > 0 ? "⬆️ かなり高く" : "⬇️ かなり低く";
}
const PitchDetectionDisplay = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let accuracyLevel;
  let { frequency = 0 } = $$props;
  let { note = "ーー" } = $$props;
  let { volume = 0 } = $$props;
  let { isMuted = false } = $$props;
  let { muteMessage = "待機中..." } = $$props;
  let { className = "" } = $$props;
  let { targetFrequency = 0 } = $$props;
  let { targetNote = "" } = $$props;
  let { centDiff = 0 } = $$props;
  let { showGuidance = false } = $$props;
  if ($$props.frequency === void 0 && $$bindings.frequency && frequency !== void 0) $$bindings.frequency(frequency);
  if ($$props.note === void 0 && $$bindings.note && note !== void 0) $$bindings.note(note);
  if ($$props.volume === void 0 && $$bindings.volume && volume !== void 0) $$bindings.volume(volume);
  if ($$props.isMuted === void 0 && $$bindings.isMuted && isMuted !== void 0) $$bindings.isMuted(isMuted);
  if ($$props.muteMessage === void 0 && $$bindings.muteMessage && muteMessage !== void 0) $$bindings.muteMessage(muteMessage);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  if ($$props.targetFrequency === void 0 && $$bindings.targetFrequency && targetFrequency !== void 0) $$bindings.targetFrequency(targetFrequency);
  if ($$props.targetNote === void 0 && $$bindings.targetNote && targetNote !== void 0) $$bindings.targetNote(targetNote);
  if ($$props.centDiff === void 0 && $$bindings.centDiff && centDiff !== void 0) $$bindings.centDiff(centDiff);
  if ($$props.showGuidance === void 0 && $$bindings.showGuidance && showGuidance !== void 0) $$bindings.showGuidance(showGuidance);
  $$result.css.add(css$1);
  accuracyLevel = getAccuracyLevel(centDiff);
  return `${validate_component(Card, "Card").$$render($$result, { class: "main-card " + className }, {}, {
    default: () => {
      return `<div class="card-header svelte-apkxqk" data-svelte-h="svelte-10ekeq9"><h3 class="section-title svelte-apkxqk">🎙️ リアルタイム音程検出</h3></div> <div class="card-content svelte-apkxqk"><div class="pitch-detector svelte-apkxqk"><div class="detection-display svelte-apkxqk"><div class="detection-card svelte-apkxqk">${isMuted ? `<span class="muted-message svelte-apkxqk">${escape(muteMessage)}</span>` : `<div class="detection-values svelte-apkxqk"><span class="detected-frequency svelte-apkxqk">${escape(frequency > 0 ? Math.round(frequency) : "---")}</span> <span class="hz-suffix svelte-apkxqk" data-svelte-h="svelte-5uyilv">Hz</span> <span class="divider svelte-apkxqk" data-svelte-h="svelte-1dytxz4">|</span> <span class="detected-note svelte-apkxqk">${escape(note)}</span></div> ${showGuidance && targetFrequency > 0 ? `<div class="guidance-section svelte-apkxqk"><div class="target-info svelte-apkxqk"><span class="target-label svelte-apkxqk" data-svelte-h="svelte-it05ma">目標:</span> <span class="target-frequency svelte-apkxqk">${escape(Math.round(targetFrequency))}Hz</span> <span class="target-note svelte-apkxqk">(${escape(targetNote)})</span></div> ${frequency > 0 ? `<div class="${"accuracy-feedback accuracy-" + escape(accuracyLevel, true) + " svelte-apkxqk"}"><span class="cent-diff svelte-apkxqk">${escape(centDiff > 0 ? "+" : "")}${escape(Math.round(centDiff))}¢</span> <span class="accuracy-message">${escape(getAccuracyMessage(accuracyLevel, centDiff))}</span></div>` : ``}</div>` : ``}`}</div> ${validate_component(VolumeBar, "VolumeBar").$$render(
        $$result,
        {
          volume: !isMuted && frequency > 0 ? volume : 0,
          className: "volume-bar"
        },
        {},
        {}
      )}</div></div></div>`;
    }
  })}`;
});
const css = {
  code: ".microphone-test.svelte-1v6hvj0{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:var(--space-6)}.header.svelte-1v6hvj0{text-align:center}.mic-test-header.svelte-1v6hvj0{display:flex;align-items:center;justify-content:center;gap:var(--space-4);margin-bottom:var(--space-4)}.mic-icon.svelte-1v6hvj0{width:64px;height:64px;border-radius:50%;background-color:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;flex-shrink:0}.mic-test-title.svelte-1v6hvj0{font-size:var(--text-2xl);font-weight:700;color:var(--color-gray-900);margin:0 0 var(--space-2) 0}.mic-test-description.svelte-1v6hvj0{font-size:var(--text-base);color:var(--color-gray-600);margin:0}.training-mode-info.svelte-1v6hvj0{margin-bottom:var(--space-6)}.training-mode-content.svelte-1v6hvj0{text-align:center}.instructions-title.svelte-1v6hvj0{font-size:var(--text-xl);font-weight:600;color:var(--color-gray-900);margin:var(--space-4) 0 var(--space-2) 0;text-align:center}.instructions-description.svelte-1v6hvj0{font-size:var(--text-sm);color:var(--color-gray-600);margin:0;text-align:center}.status-text.svelte-1v6hvj0{font-size:var(--text-lg);font-weight:600;color:var(--color-gray-900);margin:var(--space-6) 0;text-align:center}.ready-title.svelte-1v6hvj0{font-size:var(--text-xl);font-weight:600;color:#2563eb;margin:var(--space-4) 0 var(--space-2) 0;text-align:center}.ready-description.svelte-1v6hvj0{font-size:var(--text-sm);color:var(--color-gray-600);margin:0 0 var(--space-6) 0;text-align:center}.mic-test-button-area.svelte-1v6hvj0,.training-start-button-area.svelte-1v6hvj0{margin-top:var(--space-6);display:flex;justify-content:center}.mic-test-button.svelte-1v6hvj0{max-width:300px;width:100%;padding:12px 16px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background-color 0.2s ease-in-out;display:flex;align-items:center;justify-content:center;gap:8px}.mic-test-button.start.svelte-1v6hvj0{background-color:#2563eb;color:white}.mic-test-button.start.svelte-1v6hvj0:hover{background-color:#1d4ed8}.mic-test-button.retry.svelte-1v6hvj0{background-color:#dc2626;color:white}.mic-test-button.retry.svelte-1v6hvj0:hover{background-color:#b91c1c}.training-start-button.svelte-1v6hvj0{max-width:300px;width:100%;padding:12px 16px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background-color 0.2s ease-in-out;display:flex;align-items:center;justify-content:center;gap:8px;background-color:#059669;color:white}.training-start-button.enabled.svelte-1v6hvj0:hover{background-color:#047857}.ready-title.svelte-1v6hvj0{color:#059669;font-size:var(--text-lg);font-weight:600;text-align:center;margin-bottom:var(--space-2)}.ready-description.svelte-1v6hvj0{color:#6b7280;text-align:center;margin-bottom:var(--space-4)}@media(min-width: 768px){.mic-test-header.svelte-1v6hvj0{flex-direction:row;text-align:left}}.main-card{border:1px solid hsl(214.3 31.8% 91.4%) !important;background:hsl(0 0% 100%) !important;border-radius:8px !important;box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;margin-bottom:1.5rem}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  import { page } from '$app/stores';\\n  import { goto } from '$app/navigation';\\n  import { base } from '$app/paths';\\n  import Card from '$lib/components/Card.svelte';\\n  import Button from '$lib/components/Button.svelte';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n  import PitchDetector from '$lib/components/PitchDetector.svelte';\\n  import PitchDetectionDisplay from '$lib/components/PitchDetectionDisplay.svelte';\\n  import VolumeBar from '$lib/components/VolumeBar.svelte';\\n  import { audioManager } from '$lib/audio/AudioManager.js';\\n  \\n  // URL パラメータから mode を取得\\n  let mode = 'random';\\n  \\n  onMount(() => {\\n    if ($page.url.searchParams.has('mode')) {\\n      mode = $page.url.searchParams.get('mode') || 'random';\\n    }\\n  });\\n\\n  // マイクテスト状態管理（シンプル版）\\n  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied'\\n\\n  // 音程検出\\n  let currentVolume = 0;\\n  let currentFrequency = 0;\\n  let detectedNote = 'ーー';\\n  let pitchDetectorComponent = null;\\n\\n  // デバイス検出（AudioManager統一版）\\n  let platformSpecs = null;\\n  \\n  onMount(() => {\\n    // AudioManagerから統一設定を取得\\n    platformSpecs = audioManager.getPlatformSpecs();\\n  });\\n\\n  // トレーニングモード設定\\n  const trainingModes = {\\n    random: {\\n      name: 'ランダム基音モード',\\n      description: '10種類の基音からランダムに選択してトレーニング',\\n      color: 'green',\\n      path: '/training/random'\\n    },\\n    continuous: {\\n      name: '連続チャレンジモード',\\n      description: '選択した回数だけ連続で実行し、総合評価を確認',\\n      color: 'orange',\\n      path: '/training/continuous'\\n    },\\n    chromatic: {\\n      name: '12音階モード',\\n      description: 'クロマチックスケールの上行・下行で完全制覇',\\n      color: 'purple',\\n      path: '/training/chromatic'\\n    }\\n  };\\n\\n  const selectedMode = trainingModes[mode] || trainingModes.random;\\n  \\n  // マイク許可確認（シンプル版 - ランダム基音ページから移植）\\n  async function requestMicrophone() {\\n    micPermission = 'pending';\\n    \\n    try {\\n      console.log('🎤 [MicTest] マイク許可リクエスト開始');\\n      \\n      if (!navigator.mediaDevices?.getUserMedia) {\\n        micPermission = 'denied';\\n        console.error('❌ [MicTest] getUserMediaがサポートされていません');\\n        return;\\n      }\\n      \\n      // AudioManagerから共有リソースを取得（初回のみマイク許可ダイアログ表示）\\n      const resources = await audioManager.initialize();\\n      console.log('✅ [MicTest] AudioManager リソース取得完了');\\n      \\n      // マイク許可が取得できたことを確認\\n      if (resources.mediaStream && resources.audioContext) {\\n        micPermission = 'granted';\\n        console.log('✅ [MicTest] マイク許可完了');\\n        \\n        // iPadマイク安定化処理\\n        await onMicrophoneGranted();\\n        \\n        // PitchDetector初期化（マイク許可後）\\n        // Safari対応: より長い待機時間でMediaStream安定化\\n        setTimeout(async () => {\\n          if (pitchDetectorComponent) {\\n            console.log('🎙️ [MicTest] PitchDetector初期化開始');\\n            \\n            await pitchDetectorComponent.initialize();\\n            console.log('✅ [MicTest] PitchDetector初期化完了');\\n            \\n            // リアクティブなisActiveで自動検出開始されるため手動呼び出し不要\\n            console.log('🎯 [MicTest] PitchDetector isActiveリアクティブで自動検出開始');\\n          }\\n        }, 1000);\\n      } else {\\n        throw new Error('リソース取得失敗');\\n      }\\n      \\n    } catch (error) {\\n      console.error('❌ [MicTest] マイク許可エラー:', error);\\n      micPermission = (error?.name === 'NotAllowedError') ? 'denied' : 'denied';\\n    }\\n  }\\n  \\n  // トレーニング開始関数\\n  function startTraining() {\\n    console.log('🚀 [MicTest] トレーニング開始 - ランダム基音モードへ遷移');\\n    // マイクテスト完了フラグを保存\\n    localStorage.setItem('mic-test-completed', 'true');\\n    console.log('✅ [MicTest] マイクテスト完了フラグを保存');\\n    goto(\`\${base}\${selectedMode.path}?from=microphone-test\`);\\n  }\\n\\n  // PitchDetectorコンポーネントからのイベントハンドラー\\n  function handlePitchUpdate(event) {\\n    const { frequency, note, volume, rawVolume, clarity } = event.detail;\\n    \\n    currentFrequency = frequency;\\n    detectedNote = note;\\n    currentVolume = volume;\\n  }\\n  \\n  function handlePitchDetectorStateChange(event) {\\n    // ログ削除（シンプル版）\\n  }\\n  \\n  function handlePitchDetectorError(event) {\\n    console.error('❌ [MicTest] PitchDetectorエラー:', event.detail);\\n    \\n    const { error, reason, recovery } = event.detail;\\n    \\n    // MediaStream終了エラーの場合は自動復旧を試行\\n    if (reason === 'mediastream_ended' && recovery === 'restart_required') {\\n      console.log('🔄 [MicTest] MediaStream終了検出 - 自動復旧開始');\\n      \\n      // マイク許可状態をリセット\\n      micPermission = 'initial';\\n      \\n      // 検出データをリセット\\n      currentVolume = 0;\\n      currentFrequency = 0;\\n      detectedNote = 'ーー';\\n      \\n      // ユーザーに再許可を促すメッセージ（自動的に表示される）\\n      console.log('⚠️ [MicTest] マイク再許可が必要です');\\n    }\\n  }\\n\\n\\n\\n  // マイク許可完了時の処理を拡張\\n  async function onMicrophoneGranted() {\\n    // iPadマイク安定化処理\\n    if (platformSpecs && (platformSpecs.deviceType === 'iPad')) {\\n      console.log('🔧 [MicTest] iPad検出 - マイク感度7.0x自動設定開始');\\n      \\n      // iPad専用: 7.0x感度で安定化\\n      audioManager.setSensitivity(7.0);\\n      \\n      console.log('✅ [MicTest] iPad マイク感度7.0x自動設定完了');\\n      \\n      // AudioManager再初期化でマイク接続安定化\\n      try {\\n        await audioManager.initialize();\\n        console.log('🔄 [MicTest] iPad用AudioManager再初期化完了');\\n      } catch (error) {\\n        console.warn('⚠️ [MicTest] AudioManager再初期化エラー:', error);\\n      }\\n    }\\n  }\\n<\/script>\\n\\n<svelte:head>\\n  <title>マイクテスト - 相対音感トレーニング</title>\\n</svelte:head>\\n\\n<PageLayout showBackButton={true}>\\n  <div class=\\"microphone-test\\">\\n    <!-- ヘッダー -->\\n    <div class=\\"header\\">\\n      <div class=\\"mic-test-header\\">\\n        <div class=\\"mic-icon\\">\\n          <svg width=\\"48\\" height=\\"48\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n            <path d=\\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\\"/>\\n            <path d=\\"M19 10v2a7 7 0 0 1-14 0v-2\\"/>\\n            <line x1=\\"12\\" x2=\\"12\\" y1=\\"19\\" y2=\\"22\\"/>\\n            <line x1=\\"8\\" x2=\\"16\\" y1=\\"22\\" y2=\\"22\\"/>\\n          </svg>\\n        </div>\\n        <div>\\n          <h1 class=\\"mic-test-title\\">マイクテスト</h1>\\n          <p class=\\"mic-test-description\\">音感トレーニングを始める前に、マイクの動作を確認します</p>\\n        </div>\\n      </div>\\n    </div>\\n\\n    <!-- トレーニングモード情報 -->\\n    <div class=\\"training-mode-info\\">\\n      <Card variant=\\"default\\" padding=\\"lg\\">\\n        <div class=\\"training-mode-content\\">\\n          {#if micPermission === 'granted'}\\n            <!-- マイク許可完了 -->\\n            <h3 class=\\"ready-title\\">マイク準備完了</h3>\\n            <p class=\\"ready-description\\">トレーニングを開始してください</p>\\n            \\n            <div class=\\"training-start-button-area\\">\\n              <button class=\\"training-start-button enabled\\" on:click={startTraining}>\\n                トレーニング開始\\n              </button>\\n            </div>\\n          {:else}\\n            <!-- マイクテスト説明 -->\\n            <h3 class=\\"instructions-title\\">マイクのテストを開始します</h3>\\n            <p class=\\"instructions-description\\">マイクテスト開始ボタンを押してマイクの使用を許可してください</p>\\n            \\n            {#if micPermission === 'pending'}\\n              <p class=\\"status-text\\">マイク準備中...</p>\\n            {:else if micPermission === 'denied'}\\n              <div class=\\"mic-test-button-area\\">\\n                <button class=\\"mic-test-button retry\\" on:click={requestMicrophone}>\\n                  マイク許可を再試行\\n                </button>\\n              </div>\\n            {:else if micPermission === 'initial'}\\n              <div class=\\"mic-test-button-area\\">\\n                <button class=\\"mic-test-button start\\" on:click={requestMicrophone}>\\n                  マイクテストを開始\\n                </button>\\n              </div>\\n            {/if}\\n          {/if}\\n        </div>\\n      </Card>\\n    </div>\\n\\n    <!-- リアルタイム音程検出エリア（常時表示） -->\\n    <PitchDetectionDisplay\\n      frequency={currentFrequency}\\n      note={detectedNote}\\n      volume={currentVolume}\\n      isMuted={micPermission !== 'granted'}\\n      muteMessage=\\"マイク許可後に開始\\"\\n    />\\n    \\n    <!-- PitchDetectorコンポーネント（非表示・検出処理のみ） -->\\n    <div style=\\"display: none;\\">\\n      <PitchDetector\\n        bind:this={pitchDetectorComponent}\\n        isActive={micPermission === 'granted'}\\n        on:pitchUpdate={handlePitchUpdate}\\n        on:stateChange={handlePitchDetectorStateChange}\\n        on:error={handlePitchDetectorError}\\n        className=\\"pitch-detector-content\\"\\n        debugMode={false}\\n      />\\n    </div>\\n\\n  </div>\\n</PageLayout>\\n\\n<style>\\n  .microphone-test {\\n    max-width: 800px;\\n    margin: 0 auto;\\n    display: flex;\\n    flex-direction: column;\\n    gap: var(--space-6);\\n  }\\n\\n  .header {\\n    text-align: center;\\n  }\\n\\n  .mic-test-header {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: var(--space-4);\\n    margin-bottom: var(--space-4);\\n  }\\n\\n  .mic-icon {\\n    width: 64px;\\n    height: 64px;\\n    border-radius: 50%;\\n    background-color: #dbeafe;\\n    color: #2563eb;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    flex-shrink: 0;\\n  }\\n\\n  .mic-test-title {\\n    font-size: var(--text-2xl);\\n    font-weight: 700;\\n    color: var(--color-gray-900);\\n    margin: 0 0 var(--space-2) 0;\\n  }\\n\\n  .mic-test-description {\\n    font-size: var(--text-base);\\n    color: var(--color-gray-600);\\n    margin: 0;\\n  }\\n\\n  .training-mode-info {\\n    margin-bottom: var(--space-6);\\n  }\\n\\n  .training-mode-content {\\n    text-align: center;\\n  }\\n\\n\\n  .instructions-title {\\n    font-size: var(--text-xl);\\n    font-weight: 600;\\n    color: var(--color-gray-900);\\n    margin: var(--space-4) 0 var(--space-2) 0;\\n    text-align: center;\\n  }\\n\\n  .instructions-description {\\n    font-size: var(--text-sm);\\n    color: var(--color-gray-600);\\n    margin: 0;\\n    text-align: center;\\n  }\\n\\n  .status-text {\\n    font-size: var(--text-lg);\\n    font-weight: 600;\\n    color: var(--color-gray-900);\\n    margin: var(--space-6) 0;\\n    text-align: center;\\n  }\\n\\n\\n  .ready-title {\\n    font-size: var(--text-xl);\\n    font-weight: 600;\\n    color: #2563eb;\\n    margin: var(--space-4) 0 var(--space-2) 0;\\n    text-align: center;\\n  }\\n\\n  .ready-description {\\n    font-size: var(--text-sm);\\n    color: var(--color-gray-600);\\n    margin: 0 0 var(--space-6) 0;\\n    text-align: center;\\n  }\\n\\n  .mic-test-button-area,\\n  .training-start-button-area {\\n    margin-top: var(--space-6);\\n    display: flex;\\n    justify-content: center;\\n  }\\n\\n  .mic-test-button {\\n    max-width: 300px;\\n    width: 100%;\\n    padding: 12px 16px;\\n    border: none;\\n    border-radius: 8px;\\n    font-size: 14px;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: background-color 0.2s ease-in-out;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 8px;\\n  }\\n\\n  .mic-test-button.start {\\n    background-color: #2563eb;\\n    color: white;\\n  }\\n\\n  .mic-test-button.start:hover {\\n    background-color: #1d4ed8;\\n  }\\n\\n\\n  .mic-test-button.retry {\\n    background-color: #dc2626;\\n    color: white;\\n  }\\n\\n  .mic-test-button.retry:hover {\\n    background-color: #b91c1c;\\n  }\\n\\n  .training-start-button {\\n    max-width: 300px;\\n    width: 100%;\\n    padding: 12px 16px;\\n    border: none;\\n    border-radius: 8px;\\n    font-size: 14px;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: background-color 0.2s ease-in-out;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 8px;\\n    background-color: #059669;\\n    color: white;\\n  }\\n\\n  .training-start-button.enabled:hover {\\n    background-color: #047857;\\n  }\\n\\n  .mic-status-granted {\\n    margin-bottom: var(--space-4);\\n    text-align: center;\\n  }\\n\\n  .status-indicator.success {\\n    background-color: #d1fae5;\\n    color: #065f46;\\n    border: 1px solid #34d399;\\n  }\\n\\n  .mic-test-content {\\n    text-align: center;\\n  }\\n\\n  .mic-status {\\n    margin-bottom: var(--space-6);\\n    display: flex;\\n    flex-direction: column;\\n    gap: var(--space-2);\\n  }\\n\\n\\n  .start-button,\\n  .retry-button {\\n    max-width: 300px;\\n    width: 100%;\\n    margin: 0 auto;\\n    padding: 12px 16px;\\n    background-color: #2563eb;\\n    color: white;\\n    border: none;\\n    border-radius: 8px;\\n    font-size: 14px;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: background-color 0.2s ease-in-out;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 8px;\\n  }\\n\\n  .start-button:hover,\\n  .retry-button:hover {\\n    background-color: #1d4ed8;\\n  }\\n\\n  .training-button {\\n    max-width: 300px;\\n    width: 100%;\\n    margin: 0 auto;\\n    padding: 12px 16px;\\n    border: none;\\n    border-radius: 8px;\\n    font-size: 14px;\\n    font-weight: 500;\\n    cursor: pointer;\\n    transition: background-color 0.2s ease-in-out;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 8px;\\n  }\\n\\n  .training-button.enabled {\\n    background-color: #059669;\\n    color: white;\\n  }\\n\\n  .training-button.enabled:hover {\\n    background-color: #047857;\\n  }\\n\\n  .training-button.disabled {\\n    background-color: #f3f4f6;\\n    color: #9ca3af;\\n    cursor: not-allowed;\\n  }\\n\\n  .guidance-text {\\n    font-size: var(--text-sm);\\n    color: #2563eb;\\n    font-weight: 600;\\n    margin-bottom: var(--space-2);\\n    text-align: center;\\n  }\\n\\n\\n  .ready-title {\\n    color: #059669;\\n    font-size: var(--text-lg);\\n    font-weight: 600;\\n    text-align: center;\\n    margin-bottom: var(--space-2);\\n  }\\n\\n  .ready-description {\\n    color: #6b7280;\\n    text-align: center;\\n    margin-bottom: var(--space-4);\\n  }\\n\\n\\n  @media (min-width: 768px) {\\n    .mic-test-header {\\n      flex-direction: row;\\n      text-align: left;\\n    }\\n  }\\n\\n  /* カードスタイル（shadcn/ui風） */\\n  :global(.main-card) {\\n    border: 1px solid hsl(214.3 31.8% 91.4%) !important;\\n    background: hsl(0 0% 100%) !important;\\n    border-radius: 8px !important;\\n    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;\\n    margin-bottom: 1.5rem;\\n  }\\n</style>"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  let micPermission = "initial";
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = "ーー";
  let pitchDetectorComponent = null;
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-8st1fo_START -->${$$result.title = `<title>マイクテスト - 相対音感トレーニング</title>`, ""}<!-- HEAD_svelte-8st1fo_END -->`, ""} ${validate_component(PageLayout, "PageLayout").$$render($$result, { showBackButton: true }, {}, {
      default: () => {
        return `<div class="microphone-test svelte-1v6hvj0"> <div class="header svelte-1v6hvj0" data-svelte-h="svelte-4qcd63"><div class="mic-test-header svelte-1v6hvj0"><div class="mic-icon svelte-1v6hvj0"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line><line x1="8" x2="16" y1="22" y2="22"></line></svg></div> <div><h1 class="mic-test-title svelte-1v6hvj0">マイクテスト</h1> <p class="mic-test-description svelte-1v6hvj0">音感トレーニングを始める前に、マイクの動作を確認します</p></div></div></div>  <div class="training-mode-info svelte-1v6hvj0">${validate_component(Card, "Card").$$render($$result, { variant: "default", padding: "lg" }, {}, {
          default: () => {
            return `<div class="training-mode-content svelte-1v6hvj0">${` <h3 class="instructions-title svelte-1v6hvj0" data-svelte-h="svelte-gfi16f">マイクのテストを開始します</h3> <p class="instructions-description svelte-1v6hvj0" data-svelte-h="svelte-1w19y1h">マイクテスト開始ボタンを押してマイクの使用を許可してください</p> ${`${`${`<div class="mic-test-button-area svelte-1v6hvj0"><button class="mic-test-button start svelte-1v6hvj0" data-svelte-h="svelte-caex95">マイクテストを開始</button></div>`}`}`}`}</div>`;
          }
        })}</div>  ${validate_component(PitchDetectionDisplay, "PitchDetectionDisplay").$$render(
          $$result,
          {
            frequency: currentFrequency,
            note: detectedNote,
            volume: currentVolume,
            isMuted: micPermission !== "granted",
            muteMessage: "マイク許可後に開始"
          },
          {},
          {}
        )}  <div style="display: none;">${validate_component(PitchDetector_1, "PitchDetector").$$render(
          $$result,
          {
            isActive: micPermission === "granted",
            className: "pitch-detector-content",
            debugMode: false,
            this: pitchDetectorComponent
          },
          {
            this: ($$value) => {
              pitchDetectorComponent = $$value;
              $$settled = false;
            }
          },
          {}
        )}</div></div>`;
      }
    })}`;
  } while (!$$settled);
  $$unsubscribe_page();
  return $$rendered;
});
export {
  Page as default
};
