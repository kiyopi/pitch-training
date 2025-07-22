# TRAINING_MODES_ANALYSIS.md - 3モード詳細機能分析

## 📊 トレーニングモード全体構造

### 🎯 3つのメインモード

| モード | パス | 対象ユーザー | 実装状況 | 主要機能 |
|--------|------|-------------|----------|----------|
| **ランダム基音** | `/training/random/` | 初心者向け | ✅ 基本完成 | 単発ランダム基音再生 |
| **連続チャレンジ** | `/training/continuous/` | 中級者向け | 🚧 音源テスト版 | 連続自動再生 |
| **12音階** | `/training/chromatic/` | 上級者向け | 🚧 音源テスト版 | クロマチック完全制覇 |

### 🔬 技術テストページ（高度実装）

| テストページ | 主要技術 | 統合対象機能 |
|-------------|----------|-------------|
| `/test/separated-audio/` | 倍音補正・リアルタイム検出 | **🎯 メイン統合対象** |
| `/test/accuracy-test-v2/` | 音程採点システム | 採点機能 |
| `/test/hybrid-audio/` | 権限管理システム | マイク許可最適化 |

---

## 🔍 共通機能分析（詳細）

### 🎹 **オーディオエンジン（100%共通）**

#### **Tone.js + Salamander Piano 設定**
```typescript
// 全モード共通の音源設定
const sampler = new Tone.Sampler({
  urls: { "C4": "C4.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  release: 1.5,         // 共通リリース時間
  volume: 6             // iPhone最適化音量（プロトタイプ準拠）
}).toDestination();

// 共通再生設定
sampler.triggerAttack(note, undefined, 0.8); // velocity: 0.8（統一）
```

#### **基音データ構造**
```typescript
// ランダム・連続モード（10種類）
const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const baseNoteNames = {
  'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', // ... 統一命名
};

// 12音階モード（13音）
const chromaticScale = [
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 
  'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
];
```

### 🎨 **UI/UXパターン（95%共通）**

#### **共通UIコンポーネント**
- **タイムスタンプ表示**: 右上固定位置（色のみ差分）
- **デバッグログ**: 統一フォーマット（履歴件数のみ差分）
- **戻るボタン**: 統一デザイン・配置
- **レスポンシブレイアウト**: `max-w-4xl mx-auto` 共通

#### **カラースキーム差分**
```typescript
// モード別グラデーション
ランダム: from-emerald-600 to-green-600      // 緑系（初心者）
連続:     from-purple-600 to-indigo-600      // 紫系（中級）
12音階:   from-orange-600 to-red-600         // 赤系（上級）
```

### 📊 **状態管理パターン（90%共通）**

#### **共通状態変数**
```typescript
const [isPlaying, setIsPlaying] = useState(false);        // 再生状態
const [debugLog, setDebugLog] = useState<string[]>([]);   // ログ管理
const [currentNote, setCurrentNote] = useState<string>(''); // 現在音
```

#### **共通ログシステム**
```typescript
const addLog = (message: string) => {
  console.log(message);
  setDebugLog(prev => [...prev.slice(-N), message]); // N: モード別履歴数
};
```

---

## 🎯 モード独自機能分析

### 🎲 **ランダム基音モード** (`/training/random/`)

#### **独自機能**
- **単発再生**: 1回再生→完全停止
- **ランダム選択**: 10種類からMath.random()選択
- **1.7秒固定再生時間**

#### **制御フロー**
```typescript
handleStart() → 
  ランダム選択 → 
  音源再生(1.7秒) → 
  自動停止 → 
  待機状態
```

#### **特徴**
- ✅ **最もシンプル**: 初心者に最適
- ✅ **安定動作**: エラー頻度最低
- ❌ **機能限定**: 連続練習不可

### 🔄 **連続チャレンジモード** (`/training/continuous/`)

#### **独自機能**
- **連続自動再生**: 2.7秒間隔（1.7秒再生 + 1秒休憩）
- **再生回数カウンター**: リアルタイム表示
- **開始・停止制御**: ユーザー任意タイミング

#### **制御フロー**
```typescript
handleStart() → 
  continuousPlay() → 
  playRandomNote() → 
  setTimeout(2700ms) → 
  continuousPlay() → ... // 無限ループ
```

