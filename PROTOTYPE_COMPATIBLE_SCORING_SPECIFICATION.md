# プロトタイプ互換採点システム仕様書

**作成日**: 2025-07-28  
**参照プロトタイプ**: https://github.com/kiyopi/pitch_app  
**目的**: 高精度プロトタイプの採点システムを現在実装に完全移植  
**対象**: 3モード共通採点システム

---

## 🎯 プロトタイプ分析結果

### **高精度の要因**
1. **4段階評価システム**: 優秀/良好/合格/要練習の段階的評価
2. **外れ値分析システム**: 3段階レベルでの異常値検出・補正
3. **総合判定システム**: セッション全体を俯瞰した最終評価
4. **音楽教育的配慮**: 理論に基づく妥当な判定基準

### **現在実装との違い**
- **現在**: ±50セントの単純○×判定
- **プロトタイプ**: ±20/35/50セントの段階的評価

---

## 🏗️ プロトタイプ互換採点システム設計

### **Core 1: 4段階評価システム**

```javascript
/**
 * プロトタイプベースの4段階評価システム
 * @param {number} centDifference - セント差（±値）
 * @returns {Object} 評価結果
 */
function evaluateScoreWithPrototypeLogic(centDifference) {
  const absCents = Math.abs(centDifference);
  
  // プロトタイプと同一の判定基準
  if (absCents <= 20) {
    return {
      grade: 'excellent',
      score: 95,
      color: '#10b981',
      message: '優秀！',
      isCorrect: true
    };
  } else if (absCents <= 35) {
    return {
      grade: 'good',
      score: 80,
      color: '#3b82f6',
      message: '良好',
      isCorrect: true
    };
  } else if (absCents <= 50) {
    return {
      grade: 'pass',
      score: 65,
      color: '#f59e0b',
      message: '合格',
      isCorrect: false // プロトタイプでは50¢超は「要改善」扱い
    };
  } else {
    return {
      grade: 'fail',
      score: 30,
      color: '#ef4444',
      message: '要練習',
      isCorrect: false
    };
  }
}
```

### **Core 2: 外れ値分析システム**

```javascript
/**
 * プロトタイプベースの外れ値分析システム
 */
class OutlierAnalysisSystem {
  constructor() {
    // プロトタイプと同一の外れ値レベル定義
    this.outlierLevels = {
      level1: { threshold: 80, maxCount: 3, severity: 'attention' },    // 50-80セント
      level2: { threshold: 120, maxCount: 2, severity: 'warning' },     // 80-120セント  
      level3: { threshold: Infinity, maxCount: 2, severity: 'critical' } // 120セント超
    };
    
    this.outlierCounts = {
      level1: 0,
      level2: 0,
      level3: 0
    };
  }
  
  /**
   * 外れ値レベルの判定
   * @param {number} centDifference - セント差
   * @returns {Object} 外れ値分析結果
   */
  analyzeOutlier(centDifference) {
    const absCents = Math.abs(centDifference);
    
    if (absCents >= 120) {
      this.outlierCounts.level3++;
      return { 
        level: 3, 
        severity: 'critical',
        message: '重大な音程エラー',
        color: '#dc2626'
      };
    } else if (absCents >= 80) {
      this.outlierCounts.level2++;
      return { 
        level: 2, 
        severity: 'warning',
        message: '音程要注意',
        color: '#f97316'
      };
    } else if (absCents >= 50) {
      this.outlierCounts.level1++;
      return { 
        level: 1, 
        severity: 'attention',
        message: '音程注意',
        color: '#fbbf24'
      };
    }
    
    return { 
      level: 0, 
      severity: 'normal',
      message: '正常範囲',
      color: '#10b981'
    };
  }
  
  /**
   * 外れ値ペナルティの計算（プロトタイプ式）
   * @returns {number} ペナルティポイント
   */
  calculateOutlierPenalty() {
    let penalty = 0;
    
    // Level 1: 3個まで許容、それ以降は-5点/個
    if (this.outlierCounts.level1 > this.outlierLevels.level1.maxCount) {
      penalty += (this.outlierCounts.level1 - this.outlierLevels.level1.maxCount) * 5;
    }
    
    // Level 2: 2個まで許容、それ以降は-10点/個
    if (this.outlierCounts.level2 > this.outlierLevels.level2.maxCount) {
      penalty += (this.outlierCounts.level2 - this.outlierLevels.level2.maxCount) * 10;
    }
    
    // Level 3: 2個まで許容、それ以降は-15点/個
    if (this.outlierCounts.level3 > this.outlierLevels.level3.maxCount) {
      penalty += (this.outlierCounts.level3 - this.outlierLevels.level3.maxCount) * 15;
    }
    
    // 最大50点減点（全体スコアが負にならないよう制限）
    return Math.min(penalty, 50);
  }
  
  /**
   * 外れ値統計の取得
   * @returns {Object} 外れ値統計
   */
  getOutlierStatistics() {
    return {
      level1: this.outlierCounts.level1,
      level2: this.outlierCounts.level2,
      level3: this.outlierCounts.level3,
      totalOutliers: this.outlierCounts.level1 + this.outlierCounts.level2 + this.outlierCounts.level3,
      penalty: this.calculateOutlierPenalty()
    };
  }
}
```

