/**
 * AudioManager - グローバル音声リソース管理システム
 * 
 * 目的: 複数AudioContext問題の解決
 * - アプリ全体で1つのAudioContextを共有
 * - 1つのMediaStreamを全コンポーネントで再利用
 * - 安全なリソース管理とクリーンアップ
 */

class AudioManager {
  constructor() {
    // グローバル共有リソース
    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    
    // Analyser管理
    this.analysers = new Map(); // id -> analyser
    this.filters = new Map();   // id -> filter chain
    
    // 参照カウント（安全なクリーンアップ用）
    this.refCount = 0;
    this.initPromise = null; // 初期化の重複実行防止
    
    // 状態管理
    this.isInitialized = false;
    this.lastError = null;
  }

  /**
   * 音声リソースの初期化
   * 複数回呼ばれても安全（シングルトン的動作）
   */
  async initialize() {
    // 既に初期化処理中の場合は待機
    if (this.initPromise) {
      return this.initPromise;
    }

    // 既に初期化済みの場合
    if (this.isInitialized && this.audioContext && this.mediaStream) {
      this.refCount++;
      return {
        audioContext: this.audioContext,
        mediaStream: this.mediaStream,
        sourceNode: this.sourceNode
      };
    }

    // 初期化実行
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
      console.log('🎤 [AudioManager] 初期化開始');

      // AudioContext作成（1つのみ）
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ [AudioManager] AudioContext作成完了');
      }

      // AudioContextがsuspendedの場合は再開
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('✅ [AudioManager] AudioContext再開完了');
      }

      // MediaStream取得（1つのみ）
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        console.log('✅ [AudioManager] MediaStream取得完了');
      }

      // SourceNode作成（1つのみ）
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        console.log('✅ [AudioManager] SourceNode作成完了');
        
        // MediaStreamの状態確認
        const tracks = this.mediaStream.getTracks();
        console.log('🎤 [AudioManager] MediaStream tracks:', tracks.map(t => ({
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
      console.error('❌ [AudioManager] 初期化エラー:', error);
      this.lastError = error;
      this.isInitialized = false;
      
      // エラー時のクリーンアップ
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
      throw new Error('AudioManager not initialized. Call initialize() first.');
    }

    // 既存のAnalyserがある場合は削除
    this.removeAnalyser(id);

    const {
      fftSize = 2048,
      smoothingTimeConstant = 0.8,
      minDecibels = -90,
      maxDecibels = -10,
      useFilters = true
    } = options;

    // Analyser作成
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;

    let finalNode = this.sourceNode;

    // フィルターチェーン作成（オプション）
    if (useFilters) {
      const filterChain = this._createFilterChain();
      this.filters.set(id, filterChain);
      
      // フィルターチェーン接続
      this.sourceNode.connect(filterChain.highpass);
      filterChain.highpass.connect(filterChain.lowpass);
      filterChain.lowpass.connect(filterChain.notch);
      filterChain.notch.connect(analyser);
      
      console.log(`🔧 [AudioManager] フィルター付きAnalyser作成: ${id}`);
    } else {
      // 直接接続（生信号）
      this.sourceNode.connect(analyser);
      console.log(`🔧 [AudioManager] 生信号Analyser作成: ${id}`);
    }
    
    // 重要: Analyserは音声を通過させるだけで、destinationには接続しない
    // （マイクのフィードバック防止のため）

    this.analysers.set(id, analyser);
    return analyser;
  }

  /**
   * 3段階ノイズリダクションフィルターチェーン作成
   */
  _createFilterChain() {
    // 1. ハイパスフィルター（低周波ノイズ除去: 80Hz以下カット）
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(80, this.audioContext.currentTime);
    highpass.Q.setValueAtTime(0.7, this.audioContext.currentTime);

    // 2. ローパスフィルター（高周波ノイズ除去: 800Hz以上カット）
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800, this.audioContext.currentTime);
    lowpass.Q.setValueAtTime(0.7, this.audioContext.currentTime);

    // 3. ノッチフィルター（電源ノイズ除去: 60Hz）
    const notch = this.audioContext.createBiquadFilter();
    notch.type = 'notch';
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
    // 指定されたAnalyserを削除
    analyserIds.forEach(id => this.removeAnalyser(id));

    this.refCount = Math.max(0, this.refCount - 1);
    console.log(`📉 [AudioManager] 参照カウント減算: ${this.refCount}`);

    // 誰も使っていない場合のみ完全クリーンアップ
    if (this.refCount <= 0) {
      console.log('🧹 [AudioManager] 全リソースクリーンアップ開始');
      this._cleanup();
    }
  }

  /**
   * 強制クリーンアップ（緊急時用）
   */
  forceCleanup() {
    console.log('🚨 [AudioManager] 強制クリーンアップ実行');
    this._cleanup();
  }

  /**
   * 内部クリーンアップ処理
   */
  _cleanup() {
    // 全Analyser削除
    for (const id of this.analysers.keys()) {
      this.removeAnalyser(id);
    }

    // MediaStream停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 [AudioManager] MediaStreamTrack停止');
      });
      this.mediaStream = null;
    }

    // AudioContext閉じる
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      console.log('🛑 [AudioManager] AudioContext閉鎖');
      this.audioContext = null;
    }

    // SourceNode削除
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // 状態リセット
    this.isInitialized = false;
    this.refCount = 0;
    this.initPromise = null;

    console.log('✅ [AudioManager] クリーンアップ完了');
  }

  /**
   * 現在の状態取得（デバッグ用）
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      refCount: this.refCount,
      audioContextState: this.audioContext?.state || 'none',
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
      return { healthy: false, reason: 'MediaStream not initialized' };
    }

    const tracks = this.mediaStream.getTracks();
    if (tracks.length === 0) {
      return { healthy: false, reason: 'No tracks available' };
    }

    const audioTrack = tracks.find(track => track.kind === 'audio');
    if (!audioTrack) {
      return { healthy: false, reason: 'No audio track found' };
    }

    if (audioTrack.readyState === 'ended') {
      return { healthy: false, reason: 'Audio track ended' };
    }

    if (!audioTrack.enabled) {
      return { healthy: false, reason: 'Audio track disabled' };
    }

    return { healthy: true, track: audioTrack };
  }
}

// シングルトンインスタンス - アプリ全体で1つのみ
export const audioManager = new AudioManager();

// デバッグ用のグローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.audioManager = audioManager;
}