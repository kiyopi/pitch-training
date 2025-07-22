# TECHNICAL_INTEGRATION_STRATEGY.md - 技術統合戦略

## 🎯 統合戦略概要

### **目標**
`/test/separated-audio/`の高度音響技術を3つのメインモード（ランダム・連続・12音階）に統合し、基本的な音源再生モードを本格的な相対音感トレーニングアプリに発展させる。

### **原則**
- **段階的統合**: 段階的に機能追加、各段階でテスト確認
- **最小影響**: 既存の安定動作を維持
- **共通化優先**: 重複コード排除、保守性向上

---

## 📋 Phase 1: 共通基盤構築（最重要）

### 🔧 **Step 1-1: オーディオエンジン統合**

#### **統合対象技術**
```typescript
// /test/separated-audio/ から移植
- Tone.js + Salamander Piano（既存と同一）
- PitchDetector (Pitchy McLeod Pitch Method)
- NoiseFilterConfig (ハイパス・ローパス・ノッチフィルター)
- HarmonicCorrectionConfig (倍音補正システム)
```

#### **作成ファイル**: `/src/hooks/useAudioEngine.ts`
```typescript
interface AudioEngineConfig {
  mode: 'random' | 'continuous' | 'chromatic';
  enablePitchDetection: boolean;
  enableHarmonicCorrection: boolean;
  baseNotes: string[];
}

export interface AudioEngineReturn {
  // 基音再生機能
  playBaseTone: (note: string) => Promise<void>;
  stopBaseTone: () => void;
  
  // マイクロフォン機能
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  
  // リアルタイム検出
  currentPitch: number | null;
  correctedPitch: number | null;
  confidence: number;
  
  // 状態管理
  isPlaying: boolean;
  phase: AudioSystemPhase;
  error: string | null;
}
```

### 🎨 **Step 1-2: UI共通基盤構築**

#### **作成ファイル**: `/src/components/TrainingLayout.tsx`
```typescript
interface TrainingLayoutProps {
  title: string;
  subtitle: string;
  colorScheme: 'green' | 'purple' | 'orange';  // モード別色
  children: React.ReactNode;
  debugLog?: string[];
}
```

#### **作成ファイル**: `/src/components/AudioControls.tsx`
```typescript
interface AudioControlsProps {
  mode: 'random' | 'continuous' | 'chromatic';
  isPlaying: boolean;
  onStart: () => void;
  onStop?: () => void;
  onDirectionChange?: (direction: 'ascending' | 'descending') => void;
}
```

#### **作成ファイル**: `/src/components/PitchDisplay.tsx`
```typescript
interface PitchDisplayProps {
  currentPitch: number | null;
  correctedPitch: number | null;
  targetPitch: number | null;
  confidence: number;
  showDebugInfo?: boolean;
}
```

### 📊 **Step 1-3: 状態管理統一**

#### **作成ファイル**: `/src/hooks/useTrainingState.ts`
```typescript
interface TrainingState {
  currentNote: string;
  isActive: boolean;
  score: number;
  attempts: number;
  debugLog: string[];
}

export function useTrainingState(mode: TrainingMode) {
  // 共通状態管理ロジック
}
```

---

## 🚀 Phase 2: ランダムモード高度化（優先実装）

### **理由**: 最も使用頻度が高い初心者向けモード

### 🔧 **Step 2-1: 基本統合**

#### **実装方針**
1. **段階的移行**: 既存コードベース維持 + Hook追加
2. **オプション機能**: 高度機能をオプションとして追加
3. **後方互換**: 既存動作を完全保持

#### **修正ファイル**: `/src/app/training/random/page.tsx`
```typescript
// 既存機能 + Hook統合
const audioEngine = useAudioEngine({
  mode: 'random',
  enablePitchDetection: true,  // 🆕 追加機能
  enableHarmonicCorrection: true,  // 🆕 追加機能
  baseNotes: baseNotes
});

const trainingState = useTrainingState('random');
```

### 🎯 **Step 2-2: 機能段階的追加**

#### **段階A: マイクロフォン統合**
- 基音再生後にマイクロフォン自動開始
- リアルタイム周波数表示（デバッグ用）
- エラーハンドリング統合

#### **段階B: 倍音補正統合**
- `/test/separated-audio/`の補正システム移植
- デバッグパネル追加（オプション表示）
- 精度検証・調整

#### **段階C: 採点システム統合**
- 相対音程計算エンジン統合
- リアルタイムスコア表示
- 結果フィードバックUI

### 📱 **Step 2-3: iPhone最適化**

#### **フェーズ分離システム統合**
```typescript
enum AudioSystemPhase {
  IDLE = 'idle',
  BASE_TONE_PHASE = 'base_tone',    // ピアノ専用フェーズ
  MICROPHONE_PHASE = 'microphone',  // マイク専用フェーズ  
  SCORING_PHASE = 'scoring',        // 採点処理フェーズ
  ERROR_STATE = 'error'
}
```

#### **AudioContext競合回避**
- Phase別AudioContext管理
- iPhone Safari完全対応確認
- メモリリーク防止

---

## 🔄 Phase 3: 連続・12音階モード統合

### 🔧 **Step 3-1: 連続チャレンジモード**

