# 4タブ分析システム詳細仕様書 v1.0

## 📋 概要

**目的**: 技術誤差（±20-50¢）を統計的に分離し、相対音感向上のための実用的な分析情報を提供  
**制約**: 履歴データ保存なし - 8セッション内でのみ分析  
**実装対象**: UnifiedScoreResultFixed.svelte の4タブ詳細分析エリア

---

## 🔬 Tab 1: 技術分析

### **表示目的**
Web Audio APIの技術的制約を可視化し、真の音感能力と技術誤差を分離表示

### **表示内容**

#### **技術誤差統計セクション**
```typescript
interface TechnicalErrorStats {
  standardDeviation: number;    // 標準偏差 (¢)
  outlierCount: number;        // 外れ値数
  outlierPercentage: number;   // 外れ値割合 (%)
  confidenceInterval: {       // 信頼区間
    lower: number;
    upper: number;
  };
}
```

**表示例:**
```
🎯 測定精度分析
• 標準偏差: ±23.5¢  
• 外れ値検出: 8個（12.5%）
• 信頼区間: 74.2% - 87.8%
```

#### **誤差パターン分析セクション**
```typescript
interface ErrorDistribution {
  highPrecision: number;      // ±10¢以内
  mediumPrecision: number;    // ±20¢以内
  lowPrecision: number;       // ±50¢以内
  anomalies: number;          // 統計的外れ値
}
```

**表示例:**
```
📊 誤差分布
• 高精度測定: 42回（技術誤差 ±10¢以内）
• 中精度測定: 52回（技術誤差 ±20¢以内）  
• 低精度測定: 58回（技術誤差 ±50¢以内）
• 異常値: 6回（統計的外れ値）
```

#### **補正後評価セクション**
```typescript
interface CorrectedEvaluation {
  rawAverage: number;         // 補正前平均
  correctedAverage: number;   // 補正後平均
  trueAbilityGrade: string;   // 真の実力推定級
  confidenceLevel: number;    // 信頼度
}
```

**表示例:**
```
🔍 技術誤差補正結果
• 補正前平均: 76.3点
• 補正後平均: 82.7点
• 真の実力推定: A級相当
• 評価信頼度: 94.2%
```

### **データソース**
- `performHybridStatisticalAnalysis()` 拡張結果
- 64測定データの3σ外れ値検出
- ロバスト平均計算結果

---

## 🎵 Tab 2: 音程別進捗

### **表示目的**  
8セッション内での音程別パフォーマンスと改善可能領域の特定

### **表示内容**

#### **音程別習得状況** (IntervalProgressTrackerベース拡張)
```typescript
interface IntervalMastery {
  intervalType: string;       // 音程種類
  masteryLevel: number;       // 習得度 (%)
  attempts: number;           // 挑戦回数
  technicalErrorRate: number; // 技術誤差率
  trueAccuracy: number;       // 補正後精度
  recommendedPractice: string; // 推奨練習法
}
```

**表示例:**
```
🎹 音程別マスタリー状況
長3度: ⭐ 92% (マスター) - 24回挑戦
  └ 技術誤差: ±15¢ / 真の精度: 94.8%
完全5度: 🌟 78% (習得中) - 18回挑戦  
  └ 技術誤差: ±28¢ / 真の精度: 85.2%
短7度: 💪 65% (練習中) - 15回挑戦
  └ 技術誤差: ±35¢ / 真の精度: 71.3%
```

#### **改善推奨音程セクション**
```typescript
interface ImprovementRecommendation {
  intervalType: string;
  currentLevel: number;
  difficultyReason: string;
  practiceAdvice: string;
  priority: 'high' | 'medium' | 'low';
}
```

**表示例:**
```
📈 次回重点練習音程
1. 短2度 (45%): 音程幅が狭く判別困難
   → 推奨: 楽器での音程確認練習
2. 長7度 (52%): 高音域での精度向上が必要
   → 推奨: 低音域から段階的に練習
3. 三全音 (58%): 不協和音程の慣れが必要
   → 推奨: 音楽理論との関連学習
```

#### **習得完了音程セクション**
```
✅ 習得済み音程（80%以上）
• 完全4度, 完全5度: 安定した協和音程
• オクターブ: 周波数比が明確
• 長3度: 和音の基礎として習得済み
```