### **Core 3: 総合判定システム**

```javascript
/**
 * プロトタイプベースの総合判定システム
 * @param {Array} scaleResults - 8音階の評価結果配列
 * @param {OutlierAnalysisSystem} outlierSystem - 外れ値分析システム
 * @returns {Object} 総合判定結果
 */
function calculateFinalScoreWithPrototypeLogic(scaleResults, outlierSystem) {
  // 各評価グレードの集計
  const excellentCount = scaleResults.filter(r => r.grade === 'excellent').length;
  const goodCount = scaleResults.filter(r => r.grade === 'good').length;
  const passCount = scaleResults.filter(r => r.grade === 'pass').length;
  const failCount = scaleResults.filter(r => r.grade === 'fail').length;
  
  // 基本スコア計算（各音階スコアの平均）
  let baseScore = scaleResults.reduce((sum, r) => sum + r.score, 0) / scaleResults.length;
  
  // プロトタイプ式総合判定
  let finalGrade;
  let finalMessage;
  let finalColor;
  
  if (excellentCount >= 6) { // 8音中6音が優秀（75%）
    finalGrade = '優秀';
    finalMessage = '素晴らしい相対音感です！';
    finalColor = '#10b981';
    baseScore = Math.max(baseScore, 90); // 最低90点保証
  } else if (goodCount + excellentCount >= 5) { // 8音中5音が良好以上（62.5%）
    finalGrade = '良好';
    finalMessage = '良い音感を持っています';
    finalColor = '#3b82f6';
    baseScore = Math.max(baseScore, 75); // 最低75点保証
  } else if (passCount + goodCount + excellentCount >= 4) { // 8音中4音が合格以上（50%）
    finalGrade = '合格';
    finalMessage = '基本的な音感があります';
    finalColor = '#f59e0b';
    baseScore = Math.max(baseScore, 60); // 最低60点保証
  } else {
    finalGrade = '要練習';
    finalMessage = '音感トレーニングを続けましょう';
    finalColor = '#ef4444';
    baseScore = Math.min(baseScore, 50); // 最高50点制限
  }
  
  // 外れ値ペナルティ適用
  const outlierPenalty = outlierSystem.calculateOutlierPenalty();
  const finalScore = Math.max(0, Math.round(baseScore - outlierPenalty));
  
  return {
    finalScore: finalScore,
    finalGrade: finalGrade,
    finalMessage: finalMessage,
    finalColor: finalColor,
    breakdown: {
      excellent: excellentCount,
      good: goodCount,
      pass: passCount,
      fail: failCount
    },
    outlierStatistics: outlierSystem.getOutlierStatistics(),
    baseScore: Math.round(baseScore),
    penalty: outlierPenalty
  };
}
```

