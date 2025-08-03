# ランダム基音トレーニングページ統合仕様書

**作成日**: 2025-07-26  
**最終更新**: 2025-07-29 11:30 JST  
**対象**: `/training/random` ページ（SvelteKit）  
**デザインシステム**: shadcn/ui準拠 + B案段階的成功表現システム  
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training/svelte-prototype`

## 🎨 **最新更新: B案段階的成功表現システム（2025-07-29）**

### **実装完了機能**
- ✅ **印象バランス改善**: 成功音階の視覚的強調で達成感向上
- ✅ **カード型デザイン**: グレード別グラデーション背景とシャドウ
- ✅ **全8音階固定表示**: 測定不可音も「測定できませんでした」で表示
- ✅ **レイアウト統合**: 精度バー上への情報集約でスペース効率化

### **グレード表示システム**
```
• 優秀 (±15¢以内): 🏆 + "EXCELLENT" + 金色グラデーション
• 良好 (±25¢以内): ⭐ + "GOOD" + 緑色グラデーション  
• 合格 (±40¢以内): 👍 + "PASS" + 青色グラデーション
• 要練習 (±41¢以上): 📚 + "PRACTICE" + 赤色背景
• 測定不可: AlertCircle + "測定不可" + グレー背景
```

---

## 🎯 基本設計方針

### **1ページ完結型設計**
- **従来**: ホーム → マイクテスト → トレーニング（3ページ遷移）
- **新設計**: トレーニングページ内で全機能完結（1ページ）
- **理由**: UX向上、状態管理簡素化、保守性向上

### **マイク許可前提**
- **v3.0.0フロー**: マイクテストページ経由を前提
- **ダイレクトアクセス対策**: マイク未許可時の適切な誘導
- **許可確認**: 初期化時の自動チェック

### **3モード共通設計**
- **対象**: Random / Continuous / Chromatic
- **共通コンポーネント**: 基音再生、音程検出、結果表示、SNS共有
- **個別要素**: トレーニングロジック、UI表示内容

---

## 📱 UI設計仕様

### **デザインシステム**: shadcn/ui準拠

#### **レイアウト構造**
```
┌─────────────────────────────────┐
│ Header (固定)                    │
├─────────────────────────────────┤
│ Status Bar (マイク状態・進行)      │
├─────────────────────────────────┤
│ Base Tone Section (基音再生)      │
├─────────────────────────────────┤
│ Scale Guide (ドレミガイド)        │
├─────────────────────────────────┤
│ Detection Section (音程検出) ✅   │
├─────────────────────────────────┤
│ Results Section (結果・SNS)       │
└─────────────────────────────────┘
```

#### **ボタン設計**
- **サイズ**: 固定幅（コンテナ幅に合わせない）
- **Primary**: 基音再生、リスタート、SNS共有
- **Secondary**: 設定、詳細表示
- **Destructive**: リセット、終了

#### **カラーパレット** (shadcn/ui準拠)
- **Primary**: `hsl(222.2 84% 4.9%)` (濃紺)
- **Secondary**: `hsl(210 40% 96%)` (ライトグレー)
- **Success**: `hsl(142.1 76.2% 36.3%)` (グリーン)
- **Warning**: `hsl(47.9 95.8% 53.1%)` (イエロー)
- **Destructive**: `hsl(0 84.2% 60.2%)` (レッド)

#### **フォント仕様** (音程検出表示)
- **周波数表示**: `font-size: 2rem`、等幅フォント
- **音程表記**: `font-size: 2rem`、等幅フォント
- **区切り文字**: `font-size: 1.5rem`
- **Hz表示**: `font-size: 2rem`

**⚠️ フォントスタイル修正手順**
```scss
// 修正対象ファイル: /src/routes/training/random/+page.svelte
// 992-1029行目のグローバルスタイル

:global(.detected-frequency) {
  font-size: 2rem !important;  // 周波数数値のサイズ変更
}

:global(.hz-suffix) {
  font-size: 2rem !important;  // Hz文字のサイズ変更
}