### **データソース**
- 各音程の成功率・精度データ（技術誤差補正済み）
- 8セッション内の音程別統計
- 既存IntervalProgressTrackerコンポーネント拡張

---

## 📊 Tab 3: 一貫性グラフ

### **表示目的**
セッション間の一貫性とパフォーマンス安定性の可視化（技術誤差分離）

### **表示内容**

#### **一貫性グラフ** (ConsistencyGraphベース拡張)
```typescript
interface ConsistencyAnalysis {
  sessionScores: number[];           // セッション別スコア
  technicalErrorPattern: number[];  // セッション別技術誤差
  correctedScores: number[];        // 補正後スコア
  trendAnalysis: 'improving' | 'declining' | 'stable';
  consistencyScore: number;         // 一貫性スコア
}
```

**グラフ要素:**
- 青線: 生スコア
- 緑線: 技術誤差補正後スコア  
- グレー帯: 技術誤差範囲
- トレンド矢印: 改善/低下/安定

#### **安定性分析セクション**
```
📈 パフォーマンス安定性
• 一貫性スコア: 87.4%
• 最大変動幅: 12.3点（補正前）/ 6.7点（補正後）
• 安定セッション: 6/8セッション
• 技術誤差影響度: 中程度
```

#### **パフォーマンスパターン分析**
```typescript
interface PerformancePattern {
  patternType: 'early-peak' | 'stable' | 'late-improvement' | 'variable';
  description: string;
  technicalFactors: string[];
  recommendations: string[];
}
```

**表示例:**
```
🔍 パフォーマンス特性
パターン: 後半向上型
• セッション6-8で顕著な改善傾向
• 技術誤差補正により実際の向上幅はより大きい
• 学習効果が確実に現れている証拠

影響要因:
• 技術誤差: セッション1-3で大きく、後半で安定
• 集中力: 後半セッションで向上
• 慣れ効果: 操作に慣れることで真の実力発揮
```

#### **推奨練習方針**
```
💡 改善アドバイス
[後半向上型の場合]
「継続学習により確実に実力向上しています。この調子で練習を続ければ、
さらなる向上が期待できます。特に技術誤差の影響を受けやすい音程の
重点練習をお勧めします。」

[変動型の場合] 
「練習環境の統一（マイク距離、騒音レベル等）により、
より安定したパフォーマンスが期待できます。技術誤差の影響を
最小化することで、真の実力をより正確に測定できます。」
```

### **データソース**
- 8セッションのスコア履歴（生データ + 補正データ）
- 既存ConsistencyGraphコンポーネント拡張
- セッション別技術誤差分析

---

## 📈 Tab 4: セッション統計

### **表示目的**
8セッション総合の詳細統計と今後の練習指針（技術誤差考慮）

### **表示内容**

#### **総合統計** (SessionStatisticsベース大幅拡張)
```typescript
interface ComprehensiveStatistics {
  totalAttempts: number;           // 総挑戦回数
  rawSuccessRate: number;          // 生成功率
  correctedSuccessRate: number;    // 補正後成功率
  rawAverageScore: number;         // 生平均スコア
  correctedAverageScore: number;   // 補正後平均スコア
  bestSessionScore: number;        // 最高セッションスコア
  worstSessionScore: number;       // 最低セッションスコア
  improvementRate: number;         // 改善率
}
```

**表示例:**
```
📊 8セッション総合結果
• 総挑戦回数: 64回（8セッション完了）
• 生成功率: 73.4% → 補正後成功率: 81.7%
• 生平均スコア: 76.3点 → 補正後平均: 83.2点
• 最高セッションスコア: 89点（第7セッション）
• セッション改善率: +15.4%（技術誤差補正後）
```

#### **練習効率分析**
```typescript
interface PracticeEfficiency {
  totalPracticeTime: number;       // 総練習時間
  averageSessionTime: number;      // 平均セッション時間
  maxConsecutiveCorrect: number;   // 最大連続正解
  averageResponseTime: number;     // 平均応答時間
  efficiencyScore: number;         // 練習効率スコア
  technicalDisruptions: number;    // 技術的中断回数
}
```

**表示例:**
```
⏱️ 練習効率指標
• 総練習時間: 2時間34分
• 平均セッション時間: 19分12秒
• 最大連続正解: 12回（第6セッション）
• 平均応答時間: 3.2秒
• 練習効率スコア: A級（技術誤差の影響最小化）
• 技術的中断: 3回（マイク・ブラウザ問題）
```

