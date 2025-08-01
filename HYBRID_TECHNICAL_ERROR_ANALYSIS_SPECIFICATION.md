# ハイブリッド技術誤差分析システム仕様書

**バージョン**: v1.0.0  
**作成日**: 2025-08-01  
**対象システム**: SvelteKit + Tone.js + Salamander Grand Piano  
**適用モード**: ランダム(8音階) + 連続(8音階) + 12音階モード  

---

## 📋 **概要**

### **目的**
技術誤差（±20-50¢）による不公正な評価を統計的手法で吸収し、ユーザーの真の音感能力を公正に測定する。3つのトレーニングモード（ランダム・連続・12音階）に対応したハイブリッド分析システム。

### **設計思想**
- **統一アーキテクチャ**: 1つの分析関数で全モード対応
- **比例スケーリング**: データ量に応じた適応的精度向上
- **段階的体験**: 基本評価→高精度評価の自然な流れ
- **複雑化回避**: シンプルな比例計算による実装

---

## 🎯 **対象モードとデータ仕様**

### **モード別データ構造**
```javascript
const MODE_SPECIFICATIONS = {
  random: {
    name: 'ランダム基音モード',
    maxSessions: 8,
    notesPerSession: 8,
    totalNotes: 64,
    scaleType: 'diatonic',        // ドレミファソラシド
    difficulty: 'basic',
    evaluationFocus: '相対音感基礎'
  },
  
  continuous: {
    name: '連続チャレンジモード', 
    maxSessions: 8,
    notesPerSession: 8,
    totalNotes: 64,
    scaleType: 'diatonic',
    difficulty: 'intermediate',
    evaluationFocus: '持続的集中力'
  },
  
  chromatic: {
    name: '12音階モード',
    maxSessions: 12,
    notesPerSession: 12,
    totalNotes: 144,
    scaleType: 'chromatic',       // C-C#-D-D#-E-F-F#-G-G#-A-A#-B
    difficulty: 'advanced',
    evaluationFocus: '半音階精密認識'
  }
};
```

---

## 🔬 **技術誤差分析アルゴリズム**

### **1. 適応的パラメータ取得**
```javascript
function getAdaptiveThresholds(mode) {
  const spec = MODE_SPECIFICATIONS[mode] || MODE_SPECIFICATIONS.random;
  
  return {
    // データ量基準
    minDataThreshold: spec.notesPerSession,     // 最小分析データ数
    mediumDataRatio: 0.25,                      // 中信頼度データ比率
    highDataRatio: 0.5,                         // 高信頼度データ比率
    
    // 完走ボーナス基準
    completionThreshold: 0.8,                   // 80%完走でボーナス
    masteryThreshold: 1.0,                      // 100%完走でマスター認定
    
    // 精度補正係数
    basicPrecisionFactor: 1.0,                  // 基本補正なし
    enhancedPrecisionFactor: mode === 'chromatic' ? 1.2 : 1.1,  // モード別強化
    masteryBonus: mode === 'chromatic' ? 1.3 : 1.2              // 完走ボーナス
  };
}
```

