# Step 2: AudioContext・音声処理基盤 実装仕様書 v1.0

## 📋 概要

### 目的
Step 1で構築したマイクロフォン基盤を拡張し、音程検出に最適化されたAudioContext音声処理パイプラインを実装

### 作成日
2025-07-18

### 対象システム
Next.js 15.4.1 + TypeScript + 相対音感トレーニングアプリ

---

## 🎯 Step 2実装目標

### 1. 音声処理パイプライン構築
- **AudioContextの最適化設定**
- **音程検出用オーディオグラフ作成**
- **リアルタイム音声データ処理**
- **既存useTonePlayerとの統合**

### 2. 既存システム解析結果

#### useTonePlayerの現在の実装
- **Tone.js使用**: Sampler + Salamander Grand Piano音源
- **音程制御**: 10種類のベース音程候補
- **音量制御**: デシベル単位での精密制御
- **ADSR設定**: Attack, Decay, Sustain, Release
- **状態管理**: 初期化・再生・停止・エラーハンドリング

#### 統合ポイント
- **Tone.js AudioContext**: 既存のTone.contextと協調
- **音程候補**: BASE_TONE_CANDIDATESの活用
- **音量制御**: 既存setVolume機能との統合

---

## 🔧 Step 2実装設計

### 1. useAudioProcessorフック作成

#### 機能概要
```typescript
interface AudioProcessorState {
  isProcessing: boolean;
  sampleRate: number;
  bufferSize: number;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  error: string | null;
}

interface AudioProcessorHook {
  processorState: AudioProcessorState;
  startProcessing: (stream: MediaStream) => Promise<boolean>;
  stopProcessing: () => void;
  getAudioData: () => Float32Array | null;
  getFrequencyData: () => Uint8Array | null;
  resetError: () => void;
}
```

#### 核心技術仕様

**1. AudioContext最適化設定**
```typescript
const AUDIO_CONTEXT_CONFIG = {
  sampleRate: 44100,          // 高品質音程検出
  latencyHint: 'interactive', // リアルタイム応答
  echoCancellation: false,    // Step 1から継承
  autoGainControl: false,     // Step 1から継承
  noiseSuppression: false,    // Step 1から継承
};
```

**2. AnalyserNode設定**
```typescript
const ANALYSER_CONFIG = {
  fftSize: 2048,              // 周波数分解能
  smoothingTimeConstant: 0.8, // ノイズ平滑化
  minDecibels: -90,           // 最小デシベル
  maxDecibels: -10,           // 最大デシベル
};
```

**3. 音声データ処理**
```typescript
// 時間領域データ (音程検出用)
const getTimedomainData = (): Float32Array => {
  const dataArray = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(dataArray);
  return dataArray;
};

// 周波数領域データ (音量・スペクトラム用)
const getFrequencyData = (): Uint8Array => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
};
```

### 2. 既存システムとの統合設計

#### useMicrophoneManager拡張
```typescript
// Step 1機能拡張
interface MicrophoneManagerV2 {
  // 既存機能 (Step 1)
  microphoneState: MicrophoneState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  
  // 新機能 (Step 2)
  audioProcessor: AudioProcessorHook;
  getProcessedAudioData: () => ProcessedAudioData;
}
```

#### Tone.js連携
```typescript
// Tone.js AudioContextと協調
const integrateWithToneJS = (audioContext: AudioContext) => {
  // 既存のTone.contextと統合
  if (Tone.context.rawContext !== audioContext) {
    // 必要に応じて同期処理
  }
};
```

---

## 🚀 実装ステップ

### Step 2.1: useAudioProcessorフック作成
- [ ] 基本インターフェース定義
- [ ] AudioContext最適化設定
- [ ] AnalyserNode設定
- [ ] 音声データ取得機能

### Step 2.2: Step 1統合
- [ ] useMicrophoneManagerにAudioProcessor統合
- [ ] MediaStreamからAudioContextへの接続
- [ ] エラーハンドリング統合

### Step 2.3: Tone.js協調
- [ ] 既存Tone.contextとの協調
- [ ] 音程候補データ活用
- [ ] 音量制御統合

### Step 2.4: テストページ作成
- [ ] 音声処理パイプラインテスト
- [ ] リアルタイム音声データ表示
- [ ] 既存システムとの統合確認

---

## 🧪 テスト仕様

### 1. AudioContext機能テスト
- [ ] AudioContext初期化
- [ ] 最適化設定確認
- [ ] サンプリングレート確認
- [ ] レイテンシー確認

### 2. 音声データ処理テスト
- [ ] 時間領域データ取得
- [ ] 周波数領域データ取得
- [ ] リアルタイム処理確認
- [ ] データ精度検証

### 3. 統合テスト
- [ ] Step 1マイクロフォン機能との統合
- [ ] Tone.js音源システムとの協調
- [ ] エラーハンドリング確認
- [ ] iPhone Safari対応確認

---

## 📊 期待される成果

### 1. 技術的成果
- **高品質音声処理**: 44.1kHz/16bit音声データ処理
- **リアルタイム性**: 低レイテンシー音声処理
- **統合性**: 既存システムとの完全統合
- **安定性**: エラーハンドリングとリソース管理

### 2. 機能的成果
- **音程検出準備**: Step 4 Pitchy統合の基盤
- **音声品質**: ノイズ除去・平滑化処理
- **デバッグ機能**: リアルタイム音声データ可視化
- **クロスブラウザ対応**: 特にiPhone Safari

---

## 🔄 次のステップ準備

### Step 3準備
- **1段階ノイズフィルタリング**用の基盤構築
- **ハイパス・ローパス・ノッチフィルター**実装準備
- **音声品質向上**システム基盤

### Step 4準備
- **Pitchy音程検出**統合準備
- **McLeod Pitch Method**実装基盤
- **音程検出精度向上**システム基盤

---

## 🗂️ ファイル構成

### 新規作成ファイル
- `/src/hooks/useAudioProcessor.ts` - 音声処理コアフック
- `/src/app/test/audio-processor/page.tsx` - テストページ
- `/src/types/audio.ts` - 音声処理型定義

### 修正ファイル
- `/src/hooks/useMicrophoneManager.ts` - Step 2統合
- `/src/hooks/useTonePlayer.ts` - 必要に応じて協調機能追加

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: Step 2 AudioContext・音声処理基盤実装

**重要**: この実装により、Step 3以降の高度な音程検出機能の基盤が完成します。