#### **音感レベル判定** (技術誤差補正版)
```typescript
interface AbilityAssessment {
  rawGrade: string;                // 生データ判定
  correctedGrade: string;          // 補正後判定
  gradeConfidence: number;         // 判定信頼度
  nextGradeRequirement: number;    // 次級到達必要スコア
  technicalLimitation: boolean;    // 技術的制約影響
}
```

**表示例:**
```
🎯 相対音感レベル診断
生データ判定: B級 → 技術誤差補正後: A級
判定信頼度: 92.3%

• S級 (90%+): 音楽家レベルの相対音感
• A級 (80-89%): 優秀な音感能力 ← 現在位置
• B級 (70-79%): 良好な音感基礎
• C級 (60-69%): 基本的な音感
• D級 (50-59%): 発展途上
• E級 (50%未満): 継続練習推奨

次のS級まで: あと6.8点（技術誤差を考慮済み）
```

#### **継続練習アドバイス** (個別化)
```typescript
interface PersonalizedAdvice {
  currentGrade: string;
  strengthIntervals: string[];     // 得意音程
  weaknessIntervals: string[];     // 苦手音程
  technicalRecommendations: string[]; // 技術的推奨事項
  practiceSchedule: string;        // 推奨練習スケジュール
  nextMilestone: string;          // 次の目標
}
```

**表示例:**
```
🚀 次のステップ（A級 → S級への道）
あなたの強み:
• 協和音程（4度・5度・オクターブ）の識別が優秀
• セッション後半での集中力維持が良好
• 技術誤差の影響を受けにくい安定した測定環境

改善推奨領域:
• 不協和音程（短2度・長7度）の精度向上
• セッション序盤での集中力強化
• マイク環境の最適化（現在の技術誤差±23¢ → 目標±15¢）

推奨練習プログラム:
1日15-20分の集中練習で、2-3週間でS級到達が期待できます。
特に不協和音程の楽器確認練習と、セッション開始前の
準備運動を取り入れることをお勧めします。
```

### **データソース**
- 8セッション全統計データ（生データ + 補正データ）
- 既存SessionStatisticsコンポーネント大幅拡張
- S-E級判定ロジック（技術誤差補正版）

---

## 🎭 フィードバックセクション刷新

### **現在の課題**
一般的なフィードバックメッセージで技術誤差の考慮がない

### **改善案: 技術誤差考慮型段階別フィードバック**

#### **S級達成時** (補正後90%+)
```
🏆 素晴らしい成果です！
音楽家レベルの相対音感を獲得されました。技術的制約を克服し、
真の音感能力を発揮できています。この能力を活かして、
より高度な音楽理論学習や楽器演奏に挑戦してください。

技術分析: 測定精度±XX¢、信頼度XX%
```

#### **A級達成時** (補正後80-89%)
```
🌟 優秀な結果です！
相対音感の基礎が確立されています。技術誤差の影響を最小化し、
安定した実力を発揮されています。継続練習により、S級到達が
十分に期待できます。

重点練習音程: [最も困難な音程名]
推定到達期間: 2-3週間の継続練習
```

#### **B-C級達成時** (補正後60-79%)
```
💪 着実な進歩です！
基本的な音程認識ができており、技術誤差を考慮すると
実際の能力はより高いレベルにあります。毎日の短時間練習で、
確実に上級レベルへ到達できます。

技術的改善点: マイク環境の最適化により、さらなる向上が期待できます。
```

#### **D-E級時** (補正後60%未満)
```
🌱 良いスタートです！
音感は練習で必ず向上します。現在の測定値は技術的制約の影響を
受けている可能性があります。焦らず継続することが最も重要です。
まずは協和音程（4度・5度）から確実に身につけていきましょう。

技術サポート: 測定環境の改善により、より正確な評価が可能になります。
```

---

## 🔧 実装技術仕様

### **データ構造定義**
```typescript
interface TechnicalErrorAnalysis {
  rawData: SessionResult[];
  statisticalSummary: {
    mean: number;
    median: number;
    standardDeviation: number;
    outliers: number[];
    confidenceInterval: [number, number];
  };
  correctedData: {
    robustMean: number;
    adjustedScores: number[];
    technicalErrorEstimate: number;
    reliabilityScore: number;
  };
  intervalAnalysis: {
    [intervalType: string]: {
      rawAccuracy: number;
      correctedAccuracy: number;
      technicalErrorRate: number;
      sampleSize: number;
    };
  };
}
```