#### **独自状態管理**
```typescript
const [playCount, setPlayCount] = useState(0);           // 再生回数
const intervalRef = useRef<NodeJS.Timeout | null>(null); // タイマー管理
const isPlayingRef = useRef(false);                      // 状態同期
```

#### **特徴**
- ✅ **持続練習**: 集中トレーニング可能
- ✅ **進捗可視化**: 回数表示
- ❌ **複雑制御**: タイマー管理要

### 🎼 **12音階モード** (`/training/chromatic/`)

#### **独自機能**
- **シーケンス再生**: 13音連続（0.8秒×13 + 1秒間隔×12）
- **方向選択**: 上行・下行ボタン
- **進行表示**: N/13 リアルタイム表示

#### **制御フロー**
```typescript
handleStart(direction) → 
  playSequence(direction) → 
  for(13音) { playNote() + 1秒待機 } → 
  自動完了 → 
  状態リセット
```

#### **独自状態管理**
```typescript
const [currentIndex, setCurrentIndex] = useState(0);               // 進行位置
const [direction, setDirection] = useState<'ascending' | 'descending'>('ascending'); // 方向
```

#### **特徴**
- ✅ **完全網羅**: 12音階制覇
- ✅ **両方向対応**: 上行・下行
- ❌ **時間長**: 完走約30秒

---

## 🚀 高度技術統合の可能性

### 🎯 **統合対象技術** (`/test/separated-audio/`)

#### **倍音補正システム**
```typescript
// 人間音声の倍音誤検出自動補正
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // ±50Hz基音探索
  harmonicRatios: number[];          // [0.5, 2.0, 3.0, 4.0]倍音比
  confidenceThreshold: number;       // 0.8確信度
  vocalRange: { min: number, max: number }; // C3-C6人間音域
}
```

#### **リアルタイム音程検出**
```typescript
// Pitchy McLeod Pitch Method
const detector = PitchDetector.forFloat32Array(analyser.fftSize);
const pitch = detector.findPitch(float32Array, audioContext.sampleRate);
```

#### **フェーズ分離システム**
```typescript
enum AudioSystemPhase {
  IDLE = 'idle',
  BASE_TONE_PHASE = 'base_tone',    // 基音再生専用
  SCORING_PHASE = 'scoring',        // 採点処理専用
  ERROR_STATE = 'error'
}
```

### 🔧 **統合効果予測**

#### **ランダムモード + 高度技術**
- **基音再生** → **マイク自動開始** → **リアルタイム採点** → **結果表示**
- **効果**: 初心者でも高精度フィードバック取得

#### **連続チャレンジ + 高度技術**  
- **連続基音** → **連続採点** → **累積スコア表示** → **統計分析**
- **効果**: 学習進捗の数値化・可視化

#### **12音階 + 高度技術**
- **クロマチック** → **精密採点** → **音程別精度分析** → **弱点特定**
- **効果**: 上級者向け詳細分析

---

## 📋 技術統合優先度

### **Phase 1: 基盤統合（最重要）**
1. **共通オーディオエンジン**: `useAudioEngine.ts`
2. **共通UI基盤**: レイアウト・デザインシステム統一
3. **状態管理統一**: React Hook共通化

### **Phase 2: 高度機能統合（重点）**
1. **ランダムモード高度化**: 最も使用頻度高（初心者対象）
2. **マイク統合**: 倍音補正システム移植
3. **採点システム**: リアルタイムフィードバック

### **Phase 3: 完全統合（最終）**
1. **連続・12音階高度化**: 全機能統合
2. **統計・履歴システム**: 学習分析機能
3. **iPhone最適化**: 完全対応確認

---

## 🎯 統合設計指針

### **モジュール設計原則**
- **単一責任**: 各モジュールは特定機能に特化
- **疎結合**: モード間での機能共有を最大化
- **拡張性**: 新モード追加時の影響最小化

### **パフォーマンス考慮**
- **音源共有**: Salamander Piano音源の効率的管理
- **メモリ最適化**: 不要インスタンスの確実破棄
- **iPhone最適化**: Audio Context競合回避

### **ユーザビリティ**
- **統一体験**: 3モード間の操作一貫性
- **段階的学習**: 初心者→上級者の自然な移行
- **即座フィードバック**: リアルタイム結果表示

---

**記録日**: 2025-07-22  
**分析対象**: 3つのトレーニングモード + 高度技術テストページ  
**次期作業**: 技術統合戦略文書化 → 実装フェーズ移行