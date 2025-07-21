# Direct DOM Audio System 技術仕様書

**バージョン**: v1.0.0-ddas  
**作成日**: 2025-07-21  
**対象技術**: Next.js + React + DOM直接操作  
**目的**: 高速・高品質な音声UI更新システムの実現

---

## 🎯 システム概要

### **Direct DOM Audio System（DDAS）とは**
Next.js + React状態管理 + DOM直接操作による高速音声UI更新システム

### **🔧 技術構成**
- **React Component**: 状態管理・ライフサイクル管理のみ
- **DOM Direct Updates**: 音声関連UI更新（60FPS対応）
- **Web Audio API**: 音声処理・検出・再生
- **分離設計**: 基音再生とマイク検出の完全分離

### **⚠️ 重要な区別**
- **旧HYBRID権限システム**: マイクロフォン許可管理（**使用禁止**）
- **Direct DOM Audio System**: UI更新手法（**推進中**）
- **技術的関連性**: なし（完全に別のシステム）

---

## 🏗️ アーキテクチャ設計

### **基本構成**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React State   │    │  DOM References │    │  Web Audio API  │
│    Management   │◄──►│   Direct Update │◄──►│   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
  状態管理・制御        高速UI更新(60FPS)      音声処理・検出
```

### **分離設計の原則**
```typescript
// Phase 1: 基音再生（マイクOFF）
const playBaseTone = async () => {
  // マイクロフォン完全停止
  await stopMicrophone();
  
  // 基音再生開始
  await startBaseTonePlayback();
  
  // DOM直接更新
  updateBaseToneDisplay(selectedTone);
}

// Phase 2: 採点処理（基音OFF）
const startScoring = async () => {
  // 基音再生完全停止
  await stopBaseTonePlayback();
  
  // マイクロフォン開始
  await startMicrophone();
  
  // DOM直接更新開始
  startFrequencyDisplayUpdates();
}
```

---

## 🔧 実装詳細

### **1. DOM直接操作システム**

#### **周波数表示更新**
```typescript
const updateFrequencyDisplay = (frequency: number | null) => {
  if (frequencyDisplayRef.current) {
    if (frequency && frequency > 80 && frequency < 1200) {
      // リアルタイム周波数表示
      frequencyDisplayRef.current.innerHTML = `
        <div class="text-center">
          <div class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ${frequency.toFixed(1)} Hz
          </div>
        </div>
      `;
    } else {
      // 待機状態表示
      frequencyDisplayRef.current.innerHTML = `
        <div class="text-center text-gray-400">
          🎵 音声を発声してください
        </div>
      `;
    }
  }
};
```

#### **基音表示更新**
```typescript
const updateBaseToneDisplay = (tone: BaseTone | null) => {
  if (baseToneDisplayRef.current) {
    if (tone) {
      baseToneDisplayRef.current.innerHTML = `
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="text-2xl font-bold text-blue-800">${tone.note}</div>
          <div class="text-sm text-blue-600">${tone.frequency.toFixed(2)} Hz</div>
        </div>
      `;
    } else {
      baseToneDisplayRef.current.innerHTML = `
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="text-gray-500">基音を選択してください</div>
        </div>
      `;
    }
  }
};
```

### **2. 音声システム分離**

#### **基音再生システム**
```typescript
class BaseToneManager {
  private sampler: Tone.Sampler | null = null;
  private isInitialized = false;
  
  async initialize() {
    this.sampler = new Tone.Sampler({
      urls: {
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3", 
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3"
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      release: 1.5,
      volume: 6 // iPhone音量最適化
    }).toDestination();
    
    await Tone.loaded();
    this.isInitialized = true;
  }
  
  async playTone(tone: BaseTone, duration: number = 2000) {
    if (!this.sampler || !this.isInitialized) {
      throw new Error('基音システムが初期化されていません');
    }
    
    // AudioContext再開（iPhone対応）
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    this.sampler.triggerAttack(tone.tonejs, undefined, 0.8);
    
    setTimeout(() => {
      if (this.sampler) {
        this.sampler.triggerRelease(tone.tonejs);
      }
    }, duration);
  }
}
```

#### **マイクロフォン管理システム**
```typescript
class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrame: number | null = null;
  
  async start(): Promise<boolean> {
    try {
      // 最適化制約でマイクロフォンアクセス
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      // AudioContext・Analyser設定
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      // 音声ストリーム接続
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      
      return true;
    } catch (error) {
      console.error('マイクロフォン開始失敗:', error);
      return false;
    }
  }
  
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false; // iPhone Safari確実停止
      });
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }
}
```

### **3. 音程検出システム**
```typescript
class PitchDetectionManager {
  private pitchDetector: PitchDetector<Float32Array> | null = null;
  
