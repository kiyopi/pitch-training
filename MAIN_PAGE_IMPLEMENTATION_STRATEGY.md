# メインページ実装戦略文書

**作成日**: 2025-07-22  
**対象URL**: `https://kiyopi.github.io/pitch-training/`  
**戦略決定**: 音響実装完了に基づく次期フェーズ移行  
**担当**: Claude Code Assistant

---

## 🎯 **戦略概要**

### **基本方針**
**音響関連実装完了**を受け、**メインページの高度化**により実用的な相対音感トレーニングアプリを完成させる

### **実装アプローチ**
**技術継承型実装**: `/test/separated-audio/` で完成した高度技術を `/training/` に移植し、ユーザー向け完成版を構築

---

## 📊 **現状分析**

### **✅ 完成済み高度技術（/test/separated-audio/）**
- **倍音補正システム**: 動的オクターブ補正 + 基音安定化
- **高精度検出**: Pitchy (McLeod Pitch Method) ±5セント
- **iPhone最適化**: Safari完全対応・音量問題解決
- **リアルタイムデバッグ**: 6項目可視化システム
- **人間音声テスト**: 実用レベル動作確認済み

### **🔍 既存メインページの課題**

#### **ホームページ (`/`)**
- **デザイン**: ✅ 完成度高い（グラデーション・モダンUI）
- **説明**: ✅ 適切（高精度検出・本格音源・モバイル対応）
- **問題**: 実際の機能と説明の乖離

#### **トレーニングページ現状**
- **`/training/random/`**: 基本的なピアノ再生のみ
- **`/training/continuous/`**: 基本実装レベル
- **`/training/chromatic/`**: 基本実装レベル
- **問題**: ホームページが謳う「高精度検出」が実装されていない

### **🎯 技術ギャップ**
```
ホームページ宣伝: 「±5セント高精度検出」
実際の機能: 基本的な音再生のみ
```
→ **解決必要**: 宣伝内容と実機能の整合性確保

---

## 🚀 **実装戦略**

### **Phase 1: `/training/random/` 完全実装**

#### **優先実装理由**
1. **基本モード**: 初心者向けで最も重要
2. **技術検証**: 1つを完全実装して他への展開パターン確立
3. **ユーザー影響**: 最も使用頻度が高いと予想

#### **技術統合項目**
```typescript
// 1. 倍音補正システム統合
const correctHarmonicFrequency = (freq, prevFreq, config) => {
  // /test/separated-audio/ から移植
  // 1/2、1/4倍音補正の自動選択
}

// 2. リアルタイム音程検出
const detectFrequency = () => {
  // Pitchy統合 + 倍音補正適用
  // ±5セント精度実現
}

// 3. 評価システム実装
const evaluateAccuracy = (detected, target) => {
  // セント単位精度判定
  // リアルタイムフィードバック
}
```

#### **UI改善項目**
- **周波数表示**: リアルタイム検出値表示（オプション）
- **音程判定**: 「C4」「D3」等の音程名表示
- **精度評価**: 「正解」「±10セント以内」等の判定
- **視覚フィードバック**: 色分け・アニメーション

### **Phase 2: 評価・採点システム実装**

#### **採点基準設計**
```typescript
interface ScoreEvaluation {
  accuracy: number;      // セント単位精度
  grade: 'Perfect' | 'Great' | 'Good' | 'Miss';
  score: number;         // 0-100点
  feedback: string;      // フィードバックメッセージ
}

// 採点基準例
const SCORING_CRITERIA = {
  Perfect: { range: 5, score: 100 },    // ±5セント以内
  Great:   { range: 15, score: 80 },    // ±15セント以内
  Good:    { range: 30, score: 60 },    // ±30セント以内
  Miss:    { range: Infinity, score: 0 } // それ以外
};
```

#### **表示項目**
- **リアルタイム判定**: 発声中の精度表示
- **総合スコア**: セッション全体の評価
- **詳細分析**: 各音程の精度グラフ
- **改善提案**: 苦手音程の指摘

### **Phase 3: 他モードへの展開**

#### **展開順序**
1. **`/training/continuous/`**: ランダムモードの連続実行版
2. **`/training/chromatic/`**: 12音階すべての実装

