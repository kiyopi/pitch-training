# 3モード共通仕様書

**作成日**: 2025-07-26  
**対象**: Random / Continuous / Chromatic モード  
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training`

---

## 🎯 3モード概要

### **Random Mode** (`/training/random`)
- **基音**: 10種類からランダム選択
- **音階**: ドレミファソラシド（8音階）
- **特徴**: 基音が毎回変わるため、相対音感の基礎力向上

### **Continuous Mode** (`/training/continuous`)  
- **基音**: 固定（ユーザー選択可能）
- **音階**: 連続チャレンジ（10回、20回、50回）
- **特徴**: 同一基音での反復練習、速度・精度向上

### **Chromatic Mode** (`/training/chromatic`)
- **基音**: 12音階すべて
- **音階**: クロマチック（半音階）対応
- **特徴**: 上級者向け、微細な音程差の識別

---

## 🧩 共通コンポーネント設計

### **1. BaseAudioEngine** (共通音響エンジン)

```typescript
interface BaseAudioEngine {
  // 音源管理
  initializeSampler(): Promise<void>;
  playBaseTone(note: string): Promise<void>;
  stopBaseTone(): void;
  
  // マイク管理
  startMicrophone(): Promise<boolean>;
  stopMicrophone(): void;
  getMicrophoneState(): MicrophoneState;
  
  // 音程検出
  startPitchDetection(): void;
  stopPitchDetection(): void;
  getCurrentPitch(): PitchResult | null;
  
  // 共通設定
  setVolume(volume: number): void;
  getAudioContext(): AudioContext;
}
```

### **2. CommonTrainingLayout** (共通レイアウト)

```typescript
interface CommonTrainingLayoutProps {
  mode: 'random' | 'continuous' | 'chromatic';
  title: string;
  children: React.ReactNode;
}

// 共通ヘッダー・フッター・ナビゲーション
const CommonTrainingLayout: React.FC<CommonTrainingLayoutProps> = ({
  mode,
  title,
  children
}) => {
  return (
    <div className="min-h-screen bg-background">
      <CommonHeader mode={mode} title={title} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <CommonFooter />
    </div>
  );
};
```

### **3. ScaleGuideDisplay** (音階ガイド表示)

```typescript
interface ScaleGuideProps {
  mode: 'diatonic' | 'chromatic'; // ドレミ or 12音階
  currentStep: number;
  scaleStates: ScaleState[];
  onStepClick?: (step: number) => void;
}

type ScaleState = 'inactive' | 'active' | 'correct' | 'incorrect' | 'completed';
```

### **4. PitchDetectionDisplay** (音程検出表示)

```typescript
interface PitchDetectionProps {
  isActive: boolean;
  detectedFrequency: number | null;
  targetFrequency: number | null;
  accuracy: number; // 0-100%
  showVisualFeedback: boolean;
}

// 共通ビジュアル要素
// - リアルタイム周波数表示
// - 音量バー
// - 精度インジケーター
// - 音程差表示
```

### **5. ResultsDisplay** (結果表示)

```typescript
interface CommonResultsProps {
  mode: 'random' | 'continuous' | 'chromatic';
  sessionScore: SessionScore;
  onRestart: () => void;
  onShare: (data: ShareData) => void;
  onModeChange: (newMode: string) => void;
}

// 共通表示要素
// - 総合スコア
// - 精度グラフ
// - 反応時間グラフ  
// - 音階別結果
// - SNS共有ボタン
```

### **6. ShareButton** (SNS共有)

```typescript
interface ShareButtonProps {
  data: ShareData;
  platform: 'twitter' | 'facebook' | 'line' | 'clipboard';
  disabled?: boolean;
}

