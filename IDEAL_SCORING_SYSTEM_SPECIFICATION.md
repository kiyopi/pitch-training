# 理想的採点システム実装仕様書

**作成日**: 2025-07-28  
**対象**: 相対音感トレーニング全モード  
**技術**: SvelteKit + Pitchy + Tone.js  
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training`

---

## 🎯 設計方針

### **1. 精度重視の採点アルゴリズム**
- **目標**: ±5セント精度での高精度採点
- **基準**: 音楽学習理論に基づく段階的評価
- **実装**: リアルタイム音程差計算による即座フィードバック

### **2. 統一計算ロジック**
- **問題**: 複数箇所での計算不整合
- **解決**: 単一の音程計算関数による統一化
- **保証**: 全機能で一貫した周波数・セント計算

### **3. ユーザー体験最適化**
- **視覚的フィードバック**: 色分け + 数値 + グラフ表示
- **段階的評価**: 初心者から上級者まで対応
- **励ましシステム**: 進歩を実感できる表示

---

## 📊 採点アルゴリズム仕様

### **Core 1: 音程差計算（統一関数）**

```typescript
/**
 * 統一音程計算関数 - 全ての採点処理で使用
 */
interface PitchCalculation {
  targetFrequency: number;    // 期待される周波数
  detectedFrequency: number;  // 検出された周波数
  centDifference: number;     // セント差（-1200〜+1200）
  semitoneInterval: number;   // 基音からの半音間隔
}

function calculatePitchAccuracy(
  baseFrequency: number,
  baseNoteData: BaseNoteInfo,
  scaleIndex: number,
  detectedFrequency: number
): PitchCalculation {
  
  // 1. 基音からの半音間隔計算（ドレミファソラシドの順序）
  const scaleIntervalsFromBase = [
    -baseNoteData.semitonesFromC,      // ド: 基音からドへの間隔
    -baseNoteData.semitonesFromC + 2,  // レ: 基音からレへの間隔
    -baseNoteData.semitonesFromC + 4,  // ミ: 基音からミへの間隔
    -baseNoteData.semitonesFromC + 5,  // ファ: 基音からファへの間隔
    -baseNoteData.semitonesFromC + 7,  // ソ: 基音からソへの間隔
    -baseNoteData.semitonesFromC + 9,  // ラ: 基音からラへの間隔
    -baseNoteData.semitonesFromC + 11, // シ: 基音からシへの間隔
    -baseNoteData.semitonesFromC + 12  // ド（高）: 基音から高ドへの間隔
  ];
  
  // 2. 目標周波数計算（正しい半音計算）
  const semitoneInterval = scaleIntervalsFromBase[scaleIndex];
  const targetFrequency = baseFrequency * Math.pow(2, semitoneInterval / 12);
  
  // 3. セント差計算（±1200セント範囲）
  const centDifference = Math.round(1200 * Math.log2(detectedFrequency / targetFrequency));
  
  // 4. 有効性チェック
  if (!isFinite(targetFrequency) || !isFinite(centDifference)) {
    throw new Error(`音程計算エラー: baseFreq=${baseFrequency}, interval=${semitoneInterval}, detected=${detectedFrequency}`);
  }
  
  return {
    targetFrequency,
    detectedFrequency,
    centDifference,
    semitoneInterval
  };
}
```

### **Core 2: スコア評価システム**

```typescript
/**
 * 採点基準 - 音楽教育理論に基づく段階評価
 */
interface ScoreEvaluation {
  score: number;           // 0-100点
  accuracy: number;        // 精度パーセンテージ
  grade: ScoreGrade;       // 評価等級
  feedback: string;        // フィードバックメッセージ
  centRange: string;       // セント差範囲表示
  isCorrect: boolean;      // 正解判定
}

enum ScoreGrade {
  PERFECT = 'perfect',     // 完璧（±5セント以内）
  EXCELLENT = 'excellent', // 優秀（±10セント以内）
  GOOD = 'good',          // 良好（±25セント以内）
  FAIR = 'fair',          // 可（±50セント以内）
  POOR = 'poor',          // 要改善（±100セント以内）
  FAILED = 'failed'       // 不合格（±100セントを超過）
}