  initialize(fftSize: number) {
    this.pitchDetector = PitchDetector.forFloat32Array(fftSize);
    this.pitchDetector.clarityThreshold = 0.15;
    this.pitchDetector.maxInputAmplitude = 1.0;
  }
  
  detectFrequency(analyser: AnalyserNode): { frequency: number | null; clarity: number } {
    if (!this.pitchDetector || !analyser) {
      return { frequency: null, clarity: 0 };
    }
    
    const timeDomainData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    const sampleRate = 44100; // 固定サンプリングレート
    const [frequency, clarity] = this.pitchDetector.findPitch(timeDomainData, sampleRate);
    
    // 有効範囲・明瞭度チェック
    if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
      return { frequency: Math.round(frequency * 10) / 10, clarity };
    }
    
    return { frequency: null, clarity: 0 };
  }
}
```

---

## 🎯 ユーザー操作フロー

### **完全分離フロー**
```
1. マイク許可取得
   └── getUserMedia() + 権限確認

2. 基音再生フェーズ
   ├── マイクロフォン停止
   ├── 基音選択・再生
   ├── DOM表示更新（基音情報）
   └── 再生完了待機

3. 採点フェーズ
   ├── 基音再生停止
   ├── マイクロフォン開始
   ├── 音程検出開始
   ├── DOM表示更新（周波数）
   └── ドレミファソラシド採点

4. 結果表示
   ├── 採点結果計算
   ├── DOM表示更新（結果）
   └── もう一度ボタン有効化