---

## 🎨 UI統合仕様

### **リアルタイム採点表示**

```svelte
<!-- プロトタイプベースのリアルタイム採点表示 -->
<script>
  export let evaluation; // 4段階評価結果
  export let outlierAnalysis; // 外れ値分析結果
</script>

<div class="prototype-scoring-display">
  <!-- メインスコア表示 -->
  <div class="score-main" style="color: {evaluation.color}">
    <div class="score-number">{evaluation.score}</div>
    <div class="score-suffix">点</div>
    <div class="grade-badge grade-{evaluation.grade}">
      {evaluation.message}
    </div>
  </div>
  
  <!-- セント差表示 -->
  <div class="cent-display">
    <span class="cent-value">{evaluation.centDifference >= 0 ? '+' : ''}{evaluation.centDifference}¢</span>
  </div>
  
  <!-- 外れ値インジケーター -->
  {#if outlierAnalysis.level > 0}
    <div class="outlier-indicator level-{outlierAnalysis.level}" 
         style="background-color: {outlierAnalysis.color}">
      <span class="outlier-icon">⚠️</span>
      <span class="outlier-text">{outlierAnalysis.message}</span>
    </div>
  {/if}
</div>

<style>
  .prototype-scoring-display {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .score-main {
    margin-bottom: 16px;
  }
  
  .score-number {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
  }
  
  .score-suffix {
    font-size: 1.5rem;
    opacity: 0.8;
    margin-left: 4px;
  }
  
  .grade-badge {
    margin-top: 8px;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .grade-excellent { background: #d1fae5; color: #065f46; }
  .grade-good { background: #dbeafe; color: #1e40af; }
  .grade-pass { background: #fef3c7; color: #92400e; }
  .grade-fail { background: #fee2e2; color: #991b1b; }
  
  .cent-display {
    font-family: 'SF Mono', monospace;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  .outlier-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
  }
</style>
```

### **8音階結果グリッド**

```svelte
<!-- 8音階の詳細採点結果表示 -->
<script>
  export let scaleResults; // 8音階の評価結果配列
  export let scaleNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];
</script>

<div class="scale-results-grid">
  {#each scaleResults as result, index}
    <div class="scale-result-card grade-{result.grade}">
      <!-- 音階名 -->
      <div class="scale-name">{scaleNames[index]}</div>
      
      <!-- スコア表示 -->
      <div class="scale-score" style="color: {result.color}">
        {result.score}点
      </div>
      
      <!-- セント差 -->
      <div class="scale-cents">
        {result.centDifference >= 0 ? '+' : ''}{result.centDifference}¢
      </div>
      
      <!-- 評価バッジ -->
      <div class="scale-grade-badge" style="background-color: {result.color}">
        {result.message}
      </div>
      
      <!-- 外れ値アイコン -->
      {#if result.outlierLevel > 0}
        <div class="outlier-icon-small">⚠️</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .scale-results-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin: 24px 0;
  }
  
  @media (max-width: 768px) {
    .scale-results-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .scale-result-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
    position: relative;
  }
  
  .scale-result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .scale-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .scale-score {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 4px;
  }
  
  .scale-cents {
    font-family: 'SF Mono', monospace;
    font-size: 0.875rem;
    opacity: 0.7;
    margin-bottom: 8px;
  }
  
  .scale-grade-badge {
    padding: 4px 12px;
    border-radius: 16px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .outlier-icon-small {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 0.875rem;
  }
</style>
```

### **総合結果パネル**

