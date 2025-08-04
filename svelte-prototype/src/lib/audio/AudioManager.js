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
    this.gainNode = null; // マイク感度調整用
    
    // Analyser管理
    this.analysers = new Map(); // id -> analyser
    this.filters = new Map();   // id -> filter chain
    
    // 参照カウント（安全なクリーンアップ用）
    this.refCount = 0;
    this.initPromise = null; // 初期化の重複実行防止
    
    // 状態管理
    this.isInitialized = false;
    this.lastError = null;
    
    // 感度設定
    this.currentSensitivity = 1.0; // デフォルト感度
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

    // 既に初期化済みの場合 - ただしMediaStream健康チェック実行
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
        // MediaStreamが不健康な場合は強制再初期化
        console.warn('⚠️ [AudioManager] MediaStream不健康検出 - 強制再初期化:', healthCheck.reason);
        console.log('🔄 [AudioManager] 不健康なMediaStream詳細:', {
          mediaStreamActive: this.mediaStream?.active,
          trackCount: this.mediaStream?.getTracks().length,
          trackStates: this.mediaStream?.getTracks().map(t => ({
            kind: t.kind,
            readyState: t.readyState,
            enabled: t.enabled,
            muted: t.muted
          }))
        });
        
        // 安全なクリーンアップ実行
        this._cleanup();
        this.isInitialized = false;
        this.refCount = 0;
        
        // 短い待機時間でリソース解放を確実に
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔄 [AudioManager] クリーンアップ完了 - 再初期化開始');
        // 再初期化のため次のブロックに進む
      }
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
        // iPad/iPhone検出
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        console.log(`🔍 [AudioManager] デバイス検出: ${isIOS ? 'iOS' : 'その他'}`, navigator.userAgent);
        
        // Safari WebKit対応: 最大互換性音声設定
        const audioConstraints = {
          audio: {
            // 基本設定：Safari WebKit安定性重視
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            
            // iPad/iPhone専用: 超高感度設定
            ...(isIOS && {
              googAutoGainControl: false,     // Google AGC完全無効化
              googNoiseSuppression: false,    // Google ノイズ抑制無効化
              googEchoCancellation: false,    // Google エコーキャンセル無効化
              googHighpassFilter: false,      // Google ハイパスフィルター無効化
              googTypingNoiseDetection: false, // タイピングノイズ検出無効化
              googBeamforming: false,         // ビームフォーミング無効化
              mozAutoGainControl: false,      // Mozilla AGC無効化
              mozNoiseSuppression: false,     // Mozilla ノイズ抑制無効化
            }),
            
            // Safari対応: 明示的品質設定
            sampleRate: 44100,
            channelCount: 1,
            sampleSize: 16,
            
            // Safari WebKit追加安定化設定
            latency: 0.1,  // 100ms遅延許容
            volume: 1.0,   // 音量正規化
            
            // デバイス選択を柔軟に（Safari対応）
            deviceId: { ideal: 'default' }
          }
        };
        
        console.log('🎤 [AudioManager] Safari対応設定でMediaStream取得中:', audioConstraints);
        this.mediaStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
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

      // GainNode作成（マイク感度調整用）
      if (!this.gainNode) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.currentSensitivity;
        
        // SourceNode -> GainNode の接続
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

    // Analyser作成（Safari WebKit最適化）
    const analyser = this.audioContext.createAnalyser();
    
    // Safari負荷軽減設定
    analyser.fftSize = Math.min(fftSize, 2048); // Safari上限制限
    analyser.smoothingTimeConstant = Math.max(smoothingTimeConstant, 0.7); // Safari安定化
    analyser.minDecibels = Math.max(minDecibels, -80); // Safari範囲最適化
    analyser.maxDecibels = Math.min(maxDecibels, -10);

    let finalNode = this.gainNode || this.sourceNode;

    // フィルターチェーン作成（オプション）
    if (useFilters) {
      const filterChain = this._createFilterChain();
      this.filters.set(id, filterChain);
      
      // フィルターチェーン接続（GainNodeから開始）
      finalNode.connect(filterChain.highpass);
      filterChain.highpass.connect(filterChain.lowpass);
      filterChain.lowpass.connect(filterChain.notch);
      filterChain.notch.connect(analyser);
      
      console.log(`🔧 [AudioManager] フィルター付きAnalyser作成: ${id}`);
    } else {
      // 直接接続（GainNodeからの信号）
      finalNode.connect(analyser);
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
   * マイク感度調整
   * @param {number} sensitivity - 感度倍率 (0.1 ～ 10.0)
   */
  setSensitivity(sensitivity) {
    // 範囲制限（iPad実機対応で10.0xまで拡張）
    const clampedSensitivity = Math.max(0.1, Math.min(10.0, sensitivity));
    
    if (this.gainNode) {
      this.gainNode.gain.value = clampedSensitivity;
      this.currentSensitivity = clampedSensitivity;
      console.log(`🎤 [AudioManager] マイク感度更新: ${clampedSensitivity.toFixed(1)}x`);
    } else {
      // GainNodeが未初期化の場合は設定のみ保存
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
    console.log('🧹 [AudioManager] クリーンアップ開始');
    
    // 全Analyser削除
    for (const id of this.analysers.keys()) {
      this.removeAnalyser(id);
    }

    // MediaStream停止（健康チェック対応）
    if (this.mediaStream) {
      const tracks = this.mediaStream.getTracks();
      console.log(`🛑 [AudioManager] MediaStream停止中: ${tracks.length} tracks`);
      
      tracks.forEach((track, index) => {
        try {
          if (track.readyState !== 'ended') {
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

    // AudioContext閉じる
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
        console.log('🛑 [AudioManager] AudioContext閉鎖完了');
      } catch (error) {
        console.warn('⚠️ [AudioManager] AudioContext閉鎖エラー:', error);
      }
      this.audioContext = null;
    }

    // GainNode削除
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
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
    this.currentSensitivity = 1.0;

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

    // MediaStream自体の状態チェック（Safari対応強化）
    if (!this.mediaStream.active) {
      return { healthy: false, reason: 'MediaStream inactive' };
    }

    const tracks = this.mediaStream.getTracks();
    if (tracks.length === 0) {
      return { healthy: false, reason: 'No tracks available' };
    }

    const audioTrack = tracks.find(track => track.kind === 'audio');
    if (!audioTrack) {
      return { healthy: false, reason: 'No audio track found' };
    }

    // AudioTrackの詳細状態チェック（Safari WebKit対応）
    if (audioTrack.readyState === 'ended') {
      return { healthy: false, reason: 'Audio track ended' };
    }

    if (!audioTrack.enabled) {
      return { healthy: false, reason: 'Audio track disabled' };
    }

    // Safari特有のmuted状態チェック
    if (audioTrack.muted) {
      return { healthy: false, reason: 'Audio track muted' };
    }

    // 追加チェック: MediaStreamとTrackの整合性確認
    if (this.mediaStream.active && audioTrack.readyState !== 'live') {
      return { healthy: false, reason: 'Track state inconsistent with MediaStream' };
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