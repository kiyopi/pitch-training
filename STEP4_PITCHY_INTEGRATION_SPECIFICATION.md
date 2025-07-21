# Step 4: Pitchy音程検出統合 実装仕様書 v1.0

## 🚨 **環境認識警告**
**⚠️ この仕様書は参考情報です。実際の開発は Next.js で実行します。**
- **開発環境**: Next.js 15.4.1 + TypeScript + React  
- **新規作成**: `/src/app/` 以下に作成
- **デプロイ**: GitHub Actions → GitHub Pages
- **禁止**: HTML直接作成・手動デプロイ

## 📋 概要

### 目的
Step 1-3で構築した音声処理基盤を活用し、Pitchy（McLeod Pitch Method）による高精度音程検出システムを実装

### 作成日
2025-07-18

### 対象システム
Next.js 15.4.1 + TypeScript + Pitchy + 相対音感トレーニングアプリ

---

## 🎯 Step 4実装目標

### 1. Pitchy音程検出統合
- **McLeod Pitch Method**: 高精度音程検出アルゴリズム
- **リアルタイム処理**: 低レイテンシー音程検出
- **高い精度**: ±1セント以内の検出精度目標
- **既存システム統合**: Step 1-3の音声処理基盤活用

### 2. 音程検出最適化
- **前処理済み音声**: Step 3フィルタリング済み音声の活用
- **動的オクターブ補正**: 倍音誤検出の自動回避
- **信頼度評価**: 検出結果の信頼度スコア
- **平滑化処理**: ノイズ除去と安定化

#### 2.1 倍音補正システム詳細仕様 [Step B-2実装対象]

**🎵 倍音問題の現状分析**
```typescript
// 現在の問題（Step A段階）
// src/app/test/separated-audio/page.tsx:302-306
if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
  return Math.round(frequency * 10) / 10;  // 基本範囲フィルターのみ
}

// 問題点:
// - オクターブ違い検出: C3(130Hz) ↔ C4(261Hz) ↔ C5(523Hz) 不安定切り替え
// - 倍音優先検出: 基音より強い倍音成分を誤検出
// - 安定性不足: 基音優先ロジック不在
```

**🛠️ 動的オクターブ補正アルゴリズム設計**
```typescript
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // 基音探索範囲（±50Hz）
  harmonicRatios: number[];          // 倍音比率 [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;      // 確信度しきい値（0.8）
  stabilityBuffer: number[];        // 安定化バッファ（過去5フレーム）
  vocalRange: { min: number, max: number }; // 人間音域（130-1047Hz, C3-C6）
}

const DEFAULT_HARMONIC_CONFIG: HarmonicCorrectionConfig = {
  fundamentalSearchRange: 50,
  harmonicRatios: [0.5, 2.0, 3.0, 4.0],  // 1/2倍音, 2倍音, 3倍音, 4倍音
  confidenceThreshold: 0.8,
  stabilityBuffer: [],
  vocalRange: { min: 130.81, max: 1046.50 } // C3-C6
};

// 基音候補生成・評価システム
const correctHarmonicFrequency = (
  detectedFreq: number,
  previousFreq: number | null,
  config: HarmonicCorrectionConfig
): number => {
  // 1. 基音候補を生成（オクターブ違いを考慮）
  const fundamentalCandidates = [
    detectedFreq,                    // そのまま
    detectedFreq / 2.0,             // 1オクターブ下（2倍音の場合）
    detectedFreq / 3.0,             // 3倍音の基音
    detectedFreq / 4.0,             // 4倍音の基音
    detectedFreq * 2.0,             // 1オクターブ上（低く歌った場合）
  ];
  
  // 2. 各候補の妥当性を評価
  const evaluateFundamental = (freq: number) => {
    // 人間音域範囲内チェック
    const inVocalRange = freq >= config.vocalRange.min && freq <= config.vocalRange.max;
    const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
    
    // 前回検出との連続性評価
    const continuityScore = previousFreq 
      ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
      : 0.5;
    
    // 基音らしさ評価（ドレミファソラシド近似度）
    const musicalScore = calculateMusicalScore(freq);
    
    const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
    return { freq, score: totalScore };
  };
  
  // 3. 最高スコア候補を基音として採用
  const bestCandidate = fundamentalCandidates
    .map(evaluateFundamental)
    .reduce((best, current) => current.score > best.score ? current : best);
    
  return bestCandidate.freq;
};

// 音楽的妥当性評価（ドレミファソラシド近似度）
const calculateMusicalScore = (frequency: number): number => {
  const C4 = 261.63; // Middle C
  const semitoneRatio = Math.pow(2, 1/12);
  
  // 最も近い半音階音名への距離を計算
  const semitonesFromC4 = Math.log2(frequency / C4) * 12;
  const nearestSemitone = Math.round(semitonesFromC4);
  const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
  
  // 半音階に近いほど高スコア（±50セント以内で最高点）
  return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
};
```