function evaluateScore(centDifference: number): ScoreEvaluation {
  const absCents = Math.abs(centDifference);
  
  // 段階的スコア評価（音楽教育基準）
  let score: number;
  let grade: ScoreGrade;
  let feedback: string;
  let isCorrect: boolean;
  
  if (absCents <= 5) {
    score = 100;
    grade = ScoreGrade.PERFECT;
    feedback = '完璧な音程！プロレベルです';
    isCorrect = true;
  } else if (absCents <= 10) {
    score = Math.round(95 - (absCents - 5) * 1); // 95-90点
    grade = ScoreGrade.EXCELLENT;
    feedback = '優秀な音程感覚です';
    isCorrect = true;
  } else if (absCents <= 25) {
    score = Math.round(90 - (absCents - 10) * 2); // 90-60点
    grade = ScoreGrade.GOOD;
    feedback = '良好な音程です';
    isCorrect = true;
  } else if (absCents <= 50) {
    score = Math.round(60 - (absCents - 25) * 1.2); // 60-30点
    grade = ScoreGrade.FAIR;
    feedback = '音程をもう少し正確に';
    isCorrect = false;
  } else if (absCents <= 100) {
    score = Math.round(30 - (absCents - 50) * 0.4); // 30-10点
    grade = ScoreGrade.POOR;
    feedback = '音程の練習が必要です';
    isCorrect = false;
  } else {
    score = Math.max(0, Math.round(10 - (absCents - 100) * 0.1)); // 10-0点
    grade = ScoreGrade.FAILED;
    feedback = '基本の音程から練習しましょう';
    isCorrect = false;
  }
  
  // 精度パーセンテージ計算（±50セントを基準とした相対精度）
  const accuracy = Math.max(0, Math.min(100, 100 - (absCents / 50) * 100));
  
  // セント差範囲表示
  const centRange = centDifference >= 0 ? `+${centDifference}¢` : `${centDifference}¢`;
  
  return {
    score,
    accuracy: Math.round(accuracy),
    grade,
    feedback,
    centRange,
    isCorrect
  };
}
```

### **Core 3: リアルタイム採点処理**

```typescript
/**
 * リアルタイム採点システム - 音程検出と同時に評価
 */
interface RealTimeScoring {
  currentEvaluation: ScoreEvaluation | null;
  isStable: boolean;          // 安定した検出状態
  stabilityCount: number;     // 安定検出カウンター
  lastValidScore: ScoreEvaluation | null;
}

class RealTimeScoringEngine {
  private state: RealTimeScoring = {
    currentEvaluation: null,
    isStable: false,
    stabilityCount: 0,
    lastValidScore: null
  };
  
  // 安定性確保のための設定
  private readonly STABILITY_THRESHOLD = 10; // 10フレーム連続で安定判定
  private readonly FREQUENCY_VARIANCE_LIMIT = 5; // ±5Hz以内の変動を安定とみなす
  
  /**
   * 音程検出結果をリアルタイム採点
   */
  processDetection(
    detectedFrequency: number,
    baseFrequency: number,
    baseNoteData: BaseNoteInfo,
    scaleIndex: number
  ): RealTimeScoring {
    
    if (!detectedFrequency || detectedFrequency <= 0) {
      this.resetStability();
      return this.state;
    }
    
    try {
      // 1. 統一音程計算
      const pitchCalc = calculatePitchAccuracy(
        baseFrequency,
        baseNoteData,
        scaleIndex,
        detectedFrequency
      );
      
      // 2. スコア評価
      const evaluation = evaluateScore(pitchCalc.centDifference);
      
      // 3. 安定性チェック
      const isStableDetection = this.checkStability(detectedFrequency, evaluation);
      
      if (isStableDetection) {
        this.state.currentEvaluation = evaluation;
        this.state.lastValidScore = evaluation;
        this.state.isStable = true;
      } else {
        this.state.isStable = false;
      }
      
      return this.state;
      
    } catch (error) {
      console.error('採点エラー:', error);
      this.resetStability();
      return this.state;
    }
  }
  
