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

### 2.1 動的オクターブ補正・倍音誤検出回避システム

#### 問題概要
人間の歌唱音程検出では、基音に加えて2倍音、3倍音、4倍音が同時に検出されるため、Pitchy音程検出では上位倍音が誤って基音として認識される問題が発生。これにより実際の歌唱音程より1-2オクターブ高い周波数が検出される現象。

#### システム要件
- **基音検出精度**: ユーザーの歌唱における真の基音を99%以上の精度で検出
- **倍音除去**: 2倍音、3倍音、4倍音の誤検出を動的に回避
- **リアルタイム処理**: 50ms以下での高速補正処理
- **安定性**: 継続的な歌唱中での一貫した基音検出

#### 技術実装仕様

##### HarmonicCorrectionConfig インターフェース
```typescript
interface HarmonicCorrectionConfig {
  // 人間の声域範囲フィルタ (C3-C6: 130.81-1046.50Hz)
  minHumanFreq: number;    // 130.81 (C3)
  maxHumanFreq: number;    // 1046.50 (C6)
  
  // 音楽的妥当性評価設定
  musicalValidityWeight: number;     // 0.4
  frequencyStabilityWeight: number;  // 0.3
  harmonicConsistencyWeight: number; // 0.3
  
  // セント許容誤差
  maxCentsDeviation: number;         // 50
}
```

##### 動的オクターブ補正アルゴリズム
```typescript
const correctHarmonicFrequency = (
  detectedFreq: number,
  previousFreq: number | null,
  config: HarmonicCorrectionConfig
): number => {
  // 1. 基音候補生成（倍音から逆算）
  const fundamentalCandidates = [
    detectedFreq,        // そのまま（基音の可能性）
    detectedFreq / 2.0,  // 2倍音から基音を逆算
    detectedFreq / 3.0,  // 3倍音から基音を逆算
    detectedFreq / 4.0,  // 4倍音から基音を逆算
    detectedFreq * 2.0,  // 基音から2倍音（低音域誤検出補正）
  ].filter(freq => 
    freq >= config.minHumanFreq && 
    freq <= config.maxHumanFreq
  );

  // 2. 各候補の評価スコア計算
  let bestCandidate = detectedFreq;
  let bestScore = -1;

  for (const candidate of fundamentalCandidates) {
    const score = evaluateFundamentalCandidate(
      candidate, 
      previousFreq, 
      config
    );
    
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
};
```

##### 基音候補評価システム
```typescript
const evaluateFundamentalCandidate = (
  candidate: number,
  previousFreq: number | null,
  config: HarmonicCorrectionConfig
): number => {
  // 1. 音楽的妥当性スコア（最近接音名との距離）
  const musicalScore = calculateMusicalValidity(candidate, config.maxCentsDeviation);
  
  // 2. 周波数安定性スコア（前回検出値との連続性）
  const stabilityScore = previousFreq ? 
    calculateFrequencyStability(candidate, previousFreq) : 0.5;
  
  // 3. 倍音一貫性スコア（基音らしさ）
  const harmonicScore = calculateHarmonicConsistency(candidate);
  
  // 重み付き総合評価
  return (
    musicalScore * config.musicalValidityWeight +
    stabilityScore * config.frequencyStabilityWeight +
    harmonicScore * config.harmonicConsistencyWeight
  );
};
```

##### 音楽的妥当性評価
```typescript
const calculateMusicalValidity = (frequency: number, maxCents: number): number => {
  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const nearestMidiNote = Math.round(midiNote);
  const centsDeviation = Math.abs((midiNote - nearestMidiNote) * 100);
  
  // セント偏差に基づく妥当性（0-1スケール）
  return Math.max(0, 1 - (centsDeviation / maxCents));
};
```

##### 周波数安定性評価
```typescript
const calculateFrequencyStability = (current: number, previous: number): number => {
  const ratio = Math.max(current, previous) / Math.min(current, previous);
  
  // 10%以内の変動で高スコア、50%超過で最低スコア
  if (ratio <= 1.1) return 1.0;      // 10%以内: 完全安定
  if (ratio <= 1.3) return 0.8;      // 30%以内: 高安定
  if (ratio <= 1.5) return 0.4;      // 50%以内: 中程度
  return 0.0;                        // 50%超過: 不安定
};
```

##### 倍音一貫性評価
```typescript
const calculateHarmonicConsistency = (frequency: number): number => {
  // 基音域（130-523Hz）で高スコア、高音域で減点
  if (frequency >= 130.81 && frequency <= 523.25) {
    return 1.0;  // C3-C5域: 基音として最適
  } else if (frequency <= 130.81) {
    return 0.6;  // 低音域: やや不自然
  } else {
    // 高音域: オクターブ距離に応じて減点
    const octavesAboveC5 = Math.log2(frequency / 523.25);
    return Math.max(0.2, 1.0 - octavesAboveC5 * 0.3);
  }
};
```

#### 実装時注意事項
1. **リアルタイム性能**: 各フレーム（20-50ms）での高速処理が必須
2. **メモリ効率**: 候補配列の使い回し、不要なオブジェクト生成回避  
3. **エラーハンドリング**: 候補が0件の場合のフォールバック処理
4. **デバッグ対応**: 補正前後の周波数ログ出力（開発時）

#### 期待効果
- **基音検出精度**: 現在60-70% → 95%以上に向上
- **オクターブ誤認**: ほぼ完全に除去
- **歌唱体験**: 正確な音程フィードバックによる学習効果向上
- **システム信頼性**: 安定した基音検出による判定精度向上

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
- **倍音耐性**: 基音の正確な検出
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