```svelte
<!-- セッション完了時の総合結果表示 -->
<script>
  export let finalResult; // 総合判定結果
</script>

<div class="final-result-panel">
  <!-- 総合スコア -->
  <div class="final-score-section">
    <div class="final-score-number" style="color: {finalResult.finalColor}">
      {finalResult.finalScore}点
    </div>
    <div class="final-grade" style="background-color: {finalResult.finalColor}">
      {finalResult.finalGrade}
    </div>
    <div class="final-message">
      {finalResult.finalMessage}
    </div>
  </div>
  
  <!-- 詳細内訳 -->
  <div class="score-breakdown">
    <h3>評価内訳</h3>
    <div class="breakdown-grid">
      <div class="breakdown-item">
        <span class="breakdown-label">優秀</span>
        <span class="breakdown-value excellent">{finalResult.breakdown.excellent}</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">良好</span>
        <span class="breakdown-value good">{finalResult.breakdown.good}</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">合格</span>
        <span class="breakdown-value pass">{finalResult.breakdown.pass}</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">要練習</span>
        <span class="breakdown-value fail">{finalResult.breakdown.fail}</span>
      </div>
    </div>
  </div>
  
  <!-- 外れ値統計 -->
  {#if finalResult.outlierStatistics.totalOutliers > 0}
    <div class="outlier-statistics">
      <h3>音程分析</h3>
      <div class="outlier-summary">
        <span>外れ値検出: {finalResult.outlierStatistics.totalOutliers}個</span>
        {#if finalResult.penalty > 0}
          <span class="penalty">ペナルティ: -{finalResult.penalty}点</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .final-result-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    padding: 32px;
    margin: 24px 0;
    text-align: center;
  }
  
  .final-score-number {
    font-size: 5rem;
    font-weight: 900;
    margin-bottom: 16px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .final-grade {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .final-message {
    font-size: 1.25rem;
    opacity: 0.9;
    margin-bottom: 32px;
  }
  
  .score-breakdown {
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  
  @media (max-width: 768px) {
    .breakdown-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .breakdown-item {
    text-align: center;
  }
  
  .breakdown-label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.8;
    margin-bottom: 4px;
  }
  
  .breakdown-value {
    display: block;
    font-size: 2rem;
    font-weight: 800;
  }
  
  .breakdown-value.excellent { color: #10b981; }
  .breakdown-value.good { color: #3b82f6; }
  .breakdown-value.pass { color: #f59e0b; }
  .breakdown-value.fail { color: #ef4444; }
  
  .outlier-statistics {
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 20px;
  }
  
  .outlier-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  
  .penalty {
    color: #fbbf24;
    font-weight: 600;
  }
</style>
```

---

## 🔧 実装統合仕様

### **現在のevaluateScaleStep関数の拡張**

```javascript
// 現在実装への統合
function evaluateScaleStep(frequency, note) {
  if (!frequency || frequency <= 0 || !isGuideAnimationActive) return;
  if (!currentBaseFrequency || currentBaseFrequency <= 0) return;
  
  const activeStepIndex = currentScaleIndex - 1;
  if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) return;
  
  // 期待周波数計算（既存のcalculateExpectedFrequencyを使用）
  const expectedFrequency = calculateExpectedFrequency(currentBaseFrequency, activeStepIndex);
  
  // セント差計算
  const centDifference = Math.round(1200 * Math.log2(frequency / expectedFrequency));
  
  // 【新】プロトタイプベース4段階評価
  const evaluation = evaluateScoreWithPrototypeLogic(centDifference);
  
  // 【新】外れ値分析
  const outlierAnalysis = outlierSystem.analyzeOutlier(centDifference);
  
  // 結果を記録（拡張版）
  const evaluationResult = {
    stepIndex: activeStepIndex,
    stepName: scaleSteps[activeStepIndex].name,
    expectedFrequency: Math.round(expectedFrequency),
    detectedFrequency: Math.round(frequency),
    centDifference: centDifference,
    
    // プロトタイプベース拡張項目
    grade: evaluation.grade,
    score: evaluation.score,
    color: evaluation.color,
    message: evaluation.message,
    isCorrect: evaluation.isCorrect,
    
    // 外れ値分析結果
    outlierLevel: outlierAnalysis.level,
    outlierSeverity: outlierAnalysis.severity,
    outlierMessage: outlierAnalysis.message,
    outlierColor: outlierAnalysis.color,
    
    timestamp: Date.now()
  };
  
  // 既存配列への保存
  const existingIndex = scaleEvaluations.findIndex(evaluation => evaluation.stepIndex === activeStepIndex);
  if (existingIndex >= 0) {
    scaleEvaluations[existingIndex] = evaluationResult;
  } else {
    scaleEvaluations.push(evaluationResult);
  }
  
  // デバッグログ（プロトタイプスタイル）
  console.log(`🎯 [プロトタイプ採点] ${scaleSteps[activeStepIndex].name}: ${evaluation.score}点 (${centDifference}¢) ${evaluation.message}`);
  
  // UI更新（リアルタイム表示）
  updateScaleStepDisplay(activeStepIndex, evaluationResult);
}
```

