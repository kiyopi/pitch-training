# プロトタイプベース採点システム実装案

**参照元**: https://github.com/kiyopi/pitch_app  
**作成日**: 2025-07-28  
**適用対象**: `/Users/isao/Documents/pitch-training/svelte-prototype/src/routes/training/random/+page.svelte`

---

## 🎯 プロトタイプ採点システムの核心技術

### **Core 1: 4段階判定システム**
```javascript
// プロトタイプの実際の採点基準
function evaluateScoreWithPrototypeLogic(centDifference) {
  const absCents = Math.abs(centDifference);
  
  if (absCents <= 20) {
    return {
      grade: 'excellent',
      score: 95,
      color: '#10b981',
      message: '優秀！'
    };
  } else if (absCents <= 35) {
    return {
      grade: 'good', 
      score: 80,
      color: '#3b82f6',
      message: '良好'
    };
  } else if (absCents <= 50) {
    return {
      grade: 'pass',
      score: 65,
      color: '#f59e0b', 
      message: '合格'
    };
  } else {
    return {
      grade: 'fail',
      score: 30,
      color: '#ef4444',
      message: '要練習'
    };
  }
}
```

### **Core 2: 外れ値分析システム**
```javascript
// 3段階外れ値レベルでの採点補正
class OutlierAnalysisSystem {
  constructor() {
    this.outlierCounts = {
      level1: 0, // 50-80セント
      level2: 0, // 80-120セント 
      level3: 0  // 120セント超
    };
  }
  
  analyzeOutlier(centDifference) {
    const absCents = Math.abs(centDifference);
    
    if (absCents >= 120) {
      this.outlierCounts.level3++;
      return { level: 3, severity: 'critical' };
    } else if (absCents >= 80) {
      this.outlierCounts.level2++;
      return { level: 2, severity: 'warning' };
    } else if (absCents >= 50) {
      this.outlierCounts.level1++;
      return { level: 1, severity: 'attention' };
    }
    
    return { level: 0, severity: 'normal' };
  }
  
  // 外れ値ペナルティの計算
  calculateOutlierPenalty() {
    let penalty = 0;
    
    // Level 1: 3個まで許容、それ以降は-5点/個
    if (this.outlierCounts.level1 > 3) {
      penalty += (this.outlierCounts.level1 - 3) * 5;
    }
    
    // Level 2: 2個まで許容、それ以降は-10点/個
    if (this.outlierCounts.level2 > 2) {
      penalty += (this.outlierCounts.level2 - 2) * 10;
    }
    
    // Level 3: 2個まで許容、それ以降は-15点/個
    if (this.outlierCounts.level3 > 2) {
      penalty += (this.outlierCounts.level3 - 2) * 15;
    }
    
    return Math.min(penalty, 50); // 最大50点減点
  }
}
```

### **Core 3: 総合判定システム**
```javascript
// 8音階完了時の総合評価
function calculateFinalScore(scaleResults) {
  const excellentCount = scaleResults.filter(r => r.grade === 'excellent').length;
  const goodCount = scaleResults.filter(r => r.grade === 'good').length;
  const passCount = scaleResults.filter(r => r.grade === 'pass').length;
  
  // 基本スコア計算
  let baseScore = scaleResults.reduce((sum, r) => sum + r.score, 0) / scaleResults.length;
  
  // 総合判定
  let finalGrade;
  if (excellentCount >= 6) { // 8音中6音が優秀（75%）
    finalGrade = '優秀';
    baseScore = Math.max(baseScore, 90);
  } else if (goodCount + excellentCount >= 5) { // 8音中5音が良好以上（62.5%）
    finalGrade = '良好';
    baseScore = Math.max(baseScore, 75);
  } else if (passCount + goodCount + excellentCount >= 4) { // 8音中4音が合格以上（50%）
    finalGrade = '合格';
    baseScore = Math.max(baseScore, 60);
  } else {
    finalGrade = '要練習';
    baseScore = Math.min(baseScore, 50);
  }
  
  return {
    finalScore: Math.round(baseScore),
    finalGrade: finalGrade,
    breakdown: {
      excellent: excellentCount,
      good: goodCount,
      pass: passCount,
      fail: 8 - excellentCount - goodCount - passCount
    }
  };
}
```

---

## 🔧 現在実装への具体的適用

### **Step 1: evaluateScaleStep関数の置き換え**