// 全モード共通のシェア機能
const generateShareText = (data: ShareData): string => {
  const modeNames = {
    random: 'ランダム基音',
    continuous: '連続チャレンジ', 
    chromatic: '12音階'
  };
  
  return `🎵 相対音感トレーニング結果 🎵

モード: ${modeNames[data.trainingMode]}
スコア: ${data.score}/100
精度: ${data.accuracy}%
平均反応時間: ${data.responseTime}秒
完了音階: ${data.completedScales}/${data.totalScales}

#相対音感 #音楽訓練 #PitchTraining
https://kiyopi.github.io/pitch-training/training/${data.trainingMode}`;
};
```

---

## 🎨 共通UI仕様 (shadcn/ui準拠)

### **共通カラーパレット**
```css
:root {
  /* Primary Colors */
  --primary: 222.2 84% 4.9%;           /* 濃紺 */
  --primary-foreground: 210 40% 98%;   /* ホワイト */
  
  /* Secondary Colors */
  --secondary: 210 40% 96%;            /* ライトグレー */
  --secondary-foreground: 222.2 84% 4.9%; /* 濃紺 */
  
  /* Status Colors */
  --success: 142.1 76.2% 36.3%;       /* グリーン */
  --warning: 47.9 95.8% 53.1%;        /* イエロー */
  --destructive: 0 84.2% 60.2%;       /* レッド */
  --info: 221.2 83.2% 53.3%;          /* ブルー */
  
  /* Training Specific */
  --scale-inactive: 210 40% 80%;      /* 未発声状態 */
  --scale-active: 221.2 83.2% 53.3%;  /* 検出中状態 */
  --scale-correct: 142.1 76.2% 36.3%; /* 正解状態 */
  --scale-incorrect: 0 84.2% 60.2%;   /* 不正解状態 */
}
```

### **共通ボタンスタイル**
```typescript
// Primary Action (基音再生、開始)
<Button className="w-48 h-12 text-lg font-semibold">
  🎲 ランダム基音再生
</Button>

// Secondary Action (設定、詳細)
<Button variant="secondary" className="w-32 h-10">
  設定
</Button>

// Destructive Action (リセット、終了)
<Button variant="destructive" className="w-24 h-10">
  リセット
</Button>

// Ghost Action (軽微な操作)
<Button variant="ghost" className="w-20 h-8">
  詳細
</Button>
```

### **共通レスポンシブ設計**
```css
/* Mobile First */
.training-container {
  @apply px-4 py-6;
}

