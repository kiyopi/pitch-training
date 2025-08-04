class AudioManager {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analysers = /* @__PURE__ */ new Map();
    this.filters = /* @__PURE__ */ new Map();
    this.refCount = 0;
    this.initPromise = null;
    this.isInitialized = false;
    this.lastError = null;
    this.currentSensitivity = this._getDefaultSensitivity();
  }
  /**
   * デバイス依存のデフォルト感度取得
   */
  _getDefaultSensitivity() {
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.userAgent);
    const isIPadOS = /Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
    if (isIPad || isIPadOS) {
      console.log("🔧 [AudioManager] iPad検出 - デフォルト感度7.0x設定");
      return 7;
    } else if (isIPhone) {
      console.log("🔧 [AudioManager] iPhone検出 - デフォルト感度3.0x設定");
      return 3;
    } else {
      console.log("🔧 [AudioManager] PC検出 - デフォルト感度1.0x設定");
      return 1;
    }
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
        const isIPhone = /iPhone/.test(navigator.userAgent);
        const isIPad = /iPad/.test(navigator.userAgent);
        const isIPadOS = /Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
        const isIOS = isIPhone || isIPad || isIPadOS;
        const deviceType = isIPad || isIPadOS ? "iPad" : isIPhone ? "iPhone" : "その他";
        console.log(`🔍 [AudioManager] デバイス検出: ${deviceType}`, navigator.userAgent);
        console.log(`🔍 [AudioManager] タッチサポート: ${"ontouchend" in document}`);
        const audioConstraints = {
          audio: {
            // 基本設定：Safari WebKit安定性重視
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // iPad/iPhone専用: 超高感度設定
            ...isIOS && {
              googAutoGainControl: false,
              // Google AGC完全無効化
              googNoiseSuppression: false,
              // Google ノイズ抑制無効化
              googEchoCancellation: false,
              // Google エコーキャンセル無効化
              googHighpassFilter: false,
              // Google ハイパスフィルター無効化
              googTypingNoiseDetection: false,
              // タイピングノイズ検出無効化
              googBeamforming: false,
              // ビームフォーミング無効化
              mozAutoGainControl: false,
              // Mozilla AGC無効化
              mozNoiseSuppression: false
              // Mozilla ノイズ抑制無効化
            },
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
      if (!this.gainNode) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.currentSensitivity;
        this.sourceNode.connect(this.gainNode);
        console.log(`✅ [AudioManager] GainNode作成完了 (感度: ${this.currentSensitivity}x)`);
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
    let finalNode = this.gainNode || this.sourceNode;
    if (useFilters) {
      const filterChain = this._createFilterChain();
      this.filters.set(id, filterChain);
      finalNode.connect(filterChain.highpass);
      filterChain.highpass.connect(filterChain.lowpass);
      filterChain.lowpass.connect(filterChain.notch);
      filterChain.notch.connect(analyser);
      console.log(`🔧 [AudioManager] フィルター付きAnalyser作成: ${id}`);
    } else {
      finalNode.connect(analyser);
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
   * マイク感度調整
   * @param {number} sensitivity - 感度倍率 (0.1 ～ 10.0)
   */
  setSensitivity(sensitivity) {
    const clampedSensitivity = Math.max(0.1, Math.min(10, sensitivity));
    if (this.gainNode) {
      this.gainNode.gain.value = clampedSensitivity;
      this.currentSensitivity = clampedSensitivity;
      console.log(`🎤 [AudioManager] マイク感度更新: ${clampedSensitivity.toFixed(1)}x`);
    } else {
      this.currentSensitivity = clampedSensitivity;
      console.log(`🎤 [AudioManager] マイク感度設定（初期化待ち）: ${clampedSensitivity.toFixed(1)}x`);
    }
  }
  /**
   * 現在のマイク感度取得
   */
  getSensitivity() {
    return this.currentSensitivity;
  }
  /**
   * 仕様書準拠のプラットフォーム別設定取得
   * MICROPHONE_PLATFORM_SPECIFICATIONS.md準拠
   */
  getPlatformSpecs() {
    const isIPhone = /iPhone/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.userAgent);
    const isIPadOS = /Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
    const isIOS = isIPhone || isIPad || isIPadOS;
    return {
      // 音量計算divisor（重要：この値で感度が決まる）
      divisor: isIOS ? 4 : 6,
      // iPhone/iPad: 4.0, PC: 6.0
      // 音量補正（iPhone/iPad低域カット対応）  
      gainCompensation: isIOS ? 1.5 : 1,
      // iPhone/iPad: 1.5, PC: 1.0
      // ノイズ閾値（無音時0%表示の基準）
      noiseThreshold: isIOS ? 12 : 15,
      // iPhone/iPad: 12, PC: 15
      // スムージング（最小限）
      smoothingFactor: 0.2,
      // 両プラットフォーム共通
      // デバイス情報
      deviceType: isIPad || isIPadOS ? "iPad" : isIPhone ? "iPhone" : "PC",
      isIOS
    };
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
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isInitialized = false;
    this.refCount = 0;
    this.initPromise = null;
    this.currentSensitivity = this._getDefaultSensitivity();
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
class HarmonicCorrection {
  constructor(config = {}) {
    this.vocalRangeMin = config.vocalRangeMin || 130.81;
    this.vocalRangeMax = config.vocalRangeMax || 1046.5;
    this.stabilityThreshold = config.stabilityThreshold || 0.3;
    this.evaluationWeights = {
      vocalRange: config.vocalRangeWeight || 0.4,
      // 人間音域適合性
      continuity: config.continuityWeight || 0.4,
      // 前回検出との連続性
      musical: config.musicalWeight || 0.2
      // 音楽的妥当性
    };
    this.fundamentalCandidates = config.fundamentalCandidates || [
      1,
      // そのまま（基音の可能性）
      0.5,
      // 1オクターブ下（2倍音 → 基音）
      0.333,
      // 3倍音 → 基音 (1/3)
      // 0.25 削除: 4倍音補正は高音域で誤補正を引き起こすため除外
      2
      // 1オクターブ上（低く歌った場合）
    ];
    this.harmonicHistory = [];
    this.previousFrequency = 0;
    this.maxHistoryLength = 5;
    this.debugMode = false;
    this.volumeThreshold = config.volumeThreshold || 0.02;
    this.currentContext = {};
  }
  /**
   * メイン倍音補正処理
   * @param {number} detectedFreq - 検出された周波数
   * @param {number} volume - 音量レベル (0-1、省略可能)
   * @param {boolean} enableDebugLog - デバッグログ有効化
   * @returns {number} - 補正後の基音周波数
   */
  correctHarmonic(detectedFreq, volume = 1, enableDebugLog = false) {
    if (!detectedFreq || detectedFreq <= 0) {
      return 0;
    }
    const isValidVolume = volume >= this.volumeThreshold;
    const candidates = this.fundamentalCandidates.map((ratio) => ({
      frequency: detectedFreq * ratio,
      ratio
    }));
    const evaluatedCandidates = candidates.map((candidate) => {
      const evaluation = this.evaluateFundamental(candidate.frequency);
      return {
        ...candidate,
        ...evaluation
      };
    });
    const bestCandidate = evaluatedCandidates.reduce(
      (best, current) => current.totalScore > best.totalScore ? current : best
    );
    const stabilizedFreq = this.stabilizeFrequency(bestCandidate.frequency, isValidVolume);
    if (enableDebugLog || this.debugMode) {
      this.logHarmonicCorrection(detectedFreq, evaluatedCandidates, bestCandidate, stabilizedFreq, this.currentContext, volume, isValidVolume);
    }
    if (isValidVolume) {
      this.previousFrequency = stabilizedFreq;
    }
    return stabilizedFreq;
  }
  /**
   * 倍音補正デバッグログ出力
   * @param {number} originalFreq - 元の検出周波数
   * @param {Array} candidates - 全候補とスコア
   * @param {Object} bestCandidate - 選択された最適候補
   * @param {number} finalFreq - 最終補正周波数
   * @param {Object} context - 追加コンテキスト情報
   * @param {number} volume - 音量レベル
   * @param {boolean} isValidVolume - 音量閾値チェック結果
   */
  logHarmonicCorrection(originalFreq, candidates, bestCandidate, finalFreq, context = {}, volume = 1, isValidVolume = true) {
    console.group(`🔧 [HarmonicCorrection] ${originalFreq.toFixed(1)}Hz → ${finalFreq.toFixed(1)}Hz`);
    console.log(`🔊 音量: ${(volume * 100).toFixed(1)}% (閾値: ${(this.volumeThreshold * 100).toFixed(1)}%) ${isValidVolume ? "✅ 有効" : "❌ ノイズ除外"}`);
    const originalNote = this.frequencyToNote(originalFreq);
    const finalNote = this.frequencyToNote(finalFreq);
    console.log(`📝 音程変換: ${originalNote} → ${finalNote}`);
    const correctionType = this.getCorrectionType(bestCandidate.ratio);
    console.log(`🎯 補正タイプ: ${correctionType}`);
    if (context.baseFrequency && context.currentScale && context.targetFrequency) {
      console.log(`🎵 音階コンテキスト:`);
      console.log(`   基音: ${context.baseFrequency.toFixed(1)}Hz (${this.frequencyToNote(context.baseFrequency)})`);
      console.log(`   現在の音階: ${context.currentScale}`);
      console.log(`   目標周波数: ${context.targetFrequency.toFixed(1)}Hz (${this.frequencyToNote(context.targetFrequency)})`);
      const targetDiff = finalFreq - context.targetFrequency;
      const targetDiffCents = 1200 * Math.log2(finalFreq / context.targetFrequency);
      console.log(`   目標との差: ${targetDiff > 0 ? "+" : ""}${targetDiff.toFixed(1)}Hz (${targetDiffCents > 0 ? "+" : ""}${targetDiffCents.toFixed(0)}セント)`);
      const accuracy = Math.abs(targetDiffCents) <= 50 ? "🎯 高精度" : Math.abs(targetDiffCents) <= 100 ? "✅ 良好" : Math.abs(targetDiffCents) <= 200 ? "⚠️ 要改善" : "❌ 不正確";
      console.log(`   精度評価: ${accuracy} (${Math.abs(targetDiffCents).toFixed(0)}セント差)`);
    }
    console.table(candidates.map((c) => ({
      "倍率": `${c.ratio.toFixed(3)}x`,
      "周波数": `${c.frequency.toFixed(1)}Hz`,
      "音名": this.frequencyToNote(c.frequency),
      "音域": c.vocalRangeScore.toFixed(2),
      "連続性": c.continuityScore.toFixed(2),
      "音楽性": c.musicalScore.toFixed(2),
      "総合": c.totalScore.toFixed(3),
      "選択": c === bestCandidate ? "✅" : ""
    })));
    const stabilizationDiff = Math.abs(finalFreq - bestCandidate.frequency);
    if (stabilizationDiff > 0.5) {
      console.log(`🔄 安定化: ${bestCandidate.frequency.toFixed(1)}Hz → ${finalFreq.toFixed(1)}Hz (${stabilizationDiff.toFixed(1)}Hz調整)`);
    }
    console.groupEnd();
  }
  /**
   * 補正タイプの判定
   * @param {number} ratio - 適用された倍率
   * @returns {string} - 補正タイプの説明
   */
  getCorrectionType(ratio) {
    if (Math.abs(ratio - 1) < 0.01) return "補正なし（基音）";
    if (Math.abs(ratio - 0.5) < 0.01) return "2倍音補正（1オクターブ下）";
    if (Math.abs(ratio - 0.333) < 0.01) return "3倍音補正（1オクターブ+5度下）";
    if (Math.abs(ratio - 0.25) < 0.01) return "4倍音補正（2オクターブ下）";
    if (Math.abs(ratio - 2) < 0.01) return "オクターブ上補正";
    return `カスタム補正（${ratio.toFixed(3)}x）`;
  }
  /**
   * 周波数から音名変換（デバッグ用）
   * @param {number} frequency - 周波数
   * @returns {string} - 音名
   */
  frequencyToNote(frequency) {
    if (!frequency || frequency <= 0) return "---";
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const A4 = 440;
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    return noteNames[noteIndex] + octave;
  }
  /**
   * 基音候補の妥当性評価
   * @param {number} frequency - 評価対象周波数
   * @returns {Object} - 評価結果
   */
  evaluateFundamental(frequency) {
    const inVocalRange = frequency >= this.vocalRangeMin && frequency <= this.vocalRangeMax;
    const vocalRangeScore = inVocalRange ? 1 : 0;
    const continuityScore = this.previousFrequency > 0 ? 1 - Math.min(Math.abs(frequency - this.previousFrequency) / this.previousFrequency, 1) : 0.5;
    const musicalScore = this.calculateMusicalScore(frequency);
    const totalScore = vocalRangeScore * this.evaluationWeights.vocalRange + continuityScore * this.evaluationWeights.continuity + musicalScore * this.evaluationWeights.musical;
    return {
      vocalRangeScore,
      continuityScore,
      musicalScore,
      totalScore
    };
  }
  /**
   * 音楽的妥当性評価
   * 半音階に近いほど高評価
   * @param {number} frequency - 評価対象周波数
   * @returns {number} - 音楽的妥当性スコア (0-1)
   */
  calculateMusicalScore(frequency) {
    const C4 = 261.63;
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
    return Math.max(0, 1 - distanceFromSemitone / 0.5);
  }
  /**
   * 周波数安定化システム
   * 急激な変化を抑制し、中央値ベースで外れ値を除去
   * @param {number} currentFreq - 現在の周波数
   * @param {boolean} isValidVolume - 音量閾値チェック結果（履歴更新判定用）
   * @returns {number} - 安定化された周波数
   */
  stabilizeFrequency(currentFreq, isValidVolume = true) {
    if (!currentFreq || currentFreq <= 0) {
      return 0;
    }
    if (isValidVolume) {
      this.harmonicHistory.push(currentFreq);
    }
    if (this.harmonicHistory.length > this.maxHistoryLength) {
      this.harmonicHistory.shift();
    }
    if (this.harmonicHistory.length < 2) {
      return currentFreq;
    }
    const sorted = [...this.harmonicHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const maxChange = median * this.stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange ? median + Math.sign(currentFreq - median) * maxChange : currentFreq;
    return stabilized;
  }
  /**
   * 履歴リセット
   * 新しいセッション開始時に呼び出し
   */
  resetHistory() {
    this.harmonicHistory = [];
    this.previousFrequency = 0;
  }
  /**
   * 設定更新
   * 動的パラメータ調整用
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    Object.assign(this, newConfig);
    console.log("⚙️ [HarmonicCorrection] 設定更新:", newConfig);
  }
  /**
   * デバッグモード有効化
   * ブラウザコンソールから呼び出し可能
   */
  enableDebugLogging() {
    this.debugMode = true;
    console.log("🔍 [HarmonicCorrection] デバッグログ有効化 - 次回の補正から詳細ログを出力します");
    console.log("無効化するには: harmonicCorrection.disableDebugLogging()");
  }
  /**
   * デバッグモード無効化
   */
  disableDebugLogging() {
    this.debugMode = false;
    console.log("🔍 [HarmonicCorrection] デバッグログ無効化");
  }
  /**
   * 音階コンテキスト設定
   * ランダム基音モードでの音階情報を設定
   * @param {Object} context - 音階コンテキスト
   */
  setScaleContext(context) {
    this.currentContext = {
      baseFrequency: context.baseFrequency,
      currentScale: context.currentScale,
      targetFrequency: context.targetFrequency
    };
  }
  /**
   * コンテキストクリア
   */
  clearContext() {
    this.currentContext = {};
  }
  /**
   * 現在の状態取得（デバッグ用）
   * @returns {Object} - 現在の状態
   */
  getStatus() {
    return {
      vocalRangeMin: this.vocalRangeMin,
      vocalRangeMax: this.vocalRangeMax,
      stabilityThreshold: this.stabilityThreshold,
      evaluationWeights: this.evaluationWeights,
      historyLength: this.harmonicHistory.length,
      previousFrequency: this.previousFrequency,
      recentHistory: this.harmonicHistory.slice(-3)
      // 直近3件
    };
  }
}
const harmonicCorrection = new HarmonicCorrection();
const DEBUG_LEVEL = (() => {
  if (typeof import.meta !== "undefined" && true) {
    return "error";
  }
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get("debug");
    if (debugParam) return debugParam;
  }
  return "info";
})();
const LOG_LEVELS = {
  "error": 0,
  "warn": 1,
  "info": 2,
  "debug": 3
};
const CURRENT_LEVEL = LOG_LEVELS[DEBUG_LEVEL] ?? LOG_LEVELS.info;
const logger = {
  /**
   * エラーレベル（常に表示）
   */
  error: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) {
      console.error(`❌ ${message}`, ...args);
    }
  },
  /**
   * 警告レベル（開発環境では表示）
   */
  warn: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  /**
   * 情報レベル（開発環境では表示）
   */
  info: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  /**
   * デバッグレベル（?debug=debug時のみ表示）
   */
  debug: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  /**
   * リアルタイム系ログ（頻繁に出力されるもの）
   * デバッグモード時のみ表示、かつ間引き機能付き
   */
  realtime: /* @__PURE__ */ (() => {
    let lastLogTime = 0;
    const LOG_INTERVAL = 1e3;
    return (message, ...args) => {
      if (CURRENT_LEVEL >= LOG_LEVELS.debug) {
        const now = Date.now();
        if (now - lastLogTime >= LOG_INTERVAL) {
          console.log(`📊 ${message}`, ...args);
          lastLogTime = now;
        }
      }
    };
  })(),
  /**
   * 採点系ログ（結果のみ重要）
   */
  scoring: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`🎯 ${message}`, ...args);
    }
  },
  /**
   * オーディオ系ログ（初期化・エラー時のみ重要）
   */
  audio: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`🎤 ${message}`, ...args);
    }
  }
};
export {
  audioManager as a,
  harmonicCorrection as h,
  logger as l
};