### **既存コンポーネント拡張方針**
1. **IntervalProgressTracker**: 技術誤差補正データの追加表示
2. **ConsistencyGraph**: 補正前/後の二重グラフ表示  
3. **SessionStatistics**: 統計サマリーの大幅拡張
4. **UnifiedScoreResultFixed**: 4タブ統合管理とロジック強化

### **新規実装要素**
- 技術誤差分析アルゴリズム
- ロバスト統計計算
- 段階別アドバイス生成
- 信頼度計算

---

## 🎯 実装優先順位

### **High Priority**
1. `performHybridStatisticalAnalysis` の技術誤差分離機能拡張
2. 4タブのデータ構造設計と基本表示
3. 技術誤差補正アルゴリズム実装

### **Medium Priority**
4. 既存コンポーネント（IntervalProgressTracker等）の拡張
5. 段階別フィードバックシステム
6. グラフィカル要素の強化

### **Low Priority**
7. 詳細な統計表示
8. アニメーション効果
9. エクスポート機能

---

**この仕様により、技術誤差に惑わされない真の相対音感向上を支援する、科学的で実用的な分析システムが実現されます。**

---

## 📋 技術分析表示実装履歴

### **2025-08-02 技術分析表示システム刷新完了**

#### **実装概要**
**期間**: 2025-08-02 19:02-21:03 JST（5段階の段階的改善）  
**目的**: FeedbackDisplayコンポーネント依存からshadcn/ui風直接実装への移行  
**対象ファイル**: `src/lib/components/scoring/UnifiedScoreResultFixed.svelte`  
**ブランチ**: `stable-rollback-002`

#### **段階的改善プロセス**

##### **Stage 1: 3492d00 - 技術分析セクション完全修正**
- グレードセクション統一スタイル実装
- リスト中央配置（`margin: 0 auto`, `max-width: 600px`）
- 不要機能削除（アイコン・ホバー効果無効化）

##### **Stage 2: b949d7c - 技術分析表示完全リニューアル**
**重大変更**: FeedbackDisplayコンポーネント完全除去

**Before**: 複雑なコンポーネント依存
```svelte
<FeedbackDisplay 
  feedback={technicalFeedbackData}
  className="technical-feedback-display-inline"
/>
```

**After**: shadcn/ui風直接実装
```svelte
<div class="technical-analysis-content">
  <h3 class="technical-analysis-title">{technicalFeedbackData.primary}</h3>
  <p class="technical-analysis-subtitle">{technicalFeedbackData.summary}</p>
  <div class="technical-analysis-list">
    {#each technicalFeedbackData.details as item}
      <div class="technical-analysis-item">- {item.text}</div>
    {/each}
  </div>
</div>
```

##### **Stage 3: 57b303f - リスト表示改善**
- リスト項目視認性向上: ハイフン追加 `- {item.text}`
- インデント調整: `padding-left: 2rem`

##### **Stage 4: 839030d - インデント最適化**
- インデント拡大: `padding-left: 3rem`（最終調整）

##### **Stage 5: 9200e43 - パフォーマンス最適化**
- 技術分析デバッグログ全削除（本番環境向け）
- HarmonicCorrectionログ復活（重要機能保持）

#### **新しいCSS設計**
```css
.technical-analysis-content {
  text-align: center;
}

.technical-analysis-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.technical-analysis-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.technical-analysis-list {
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
  padding-left: 3rem;
}

.technical-analysis-item {
  padding: 0.25rem 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}
```

#### **実装効果**
- ✅ **UI統一性**: shadcn/ui風デザインでアプリ全体の一貫性確保
- ✅ **メンテナンス性**: 複雑なコンポーネント依存を排除
- ✅ **表示品質**: リスト項目の視認性・可読性向上
- ✅ **パフォーマンス**: デバッグログ削除による最適化

#### **アーキテクチャ改善**
- 🔄 **依存関係簡素化**: FeedbackDisplayコンポーネント除去
- 🎨 **直接CSS実装**: shadcn/ui風スタイルの直接適用
- 📱 **レスポンシブ対応**: 中央配置・最大幅制御の統一実装

#### **将来の拡張性**
この実装により、今後の4タブ分析システム拡張時も統一されたデザイン言語で開発可能。技術分析表示の基盤設計が確立されました。