#### **共通化戦略**
```typescript
// 共通フック作成
const useHarmonicPitchDetection = () => {
  // 倍音補正 + 音程検出の共通ロジック
}

const useScoreEvaluation = () => {
  // 採点・評価の共通ロジック  
}
```

---

## 📋 **実装計画詳細**

### **Step 1: 基盤準備**
#### **共通ライブラリ抽出**
- **`/src/hooks/useHarmonicPitchDetection.ts`**: 倍音補正音程検出
- **`/src/hooks/useScoreEvaluation.ts`**: 採点・評価システム
- **`/src/utils/harmonicCorrection.ts`**: 倍音補正アルゴリズム

### **Step 2: `/training/random/` 実装**
#### **ファイル修正**
- **メイン**: `/src/app/training/random/page.tsx`
- **追加hook**: 上記共通ライブラリ
- **UI追加**: 精度表示・評価システム

#### **実装内容**
1. **倍音補正システム統合**
2. **リアルタイム音程検出**
3. **精度評価・採点機能**
4. **視覚的フィードバック**

### **Step 3: ユーザビリティ向上**
#### **UI/UX改善**
- **レスポンシブデザイン**: モバイル最適化
- **アクセシビリティ**: 視覚・聴覚サポート
- **パフォーマンス**: iPhone動作最適化

---

## 🎯 **技術継承仕様**

### **倍音補正システム移植**
```typescript
// From: /test/separated-audio/page.tsx
// To: /training/random/page.tsx

// 1. インターフェース定義
interface HarmonicCorrectionConfig { /* ... */ }

// 2. 補正関数
const correctHarmonicFrequency = (freq, prevFreq, config) => {
  // 完全移植: 1/2, 1/4倍音補正ロジック
}

// 3. 安定化関数  
const stabilizeFrequency = (freq, history, threshold) => {
  // 完全移植: 履歴バッファ安定化
}
```

### **デバッグ機能の簡略化**
```typescript
// 本番向け簡略版デバッグ
const [debugMode, setDebugMode] = useState(false);

// デバッグ時のみ詳細表示
{debugMode && (
  <div>周波数: {freq}Hz / 補正: {correction}</div>
)}
```

---

## 📊 **成功指標**

### **技術的指標**
- **検出精度**: ±15セント以内で80%以上
- **応答速度**: リアルタイム（遅延100ms以下）
- **安定性**: iPhone Safari 10分連続動作

### **ユーザー体験指標**
- **直感性**: 初回利用で操作方法理解
- **フィードバック**: リアルタイム精度表示
- **達成感**: スコア・評価による成長実感

### **整合性指標**
- **宣伝内容**: ホームページ説明と実機能の一致
- **期待値**: ユーザー期待に応える高精度実装
- **ブランド**: 「高精度相対音感アプリ」としての信頼性

---

## 🎯 **リスク管理**

### **技術的リスク**
- **複雑性**: 倍音補正システムの移植複雑性
- **パフォーマンス**: iPhone環境でのメモリ使用量
- **互換性**: 既存UI実装との統合

### **リスク対策**
- **段階的実装**: 1つずつ機能追加・検証
- **iPhone最適化**: `/test/separated-audio/` 実績活用
- **ロールバック**: 使い捨てブランチ運用継続

---

## 🎯 **期待される成果**

### **完成時の状態**
1. **ホームページ**: 実機能と説明の完全一致
2. **トレーニング機能**: 高精度検出による実用性
3. **ユーザー体験**: 満足度の高い相対音感学習環境
4. **技術的価値**: 音程検出分野での先進性

### **プロジェクト完成度**
- **音響技術**: ✅ **完了**（倍音補正・高精度検出）
- **UI/UX**: 🔄 **実装中**（メインページ統合）
- **採点システム**: ⏳ **後続**（基準・表示項目）

---

**🎵 技術完成度の高い相対音感トレーニングアプリの実現を目指す**

---

**作成者**: Claude Code Assistant  
**戦略承認**: 音響実装完了に基づく方針転換  
**実装開始**: 次期セッションより開始予定