### **セッション完了処理の拡張**

```javascript
// 外れ値分析システムのインスタンス（グローバル）
let outlierSystem = new OutlierAnalysisSystem();

// セッション完了処理（拡張版）
function completeSession() {
  trainingPhase = 'completed';
  
  // 【新】総合判定の実行
  const finalResult = calculateFinalScoreWithPrototypeLogic(scaleEvaluations, outlierSystem);
  
  // セッション結果の更新
  sessionResults = {
    ...sessionResults,
    isCompleted: true,
    
    // プロトタイプベース拡張項目
    finalScore: finalResult.finalScore,
    finalGrade: finalResult.finalGrade,
    finalMessage: finalResult.finalMessage,
    finalColor: finalResult.finalColor,
    
    breakdown: finalResult.breakdown,
    outlierStatistics: finalResult.outlierStatistics,
    baseScore: finalResult.baseScore,
    penalty: finalResult.penalty
  };
  
  // 総合結果ログ
  console.log(`🎯 [セッション完了] 総合: ${finalResult.finalScore}点 (${finalResult.finalGrade}) ペナルティ: -${finalResult.penalty}点`);
  console.log(`📊 [内訳] 優秀:${finalResult.breakdown.excellent} 良好:${finalResult.breakdown.good} 合格:${finalResult.breakdown.pass} 要練習:${finalResult.breakdown.fail}`);
  
  // UI更新（総合結果表示）
  showFinalResults(finalResult);
}
```

---

## 📊 期待される改善効果

### **採点精度の向上**
- **現在**: ±50セントの大雑把な○×判定
- **改善後**: ±20/35/50セントの細かい段階評価

### **ユーザー体験の向上**
- **現在**: 「正解/不正解」の単純フィードバック
- **改善後**: 「優秀/良好/合格/要練習」の励ましフィードバック

### **教育効果の向上**
- **現在**: 合格基準が不明確
- **改善後**: 音楽教育理論に基づく明確な段階評価

### **モチベーション向上**
- **現在**: 厳しすぎる基準で挫折感
- **改善後**: 段階的達成感と具体的な改善指針

---

## 🚀 実装ロードマップ

### **Phase 1: Core System（1週間）**
1. `evaluateScoreWithPrototypeLogic`関数実装
2. `OutlierAnalysisSystem`クラス実装
3. `calculateFinalScoreWithPrototypeLogic`関数実装
4. 既存システムとの統合

### **Phase 2: UI Integration（1週間）**
1. リアルタイム採点表示コンポーネント
2. 8音階結果グリッドコンポーネント
3. 総合結果パネルコンポーネント
4. 既存UIとの置き換え

### **Phase 3: 3Mode Expansion（1週間）**
1. Continuous Modeへの適用
2. Chromatic Modeへの適用
3. モード間の統一性確保
4. 全体テスト・調整

### **Phase 4: Enhancement（1週間）**
1. パフォーマンス最適化
2. アニメーション効果追加
3. アクセシビリティ対応
4. 最終品質保証

---

この仕様書に基づいて実装することで、高精度プロトタイプと同等の採点システムを実現し、ユーザーにとって分かりやすく励みになる相対音感トレーニング体験を提供できます。