**📊 基音安定化システム**
```typescript
// 履歴バッファによる異常値除去・安定化
const stabilizeFrequency = (
  currentFreq: number,
  historyBuffer: number[],
  stabilityThreshold: number = 0.1
): number => {
  // 1. 履歴バッファに追加
  historyBuffer.push(currentFreq);
  if (historyBuffer.length > 5) historyBuffer.shift(); // 最大5フレーム保持
  
  // 2. 中央値ベースの安定化（外れ値除去）
  const sorted = [...historyBuffer].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 3. 急激な変化を抑制（段階的変化）
  const maxChange = median * stabilityThreshold;
  const stabilized = Math.abs(currentFreq - median) > maxChange 
    ? median + Math.sign(currentFreq - median) * maxChange
    : currentFreq;
    
  return stabilized;
};
```

**🎯 実装タイミング戦略**
- **Step B-1**: iPhone音量問題解決（フェーズ分離システム）
- **Step B-2**: 倍音補正システム統合 ← **本機能実装**
- **理由**: 安定したフェーズ分離基盤上で倍音補正を実装することで、問題の切り分けとデバッグが容易

**📋 品質基準**
- **検出精度**: ±10セント以内（基音検出）
- **安定性**: 5フレーム連続安定検出
- **レスポンス**: 100ms以内での補正処理
- **環境対応**: iPhone・PC両環境での同等性能

---

## 🔧 Step 4実装設計

### 1. Pitchy統合準備

#### Pitchyライブラリのインストール
```bash
npm install pitchy
npm install @types/pitchy  # TypeScript型定義（存在する場合）
```

#### 基本的な使用方法
```typescript
import { PitchDetector } from 'pitchy';

// 音程検出器の初期化
const detector = PitchDetector.forFloat32Array(bufferSize);

// 音程検出実行
const [pitch, clarity] = detector.findPitch(audioBuffer, sampleRate);
```

### 2. usePitchDetectorフック作成

#### 音程検出状態インターフェース
```typescript
interface PitchDetectionState {
  isDetecting: boolean;
  currentPitch: number | null;      // Hz
  currentNote: string | null;       // 音名 (C4, D#3, etc.)
  currentCents: number | null;      // セント偏差
  clarity: number;                  // 検出信頼度 (0-1)
  octave: number | null;            // オクターブ
  frequency: number | null;         // 周波数
  error: string | null;
}

interface PitchDetectionResult {
  pitch: number;
  note: string;
  cents: number;
  octave: number;
  clarity: number;
  timestamp: number;
}

interface PitchDetectorHook {
  pitchState: PitchDetectionState;
  startDetection: () => void;
  stopDetection: () => void;
  getPitchResult: () => PitchDetectionResult | null;
  resetError: () => void;
}
```

#### 音程検出設定
```typescript
const PITCH_DETECTION_CONFIG = {
  bufferSize: 1024,                // 音程検出バッファサイズ
  hopSize: 512,                    // オーバーラップサイズ
  sampleRate: 44100,               // サンプリングレート
  clarityThreshold: 0.9,           // 信頼度閾値
  smoothingFactor: 0.3,            // 平滑化係数
  minFrequency: 80,                // 最低検出周波数 (Hz)
  maxFrequency: 2000,              // 最高検出周波数 (Hz)
};
```

### 3. 音程処理ユーティリティ

#### 音程変換関数
```typescript
/**
 * 周波数からMIDIノート番号への変換
 */
export const frequencyToMidiNote = (frequency: number): number => {
  return 12 * Math.log2(frequency / 440) + 69;
};

/**
 * MIDIノート番号から音名への変換
 */
export const midiNoteToNoteName = (midiNote: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return noteNames[noteIndex] + octave;
};

/**
 * セント偏差計算
 */
export const calculateCentsDeviation = (frequency: number, targetFrequency: number): number => {
  return 1200 * Math.log2(frequency / targetFrequency);
};

/**
 * 音程の平滑化
 */
export const smoothPitch = (
  currentPitch: number, 
  previousPitch: number, 
  smoothingFactor: number
): number => {
  return previousPitch + smoothingFactor * (currentPitch - previousPitch);
};
```

### 4. Step 1-3統合設計

#### 音声処理フロー統合
```
Step 1: Microphone → Step 2: AudioContext → Step 3: NoiseFilter → Step 4: PitchDetector
```

#### useAudioProcessor拡張
```typescript
// Step 4統合: Pitchy音程検出
interface EnhancedAudioProcessorHook extends AudioProcessorHook {
  pitchDetector: PitchDetectorHook;
  startPitchDetection: () => void;
  stopPitchDetection: () => void;
  getPitchData: () => PitchDetectionResult | null;
}
```