:global(.detected-note) {
  font-size: 2rem !important;  // 音程表記(C4等)のサイズ変更
}

:global(.divider) {
  font-size: 1.5rem !important;  // 区切り文字(|)のサイズ変更
}
```

**注意事項**:
- `!important` 修飾子が必須（PitchDetectorコンポーネントとのCSS競合回避）
- `:global()` セレクタが必須（Svelteコンポーネント境界を超えた適用）
- フォントファミリーの変更も同様の手順で可能

---

## 🎵 機能仕様

### **Phase 1: 基音再生システム**

#### **基音選択ロジック**
```typescript
type BaseNote = 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4' | 'C5' | 'D5' | 'E5';

const baseNotes: BaseNote[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const baseNoteNames = {
  'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
  'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
};

// ランダム選択
const getRandomBaseNote = (): BaseNote => {
  return baseNotes[Math.floor(Math.random() * baseNotes.length)];
};
```

#### **音源システム**
- **技術**: Tone.js + Salamander Grand Piano
- **音源場所**: `/public/audio/piano/` (ローカル)
- **必要ファイル**: `C4.mp3`, `D4.mp3`, `E4.mp3`, `F4.mp3`, `G4.mp3`, `A4.mp3`, `B4.mp3`, `C5.mp3`, `D5.mp3`, `E5.mp3`

```typescript
const sampler = new Tone.Sampler({
  urls: {
    "C4": "C4.mp3", "D4": "D4.mp3", "E4": "E4.mp3", "F4": "F4.mp3", "G4": "G4.mp3",
    "A4": "A4.mp3", "B4": "B4.mp3", "C5": "C5.mp3", "D5": "D5.mp3", "E5": "E5.mp3"
  },
  baseUrl: "/audio/piano/",
  release: 1.5
}).toDestination();
```

### **Phase 2: ドレミガイドシステム**

#### **視覚的ガイド**
- **表示**: ド→レ→ミ→ファ→ソ→ラ→シ→ド（8音階）
- **アニメーション**: 順次ハイライト表示
- **状態**: 未発声（グレー）、検出中（ブルー）、正解（グリーン）、不正解（レッド）

```typescript
type ScaleStep = 'ド' | 'レ' | 'ミ' | 'ファ' | 'ソ' | 'ラ' | 'シ' | 'ド（高）';
type ScaleState = 'inactive' | 'active' | 'correct' | 'incorrect';

interface ScaleGuide {
  step: ScaleStep;
  state: ScaleState;
  targetFrequency: number;
}
```

### **Phase 3: 音程検出システム**

#### **技術スタック**
- **Pitchy**: McLeod Pitch Method
- **動的オクターブ補正**: `/test/separated-audio/` 実装の移植
- **3段階ノイズリダクション**: ハイパス・ローパス・ノッチフィルター

#### **検出ロジック**
```typescript
interface PitchResult {
  frequency: number;
  clarity: number;
  detectedNote: string;
  relativeStep: ScaleStep | null;
  isCorrect: boolean;
}
```

### **Phase 4: 結果・採点システム**

#### **スコアリング**
- **基準**: 音程精度、反応速度、連続正解数
- **表示**: 8音階個別スコア + 総合スコア
- **履歴**: セッション内進捗表示

```typescript
interface TrainingResult {
  scaleStep: ScaleStep;
  targetFrequency: number;
  detectedFrequency: number;
  accuracy: number; // 0-100%
  responseTime: number; // ms
  isCorrect: boolean;
}

interface SessionScore {
  totalScore: number;
  correctCount: number;
  totalCount: number;
  averageAccuracy: number;
  averageResponseTime: number;
  scaleResults: TrainingResult[];
}
```

---

## 📤 SNS共有機能仕様

### **共有内容**
```typescript
interface ShareData {
  score: number;
  accuracy: number;
  responseTime: number;
  completedScales: number;
  trainingMode: 'random' | 'continuous' | 'chromatic';
  imageUrl: string; // 結果画像のURL
}
```

### **共有フォーマット**
```
🎵 相対音感トレーニング結果 🎵

モード: ランダム基音
スコア: 85/100
精度: 92%
平均反応時間: 1.2秒
完了音階: 8/8

#相対音感 #音楽訓練 #PitchTraining
https://kiyopi.github.io/pitch-training/training/random
```

### **対応プラットフォーム**
- **Twitter/X**: Web Share API + Twitter Intent
- **Facebook**: Facebook Share Dialog
- **LINE**: LINE Share API
- **クリップボード**: テキストコピー機能

---

## 🛡️ エラーハンドリング

### **マイク許可チェック**
```typescript
type MicrophoneState = 'checking' | 'granted' | 'denied' | 'unavailable';

const checkMicrophonePermission = async (): Promise<MicrophoneState> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error) {
    if (error.name === 'NotAllowedError') return 'denied';
    return 'unavailable';
  }
};
```

### **ダイレクトアクセス対策**
- **マイク未許可**: マイクテストページへの誘導
- **音源読み込み失敗**: エラーメッセージ + リロード案内
- **音程検出失敗**: ブラウザ互換性チェック

---

## 🔧 技術実装詳細

### **状態管理**
```typescript
interface TrainingState {
  // セッション状態
  isActive: boolean;
  currentPhase: 'setup' | 'listening' | 'guiding' | 'detecting' | 'results';
  
