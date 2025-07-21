/**
 * Vanilla Audio Engine - プロトタイプ準拠の音声処理エンジン
 * iPhone音量問題を解決するvanilla JavaScript音声実装
 */

import * as Tone from 'tone';

export interface BaseTone {
  name: string;
  note: string;
  frequency: number;
  tonejs: string;
}

/**
 * プロトタイプ準拠の基音データ（random-training.htmlより移植）
 */
export const PROTOTYPE_BASE_TONES: BaseTone[] = [
  { name: 'Bb3', note: 'シ♭3', frequency: 233.08, tonejs: 'Bb3' },
  { name: 'C4',  note: 'ド4',   frequency: 261.63, tonejs: 'C4' },
  { name: 'Db4', note: 'レ♭4', frequency: 277.18, tonejs: 'Db4' },
  { name: 'D4',  note: 'レ4',   frequency: 293.66, tonejs: 'D4' },
  { name: 'Eb4', note: 'ミ♭4', frequency: 311.13, tonejs: 'Eb4' },
  { name: 'E4',  note: 'ミ4',   frequency: 329.63, tonejs: 'E4' },
  { name: 'F4',  note: 'ファ4', frequency: 349.23, tonejs: 'F4' },
  { name: 'Gb4', note: 'ソ♭4', frequency: 369.99, tonejs: 'Gb4' },
  { name: 'G4',  note: 'ソ4',   frequency: 392.00, tonejs: 'G4' },
  { name: 'Ab4', note: 'ラ♭4', frequency: 415.30, tonejs: 'Ab4' }
];

export interface VanillaAudioConfig {
  volume?: number;
  velocity?: number;
  duration?: number;
  baseUrl?: string;
}

/**
 * Vanilla Audio Engine - iPhone音量問題解決済み音声エンジン
 */
export class VanillaAudioEngine {
  private sampler: Tone.Sampler | null = null;
  private config: Required<VanillaAudioConfig>;
  private isInitialized: boolean = false;
  private currentNote: string | null = null;
  private playbackTimeoutId: number | null = null;

  constructor(config: VanillaAudioConfig = {}) {
    // プロトタイプ準拠のデフォルト設定
    this.config = {
      volume: config.volume ?? 6,  // プロトタイプ準拠: volume: 6
      velocity: config.velocity ?? 0.8,  // プロトタイプ準拠: velocity: 0.8
      duration: config.duration ?? 2000,  // プロトタイプ準拠: 2秒再生
      baseUrl: config.baseUrl ?? "https://tonejs.github.io/audio/salamander/"
    };
  }

  /**
   * ピアノ音源初期化（プロトタイプ準拠）
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.sampler) {
      return true;
    }

    try {
      console.log('🎹 VanillaAudioEngine: ピアノ音源初期化開始');
      
      // プロトタイプと同じSampler設定（4音源版）
      this.sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          "A4": "A4.mp3"
        },
        baseUrl: this.config.baseUrl,
        volume: this.config.volume,  // iPhone音量問題解決済み設定
        release: 1.5  // 自然なリリース
      }).toDestination();

      // 音源読み込み完了待機
      await Tone.loaded();
      
      this.isInitialized = true;
      console.log('✅ VanillaAudioEngine: ピアノ音源初期化完了');
      return true;
      
    } catch (error) {
      console.error('❌ VanillaAudioEngine: ピアノ音源初期化失敗:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * iPhone AudioContext問題対策
   */
  private async ensureAudioContextResumed(): Promise<void> {
    if (Tone.context.state === 'suspended') {
      console.log('🔊 VanillaAudioEngine: AudioContext復旧開始');
      await Tone.context.resume();
      console.log('✅ VanillaAudioEngine: AudioContext復旧完了');
    }
  }