```javascript
// 現在の採点ロジックを置き換え
function evaluateScaleStep(frequency, note) {
  if (!frequency || frequency <= 0 || !isGuideAnimationActive) {
    return;
  }
  
  // 基音周波数チェック（既存）
  if (!currentBaseFrequency || currentBaseFrequency <= 0) {
    console.error('基音周波数が無効');
    return;
  }
  
  const activeStepIndex = currentScaleIndex - 1;
  if (activeStepIndex < 0 || activeStepIndex >= scaleSteps.length) {
    return;
  }
  
  // 【新】統一音程計算
  const pitchCalc = calculatePitchAccuracy(
    currentBaseFrequency,
    getCurrentBaseNoteData(),
    activeStepIndex,
    frequency
  );
  
  // 【新】プロトタイプベース採点
  const evaluation = evaluateScoreWithPrototypeLogic(pitchCalc.centDifference);
  
  // 【新】外れ値分析
  const outlierAnalysis = outlierSystem.analyzeOutlier(pitchCalc.centDifference);
  
  // 結果を記録
  scaleEvaluations[activeStepIndex] = {
    ...evaluation,
    centDifference: pitchCalc.centDifference,
    targetFrequency: pitchCalc.targetFrequency,
    detectedFrequency: frequency,
    outlierLevel: outlierAnalysis.level,
    timestamp: Date.now()
  };
  
  // UI更新
  updateScaleStepDisplay(activeStepIndex, evaluation);
  
  console.log(`📊 [プロトタイプ採点] ${scaleSteps[activeStepIndex].name}: ${evaluation.score}点 (${pitchCalc.centDifference}¢) ${evaluation.message}`);
}
```

### **Step 2: UI表示の改善**

```svelte
<!-- プロトタイプベースの採点表示 -->
<div class="prototype-scoring-display">
  {#each scaleSteps as step, index}
    <div class="scale-step-result" 
         class:excellent={scaleEvaluations[index]?.grade === 'excellent'}
         class:good={scaleEvaluations[index]?.grade === 'good'}
         class:pass={scaleEvaluations[index]?.grade === 'pass'}
         class:fail={scaleEvaluations[index]?.grade === 'fail'}>
      
      <div class="step-name">{step.name}</div>
      
      {#if scaleEvaluations[index]}
        <div class="step-score">{scaleEvaluations[index].score}点</div>
        <div class="step-cents">{scaleEvaluations[index].centDifference}¢</div>
        <div class="step-grade">{scaleEvaluations[index].message}</div>
        
        <!-- 外れ値インジケーター -->
        {#if scaleEvaluations[index].outlierLevel > 0}
          <div class="outlier-indicator level-{scaleEvaluations[index].outlierLevel}">
            外れ値Lv{scaleEvaluations[index].outlierLevel}
          </div>
        {/if}
      {:else}
        <div class="step-pending">待機中</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .prototype-scoring-display {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 20px 0;
  }
  
  .scale-step-result {
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .scale-step-result.excellent {
    background-color: #d1fae5;
    border: 2px solid #10b981;
  }
  
  .scale-step-result.good {
    background-color: #dbeafe;
    border: 2px solid #3b82f6;
  }
  
  .scale-step-result.pass {
    background-color: #fef3c7;
    border: 2px solid #f59e0b;
  }
  
  .scale-step-result.fail {
    background-color: #fee2e2;
    border: 2px solid #ef4444;
  }
  
  .outlier-indicator {
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
  }
  
  .outlier-indicator.level-1 { background: #fbbf24; }
  .outlier-indicator.level-2 { background: #f97316; }
  .outlier-indicator.level-3 { background: #dc2626; color: white; }
</style>
```

### **Step 3: セッション完了時の総合評価**

```javascript
// 8音階完了時の処理
function completeTrainingSession() {
  // 外れ値ペナルティ計算
  const outlierPenalty = outlierSystem.calculateOutlierPenalty();
  
  // 総合判定
  const finalResult = calculateFinalScore(scaleEvaluations);
  
  // ペナルティ適用
  finalResult.finalScore = Math.max(0, finalResult.finalScore - outlierPenalty);
  
  // 結果表示
  displayFinalResults(finalResult, outlierPenalty);
  
  console.log(`🎯 [セッション完了] 総合: ${finalResult.finalScore}点 (${finalResult.finalGrade}) ペナルティ: -${outlierPenalty}点`);
}
```

---

## 📊 期待される改善効果

### **精度向上**
- **現在**: ±50セント基準の大雑把な判定
- **改善後**: ±20/35/50セントの3段階精密判定

### **ユーザー体験向上**
- **現在**: 単純な○×判定
- **改善後**: 優秀/良好/合格/要練習の段階的フィードバック

### **採点の公平性**
- **現在**: 固定基準
- **改善後**: 外れ値分析による適応的評価

### **モチベーション向上**
- **現在**: 厳しすぎる基準
- **改善後**: 段階的達成感のある基準

---

## 🚀 実装スケジュール

### **Phase 1: Core Logic (1時間)**
1. `evaluateScoreWithPrototypeLogic`関数の実装
2. `OutlierAnalysisSystem`クラスの実装
3. 既存`evaluateScaleStep`の置き換え

### **Phase 2: UI Integration (30分)**
1. 採点結果表示コンポーネントの更新
2. 色分け・グレード表示の実装
3. 外れ値インジケーターの追加

### **Phase 3: Final Scoring (30分)**
1. `calculateFinalScore`の実装
2. セッション完了処理の実装
3. 総合結果表示の実装

---

**この実装により、プロトタイプレベルの高精度採点システムを実現できます。**