  // 基音情報
  currentBaseNote: BaseNote;
  currentBaseFrequency: number;
  
  // ガイド状態
  currentScaleIndex: number;
  scaleGuide: ScaleGuide[];
  
  // 検出状態
  detectedFrequency: number | null;
  detectedNote: string | null;
  
  // 結果
  sessionScore: SessionScore;
  isCompleted: boolean;
}
```

### **コンポーネント構成**
```
TrainingRandomPage/
├── BasetonPlayer/          # 基音再生
├── ScaleGuide/            # ドレミガイド
├── PitchDetectionDisplay/ # 音程検出表示 ✅ **実装完了**
├── ResultsDisplay/        # 結果表示
├── ShareButton/           # SNS共有
└── StatusIndicator/       # 状態表示
```

### **ファイル構成**
```
/src/app/training/random/
├── page.tsx              # メインページ
├── components/
│   ├── BasetonPlayer.tsx
│   ├── ScaleGuide.tsx
│   ├── PitchDetector.tsx
│   ├── ResultsDisplay.tsx
│   └── ShareButton.tsx
├── hooks/
│   ├── useTrainingState.ts
│   ├── usePitchDetection.ts
│   └── useAudioEngine.ts
└── utils/
    ├── audioProcessing.ts
    ├── scoreCalculation.ts
    └── shareUtils.ts
```

---

## 🎯 実装フェーズ

### **Phase 1: 基本構造**
1. ページレイアウト構築
2. shadcn/uiコンポーネント統合
3. 基本状態管理

### **Phase 2: 音響システム**
1. Tone.js基音再生システム
2. Pitchy音程検出システム
3. `/test/separated-audio/`からの技術移植

### **Phase 3: UI統合**
1. ドレミガイドアニメーション
2. リアルタイム検出表示 ✅ **PitchDetectionDisplayコンポーネント実装完了**
3. 結果画面実装

### **Phase 4: 機能強化**
1. SNS共有機能
2. エラーハンドリング強化
3. パフォーマンス最適化

---

## ✅ 完成基準

### **機能要件**
- [ ] ランダム基音再生（10種類）
- [ ] ドレミ8音階ガイド表示
- [x] リアルタイム音程検出 ✅ **PitchDetectionDisplayコンポーネント実装完了**
- [ ] 採点・結果表示
- [ ] SNS共有機能
- [ ] エラーハンドリング

### **品質要件**
- [ ] iPhone Safari対応
- [ ] レスポンシブデザイン
- [ ] アクセシビリティ対応
- [ ] パフォーマンス（3G回線対応）

### **保守性要件**
- [ ] TypeScript型安全性
- [ ] ESLintエラーゼロ
- [ ] コンポーネント分離
- [ ] 3モード共通化準備

---

**この仕様書に基づき、新セッションでの実装を開始します。**