#### リアルタイム音程検出パイプライン
```typescript
const processPitchDetection = (filteredAudioData: Float32Array): PitchDetectionResult | null => {
  // 1. Pitchyで音程検出
  const [pitch, clarity] = detector.findPitch(filteredAudioData, sampleRate);
  
  // 2. 信頼度チェック
  if (clarity < PITCH_DETECTION_CONFIG.clarityThreshold) {
    return null;
  }
  
  // 3. 音程情報計算
  const midiNote = frequencyToMidiNote(pitch);
  const noteName = midiNoteToNoteName(Math.round(midiNote));
  const cents = calculateCentsDeviation(pitch, midiNoteToFrequency(Math.round(midiNote)));
  const octave = Math.floor(midiNote / 12) - 1;
  
  // 4. 平滑化処理
  const smoothedPitch = smoothPitch(pitch, previousPitch, PITCH_DETECTION_CONFIG.smoothingFactor);
  
  return {
    pitch: smoothedPitch,
    note: noteName,
    cents,
    octave,
    clarity,
    timestamp: Date.now(),
  };
};
```

---

## 🧪 Step 4テスト仕様

### 1. 音程検出精度テスト
- [ ] 基準音A4(440Hz)の正確な検出
- [ ] 各オクターブでの精度確認
- [ ] セント偏差の精度確認（±1セント以内）
- [ ] 倍音誤検出の回避確認

### 2. リアルタイム性能テスト
- [ ] 低レイテンシー検出確認
- [ ] CPU使用率の測定
- [ ] メモリ使用量の確認
- [ ] 長時間動作安定性

### 3. 統合テスト
- [ ] Step 1-3システムとの完全統合
- [ ] フィルタリング効果の音程検出への影響
- [ ] エラーハンドリングの確認
- [ ] iPhone Safari対応確認

### 4. 相対音感テスト
- [ ] ドレミファソラシドの正確な検出
- [ ] 音程間隔の正確性確認
- [ ] 基音からの相対音程計算
- [ ] 音程判定の正確性

---

## 📊 期待される効果

### 1. 高精度音程検出
- **McLeod Pitch Method**: 業界標準の高精度アルゴリズム
- **±1セント精度**: プロレベルの検出精度
- **倍音耐性**: 基音の正確な検出（Step B-2で動的オクターブ補正実装）
- **ノイズ耐性**: Step 3フィルタリングとの相乗効果

### 2. リアルタイム処理
- **低レイテンシー**: 50ms以下の検出遅延目標
- **高速処理**: 最適化されたアルゴリズム
- **安定性**: 長時間連続動作
- **効率性**: 低CPU・メモリ使用量

### 3. 音楽的精度
- **音名検出**: 正確な音名表示
- **オクターブ判定**: 正確なオクターブ識別
- **セント表示**: 微細な音程偏差表示
- **相対音程**: 基音からの正確な音程関係

---

## 🚀 実装ステップ

### Step 4.1: Pitchy統合準備
- [ ] Pitchyライブラリのインストール
- [ ] 基本的な動作確認
- [ ] TypeScript型定義の準備
- [ ] 設定パラメータの最適化

### Step 4.2: usePitchDetectorフック作成
- [ ] 基本インターフェース定義
- [ ] 音程検出ロジック実装
- [ ] 音程変換関数実装
- [ ] エラーハンドリング実装

### Step 4.3: 音程処理ユーティリティ
- [ ] 周波数・音名変換関数
- [ ] セント計算関数
- [ ] 平滑化処理関数
- [ ] 音程判定関数

### Step 4.4: Step 1-3統合
- [ ] useAudioProcessorとの統合
- [ ] フィルタリング済み音声の活用
- [ ] リアルタイム処理パイプライン
- [ ] 性能最適化

### Step 4.5: テストページ作成
- [ ] 音程検出結果表示
- [ ] リアルタイム音程可視化
- [ ] 検出精度確認機能
- [ ] 相対音感テスト機能

---

## 🔄 次のステップ準備

### Step 5準備
- **完全統合**: 全システムの統合テスト
- **相対音感トレーニング**: 実際のトレーニング機能
- **UI/UX最適化**: ユーザビリティ向上
- **パフォーマンス最適化**: 全体的な性能向上

### 音程検出活用
- **リアルタイム判定**: 歌唱音程の即座判定
- **音程ガイダンス**: 正確な音程への誘導
- **進歩追跡**: 音程精度の改善追跡
- **難易度調整**: 個人レベルに応じた調整

---

## 🗂️ ファイル構成

### 新規作成ファイル
- `/src/hooks/usePitchDetector.ts` - 音程検出コアフック
- `/src/utils/pitchUtils.ts` - 音程処理ユーティリティ
- `/src/app/test/pitch-detector/page.tsx` - テストページ
- `/src/types/pitch.ts` - 音程関連型定義

### 修正ファイル
- `/src/hooks/useAudioProcessor.ts` - Step 4統合
- `/src/types/audio.ts` - 音程検出型定義追加
- `/package.json` - Pitchy依存関係追加

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: Step 4 Pitchy音程検出統合実装

**重要**: この実装により、Step 5での完全な相対音感トレーニングシステムが実現されます。