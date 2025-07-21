import * as Tone from "tone";

/**
 * iOS Safari用音量ブースタークラス
 * 複数のGainNodeとCompressorを使用して30-40dBの增幅を実現
 */
export class iOSVolumeBooster {
  private gainStages: Tone.Gain[] = [];
  private compressor: Tone.Compressor;
  private limiter: Tone.Limiter;
  private isConnected: boolean = false;
  
  constructor(stages: number = 3, gainPerStageDB: number = 10) {
    // 複数のGainNodeを作成（各段階でgainPerStageDB増幅）
    for (let i = 0; i < stages; i++) {
      const gainValue = Tone.dbToGain(gainPerStageDB);
      this.gainStages.push(new Tone.Gain(gainValue));
    }
    
    // DynamicsCompressorで歪み防止
    this.compressor = new Tone.Compressor({
      threshold: -12, // -12dB以上をコンプレッション
      ratio: 8,       // 8:1の圧縮比
      attack: 0.003,  // 3ms攻撃時間
      release: 0.25   // 250ms解放時間
    });
    
    // Limiterで最終的なクリッピング防止
    this.limiter = new Tone.Limiter(-3); // -3dBでリミット
    
    // チェーン接続: Gain1 -> Gain2 -> Gain3 -> Compressor -> Limiter
    this.connectChain();
  }
  
  /**
   * 内部チェーンを接続
   */
  private connectChain(): void {
    // GainNodeをチェーン接続
    for (let i = 0; i < this.gainStages.length - 1; i++) {
      this.gainStages[i].connect(this.gainStages[i + 1]);
    }
    
    // 最後のGainNodeからCompressor、Limiterへ
    const lastGain = this.gainStages[this.gainStages.length - 1];
    lastGain.connect(this.compressor);
    this.compressor.connect(this.limiter);
  }
  
  /**
   * 音源をブースターチェーンに接続
   */
  connect(source: Tone.ToneAudioNode): Tone.Limiter {
    if (this.isConnected) {
      throw new Error("VolumeBooster is already connected to a source");
    }
    
    source.connect(this.gainStages[0]);
    this.isConnected = true;
    return this.limiter;
  }
  
  /**
   * ブースターチェーンをdestinationに接続
   */
  toDestination(): this {
    this.limiter.toDestination();
    return this;
  }
  
  /**
   * 各段階のGain値を動的に調整
   */
  setGainDB(stageIndex: number, gainDB: number): void {
    if (stageIndex >= 0 && stageIndex < this.gainStages.length) {
      const gainValue = Tone.dbToGain(gainDB);
      this.gainStages[stageIndex].gain.value = gainValue;
    }
  }
  
  /**
   * 全段階のGain値を一括設定
   */
  setAllGainsDB(gainDB: number): void {
    const gainValue = Tone.dbToGain(gainDB);
    this.gainStages.forEach(stage => {
      stage.gain.value = gainValue;
    });
  }
  
  /**
   * コンプレッサーの閾値を調整
   */
  setCompressorThreshold(thresholdDB: number): void {
    this.compressor.threshold.value = thresholdDB;
  }
  
  /**
   * リソースを解放
   */
  dispose(): void {
    this.gainStages.forEach(stage => stage.dispose());
    this.compressor.dispose();
    this.limiter.dispose();
    this.gainStages = [];
    this.isConnected = false;
  }
  
  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): object {
    return {
      stages: this.gainStages.length,
      gainValues: this.gainStages.map(stage => Tone.gainToDb(stage.gain.value)),
      compressorThreshold: this.compressor.threshold.value,
      limiterThreshold: this.limiter.threshold,
      isConnected: this.isConnected
    };
  }
}

/**
 * iOS検出ユーティリティ
 */
export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * iOS用音量ブースターのファクトリー関数
 * iOS環境でのみブースターを作成し、それ以外は通常の処理
 */
export function createVolumeBooster(): iOSVolumeBooster | null {
  if (isIOS()) {
    // iOS環境: 3段階 × 12dB = 36dB増幅
    return new iOSVolumeBooster(3, 12);
  }
  return null;
}