```

### **フェーズ分離の利点**
- **音質最適化**: 各フェーズで最適な音声設定
- **リソース効率**: 不要なシステム停止による軽量化
- **iPhone対応**: iOS音声制限の回避
- **デバッグ容易**: 問題の特定・修正が簡単

---

## 📱 iPhone最適化

### **AudioContext管理**
```typescript
// iPhone Safari対応
const ensureAudioContextRunning = async () => {
  if (Tone.context.state === 'suspended') {
    await Tone.start();
    // 追加待機でiOS安定化
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

### **音量設定**
```typescript
// iPhone音量問題解決
const createOptimizedSampler = () => {
  return new Tone.Sampler({
    urls: { "C4": "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    release: 1.5,
    volume: 6 // iPhone専用音量設定
  }).toDestination();
};
```

### **マイクロフォン停止**
```typescript
// iPhone完全停止
const stopMicrophoneCompletely = (stream: MediaStream) => {
  stream.getTracks().forEach(track => {
    track.stop();
    track.enabled = false; // iPhone Safari確実停止
  });
};
```

---

## 🔍 デバッグ・ログ機能

### **DOM操作ログ**
```typescript
const addLog = (message: string) => {
  console.log(message);
  
  if (logRef.current) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const logEntry = document.createElement('div');
    logEntry.className = 'text-sm text-gray-600 font-mono';
    logEntry.textContent = `${timestamp}: ${message}`;
    
    // 最新ログを先頭に追加
    logRef.current.insertBefore(logEntry, logRef.current.firstChild);
    
    // 最大5つまで保持
    while (logRef.current.children.length > 5) {
      logRef.current.removeChild(logRef.current.lastChild!);
    }
  }
};
```

### **システム状態表示**
```typescript
const updateSystemStatus = (phase: 'idle' | 'base-tone' | 'scoring') => {
  if (statusRef.current) {
    const statusInfo = {
      idle: { message: '待機中', color: 'gray' },
      'base-tone': { message: '基音再生中', color: 'blue' },
      scoring: { message: '採点中', color: 'green' }
    };
    
    const { message, color } = statusInfo[phase];
    statusRef.current.innerHTML = `<span class="text-${color}-600 font-bold">${message}</span>`;
  }
};
```

---

## ⚡ パフォーマンス最適化

### **60FPS DOM更新**
```typescript
// 高速更新用のrequestAnimationFrame
const updateFrequencyLoop = () => {
  const { frequency } = detectFrequency();
  
  if (frequency !== null) {
    updateFrequencyDisplay(frequency);
  }
  
  animationFrameRef.current = requestAnimationFrame(updateFrequencyLoop);
};
```

### **メモリ管理**
```typescript
// リソース確実解放
const cleanup = () => {
  // アニメーションフレーム停止
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }
  
  // 音源・マイク停止
  baseToneManager.cleanup();
  microphoneManager.stop();
  
  // 状態リセット
  setPhase('idle');
};
```

---

## 🧪 テスト・検証

### **必須テスト項目**
1. **基音再生テスト**: 各基音の明瞭な再生確認
2. **マイク分離テスト**: 基音再生中のマイク完全停止確認
3. **DOM更新テスト**: 60FPS表示更新の滑らかさ確認
4. **iPhone互換テスト**: iOS Safari での完全動作確認
5. **フェーズ移行テスト**: 各段階の正確な切り替え確認

### **品質基準**
- **基音再生**: iPhone音量問題なし
- **周波数検出**: ±50セント精度
- **UI応答**: 16ms以下（60FPS）
- **メモリ使用**: 50MB以下
- **CPU使用率**: 30%以下

---

## 📚 関連ドキュメント

### **技術仕様書**
- `PITCHY_SPECS.md`: Pitchy音程検出ライブラリ仕様
- `TONE_JS_NOTES.md`: Tone.js音源実装ノート
- `WEB_AUDIO_API_GUIDE.md`: Web Audio API実装ガイド

### **設計原則**
- `SIMPLE_PITCH_TRAINING_DESIGN_PRINCIPLES.md`: 設計原則
- `ERROR_DIALOG_SPECIFICATION.md`: エラーハンドリング仕様

### **要件定義**
- `COMPREHENSIVE_REQUIREMENTS_SPECIFICATION.md`: 統合要件定義

---

## 🔧 実装例（完全版）

### **React Component統合**
```typescript
'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import * as Tone from 'tone';

export default function DirectDomAudioTestPage() {
  // DOM References（直接操作用）
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const baseToneDisplayRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  
  // React State（制御用のみ）
  const [phase, setPhase] = useState<'idle' | 'base-tone' | 'scoring'>('idle');
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  
  // Audio Systems
  const baseToneManagerRef = useRef<BaseToneManager | null>(null);
  const microphoneManagerRef = useRef<MicrophoneManager | null>(null);
  const pitchDetectorRef = useRef<PitchDetectionManager | null>(null);
  
  // 初期化
  useEffect(() => {
    baseToneManagerRef.current = new BaseToneManager();
    microphoneManagerRef.current = new MicrophoneManager();
    pitchDetectorRef.current = new PitchDetectionManager();
    
    baseToneManagerRef.current.initialize();
    
    return () => {
      cleanup();
    };
  }, []);
  
  // 基音再生（フェーズ1）
  const handlePlayBaseTone = useCallback(async () => {
    try {
      setPhase('base-tone');
      updateSystemStatus('base-tone');
      
      // マイクロフォン停止（重要）
      microphoneManagerRef.current?.stop();
      
      // ランダム基音選択
      const selectedTone = selectRandomBaseTone();
      setCurrentBaseTone(selectedTone);
      updateBaseToneDisplay(selectedTone);
      
      // 基音再生
      await baseToneManagerRef.current?.playTone(selectedTone, 2000);
      
      // フェーズ2へ自動移行
      setTimeout(() => {
        startScoringPhase();
      }, 2100);
      
    } catch (error) {
      addLog(`❌ 基音再生エラー: ${error}`);
      setPhase('idle');
    }
  }, []);
  
  // 採点フェーズ開始（フェーズ2）
  const startScoringPhase = useCallback(async () => {
    try {
      setPhase('scoring');
      updateSystemStatus('scoring');
      
      // マイクロフォン開始
      const success = await microphoneManagerRef.current?.start();
      if (success) {
        startFrequencyDetection();
        addLog('✅ 採点フェーズ開始');
      }
      
    } catch (error) {
      addLog(`❌ 採点フェーズエラー: ${error}`);
      setPhase('idle');
    }
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* システム状態表示 */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 システム状態</h3>
        <div ref={statusRef} className="text-lg">
          <span className="text-gray-500">初期化中...</span>
        </div>
      </div>
      
      {/* 基音表示 */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎵 基音情報</h3>
        <div ref={baseToneDisplayRef}>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-500">基音を選択してください</div>
          </div>
        </div>
      </div>
      
      {/* 周波数表示 */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 周波数検出</h3>
        <div ref={frequencyDisplayRef} className="text-lg text-gray-400">
          🎤 音声検出待ち...
        </div>
      </div>
      
      {/* 制御ボタン */}
      <button
        onClick={handlePlayBaseTone}
        disabled={phase !== 'idle'}
        className="px-8 py-4 bg-blue-500 text-white rounded-xl font-bold disabled:bg-gray-400"
      >
        {phase === 'idle' ? '🎲 ランダム基音再生' : 
         phase === 'base-tone' ? '🎵 基音再生中...' : 
         '📈 採点中...'}
      </button>
      
      {/* ログ表示 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-2">📝 ログ</h4>
        <div ref={logRef} className="space-y-1 max-h-32 overflow-y-auto">
          <div className="text-sm text-gray-500">ログが表示されます...</div>
        </div>
      </div>
    </div>
  );
}
```

---

**この仕様書は、Direct DOM Audio Systemの完全な技術実装ガイドです。旧HYBRID権限システムとの混同を避け、高品質な音声UIシステムを構築するための詳細な指針を提供します。**

*最終更新: 2025-07-21*  
*バージョン: v1.0.0-ddas*  
*責任者: Claude Development Team*