/* Tablet */
@media (min-width: 768px) {
  .training-container {
    @apply px-8 py-8;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .training-container {
    @apply px-12 py-12 max-w-4xl mx-auto;
  }
}
```

---

## 🔧 共通Hook設計

### **useAudioEngine** (音響エンジン管理)
```typescript
interface UseAudioEngineReturn {
  // 状態
  isInitialized: boolean;
  isPlaying: boolean;
  microphoneState: MicrophoneState;
  currentPitch: PitchResult | null;
  
  // アクション
  initializeAudio: () => Promise<boolean>;
  playBaseTone: (note: string) => Promise<void>;
  stopBaseTone: () => void;
  startMicrophone: () => Promise<boolean>;
  stopMicrophone: () => void;
  
  // 設定
  setVolume: (volume: number) => void;
  setNoiseReduction: (enabled: boolean) => void;
}

const useAudioEngine = (): UseAudioEngineReturn => {
  // 共通音響処理ロジック
  // /test/separated-audio/ の実装を基盤とする
};
```

### **useTrainingSession** (セッション管理)
```typescript
interface UseTrainingSessionReturn<T extends TrainingConfig> {
  // セッション状態
  isActive: boolean;
  currentPhase: TrainingPhase;
  progress: number; // 0-100%
  
  // データ
  config: T;
  currentChallenge: Challenge | null;
  sessionResults: TrainingResult[];
  sessionScore: SessionScore;
  
  // アクション
  startSession: (config: T) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  recordResult: (result: TrainingResult) => void;
}
```

### **useScaleGuide** (音階ガイド管理)
```typescript
interface UseScaleGuideReturn {
  // 状態
  scaleType: 'diatonic' | 'chromatic';
  currentStep: number;
  scaleStates: ScaleState[];
  
  // アクション
  setScaleType: (type: 'diatonic' | 'chromatic') => void;
  advanceStep: () => void;
  setStepState: (step: number, state: ScaleState) => void;
  resetGuide: () => void;
  
  // 計算
  getTargetFrequency: (baseFreq: number, step: number) => number;
  getStepName: (step: number) => string;
}
```

---

## 📁 共通ファイル構成

```
/src/
├── components/
│   ├── common/
│   │   ├── AudioEngine/
│   │   │   ├── BaseAudioEngine.tsx
│   │   │   ├── PitchDetector.tsx
│   │   │   └── TonePlayer.tsx
│   │   ├── Layout/
│   │   │   ├── CommonTrainingLayout.tsx
│   │   │   ├── CommonHeader.tsx
│   │   │   └── CommonFooter.tsx
│   │   ├── Training/
│   │   │   ├── ScaleGuideDisplay.tsx
│   │   │   ├── PitchDetectionDisplay.tsx
│   │   │   ├── ResultsDisplay.tsx
│   │   │   └── ShareButton.tsx
│   │   └── UI/
│   │       ├── StatusIndicator.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ErrorBoundary.tsx
│   └── mode-specific/
│       ├── random/
│       ├── continuous/
│       └── chromatic/
├── hooks/
│   ├── common/
│   │   ├── useAudioEngine.ts
│   │   ├── useTrainingSession.ts
│   │   ├── useScaleGuide.ts
│   │   └── usePitchDetection.ts
│   └── mode-specific/
│       ├── useRandomTraining.ts
│       ├── useContinuousTraining.ts
│       └── useChromaticTraining.ts
├── utils/
│   ├── common/
│   │   ├── audioProcessing.ts
│   │   ├── pitchCalculation.ts
│   │   ├── scoreCalculation.ts
│   │   ├── shareUtils.ts
│   │   └── constants.ts
│   └── mode-specific/
├── types/
│   ├── common/
│   │   ├── audio.ts
│   │   ├── training.ts
│   │   ├── pitch.ts
│   │   └── ui.ts
│   └── mode-specific/
└── app/
    └── training/
        ├── random/
        ├── continuous/
        └── chromatic/
```

---

## 🎯 実装優先順位

### **Phase 1: 共通基盤構築**
1. **BaseAudioEngine**: 音響処理の共通化
2. **CommonTrainingLayout**: レイアウト統一
3. **基本Hook**: useAudioEngine, useTrainingSession

### **Phase 2: Random Mode実装**
1. ランダム基音システム
2. ドレミガイド表示
3. 結果・SNS共有

### **Phase 3: 共通コンポーネント強化**
1. ScaleGuideDisplay の抽象化
2. PitchDetectionDisplay の統一
3. ResultsDisplay の共通化

### **Phase 4: 他モード展開**
1. Continuous Mode 実装
2. Chromatic Mode 実装
3. 最終統合・最適化

---

## ✅ 共通品質基準

### **パフォーマンス**
- [ ] 初期ローディング時間: 3秒以内
- [ ] 音程検出遅延: 100ms以内
- [ ] メモリ使用量: 50MB以内

### **互換性**
- [ ] iPhone Safari 14+
- [ ] Chrome 88+
- [ ] Firefox 85+
- [ ] Edge 88+

### **アクセシビリティ**
- [ ] キーボードナビゲーション対応
- [ ] スクリーンリーダー対応
- [ ] 色覚異常対応
- [ ] WCAG 2.1 AA準拠

### **品質**
- [ ] TypeScript型カバレッジ 100%
- [ ] ESLintエラー 0件
- [ ] テストカバレッジ 80%以上
- [ ] Bundle Size 最適化

---

**この共通仕様に基づき、効率的な3モード開発を進めます。**