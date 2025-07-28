import { c as create_ssr_component, g as add_attribute, e as escape, h as createEventDispatcher, o as onDestroy, v as validate_component } from "./ssr.js";
import { PitchDetector } from "pitchy";
import { C as Card } from "./PageLayout.js";
const css$2 = {
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
  $$result.css.add(css$2);
  return `<div class="${"volume-bar-container " + escape(className, true) + " svelte-13z7ppf"}"><div class="volume-bar-bg" style="${"height: " + escape(height, true) + "; border-radius: 9999px; background-color: #e2e8f0; position: relative; overflow: hidden;"}"><div class="volume-bar-fill" style="position: absolute; top: 0; left: 0; height: 100%;"${add_attribute("this", barElement, 0)}></div></div>  <div class="threshold-indicator svelte-13z7ppf" style="${"position: absolute; top: 0; left: " + escape(threshold, true) + "%; width: 2px; height: " + escape(height, true) + "; background-color: #64748b; border-radius: 1px;"}"></div> </div>`;
});
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.analysers = /* @__PURE__ */ new Map();
    this.filters = /* @__PURE__ */ new Map();
    this.refCount = 0;
    this.initPromise = null;
    this.isInitialized = false;
    this.lastError = null;
  }
  /**
   * 音声リソースの初期化
   * 複数回呼ばれても安全（シングルトン的動作）
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }
    if (this.isInitialized && this.audioContext && this.mediaStream) {
      const healthCheck = this.checkMediaStreamHealth();
      if (healthCheck.healthy) {
        this.refCount++;
        return {
          audioContext: this.audioContext,
          mediaStream: this.mediaStream,
          sourceNode: this.sourceNode
        };
      } else {
        console.warn("⚠️ [AudioManager] MediaStream不健康検出 - 強制再初期化:", healthCheck.reason);
        console.log("🔄 [AudioManager] 不健康なMediaStream詳細:", {
          mediaStreamActive: this.mediaStream?.active,
          trackCount: this.mediaStream?.getTracks().length,
          trackStates: this.mediaStream?.getTracks().map((t) => ({
            kind: t.kind,
            readyState: t.readyState,
            enabled: t.enabled,
            muted: t.muted
          }))
        });
        this._cleanup();
        this.isInitialized = false;
        this.refCount = 0;
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("🔄 [AudioManager] クリーンアップ完了 - 再初期化開始");
      }
    }
    this.initPromise = this._doInitialize();
    try {
      const result = await this.initPromise;
      this.initPromise = null;
      return result;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }
  /**
   * 実際の初期化処理
   */
  async _doInitialize() {
    try {
      console.log("🎤 [AudioManager] 初期化開始");
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("✅ [AudioManager] AudioContext作成完了");
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        console.log("✅ [AudioManager] AudioContext再開完了");
      }
      if (!this.mediaStream) {
        const audioConstraints = {
          audio: {
            // 基本設定：Safari WebKit安定性重視
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // Safari対応: 明示的品質設定
            sampleRate: 44100,
            channelCount: 1,
            sampleSize: 16,
            // Safari WebKit追加安定化設定
            latency: 0.1,
            // 100ms遅延許容
            volume: 1,
            // 音量正規化
            // デバイス選択を柔軟に（Safari対応）
            deviceId: { ideal: "default" }
          }
        };
        console.log("🎤 [AudioManager] Safari対応設定でMediaStream取得中:", audioConstraints);
        this.mediaStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        console.log("✅ [AudioManager] MediaStream取得完了");
      }
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        console.log("✅ [AudioManager] SourceNode作成完了");
        const tracks = this.mediaStream.getTracks();
        console.log("🎤 [AudioManager] MediaStream tracks:", tracks.map((t) => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        })));
      }
      this.isInitialized = true;
      this.refCount++;
      this.lastError = null;
      console.log(`🎤 [AudioManager] 初期化完了 (参照カウント: ${this.refCount})`);
      return {
        audioContext: this.audioContext,
        mediaStream: this.mediaStream,
        sourceNode: this.sourceNode
      };
    } catch (error) {
      console.error("❌ [AudioManager] 初期化エラー:", error);
      this.lastError = error;
      this.isInitialized = false;
      this._cleanup();
      throw error;
    }
  }
  /**
   * 専用のAnalyserNodeを作成
   * @param {string} id - Analyser識別子
   * @param {Object} options - オプション設定
   */
  createAnalyser(id, options = {}) {
    if (!this.isInitialized || !this.audioContext || !this.sourceNode) {
      throw new Error("AudioManager not initialized. Call initialize() first.");
    }
    this.removeAnalyser(id);
    const {
      fftSize = 2048,
      smoothingTimeConstant = 0.8,
      minDecibels = -90,
      maxDecibels = -10,
      useFilters = true
    } = options;
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = Math.min(fftSize, 2048);
    analyser.smoothingTimeConstant = Math.max(smoothingTimeConstant, 0.7);
    analyser.minDecibels = Math.max(minDecibels, -80);
    analyser.maxDecibels = Math.min(maxDecibels, -10);
    this.sourceNode;
    if (useFilters) {
      const filterChain = this._createFilterChain();
      this.filters.set(id, filterChain);
      this.sourceNode.connect(filterChain.highpass);
      filterChain.highpass.connect(filterChain.lowpass);
      filterChain.lowpass.connect(filterChain.notch);
      filterChain.notch.connect(analyser);
      console.log(`🔧 [AudioManager] フィルター付きAnalyser作成: ${id}`);
    } else {
      this.sourceNode.connect(analyser);
      console.log(`🔧 [AudioManager] 生信号Analyser作成: ${id}`);
    }
    this.analysers.set(id, analyser);
    return analyser;
  }
  /**
   * 3段階ノイズリダクションフィルターチェーン作成
   */
  _createFilterChain() {
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(80, this.audioContext.currentTime);
    highpass.Q.setValueAtTime(0.7, this.audioContext.currentTime);
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(800, this.audioContext.currentTime);
    lowpass.Q.setValueAtTime(0.7, this.audioContext.currentTime);
    const notch = this.audioContext.createBiquadFilter();
    notch.type = "notch";
    notch.frequency.setValueAtTime(60, this.audioContext.currentTime);
    notch.Q.setValueAtTime(10, this.audioContext.currentTime);
    return { highpass, lowpass, notch };
  }
  /**
   * 特定のAnalyserを削除
   */
  removeAnalyser(id) {
    if (this.analysers.has(id)) {
      const analyser = this.analysers.get(id);
      analyser.disconnect();
      this.analysers.delete(id);
      console.log(`🗑️ [AudioManager] Analyser削除: ${id}`);
    }
    if (this.filters.has(id)) {
      const filterChain = this.filters.get(id);
      filterChain.highpass.disconnect();
      filterChain.lowpass.disconnect();
      filterChain.notch.disconnect();
      this.filters.delete(id);
      console.log(`🗑️ [AudioManager] フィルターチェーン削除: ${id}`);
    }
  }
  /**
   * 参照カウント減算とクリーンアップ
   */
  release(analyserIds = []) {
    analyserIds.forEach((id) => this.removeAnalyser(id));
    this.refCount = Math.max(0, this.refCount - 1);
    console.log(`📉 [AudioManager] 参照カウント減算: ${this.refCount}`);
    if (this.refCount <= 0) {
      console.log("🧹 [AudioManager] 全リソースクリーンアップ開始");
      this._cleanup();
    }
  }
  /**
   * 強制クリーンアップ（緊急時用）
   */
  forceCleanup() {
    console.log("🚨 [AudioManager] 強制クリーンアップ実行");
    this._cleanup();
  }
  /**
   * 内部クリーンアップ処理
   */
  _cleanup() {
    console.log("🧹 [AudioManager] クリーンアップ開始");
    for (const id of this.analysers.keys()) {
      this.removeAnalyser(id);
    }
    if (this.mediaStream) {
      const tracks = this.mediaStream.getTracks();
      console.log(`🛑 [AudioManager] MediaStream停止中: ${tracks.length} tracks`);
      tracks.forEach((track, index) => {
        try {
          if (track.readyState !== "ended") {
            track.stop();
            console.log(`🛑 [AudioManager] Track ${index} 停止完了`);
          } else {
            console.log(`⚠️ [AudioManager] Track ${index} 既に終了済み`);
          }
        } catch (error) {
          console.warn(`⚠️ [AudioManager] Track ${index} 停止エラー:`, error);
        }
      });
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
        console.log("🛑 [AudioManager] AudioContext閉鎖完了");
      } catch (error) {
        console.warn("⚠️ [AudioManager] AudioContext閉鎖エラー:", error);
      }
      this.audioContext = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isInitialized = false;
    this.refCount = 0;
    this.initPromise = null;
    console.log("✅ [AudioManager] クリーンアップ完了");
  }
  /**
   * 現在の状態取得（デバッグ用）
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      refCount: this.refCount,
      audioContextState: this.audioContext?.state || "none",
      mediaStreamActive: this.mediaStream?.active || false,
      activeAnalysers: Array.from(this.analysers.keys()),
      activeFilters: Array.from(this.filters.keys()),
      lastError: this.lastError
    };
  }
  /**
   * MediaStream健康状態チェック
   */
  checkMediaStreamHealth() {
    if (!this.mediaStream) {
      return { healthy: false, reason: "MediaStream not initialized" };
    }
    if (!this.mediaStream.active) {
      return { healthy: false, reason: "MediaStream inactive" };
    }
    const tracks = this.mediaStream.getTracks();
    if (tracks.length === 0) {
      return { healthy: false, reason: "No tracks available" };
    }
    const audioTrack = tracks.find((track) => track.kind === "audio");
    if (!audioTrack) {
      return { healthy: false, reason: "No audio track found" };
    }
    if (audioTrack.readyState === "ended") {
      return { healthy: false, reason: "Audio track ended" };
    }
    if (!audioTrack.enabled) {
      return { healthy: false, reason: "Audio track disabled" };
    }
    if (audioTrack.muted) {
      return { healthy: false, reason: "Audio track muted" };
    }
    if (this.mediaStream.active && audioTrack.readyState !== "live") {
      return { healthy: false, reason: "Track state inconsistent with MediaStream" };
    }
    return { healthy: true, track: audioTrack };
  }
}
const audioManager = new AudioManager();
if (typeof window !== "undefined" && true) {
  window.audioManager = audioManager;
}
const css$1 = {
  code: ".pitch-detector.svelte-vc1bho{padding:1rem}.detection-display.svelte-vc1bho{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-vc1bho{display:inline-flex;align-items:baseline;gap:0.5rem;padding:1rem 1.5rem;background:hsl(0 0% 100%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;width:fit-content}.detected-frequency.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(222.2 84% 4.9%);font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;min-width:4ch;text-align:right;display:inline-block;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.hz-suffix.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(222.2 84% 4.9%)}.divider.svelte-vc1bho{color:hsl(214.3 31.8% 70%);font-size:1.5rem;margin:0 0.25rem;font-weight:300}.detected-note.svelte-vc1bho{font-weight:600;font-size:2rem;color:hsl(215.4 16.3% 46.9%);font-family:'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;min-width:3ch;display:inline-block;text-align:center}.volume-bar{border-radius:4px !important}",
  map: `{"version":3,"file":"PitchDetector.svelte","sources":["PitchDetector.svelte"],"sourcesContent":["<script>\\n  import { onMount, onDestroy, createEventDispatcher } from 'svelte';\\n  import { PitchDetector } from 'pitchy';\\n  import VolumeBar from './VolumeBar.svelte';\\n  import { audioManager } from '$lib/audio/AudioManager.js';\\n\\n  const dispatch = createEventDispatcher();\\n\\n  // Props\\n  export let isActive = false;\\n  export let className = '';\\n  export let debugMode = false; // デバッグモード\\n\\n  // 状態管理（改訂版）\\n  let componentState = 'uninitialized'; // 'uninitialized' | 'initializing' | 'ready' | 'detecting' | 'error'\\n  let lastError = null;\\n  let isInitialized = false;\\n\\n  // 音程検出状態（外部AudioContext対応）\\n  let audioContext = null;        // AudioManagerから取得\\n  let mediaStream = null;         // AudioManagerから取得\\n  let sourceNode = null;          // AudioManagerから取得\\n  let analyser = null;            // AudioManagerから取得\\n  let rawAnalyser = null;         // AudioManagerから取得\\n  let pitchDetector = null;\\n  let animationFrame = null;\\n  let isDetecting = false;\\n\\n  // AudioManager関連\\n  let analyserIds = [];           // 作成したAnalyserのID管理\\n  let mediaStreamListeners = new Map(); // MediaStreamイベントリスナー管理\\n\\n  // 検出データ\\n  let currentVolume = 0;\\n  let rawVolume = 0;\\n  let currentFrequency = 0;\\n  let detectedNote = 'ーー';\\n  let pitchClarity = 0;\\n  \\n  // 安定化用バッファ\\n  let frequencyHistory = [];\\n  let volumeHistory = [];\\n  let stableFrequency = 0;\\n  let stableVolume = 0;\\n  \\n  // 倍音補正用\\n  let previousFrequency = 0;\\n  let harmonicHistory = [];\\n  \\n  // デバッグ用\\n  let debugInterval = null;\\n  \\n  // 表示状態リセット関数（外部から呼び出し可能）\\n  export function resetDisplayState() {\\n    currentVolume = 0;\\n    rawVolume = 0;\\n    currentFrequency = 0;\\n    detectedNote = 'ーー';\\n    pitchClarity = 0;\\n    stableFrequency = 0;\\n    stableVolume = 0;\\n    previousFrequency = 0;\\n    \\n    // バッファクリア\\n    frequencyHistory = [];\\n    volumeHistory = [];\\n    harmonicHistory = [];\\n    \\n    if (debugMode) {\\n      console.log('🔄 [PitchDetector] Display state reset');\\n    }\\n  }\\n  \\n  // マイク状態チェック関数（デバッグ用）\\n  function checkMicrophoneStatus() {\\n    if (!debugMode) return;\\n    \\n    const timestamp = new Date().toLocaleTimeString();\\n    const status = {\\n      timestamp,\\n      componentState,\\n      isActive,\\n      isDetecting,\\n      isInitialized,\\n      mediaStreamActive: mediaStream ? mediaStream.active : null,\\n      mediaStreamTracks: mediaStream ? mediaStream.getTracks().length : 0,\\n      trackStates: mediaStream ? mediaStream.getTracks().map(track => ({\\n        kind: track.kind,\\n        enabled: track.enabled,\\n        readyState: track.readyState,\\n        muted: track.muted\\n      })) : [],\\n      audioContextState: audioContext ? audioContext.state : null,\\n      hasAnalyser: !!analyser,\\n      currentVolume,\\n      currentFrequency\\n    };\\n    \\n    console.log(\`🎤 [PitchDetector] \${timestamp}:\`, status);\\n    \\n    // マイク状態の異常を検知して親に通知\\n    let microphoneHealthy = true;\\n    let errorDetails = [];\\n    \\n    // MediaStreamの状態が異常な場合は警告\\n    if (mediaStream && !mediaStream.active) {\\n      console.warn(\`⚠️ [PitchDetector] MediaStream is inactive!\`, mediaStream);\\n      microphoneHealthy = false;\\n      errorDetails.push('MediaStream inactive');\\n    }\\n    \\n    // AudioContextの状態が異常な場合は警告\\n    if (audioContext && audioContext.state === 'suspended') {\\n      console.warn(\`⚠️ [PitchDetector] AudioContext is suspended!\`, audioContext);\\n      microphoneHealthy = false;\\n      errorDetails.push('AudioContext suspended');\\n    }\\n    \\n    // トラックの状態をチェック\\n    if (mediaStream) {\\n      mediaStream.getTracks().forEach((track, index) => {\\n        if (track.readyState === 'ended') {\\n          console.error(\`❌ [PitchDetector] Track \${index} has ended!\`, track);\\n          microphoneHealthy = false;\\n          errorDetails.push(\`Track \${index} ended\`);\\n        }\\n      });\\n    }\\n    \\n    // マイク状態変化を親に通知\\n    dispatch('microphoneHealthChange', {\\n      healthy: microphoneHealthy,\\n      errors: errorDetails,\\n      details: status\\n    });\\n  }\\n  \\n  // デバッグモードの監視\\n  $: if (debugMode && !debugInterval) {\\n    console.log('🔍 [PitchDetector] Debug mode enabled - starting status monitoring');\\n    debugInterval = setInterval(checkMicrophoneStatus, 3000); // 3秒間隔\\n    checkMicrophoneStatus(); // 即座に1回実行\\n  } else if (!debugMode && debugInterval) {\\n    console.log('🔍 [PitchDetector] Debug mode disabled - stopping status monitoring');\\n    clearInterval(debugInterval);\\n    debugInterval = null;\\n  }\\n\\n  // 初期化（AudioManager対応版）\\n  export async function initialize() {\\n    try {\\n      componentState = 'initializing';\\n      lastError = null;\\n      \\n      console.log('🎙️ [PitchDetector] AudioManager経由で初期化開始');\\n      \\n      // AudioManagerから共有リソースを取得\\n      const resources = await audioManager.initialize();\\n      audioContext = resources.audioContext;\\n      mediaStream = resources.mediaStream;\\n      sourceNode = resources.sourceNode;\\n      \\n      console.log('✅ [PitchDetector] AudioManager リソース取得完了');\\n      \\n      // 専用のAnalyserを作成（フィルター付き）\\n      const filteredAnalyserId = \`pitch-detector-filtered-\${Date.now()}\`;\\n      analyser = audioManager.createAnalyser(filteredAnalyserId, {\\n        fftSize: 2048,\\n        smoothingTimeConstant: 0.8,\\n        minDecibels: -90,\\n        maxDecibels: -10,\\n        useFilters: true\\n      });\\n      analyserIds.push(filteredAnalyserId);\\n      \\n      // 生信号用Analyser（比較用）\\n      const rawAnalyserId = \`pitch-detector-raw-\${Date.now()}\`;\\n      rawAnalyser = audioManager.createAnalyser(rawAnalyserId, {\\n        fftSize: 2048,\\n        smoothingTimeConstant: 0.8,\\n        minDecibels: -90,\\n        maxDecibels: -10,\\n        useFilters: false\\n      });\\n      analyserIds.push(rawAnalyserId);\\n      \\n      console.log('✅ [PitchDetector] Analyser作成完了:', analyserIds);\\n      \\n      // PitchDetector初期化\\n      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);\\n      \\n      // 初期化完了\\n      componentState = 'ready';\\n      isInitialized = true;\\n      \\n      // 状態変更を通知\\n      dispatch('stateChange', { state: componentState });\\n      \\n      // MediaStreamの健康状態監視を開始\\n      setupMediaStreamMonitoring();\\n      \\n      console.log('✅ [PitchDetector] 初期化完了');\\n      \\n    } catch (error) {\\n      console.error('❌ [PitchDetector] 初期化エラー:', error);\\n      componentState = 'error';\\n      lastError = error;\\n      isInitialized = false;\\n      \\n      // エラーを通知\\n      dispatch('error', { error, context: 'initialization' });\\n      \\n      throw error;\\n    }\\n  }\\n\\n  // 検出開始（改訂版）\\n  export function startDetection() {\\n    if (componentState !== 'ready') {\\n      const error = new Error(\`Cannot start detection: component state is \${componentState}\`);\\n      dispatch('error', { error, context: 'start-detection' });\\n      return false;\\n    }\\n    \\n    if (!analyser || !pitchDetector || !audioContext) {\\n      const error = new Error('Required components not available');\\n      componentState = 'error';\\n      dispatch('error', { error, context: 'start-detection' });\\n      return false;\\n    }\\n    \\n    componentState = 'detecting';\\n    isDetecting = true;\\n    dispatch('stateChange', { state: componentState });\\n    detectPitch();\\n    return true;\\n  }\\n\\n  // 検出停止（改訂版）\\n  export function stopDetection() {\\n    isDetecting = false;\\n    if (animationFrame) {\\n      cancelAnimationFrame(animationFrame);\\n      animationFrame = null;\\n    }\\n    \\n    // 状態を ready に戻す（初期化済みの場合）\\n    if (componentState === 'detecting' && isInitialized) {\\n      componentState = 'ready';\\n      dispatch('stateChange', { state: componentState });\\n    }\\n    \\n  }\\n\\n  // リアルタイム音程検出\\n  function detectPitch() {\\n    if (!isDetecting || !analyser || !rawAnalyser || !pitchDetector) return;\\n    \\n    const bufferLength = analyser.fftSize;\\n    const buffer = new Float32Array(bufferLength);\\n    const rawBuffer = new Float32Array(rawAnalyser.fftSize);\\n    \\n    analyser.getFloatTimeDomainData(buffer);\\n    rawAnalyser.getFloatTimeDomainData(rawBuffer);\\n    \\n    // 音量計算（フィルター後）\\n    let sum = 0;\\n    for (let i = 0; i < bufferLength; i++) {\\n      sum += Math.abs(buffer[i]);\\n    }\\n    const rms = Math.sqrt(sum / bufferLength);\\n    const logVolume = Math.log10(rms + 0.001) * 50 + 100;\\n    const rawCurrentVolume = Math.max(0, Math.min(100, logVolume));\\n    \\n    // 生音量計算（フィルター前）\\n    let rawSum = 0;\\n    for (let i = 0; i < rawBuffer.length; i++) {\\n      rawSum += Math.abs(rawBuffer[i]);\\n    }\\n    const rawRms = Math.sqrt(rawSum / rawBuffer.length);\\n    const rawLogVolume = Math.log10(rawRms + 0.001) * 50 + 100;\\n    rawVolume = Math.max(0, Math.min(100, rawLogVolume));\\n    \\n    // 音量の安定化（5フレーム移動平均）\\n    volumeHistory.push(rawCurrentVolume);\\n    if (volumeHistory.length > 5) {\\n      volumeHistory.shift();\\n    }\\n    stableVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;\\n    currentVolume = stableVolume;\\n    \\n    // 音程検出（PitchDetector使用）\\n    const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContext.sampleRate);\\n    \\n    // 人間音域フィルタリング（実用調整）\\n    // 実際の人間の声域に最適化:\\n    // - 低域: 65Hz以上（C2以上、男性最低音域考慮）  \\n    // - 高域: 1200Hz以下（実用的な歌唱範囲）\\n    // - 極低音域ノイズ（G-1等）は確実に除外\\n    const isValidVocalRange = pitch >= 65 && pitch <= 1200;\\n    \\n    if (pitch && clarity > 0.6 && currentVolume > 10 && isValidVocalRange) {\\n      // 倍音補正システム適用\\n      const correctedFreq = correctHarmonicFrequency(pitch, previousFrequency);\\n      \\n      // 基音安定化システム適用\\n      const stabilizedFreq = stabilizeFrequency(correctedFreq);\\n      \\n      // 周波数表示を更新\\n      currentFrequency = Math.round(stabilizedFreq);\\n      detectedNote = frequencyToNote(currentFrequency);\\n      pitchClarity = clarity;\\n      \\n      // 次回比較用に保存\\n      previousFrequency = currentFrequency;\\n      \\n    } else {\\n      // 信号が弱い場合は倍音履歴をクリア\\n      if (harmonicHistory.length > 0) {\\n        harmonicHistory = [];\\n      }\\n      \\n      // 音程がない場合は前回周波数をリセット\\n      if (currentFrequency === 0) {\\n        previousFrequency = 0;\\n      }\\n      \\n      // 周波数表示をクリア\\n      currentFrequency = 0;\\n      detectedNote = 'ーー';\\n      pitchClarity = 0;\\n    }\\n    \\n    // 音程が検出されない場合はVolumeBarも0に（極低音域ノイズ対策）\\n    const displayVolume = currentFrequency > 0 ? rawVolume : 0;\\n    \\n    \\n    // 親コンポーネントにデータを送信\\n    \\n    dispatch('pitchUpdate', {\\n      frequency: currentFrequency,\\n      note: detectedNote,\\n      volume: currentVolume,\\n      rawVolume: displayVolume,\\n      clarity: pitchClarity\\n    });\\n    \\n    animationFrame = requestAnimationFrame(detectPitch);\\n  }\\n\\n  // 音楽的妥当性評価\\n  function calculateMusicalScore(frequency) {\\n    const C4 = 261.63; // Middle C\\n    \\n    // 最も近い半音階音名への距離を計算\\n    const semitonesFromC4 = Math.log2(frequency / C4) * 12;\\n    const nearestSemitone = Math.round(semitonesFromC4);\\n    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);\\n    \\n    // 半音階に近いほど高スコア（±50セント以内で最高点）\\n    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));\\n  }\\n\\n  // 倍音補正システム\\n  function correctHarmonicFrequency(detectedFreq, previousFreq) {\\n    // 基音候補生成（オクターブ違いを考慮）\\n    const fundamentalCandidates = [\\n      detectedFreq,          // そのまま（基音の可能性）\\n      detectedFreq / 2.0,    // 1オクターブ下（2倍音 → 基音）\\n      detectedFreq / 3.0,    // 3倍音 → 基音\\n      detectedFreq / 4.0,    // 4倍音 → 基音\\n      detectedFreq * 2.0,    // 1オクターブ上（低く歌った場合）\\n    ];\\n    \\n    // 人間音域範囲（C3-C6）\\n    const vocalRangeMin = 130.81;\\n    const vocalRangeMax = 1046.50;\\n    \\n    // 各候補の妥当性評価\\n    const evaluateFundamental = (freq) => {\\n      // 人間音域範囲内チェック（40%重み）\\n      const inVocalRange = freq >= vocalRangeMin && freq <= vocalRangeMax;\\n      const vocalRangeScore = inVocalRange ? 1.0 : 0.0;\\n      \\n      // 前回検出との連続性評価（40%重み）\\n      const continuityScore = previousFreq > 0\\n        ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)\\n        : 0.5;\\n      \\n      // 音楽的妥当性評価（20%重み）\\n      const musicalScore = calculateMusicalScore(freq);\\n      \\n      const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);\\n      return { freq, score: totalScore };\\n    };\\n    \\n    // 最高スコア候補を基音として採用\\n    const evaluatedCandidates = fundamentalCandidates.map(evaluateFundamental);\\n    const bestCandidate = evaluatedCandidates.reduce((best, current) => \\n      current.score > best.score ? current : best\\n    );\\n    \\n    return bestCandidate.freq;\\n  }\\n\\n  // 基音安定化システム\\n  function stabilizeFrequency(currentFreq, stabilityThreshold = 0.1) {\\n    // 履歴バッファに追加（最大5フレーム保持）\\n    harmonicHistory.push(currentFreq);\\n    if (harmonicHistory.length > 5) harmonicHistory.shift();\\n    \\n    // 中央値ベースの安定化（外れ値除去）\\n    const sorted = [...harmonicHistory].sort((a, b) => a - b);\\n    const median = sorted[Math.floor(sorted.length / 2)];\\n    \\n    // 急激な変化を抑制（段階的変化）\\n    const maxChange = median * stabilityThreshold;\\n    const stabilized = Math.abs(currentFreq - median) > maxChange \\n      ? median + Math.sign(currentFreq - median) * maxChange\\n      : currentFreq;\\n      \\n    return stabilized;\\n  }\\n\\n  // 周波数から音程名に変換\\n  function frequencyToNote(frequency) {\\n    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];\\n    const A4 = 440;\\n    \\n    if (frequency <= 0) return 'ーー';\\n    \\n    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));\\n    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;\\n    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;\\n    \\n    return noteNames[noteIndex] + octave;\\n  }\\n\\n  // 状態確認API（新規追加）\\n  export function getIsInitialized() {\\n    return isInitialized && componentState === 'ready';\\n  }\\n  \\n  export function getState() {\\n    return {\\n      componentState,\\n      isInitialized,\\n      isDetecting,\\n      lastError,\\n      hasRequiredComponents: !!(analyser && pitchDetector && audioContext && mediaStream)\\n    };\\n  }\\n  \\n  // 再初期化API（AudioManager対応版）\\n  export async function reinitialize() {\\n    console.log('🔄 [PitchDetector] 再初期化開始');\\n    \\n    // 現在の状態をクリーンアップ\\n    cleanup();\\n    \\n    // 短い待機でリソース解放を確実に\\n    await new Promise(resolve => setTimeout(resolve, 100));\\n    \\n    // 再初期化実行\\n    await initialize();\\n    \\n    console.log('✅ [PitchDetector] 再初期化完了');\\n  }\\n\\n  // クリーンアップ（AudioManager対応版）\\n  export function cleanup() {\\n    console.log('🧹 [PitchDetector] クリーンアップ開始');\\n    \\n    stopDetection();\\n    \\n    // MediaStreamイベントリスナーをクリーンアップ\\n    if (mediaStreamListeners.size > 0) {\\n      mediaStreamListeners.forEach((handlers, track) => {\\n        track.removeEventListener('ended', handlers.endedHandler);\\n        track.removeEventListener('mute', handlers.muteHandler);\\n        track.removeEventListener('unmute', handlers.unmuteHandler);\\n      });\\n      mediaStreamListeners.clear();\\n      console.log('🔄 [PitchDetector] MediaStreamイベントリスナー削除');\\n    }\\n    \\n    // AudioManagerに作成したAnalyserを解放通知\\n    if (analyserIds.length > 0) {\\n      audioManager.release(analyserIds);\\n      console.log('📤 [PitchDetector] AudioManagerにAnalyser解放通知:', analyserIds);\\n      analyserIds = [];\\n    }\\n    \\n    // 状態をリセット\\n    componentState = 'uninitialized';\\n    isInitialized = false;\\n    lastError = null;\\n    \\n    // 参照をクリア（実際のリソースはAudioManagerが管理）\\n    audioContext = null;\\n    mediaStream = null;\\n    sourceNode = null;\\n    analyser = null;\\n    rawAnalyser = null;\\n    pitchDetector = null;\\n    \\n    // 履歴クリア\\n    frequencyHistory = [];\\n    volumeHistory = [];\\n    harmonicHistory = [];\\n    \\n    console.log('✅ [PitchDetector] クリーンアップ完了');\\n  }\\n\\n  /**\\n   * MediaStreamの健康状態監視セットアップ\\n   * Safari環境でのMediaStreamTrack終了検出\\n   */\\n  function setupMediaStreamMonitoring() {\\n    if (!mediaStream) return;\\n    \\n    const tracks = mediaStream.getTracks();\\n    tracks.forEach(track => {\\n      // トラック終了イベントの監視\\n      const endedHandler = () => {\\n        console.error('🚨 [PitchDetector] MediaStreamTrack終了検出:', track.kind);\\n        componentState = 'error';\\n        lastError = new Error(\`MediaStreamTrack (\${track.kind}) ended\`);\\n        \\n        // エラー状態を通知\\n        dispatch('error', { \\n          error: lastError, \\n          reason: 'mediastream_ended',\\n          recovery: 'restart_required'\\n        });\\n        \\n        // 検出停止\\n        if (isDetecting) {\\n          stopDetection();\\n        }\\n      };\\n      \\n      // トラックの無効化検出\\n      const muteHandler = () => {\\n        console.warn('⚠️ [PitchDetector] MediaStreamTrack muted:', track.kind);\\n        dispatch('warning', { \\n          reason: 'track_muted', \\n          track: track.kind \\n        });\\n      };\\n      \\n      const unmuteHandler = () => {\\n        console.log('✅ [PitchDetector] MediaStreamTrack unmuted:', track.kind);\\n        dispatch('info', { \\n          reason: 'track_unmuted', \\n          track: track.kind \\n        });\\n      };\\n      \\n      // イベントリスナーを追加\\n      track.addEventListener('ended', endedHandler);\\n      track.addEventListener('mute', muteHandler);\\n      track.addEventListener('unmute', unmuteHandler);\\n      \\n      // リスナー参照を保存（後で削除するため）\\n      mediaStreamListeners.set(track, { endedHandler, muteHandler, unmuteHandler });\\n    });\\n    \\n    console.log('🔍 [PitchDetector] MediaStream監視開始:', tracks.length + ' tracks');\\n  }\\n\\n  // isActiveの変更を監視（改善版）\\n  $: if (isActive && componentState === 'ready' && analyser && !isDetecting) {\\n    startDetection();\\n  } else if (!isActive && isDetecting) {\\n    stopDetection();\\n  }\\n\\n  onDestroy(() => {\\n    // デバッグインターバルのクリア\\n    if (debugInterval) {\\n      clearInterval(debugInterval);\\n      debugInterval = null;\\n    }\\n    \\n    // AudioManager使用時は自動クリーンアップしない\\n    // （他のコンポーネントが使用中の可能性があるため）\\n    // 明示的なcleanup()呼び出しが必要\\n    console.log('🔄 [PitchDetector] onDestroy - AudioManagerリソースは保持');\\n  });\\n<\/script>\\n\\n<div class=\\"pitch-detector {className}\\">\\n  <div class=\\"detection-display\\">\\n    <div class=\\"detection-card\\">\\n      <span class=\\"detected-frequency\\">{currentFrequency > 0 ? Math.round(currentFrequency) : '---'}</span>\\n      <span class=\\"hz-suffix\\">Hz</span>\\n      <span class=\\"divider\\">|</span>\\n      <span class=\\"detected-note\\">{detectedNote}</span>\\n    </div>\\n    \\n    <VolumeBar volume={currentFrequency > 0 ? rawVolume : 0} className=\\"volume-bar\\" />\\n  </div>\\n</div>\\n\\n<style>\\n  .pitch-detector {\\n    padding: 1rem;\\n  }\\n\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n  \\n  .detection-card {\\n    display: inline-flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n    padding: 1rem 1.5rem;\\n    background: hsl(0 0% 100%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    width: fit-content;\\n  }\\n\\n  .detected-frequency {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(222.2 84% 4.9%);\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;\\n    min-width: 4ch;\\n    text-align: right;\\n    display: inline-block;\\n    font-variant-numeric: tabular-nums;\\n    -webkit-font-smoothing: antialiased;\\n    -moz-osx-font-smoothing: grayscale;\\n  }\\n\\n  .hz-suffix {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n\\n  .divider {\\n    color: hsl(214.3 31.8% 70%);\\n    font-size: 1.5rem;\\n    margin: 0 0.25rem;\\n    font-weight: 300;\\n  }\\n  \\n  .detected-note {\\n    font-weight: 600;\\n    font-size: 2rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-family: 'SF Mono', 'Monaco', 'Cascadia Mono', 'Roboto Mono', \\n                 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;\\n    min-width: 3ch;\\n    display: inline-block;\\n    text-align: center;\\n  }\\n\\n  :global(.volume-bar) {\\n    border-radius: 4px !important;\\n  }\\n</style>"],"names":[],"mappings":"AA8lBE,6BAAgB,CACd,OAAO,CAAE,IACX,CAEA,gCAAmB,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IACP,CAEA,6BAAgB,CACd,OAAO,CAAE,WAAW,CACpB,WAAW,CAAE,QAAQ,CACrB,GAAG,CAAE,MAAM,CACX,OAAO,CAAE,IAAI,CAAC,MAAM,CACpB,UAAU,CAAE,IAAI,CAAC,CAAC,EAAE,CAAC,IAAI,CAAC,CAC1B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CACxC,aAAa,CAAE,GAAG,CAClB,KAAK,CAAE,WACT,CAEA,iCAAoB,CAClB,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAAC,CAC1B,WAAW,CAAE,SAAS,CAAC,CAAC,QAAQ,CAAC,CAAC,eAAe,CAAC,CAAC,aAAa,CAAC;AACrE,iBAAiB,gBAAgB,CAAC,CAAC,WAAW,CAAC,CAAC,UAAU,CAAC,CAAC,SAAS,CACjE,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,YAAY,CACrB,oBAAoB,CAAE,YAAY,CAClC,sBAAsB,CAAE,WAAW,CACnC,uBAAuB,CAAE,SAC3B,CAEA,wBAAW,CACT,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAC3B,CAEA,sBAAS,CACP,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,GAAG,CAAC,CAC3B,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,OAAO,CACjB,WAAW,CAAE,GACf,CAEA,4BAAe,CACb,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC7B,WAAW,CAAE,SAAS,CAAC,CAAC,QAAQ,CAAC,CAAC,eAAe,CAAC,CAAC,aAAa,CAAC;AACrE,iBAAiB,gBAAgB,CAAC,CAAC,WAAW,CAAC,CAAC,UAAU,CAAC,CAAC,SAAS,CACjE,SAAS,CAAE,GAAG,CACd,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,MACd,CAEQ,WAAa,CACnB,aAAa,CAAE,GAAG,CAAC,UACrB"}`
};
function calculateMusicalScore(frequency) {
  const C4 = 261.63;
  const semitonesFromC4 = Math.log2(frequency / C4) * 12;
  const nearestSemitone = Math.round(semitonesFromC4);
  const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
  return Math.max(0, 1 - distanceFromSemitone / 0.5);
}
function correctHarmonicFrequency(detectedFreq, previousFreq) {
  const fundamentalCandidates = [
    detectedFreq,
    detectedFreq / 2,
    detectedFreq / 3,
    detectedFreq / 4,
    detectedFreq * 2
  ];
  const vocalRangeMin = 130.81;
  const vocalRangeMax = 1046.5;
  const evaluateFundamental = (freq) => {
    const inVocalRange = freq >= vocalRangeMin && freq <= vocalRangeMax;
    const vocalRangeScore = inVocalRange ? 1 : 0;
    const continuityScore = previousFreq > 0 ? 1 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1) : 0.5;
    const musicalScore = calculateMusicalScore(freq);
    const totalScore = vocalRangeScore * 0.4 + continuityScore * 0.4 + musicalScore * 0.2;
    return { freq, score: totalScore };
  };
  const evaluatedCandidates = fundamentalCandidates.map(evaluateFundamental);
  const bestCandidate = evaluatedCandidates.reduce((best, current) => current.score > best.score ? current : best);
  return bestCandidate.freq;
}
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
  let previousFrequency = 0;
  let harmonicHistory = [];
  let debugInterval = null;
  function resetDisplayState() {
    currentVolume = 0;
    rawVolume = 0;
    currentFrequency = 0;
    detectedNote = "ーー";
    pitchClarity = 0;
    stableVolume = 0;
    previousFrequency = 0;
    volumeHistory = [];
    harmonicHistory = [];
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
    console.log(`🎤 [PitchDetector] ${timestamp}:`, status);
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
    if (pitch && clarity > 0.6 && currentVolume > 10 && isValidVocalRange) {
      const correctedFreq = correctHarmonicFrequency(pitch, previousFrequency);
      const stabilizedFreq = stabilizeFrequency(correctedFreq);
      currentFrequency = Math.round(stabilizedFreq);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
      previousFrequency = currentFrequency;
    } else {
      if (harmonicHistory.length > 0) {
        harmonicHistory = [];
      }
      if (currentFrequency === 0) {
        previousFrequency = 0;
      }
      currentFrequency = 0;
      detectedNote = "ーー";
      pitchClarity = 0;
    }
    const displayVolume = currentFrequency > 0 ? rawVolume : 0;
    dispatch("pitchUpdate", {
      frequency: currentFrequency,
      note: detectedNote,
      volume: currentVolume,
      rawVolume: displayVolume,
      clarity: pitchClarity
    });
    animationFrame = requestAnimationFrame(detectPitch);
  }
  function stabilizeFrequency(currentFreq, stabilityThreshold = 0.1) {
    harmonicHistory.push(currentFreq);
    if (harmonicHistory.length > 5) harmonicHistory.shift();
    const sorted = [...harmonicHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const maxChange = median * stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange ? median + Math.sign(currentFreq - median) * maxChange : currentFreq;
    return stabilized;
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
    harmonicHistory = [];
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
  if ($$props.resetDisplayState === void 0 && $$bindings.resetDisplayState && resetDisplayState !== void 0) $$bindings.resetDisplayState(resetDisplayState);
  if ($$props.initialize === void 0 && $$bindings.initialize && initialize !== void 0) $$bindings.initialize(initialize);
  if ($$props.startDetection === void 0 && $$bindings.startDetection && startDetection !== void 0) $$bindings.startDetection(startDetection);
  if ($$props.stopDetection === void 0 && $$bindings.stopDetection && stopDetection !== void 0) $$bindings.stopDetection(stopDetection);
  if ($$props.getIsInitialized === void 0 && $$bindings.getIsInitialized && getIsInitialized !== void 0) $$bindings.getIsInitialized(getIsInitialized);
  if ($$props.getState === void 0 && $$bindings.getState && getState !== void 0) $$bindings.getState(getState);
  if ($$props.reinitialize === void 0 && $$bindings.reinitialize && reinitialize !== void 0) $$bindings.reinitialize(reinitialize);
  if ($$props.cleanup === void 0 && $$bindings.cleanup && cleanup !== void 0) $$bindings.cleanup(cleanup);
  $$result.css.add(css$1);
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
const css = {
  code: ".card-header.svelte-1datf0r{padding-bottom:1rem;border-bottom:1px solid hsl(214.3 31.8% 91.4%);margin-bottom:1.5rem}.section-title.svelte-1datf0r{font-size:1.125rem;font-weight:600;color:hsl(222.2 84% 4.9%);margin:0}.card-content.svelte-1datf0r{display:flex;flex-direction:column;gap:1rem}.pitch-detector.svelte-1datf0r{display:flex;flex-direction:column;gap:1rem}.detection-display.svelte-1datf0r{display:flex;flex-direction:column;gap:1rem}.detection-card.svelte-1datf0r{background:hsl(210 40% 96.1%);border:1px solid hsl(214.3 31.8% 91.4%);border-radius:8px;padding:1.5rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:600;color:hsl(222.2 84% 4.9%);min-height:80px}.detection-values.svelte-1datf0r{display:flex;align-items:baseline;gap:0.5rem}.muted-message.svelte-1datf0r{font-size:1.125rem;color:hsl(215.4 16.3% 46.9%);font-weight:500}.detected-frequency.svelte-1datf0r{font-size:2rem;font-weight:700;color:hsl(142.1 76.2% 36.3%)}.hz-suffix.svelte-1datf0r{font-size:1rem;color:hsl(215.4 16.3% 46.9%);font-weight:400}.divider.svelte-1datf0r{color:hsl(214.3 31.8% 91.4%);margin:0 0.5rem}.detected-note.svelte-1datf0r{font-size:1.5rem;font-weight:600;color:hsl(222.2 84% 4.9%)}.volume-bar{margin-top:0.5rem}@media(max-width: 768px){.detection-card.svelte-1datf0r{font-size:1.25rem;padding:1rem;min-height:60px}.detected-frequency.svelte-1datf0r{font-size:1.5rem}.detected-note.svelte-1datf0r{font-size:1.25rem}.muted-message.svelte-1datf0r{font-size:1rem}}",
  map: `{"version":3,"file":"PitchDetectionDisplay.svelte","sources":["PitchDetectionDisplay.svelte"],"sourcesContent":["<script>\\n  import Card from './Card.svelte';\\n  import VolumeBar from './VolumeBar.svelte';\\n  \\n  // Props\\n  export let frequency = 0;\\n  export let note = 'ーー';\\n  export let volume = 0;\\n  export let isMuted = false;\\n  export let muteMessage = '待機中...';\\n  export let className = '';\\n<\/script>\\n\\n<Card class=\\"main-card {className}\\">\\n  <div class=\\"card-header\\">\\n    <h3 class=\\"section-title\\">🎙️ リアルタイム音程検出</h3>\\n  </div>\\n  <div class=\\"card-content\\">\\n    <div class=\\"pitch-detector\\">\\n      <div class=\\"detection-display\\">\\n        <div class=\\"detection-card\\">\\n          {#if isMuted}\\n            <span class=\\"muted-message\\">{muteMessage}</span>\\n          {:else}\\n            <div class=\\"detection-values\\">\\n              <span class=\\"detected-frequency\\">{frequency > 0 ? Math.round(frequency) : '---'}</span>\\n              <span class=\\"hz-suffix\\">Hz</span>\\n              <span class=\\"divider\\">|</span>\\n              <span class=\\"detected-note\\">{note}</span>\\n            </div>\\n          {/if}\\n        </div>\\n        \\n        <VolumeBar volume={!isMuted && frequency > 0 ? volume : 0} className=\\"volume-bar\\" />\\n      </div>\\n    </div>\\n  </div>\\n</Card>\\n\\n<style>\\n  /* カードヘッダー */\\n  .card-header {\\n    padding-bottom: 1rem;\\n    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);\\n    margin-bottom: 1.5rem;\\n  }\\n  \\n  .section-title {\\n    font-size: 1.125rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    margin: 0;\\n  }\\n\\n  /* カードコンテンツ */\\n  .card-content {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  /* 音程検出表示 */\\n  .pitch-detector {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  .detection-display {\\n    display: flex;\\n    flex-direction: column;\\n    gap: 1rem;\\n  }\\n\\n  .detection-card {\\n    background: hsl(210 40% 96.1%);\\n    border: 1px solid hsl(214.3 31.8% 91.4%);\\n    border-radius: 8px;\\n    padding: 1.5rem;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    font-size: 1.5rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n    min-height: 80px;\\n  }\\n\\n  /* 検出値のコンテナ */\\n  .detection-values {\\n    display: flex;\\n    align-items: baseline;\\n    gap: 0.5rem;\\n  }\\n\\n  /* ミュート時のメッセージ */\\n  .muted-message {\\n    font-size: 1.125rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 500;\\n  }\\n\\n  /* 周波数表示 */\\n  .detected-frequency {\\n    font-size: 2rem;\\n    font-weight: 700;\\n    color: hsl(142.1 76.2% 36.3%);\\n  }\\n\\n  .hz-suffix {\\n    font-size: 1rem;\\n    color: hsl(215.4 16.3% 46.9%);\\n    font-weight: 400;\\n  }\\n\\n  .divider {\\n    color: hsl(214.3 31.8% 91.4%);\\n    margin: 0 0.5rem;\\n  }\\n\\n  .detected-note {\\n    font-size: 1.5rem;\\n    font-weight: 600;\\n    color: hsl(222.2 84% 4.9%);\\n  }\\n\\n  /* VolumeBar用のスタイル */\\n  :global(.volume-bar) {\\n    margin-top: 0.5rem;\\n  }\\n\\n  /* レスポンシブ対応 */\\n  @media (max-width: 768px) {\\n    .detection-card {\\n      font-size: 1.25rem;\\n      padding: 1rem;\\n      min-height: 60px;\\n    }\\n\\n    .detected-frequency {\\n      font-size: 1.5rem;\\n    }\\n\\n    .detected-note {\\n      font-size: 1.25rem;\\n    }\\n\\n    .muted-message {\\n      font-size: 1rem;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"AAyCE,2BAAa,CACX,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC/C,aAAa,CAAE,MACjB,CAEA,6BAAe,CACb,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAAC,CAC1B,MAAM,CAAE,CACV,CAGA,4BAAc,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IACP,CAGA,8BAAgB,CACd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IACP,CAEA,iCAAmB,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IACP,CAEA,8BAAgB,CACd,UAAU,CAAE,IAAI,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAC9B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CACxC,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,MAAM,CACf,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAAC,CAC1B,UAAU,CAAE,IACd,CAGA,gCAAkB,CAChB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,QAAQ,CACrB,GAAG,CAAE,MACP,CAGA,6BAAe,CACb,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC7B,WAAW,CAAE,GACf,CAGA,kCAAoB,CAClB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAC9B,CAEA,yBAAW,CACT,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC7B,WAAW,CAAE,GACf,CAEA,uBAAS,CACP,KAAK,CAAE,IAAI,KAAK,CAAC,KAAK,CAAC,KAAK,CAAC,CAC7B,MAAM,CAAE,CAAC,CAAC,MACZ,CAEA,6BAAe,CACb,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,KAAK,CAAC,GAAG,CAAC,IAAI,CAC3B,CAGQ,WAAa,CACnB,UAAU,CAAE,MACd,CAGA,MAAO,YAAY,KAAK,CAAE,CACxB,8BAAgB,CACd,SAAS,CAAE,OAAO,CAClB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IACd,CAEA,kCAAoB,CAClB,SAAS,CAAE,MACb,CAEA,6BAAe,CACb,SAAS,CAAE,OACb,CAEA,6BAAe,CACb,SAAS,CAAE,IACb,CACF"}`
};
const PitchDetectionDisplay = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { frequency = 0 } = $$props;
  let { note = "ーー" } = $$props;
  let { volume = 0 } = $$props;
  let { isMuted = false } = $$props;
  let { muteMessage = "待機中..." } = $$props;
  let { className = "" } = $$props;
  if ($$props.frequency === void 0 && $$bindings.frequency && frequency !== void 0) $$bindings.frequency(frequency);
  if ($$props.note === void 0 && $$bindings.note && note !== void 0) $$bindings.note(note);
  if ($$props.volume === void 0 && $$bindings.volume && volume !== void 0) $$bindings.volume(volume);
  if ($$props.isMuted === void 0 && $$bindings.isMuted && isMuted !== void 0) $$bindings.isMuted(isMuted);
  if ($$props.muteMessage === void 0 && $$bindings.muteMessage && muteMessage !== void 0) $$bindings.muteMessage(muteMessage);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css);
  return `${validate_component(Card, "Card").$$render($$result, { class: "main-card " + className }, {}, {
    default: () => {
      return `<div class="card-header svelte-1datf0r"><h3 class="section-title svelte-1datf0r" data-svelte-h="svelte-1bj87i9">🎙️ リアルタイム音程検出</h3></div> <div class="card-content svelte-1datf0r"><div class="pitch-detector svelte-1datf0r"><div class="detection-display svelte-1datf0r"><div class="detection-card svelte-1datf0r">${isMuted ? `<span class="muted-message svelte-1datf0r">${escape(muteMessage)}</span>` : `<div class="detection-values svelte-1datf0r"><span class="detected-frequency svelte-1datf0r">${escape(frequency > 0 ? Math.round(frequency) : "---")}</span> <span class="hz-suffix svelte-1datf0r" data-svelte-h="svelte-5uyilv">Hz</span> <span class="divider svelte-1datf0r" data-svelte-h="svelte-1dytxz4">|</span> <span class="detected-note svelte-1datf0r">${escape(note)}</span></div>`}</div> ${validate_component(VolumeBar, "VolumeBar").$$render(
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
export {
  PitchDetectionDisplay as P,
  PitchDetector_1 as a
};