  /**
   * プロトタイプ準拠のピアノ音再生（iPhone対応強化）
   */
  async playBaseTone(note: string): Promise<boolean> {
    try {
      // iPhone AudioContext問題対策
      await this.ensureAudioContextResumed();
      // 初期化確認
      if (!await this.initialize()) {
        throw new Error('音源初期化失敗');
      }

      // AudioContext開始（プロトタイプ準拠）
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        console.log('🔊 VanillaAudioEngine: AudioContext開始');
      }

      // 既存再生停止
      if (this.currentNote && this.sampler) {
        this.sampler.triggerRelease(this.currentNote);
        if (this.playbackTimeoutId) {
          clearTimeout(this.playbackTimeoutId);
        }
      }

      // ピアノ音再生（プロトタイプ準拠の設定）
      this.currentNote = note;
      console.log(`🎵 VanillaAudioEngine: 再生開始 ${note} (volume: ${this.config.volume}, velocity: ${this.config.velocity})`);
      
      if (!this.sampler) {
        throw new Error('Sampler未初期化');
      }

      this.sampler.triggerAttack(note, undefined, this.config.velocity);

      // プロトタイプ準拠の2秒後自動リリース
      this.playbackTimeoutId = window.setTimeout(() => {
        if (this.sampler && this.currentNote) {
          this.sampler.triggerRelease(this.currentNote);
          console.log(`🔇 VanillaAudioEngine: 再生終了 ${this.currentNote}`);
          this.currentNote = null;
          this.playbackTimeoutId = null;
        }
      }, this.config.duration);

      return true;

    } catch (error) {
      console.error('❌ VanillaAudioEngine: 再生エラー:', error);
      return false;
    }
  }

  /**
   * ランダム基音選択＆再生（プロトタイプ準拠）
   */
  async playRandomBaseTone(): Promise<BaseTone | null> {
    try {
      // ランダム基音選択（プロトタイプと同じロジック）
      const randomIndex = Math.floor(Math.random() * PROTOTYPE_BASE_TONES.length);
      const selectedTone = PROTOTYPE_BASE_TONES[randomIndex];

      console.log(`🎲 VanillaAudioEngine: ランダム基音選択 ${selectedTone.note} (${selectedTone.frequency}Hz)`);

      // ピアノ音再生
      const success = await this.playBaseTone(selectedTone.tonejs);
      
      return success ? selectedTone : null;

    } catch (error) {
      console.error('❌ VanillaAudioEngine: ランダム再生エラー:', error);
      return null;
    }
  }

  /**
   * 手動再生停止
   */
  stop(): void {
    if (this.currentNote && this.sampler) {
      this.sampler.triggerRelease(this.currentNote);
      console.log(`⏹️ VanillaAudioEngine: 手動停止 ${this.currentNote}`);
    }

    if (this.playbackTimeoutId) {
      clearTimeout(this.playbackTimeoutId);
      this.playbackTimeoutId = null;
    }

    this.currentNote = null;
  }

  /**
   * 音量設定更新（リアルタイム）
   */
  setVolume(volume: number): void {
    this.config.volume = volume;
    if (this.sampler) {
      this.sampler.volume.value = volume;
      console.log(`🔊 VanillaAudioEngine: 音量更新 ${volume}dB`);
    }
  }

  /**
   * 設定取得
   */
  getConfig(): Required<VanillaAudioConfig> {
    return { ...this.config };
  }

  /**
   * 初期化状態確認
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 現在の再生状態
   */
  get isPlaying(): boolean {
    return this.currentNote !== null;
  }

  /**
   * 現在再生中の音名
   */
  get currentPlayingNote(): string | null {
    return this.currentNote;
  }

  /**
   * リソース解放
   */
  dispose(): void {
    this.stop();
    
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }

    this.isInitialized = false;
    console.log('🗑️ VanillaAudioEngine: リソース解放完了');
  }
}

/**
 * シングルトンインスタンス（グローバル共有用）
 */
let globalAudioEngine: VanillaAudioEngine | null = null;

/**
 * グローバルオーディオエンジン取得
 */
export function getGlobalAudioEngine(config?: VanillaAudioConfig): VanillaAudioEngine {
  if (!globalAudioEngine) {
    globalAudioEngine = new VanillaAudioEngine(config);
  }
  return globalAudioEngine;
}

/**
 * グローバルオーディオエンジン解放
 */
export function disposeGlobalAudioEngine(): void {
  if (globalAudioEngine) {
    globalAudioEngine.dispose();
    globalAudioEngine = null;
  }
}