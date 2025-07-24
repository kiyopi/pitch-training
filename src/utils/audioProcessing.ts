/**
 * 統一音響処理モジュール (Unified Audio Processing Module)
 * 
 * 目的: 全ページで一貫した音響処理を保証
 * 基準: マイクテストページの実装に完全準拠
 * 対象: マイクテスト・ランダム基音・連続チャレンジ・12音階モード
 */

/**
 * 音響処理設定インターフェース
 */
export interface AudioProcessingConfig {
  platform: {
    ios: { 
      divisor: number; 
      gainCompensation: number; 
      noiseThreshold: number; 
    };
    pc: { 
      divisor: number; 
      gainCompensation: number; 
      noiseThreshold: number; 
    };
  };
  frequency: { 
    min: number; 
    max: number; 
    clarityThreshold: number; 
  };
  smoothing: { 
    factor: number; 
  };
}

/**
 * 音量計算結果インターフェース
 */
export interface VolumeResult {
  rms: number;
  maxAmplitude: number;
  calculatedVolume: number;
  rawVolumePercent: number;
  compensatedVolume: number;
  finalVolume: number;
}

/**
 * プラットフォーム検出結果インターフェース
 */
export interface PlatformInfo {
  isIOS: boolean;
  userAgent: string;
}

/**
 * 統一音響処理クラス
 * マイクテストページの実装を完全再現
 */
export class UnifiedAudioProcessor {
  private config: AudioProcessingConfig;
  private previousVolume: number = 0;
  private platformInfo: PlatformInfo;

  /**
   * コンストラクタ
   * @param customConfig - カスタム設定（オプション）
   */
  constructor(customConfig?: Partial<AudioProcessingConfig>) {
    // デフォルト設定（マイクテストページ準拠）
    const defaultConfig: AudioProcessingConfig = {
      platform: {
        ios: { 
          divisor: 4.0, 
          gainCompensation: 1.5, 
          noiseThreshold: 12 
        },
        pc: { 
          divisor: 6.0, 
          gainCompensation: 1.0, 
          noiseThreshold: 15 
        }
      },
      frequency: { 
        min: 80, 
        max: 2000, 
        clarityThreshold: 0.6 
      },
      smoothing: { 
        factor: 0.2 
      }
    };

    // 設定をマージ
    this.config = this.mergeWithDefaults(defaultConfig, customConfig);
    
    // プラットフォーム情報を取得
    this.platformInfo = this.detectPlatform();
  }

  /**
   * 設定のマージ処理
   */
  private mergeWithDefaults(
    defaults: AudioProcessingConfig, 
    custom?: Partial<AudioProcessingConfig>
  ): AudioProcessingConfig {
    if (!custom) return defaults;

    return {
      platform: {
        ios: { ...defaults.platform.ios, ...custom.platform?.ios },
        pc: { ...defaults.platform.pc, ...custom.platform?.pc }
      },
      frequency: { ...defaults.frequency, ...custom.frequency },
      smoothing: { ...defaults.smoothing, ...custom.smoothing }
    };
  }

  /**
   * プラットフォーム検出
   */
  private detectPlatform(): PlatformInfo {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    return { isIOS, userAgent };
  }

  /**
   * 音量計算（マイクテストページ準拠）
   * @param data - バイト配列データ（getByteTimeDomainData()の結果）
   * @returns 音量計算結果
   */
  calculateVolume(data: Uint8Array): VolumeResult {
    const bufferLength = data.length;
    let sum = 0;
    let maxAmplitude = 0;

    // RMS計算とMax振幅トラッキング（マイクテストページ準拠）
    for (let i = 0; i < bufferLength; i++) {
      const sample = (data[i] - 128) / 128;  // -1 to 1 正規化
      sum += sample * sample;
      maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
    }

    const rms = Math.sqrt(sum / bufferLength);

    // 音量計算式（マイクテストページ準拠）
    const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);

    // プラットフォーム別補正
    const { rawVolumePercent, compensatedVolume } = this.applyPlatformCorrection(calculatedVolume);

    // スムージング処理
    const finalVolume = this.applySmoothingFilter(compensatedVolume);

    return {
      rms,
      maxAmplitude,
      calculatedVolume,
      rawVolumePercent,
      compensatedVolume,
      finalVolume
    };
  }

  /**
   * プラットフォーム別補正適用
   */
  private applyPlatformCorrection(calculatedVolume: number): {
    rawVolumePercent: number;
    compensatedVolume: number;
  } {
    const spec = this.platformInfo.isIOS ? 
      this.config.platform.ios : 
      this.config.platform.pc;

    // プラットフォーム適応
    const rawVolumePercent = Math.min(
      Math.max(calculatedVolume / spec.divisor * 100, 0), 
      100
    );

    // ゲイン補正
    const compensatedVolume = rawVolumePercent * spec.gainCompensation;

    return { rawVolumePercent, compensatedVolume };
  }

  /**
   * スムージングフィルター適用
   */
  applySmoothingFilter(currentVolume: number): number {
    const smoothedVolume = this.previousVolume + 
      this.config.smoothing.factor * (currentVolume - this.previousVolume);
    
    this.previousVolume = smoothedVolume;
    return smoothedVolume;
  }

  /**
   * 音量表示判定（周波数検出連動）
   */
  shouldDisplayVolume(frequency: number | null, clarity: number): boolean {
    if (!frequency) return false;
    
    return (
      clarity > this.config.frequency.clarityThreshold &&
      frequency >= this.config.frequency.min &&
      frequency <= this.config.frequency.max
    );
  }

  /**
   * 最終音量計算（ノイズ閾値適用）
   */
  getFinalDisplayVolume(volume: number): number {
    const spec = this.platformInfo.isIOS ? 
      this.config.platform.ios : 
      this.config.platform.pc;

    return volume > spec.noiseThreshold ? volume : 0;
  }

  /**
   * プラットフォーム情報取得
   */
  getPlatformInfo(): PlatformInfo {
    return this.platformInfo;
  }

  /**
   * 現在の設定取得
   */
  getConfig(): AudioProcessingConfig {
    return this.config;
  }

  /**
   * スムージング状態リセット
   */
  resetSmoothingState(): void {
    this.previousVolume = 0;
  }

  /**
   * デバッグ情報取得
   */
  getDebugInfo(): {
    platform: string;
    config: AudioProcessingConfig;
    previousVolume: number;
  } {
    return {
      platform: this.platformInfo.isIOS ? 'iOS' : 'PC',
      config: this.config,
      previousVolume: this.previousVolume
    };
  }
}

/**
 * デフォルトインスタンス作成関数
 */
export function createUnifiedAudioProcessor(config?: Partial<AudioProcessingConfig>): UnifiedAudioProcessor {
  return new UnifiedAudioProcessor(config);
}

/**
 * プラットフォーム検出ユーティリティ
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  return { isIOS, userAgent };
}

/**
 * 周波数から音名変換（マイクテストページ準拠）
 */
export function frequencyToNoteName(frequency: number): string {
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
}