  /**
   * 検出安定性チェック
   */
  private checkStability(frequency: number, evaluation: ScoreEvaluation): boolean {
    // 前回の評価結果と比較
    if (this.state.lastValidScore) {
      const freqDiff = Math.abs(frequency - this.state.lastValidScore.detectedFrequency);
      const scoreDiff = Math.abs(evaluation.score - this.state.lastValidScore.score);
      
      // 周波数変動と点数変動が小さい場合は安定
      if (freqDiff <= this.FREQUENCY_VARIANCE_LIMIT && scoreDiff <= 5) {
        this.state.stabilityCount++;
      } else {
        this.state.stabilityCount = 0;
      }
    } else {
      this.state.stabilityCount = 1;
    }
    
    return this.state.stabilityCount >= this.STABILITY_THRESHOLD;
  }
  
  private resetStability(): void {
    this.state.isStable = false;
    this.state.stabilityCount = 0;
    this.state.currentEvaluation = null;
  }
}
```

---

## 🎨 UI表示仕様

### **Visual 1: リアルタイムスコア表示**

```svelte
<!-- 採点結果のリアルタイム表示 -->
<div class="score-display">
  {#if scoringEngine.state.currentEvaluation}
    <div class="score-main" class:perfect={evaluation.grade === 'perfect'}
                           class:excellent={evaluation.grade === 'excellent'}
                           class:good={evaluation.grade === 'good'}
                           class:fair={evaluation.grade === 'fair'}
                           class:poor={evaluation.grade === 'poor'}
                           class:failed={evaluation.grade === 'failed'}>
      
      <!-- メインスコア -->
      <div class="score-number">{evaluation.score}</div>
      <div class="score-suffix">点</div>
      
      <!-- セント差表示 -->
      <div class="cent-difference">{evaluation.centRange}</div>
      
      <!-- 正解判定 -->
      <div class="correctness-indicator">
        {#if evaluation.isCorrect}
          <span class="correct">✓ 正解</span>
        {:else}
          <span class="incorrect">✗ 要調整</span>
        {/if}
      </div>
      
      <!-- フィードバック -->
      <div class="feedback-message">{evaluation.feedback}</div>
    </div>
  {:else}
    <div class="waiting-detection">音程を検出中...</div>
  {/if}
</div>

<style>
  .score-display {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    text-align: center;
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .score-main {
    transition: all 0.3s ease;
  }
  
  .score-number {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 8px;
  }
  
  .cent-difference {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 12px;
    font-family: 'SF Mono', monospace;
  }
  
  /* 評価等級別カラーリング */
  .perfect { color: #10b981; } /* 完璧：エメラルドグリーン */
  .excellent { color: #059669; } /* 優秀：深いグリーン */
  .good { color: #3b82f6; } /* 良好：ブルー */
  .fair { color: #f59e0b; } /* 可：オレンジ */
  .poor { color: #ef4444; } /* 要改善：レッド */
  .failed { color: #991b1b; } /* 不合格：深いレッド */
  
  .feedback-message {
    font-size: 0.875rem;
    opacity: 0.8;
    margin-top: 8px;
  }
</style>
```

### **Visual 2: 8音階総合結果表示**

```svelte
<!-- セッション完了時の詳細採点結果 -->
<div class="session-results">
  <h3>ドレミファソラシド 採点結果</h3>
  
  <div class="scale-results-grid">
    {#each scaleResults as result, index}
      <div class="scale-result-card" 
           class:correct={result.evaluation.isCorrect}
           class:incorrect={!result.evaluation.isCorrect}>
        
        <div class="scale-name">{scaleSteps[index].name}</div>
        <div class="scale-score">{result.evaluation.score}点</div>
        <div class="scale-cents">{result.evaluation.centRange}</div>
        <div class="scale-grade-badge grade-{result.evaluation.grade}">
          {getGradeLabel(result.evaluation.grade)}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- 総合統計 -->
  <div class="session-summary">
    <div class="summary-stat">
      <div class="stat-label">総合スコア</div>
      <div class="stat-value">{sessionStats.averageScore}点</div>
    </div>
    <div class="summary-stat">
      <div class="stat-label">正解率</div>
      <div class="stat-value">{sessionStats.correctRate}%</div>
    </div>
    <div class="summary-stat">
      <div class="stat-label">平均精度</div>
      <div class="stat-value">±{sessionStats.averageCentError}¢</div>
    </div>
  </div>
</div>
```

---

## 🔧 実装上の重要ポイント

### **Point 1: エラーハンドリング**

```typescript
/**
 * 採点システムの堅牢性確保
 */
interface ScoringErrorHandler {
  handleInvalidFrequency(freq: number): void;
  handleCalculationError(error: Error): void;
  handleDisplayError(error: Error): void;
}

class SafeScoringSystem implements ScoringErrorHandler {
  handleInvalidFrequency(freq: number): void {
    console.warn(`無効な周波数検出: ${freq}Hz - スキップします`);
    // UIには「検出中...」を継続表示
  }
  
  handleCalculationError(error: Error): void {
    console.error('採点計算エラー:', error);
    // フォールバック: 基本的な周波数比較での簡易採点
    this.fallbackScoring();
  }
  
  handleDisplayError(error: Error): void {
    console.error('採点表示エラー:', error);
    // UI復旧: エラーメッセージ表示後、検出画面に戻す
  }
  
  private fallbackScoring(): void {
    // 緊急時の簡易採点ロジック
  }
}
```

### **Point 2: パフォーマンス最適化**

```typescript
/**
 * 高頻度呼び出しでのパフォーマンス確保
 */
class OptimizedScoring {
  private lastCalculation: Map<string, PitchCalculation> = new Map();
  private cacheTimeout = 100; // 100ms以内は同じ計算結果を再利用
  
  calculateWithCache(
    baseFreq: number,
    scaleIndex: number,
    detectedFreq: number
  ): PitchCalculation {
    const cacheKey = `${baseFreq}-${scaleIndex}-${Math.round(detectedFreq)}`;
    const cached = this.lastCalculation.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached;
    }
    
    const result = calculatePitchAccuracy(baseFreq, baseNoteData, scaleIndex, detectedFreq);
    result.timestamp = Date.now();
    this.lastCalculation.set(cacheKey, result);
    
    return result;
  }
}
```

### **Point 3: デバッグサポート**

```typescript
/**
 * 採点プロセスの詳細ログ（開発・トラブルシューティング用）
 */
function enableScoringDebugLogs(): void {
  console.log('🎯 採点デバッグモード有効化');
  
  // 統一音程計算の詳細ログ
  window.debugScoring = {
    logCalculation: true,
    logEvaluation: true,
    logStability: true
  };
}

// 計算過程の詳細出力
function debugLogCalculation(pitchCalc: PitchCalculation, evaluation: ScoreEvaluation): void {
  if (window.debugScoring?.logCalculation) {
    console.log(`📊 [採点詳細] 目標:${pitchCalc.targetFrequency.toFixed(1)}Hz 検出:${pitchCalc.detectedFrequency.toFixed(1)}Hz 差:${pitchCalc.centDifference}¢ 点数:${evaluation.score}点`);
  }
}
```

---

## ✅ 実装チェックリスト

### **Core Implementation**
- [ ] 統一音程計算関数の実装
- [ ] 段階的スコア評価システムの実装
- [ ] リアルタイム採点エンジンの実装
- [ ] エラーハンドリングの実装

### **UI Implementation**  
- [ ] リアルタイムスコア表示コンポーネント
- [ ] 8音階結果表示コンポーネント
- [ ] 評価等級別カラーリング
- [ ] アニメーション効果

### **Integration**
- [ ] 既存PitchDetectorとの統合
- [ ] ガイドアニメーション連携
- [ ] セッション状態管理
- [ ] デバッグログシステム

### **Quality Assurance**
- [ ] 精度テスト（±5セント範囲確認）
- [ ] パフォーマンステスト（60FPS維持）
- [ ] エラーケーステスト
- [ ] iPhone Safari動作確認

---

## 🚀 段階的実装プラン

### **Phase 1: Core Logic（優先度：最高）**
1. 統一音程計算関数の実装・テスト
2. 従来の計算ロジックとの整合性確認
3. エラーハンドリングの実装

### **Phase 2: Scoring Engine（優先度：高）**
1. スコア評価システムの実装
2. リアルタイム採点エンジンの実装
3. 安定性チェック機能の実装

### **Phase 3: UI Integration（優先度：中）**
1. リアルタイム表示コンポーネント
2. 8音階結果表示コンポーネント
3. 視覚的フィードバックシステム

### **Phase 4: Enhancement（優先度：低）**
1. パフォーマンス最適化
2. デバッグサポート機能
3. 高度な統計表示

---

**この仕様書は、現在発生している採点システムの問題を根本的に解決し、ユーザーにとって分かりやすく正確な相対音感トレーニング体験を提供することを目的としています。**