### **2. 統計的分析処理**
```javascript
function performHybridStatisticalAnalysis(sessionHistory, mode) {
  const thresholds = getAdaptiveThresholds(mode);
  const spec = MODE_SPECIFICATIONS[mode];
  
  // Step 1: 全centデータ収集
  const allCentData = extractAllCentData(sessionHistory);
  
  // Step 2: データ充足性判定
  const dataRatio = allCentData.length / spec.totalNotes;
  const progressRatio = sessionHistory.length / spec.maxSessions;
  
  if (allCentData.length < thresholds.minDataThreshold) {
    return createInsufficientDataResult();
  }
  
  // Step 3: 基本統計計算
  const stats = calculateBasicStatistics(allCentData);
  
  // Step 4: 外れ値検出（3σ法則）
  const outliers = detectOutliers(allCentData, stats);
  
  // Step 5: 堅牢平均計算（外れ値除外）
  const robustStats = calculateRobustStatistics(allCentData, outliers);
  
  // Step 6: 信頼度レベル判定
  const confidenceLevel = determineConfidenceLevel(dataRatio, outliers.rate);
  
  // Step 7: モード特化補正適用
  const correctedAccuracy = applyModeSpecificCorrection(
    robustStats.accuracy, 
    mode, 
    progressRatio, 
    confidenceLevel
  );
  
  return {
    // 基本指標
    totalMeasurements: allCentData.length,
    averageError: Math.round(robustStats.mean),
    technicalErrorRate: Math.round((stats.stdDev / 50) * 100),
    
    // 品質指標
    confidenceLevel: confidenceLevel,
    outlierCount: outliers.count,
    outlierRate: outliers.rate,
    
    // 補正結果
    robustAccuracy: Math.round(correctedAccuracy),
    correctionFactor: calculateCorrectionFactor(mode, progressRatio, confidenceLevel),
    
    // メタデータ
    measurement: 'complete',
    analysisMode: mode,
    progressRatio: progressRatio,
    dataCompleteness: dataRatio
  };
}
```

### **3. 信頼度レベル判定**
```javascript
function determineConfidenceLevel(dataRatio, outlierRate) {
  // データ充足性チェック
  if (dataRatio >= 0.5 && outlierRate <= 0.2) return 'high';     // 高信頼度
  if (dataRatio >= 0.25 && outlierRate <= 0.4) return 'medium';  // 中信頼度
  return 'low';                                                   // 低信頼度
}
```

### **4. モード特化補正システム**
```javascript
function applyModeSpecificCorrection(baseAccuracy, mode, progressRatio, confidenceLevel) {
  const thresholds = getAdaptiveThresholds(mode);
  let correctedAccuracy = baseAccuracy;
  
  // 基本信頼度補正
  const confidenceMultiplier = {
    'high': 1.1,
    'medium': 1.05,
    'low': 1.0
  }[confidenceLevel];
  
  correctedAccuracy *= confidenceMultiplier;
  
  // プログレス補正
  if (progressRatio >= thresholds.completionThreshold) {
    correctedAccuracy *= thresholds.enhancedPrecisionFactor;
  }
  
  // 完走マスターボーナス
  if (progressRatio >= thresholds.masteryThreshold) {
    correctedAccuracy *= thresholds.masteryBonus;
  }
  
  // 12音階モード特別ボーナス
  if (mode === 'chromatic' && progressRatio >= 0.8) {
    correctedAccuracy *= 1.15; // 半音階マスター認定
  }
  
  return Math.min(correctedAccuracy, 100); // 上限100%
}
```

---

## 🎨 **ユーザーインターフェース仕様**

### **技術分析結果表示**
```html
<!-- 4セッション以上で表示開始 -->
<div class="technical-analysis-section" [表示条件: sessionCount >= 4]>
  <h4>🔬 技術分析結果</h4>
  
  <div class="analysis-grid">
    <!-- 測定精度 -->
    <div class="analysis-item">
      <span class="analysis-label">測定精度</span>
      <span class="analysis-value confidence-{level}">
        {high: '高精度', medium: '中精度', low: '低精度'}
      </span>
    </div>
    
    <!-- 技術誤差 -->
    <div class="analysis-item">
      <span class="analysis-label">技術誤差</span>
      <span class="analysis-value">±{averageError}¢</span>
    </div>
    
    <!-- 真の音感能力 -->
    <div class="analysis-item">
      <span class="analysis-label">真の音感能力</span>
      <span class="analysis-value grade-indicator">{gradeWithCorrection}</span>
    </div>
    
    <!-- 総測定回数 -->
    <div class="analysis-item">
      <span class="analysis-label">総測定回数</span>
      <span class="analysis-value">{totalMeasurements}回</span>
    </div>
  </div>
  
  <!-- 説明文（モード別） -->
  <div class="analysis-explanation">
    <strong>評価について:</strong>
    {totalMeasurements}回の測定データから統計的に分析し、技術的な誤差を考慮した真の音感能力を評価しています。
    
    <!-- 12音階モード特別表示 -->
    {#if mode === 'chromatic'}
      <br><strong>🎹 12音階モード:</strong> 
      半音階144音の高精度分析により、より正確な音感能力を測定しています。
    {/if}
    
    <!-- 外れ値検出表示 -->
    {#if outlierCount > 0}
      <br>({outlierCount}回の外れ値を検出・補正済み)
    {/if}
  </div>
</div>
```