#### **統合特徴**
- **連続採点**: 各基音ごとにリアルタイム採点
- **累積スコア**: 総合評価・統計表示
- **進捗可視化**: スコア履歴グラフ

#### **技術課題**
- **メモリ管理**: 連続動作でのリソース最適化
- **タイミング制御**: 採点期間の精密制御
- **データ蓄積**: セッション統計管理

### 🎼 **Step 3-2: 12音階モード**

#### **統合特徴**
- **精密採点**: 13音個別評価
- **音程別分析**: 弱点特定・改善提案
- **完走評価**: 総合習熟度評価

#### **技術課題**
- **長時間安定性**: 30秒連続動作保証
- **精度維持**: 全音程での採点精度
- **方向別評価**: 上行・下行の比較分析

---

## 🔧 共通モジュール設計詳細

### 📁 **ディレクトリ構造**
```
/src/
├── hooks/
│   ├── useAudioEngine.ts       # 音響エンジン統合
│   ├── useTrainingState.ts     # 状態管理統合
│   ├── usePitchDetection.ts    # 音程検出専用
│   └── usePermissionManager.ts # マイク許可管理（既存）
├── components/
│   ├── TrainingLayout.tsx      # レイアウト共通化
│   ├── AudioControls.tsx       # 制御UI統合
│   ├── PitchDisplay.tsx        # 音程表示UI
│   └── ScoreDisplay.tsx        # 採点結果UI
├── utils/
│   ├── audioFilters.ts         # フィルター（既存）
│   ├── harmonicCorrection.ts   # 倍音補正
│   ├── pitchCalculation.ts     # 音程計算
│   └── scoreCalculation.ts     # 採点計算
└── types/
    ├── audio.ts               # 音響関連型定義
    ├── training.ts            # トレーニング型定義
    └── score.ts               # 採点関連型定義
```

### 🔗 **インターフェース設計**

#### **AudioEngine Interface**
```typescript
interface AudioEngine {
  // Core Functions
  initialize: (config: AudioEngineConfig) => Promise<void>;
  cleanup: () => void;
  
  // Base Tone Control
  playBaseTone: (note: string, duration?: number) => Promise<void>;
  stopBaseTone: () => void;
  
  // Microphone Control
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  
  // Real-time Data
  getCurrentPitch: () => number | null;
  getCorrectedPitch: () => number | null;
  getConfidence: () => number;
  
  // State Management
  getPhase: () => AudioSystemPhase;
  transitionToPhase: (phase: AudioSystemPhase) => Promise<void>;
  
  // Error Handling
  getLastError: () => string | null;
  clearError: () => void;
}
```

#### **TrainingSession Interface**
```typescript
interface TrainingSession {
  mode: 'random' | 'continuous' | 'chromatic';
  startTime: Date;
  endTime?: Date;
  totalAttempts: number;
  correctAttempts: number;
  averageAccuracy: number;
  notes: NoteAttempt[];
}

interface NoteAttempt {
  targetNote: string;
  targetFrequency: number;
  detectedFrequency: number;
  correctedFrequency: number;
  accuracy: number;
  timestamp: Date;
}
```

---

## 🧪 テスト戦略

### **Phase 1 テスト**
1. **Hook単体テスト**: Jest + React Testing Library
2. **音響機能テスト**: Web Audio API モック
3. **UI統合テスト**: Storybook コンポーネント確認

### **Phase 2 テスト**  
1. **ランダムモード統合テスト**: 機能段階別確認
2. **iPhone Safari実機テスト**: 各段階での動作確認
3. **パフォーマンステスト**: メモリ・CPU使用量監視

### **Phase 3 テスト**
1. **全モード統合テスト**: 3モード完全動作確認
2. **長時間安定性テスト**: 連続・12音階の耐久テスト
3. **ユーザビリティテスト**: 実際の学習フロー確認

---

## 📈 成功指標・完了基準

### **Phase 1 完了基準**
- ✅ 3モード共通Hook実装完了
- ✅ UI基盤統合完了
- ✅ 既存機能破綻なし
- ✅ GitHub Pages正常デプロイ

### **Phase 2 完了基準**
- ✅ ランダムモード高度化完了
- ✅ iPhone Safari完全対応
- ✅ リアルタイム採点動作
- ✅ ユーザー体験向上確認

### **Phase 3 完了基準**
- ✅ 全モード高度化完了
- ✅ 統計・分析機能実装
- ✅ 学習効果の数値化
- ✅ 本格トレーニングアプリ完成

---

## 🚨 リスク管理

### **技術リスク**
- **音響競合**: フェーズ分離システムで回避
- **メモリリーク**: 段階的実装で早期発見
- **iPhone互換性**: 各段階でのSafari確認

### **プロジェクトリスク**
- **機能過多**: 段階的実装で複雑性制御
- **既存破綻**: 後方互換性の厳格維持
- **開発期間**: 最小単位での確実な進行

### **品質管理**
- **使い捨てブランチ運用**: 失敗時の確実ロールバック
- **段階的確認**: 各Phase完了時のユーザー確認
- **継続的テスト**: GitHub Pages での動作確認

---

**戦略策定日**: 2025-07-22  
**対象システム**: pitch-training Next.js アプリ  
**実装期間**: Phase別段階実行  
**最終目標**: 音響技術統合による本格相対音感トレーニングアプリ完成