### **段階的メッセージシステム**
```javascript
const PROGRESSIVE_MESSAGES = {
  // セッション数に応じたメッセージ
  session_1_3: "データ蓄積中... より正確な評価のために練習を続けましょう",
  session_4_7: "統計分析開始！ 技術誤差を考慮した評価を表示しています",
  session_8: "8セッション完走！ あなたの真の音感能力が明らかになりました",
  session_12: "🎹 12音階マスター認定！ 半音階の精密な音感能力を証明しました",
  
  // モード別完走メッセージ  
  random_complete: "ランダム基音モード完走！ 基礎的な相対音感能力を習得",
  continuous_complete: "連続チャレンジ完走！ 持続的な集中力と音感の両立達成",
  chromatic_complete: "🏆 12音階モード制覇！ 真の音感マスターの称号を獲得"
};
```

---

## 📊 **S-E級統合評価への統合**

### **技術誤差補正版S-E級判定**
```javascript
function calculateCorrectedUnifiedGrade(sessionHistory, mode) {
  // 技術誤差分析実行
  const errorAnalysis = performHybridStatisticalAnalysis(sessionHistory, mode);
  
  // 基本グレード集計
  const basicGrades = calculateBasicGrades(sessionHistory);
  
  // 補正係数適用
  const correctionFactor = errorAnalysis.correctionFactor;
  const correctedExcellentRatio = Math.min(basicGrades.excellentRatio * correctionFactor, 1.0);
  const correctedGoodRatio = Math.min(basicGrades.goodRatio * correctionFactor, 1.0);
  
  // S-E級判定（補正後）
  if (correctedExcellentRatio >= 0.9 && correctedGoodRatio >= 0.95) return 'S';
  if (correctedExcellentRatio >= 0.7 && correctedGoodRatio >= 0.85) return 'A';
  if (correctedExcellentRatio >= 0.5 && correctedGoodRatio >= 0.75) return 'B';
  if (correctedGoodRatio >= 0.65) return 'C';
  if (correctedGoodRatio >= 0.50) return 'D';
  return 'E';
}
```

---

## 🚀 **実装優先順位**

### **Phase 1: 基本ハイブリッド分析**
1. `getAdaptiveThresholds()` 関数実装
2. `performHybridStatisticalAnalysis()` 基本版実装
3. モード自動検出機能

### **Phase 2: UI統合**
4. 技術分析結果表示コンポーネント
5. 段階的メッセージシステム
6. CSSスタイリング

### **Phase 3: S-E級統合**
7. 補正版S-E級判定ロジック
8. 既存UnifiedScoreResultFixed.svelteとの統合
9. テストとデバッグ

---

## ✅ **期待される効果**

### **ユーザー体験向上**
- **公正な評価**: 技術誤差による不当な低評価を回避
- **継続モチベーション**: 段階的な精度向上体験
- **達成感**: モード別特別認定システム

### **技術的優位性**
- **統計的信頼性**: 大数の法則による精度向上（特に12音階144音）
- **適応性**: データ量に応じた動的品質調整
- **拡張性**: 新モード追加時の簡単対応

### **教育的価値**
- **科学的根拠**: 統計的分析による納得感
- **段階的成長**: 基本→高精度の自然な学習フロー
- **専門性**: 12音階モードでの真の音感マスター認定

---

**この仕様に基づいて実装を進めることで、技術的制約に負けない公正で継続可能な評価システムが実現できます。**