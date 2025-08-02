<script>
  import { onMount } from 'svelte';
  import { EnhancedScoringEngine } from '$lib/scoring/EnhancedScoringEngine.js';
  
  // 採点エンジンのインスタンス
  let scoringEngine = null;
  let isInitialized = false;
  
  // テストデータ
  let testScenarios = [
    {
      name: "完璧な長3度認識",
      baseFreq: 440,      // A4
      targetFreq: 554.37, // C#5 (長3度上)
      detectedFreq: 554.37,
      responseTime: 800,
      volume: 60,
      expected: "高得点"
    },
    {
      name: "やや不正確な完全5度",
      baseFreq: 261.63,   // C4
      targetFreq: 392.00, // G4 (完全5度上)
      detectedFreq: 385.00, // 少しフラット
      responseTime: 1500,
      volume: 50,
      expected: "中程度の得点"
    },
    {
      name: "遅い反応での短2度",
      baseFreq: 293.66,   // D4
      targetFreq: 311.13, // D#4 (短2度上)
      detectedFreq: 315.00, // 少しシャープ
      responseTime: 4000,
      volume: 45,
      expected: "速度減点あり"
    },
    {
      name: "方向性間違い",
      baseFreq: 349.23,   // F4
      targetFreq: 293.66, // D4 (下行の短3度)
      detectedFreq: 415.30, // A4 (上行になってしまった)
      responseTime: 2200,
      volume: 65,
      expected: "方向性エラー"
    }
  ];
  
  // 結果表示用
  let currentTest = null;
  let testResults = [];
  let isRunning = false;
  let currentScenarioIndex = 0;
  
  // 統計表示用
  let engineStats = null;
  
  onMount(() => {
    initializeScoringEngine();
  });
  
  /**
   * 採点エンジンの初期化
   */
  function initializeScoringEngine() {
    try {
      scoringEngine = new EnhancedScoringEngine({
        weights: {
          pitchAccuracy: 0.40,
          recognitionSpeed: 0.20,
          intervalMastery: 0.20,
          directionAccuracy: 0.10,
          consistency: 0.10
        },
        speedThresholds: {
          excellent: 1000,
          good: 2000,
          fair: 3000,
          poor: 5000
        }
      });
      
      isInitialized = true;
      console.log('✅ EnhancedScoringEngine初期化完了');
    } catch (error) {
      console.error('❌ EnhancedScoringEngine初期化エラー:', error);
    }
  }
  
  /**
   * 単一テストシナリオの実行
   */
  async function runSingleTest(scenario) {
    if (!isInitialized) {
      console.error('採点エンジンが初期化されていません');
      return null;
    }
    
    try {
      console.log(`🧪 テスト実行: ${scenario.name}`);
      
      const result = await scoringEngine.analyzePerformance({
        baseFreq: scenario.baseFreq,
        targetFreq: scenario.targetFreq,
        detectedFreq: scenario.detectedFreq,
        responseTime: scenario.responseTime,
        volume: scenario.volume,
        harmonicCorrection: null // テスト用にnull
      });
      
      return {
        scenario: scenario.name,
        expected: scenario.expected,
        result: result,
        timestamp: new Date().toLocaleTimeString()
      };
      
    } catch (error) {
      console.error('❌ テスト実行エラー:', error);
      return {
        scenario: scenario.name,
        expected: scenario.expected,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };
    }
  }
  
  /**
   * 全テストシナリオの実行
   */
  async function runAllTests() {
    if (!isInitialized) {
      alert('採点エンジンが初期化されていません');
      return;
    }
    
    isRunning = true;
    testResults = [];
    currentTest = null;
    currentScenarioIndex = 0;
    
    for (let i = 0; i < testScenarios.length; i++) {
      currentScenarioIndex = i;
      currentTest = testScenarios[i];
      
      // 短い遅延を入れて視覚的な効果を作る
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await runSingleTest(testScenarios[i]);
      if (result) {
        testResults = [...testResults, result];
      }
    }
    
    isRunning = false;
    currentTest = null;
    
    // 統計情報の取得
    engineStats = scoringEngine.getStatistics();
    
    console.log('✅ 全テスト完了');
  }
  
  /**
   * エンジンのリセット
   */
  function resetEngine() {
    if (scoringEngine) {
      scoringEngine.reset();
      testResults = [];
      engineStats = null;
      console.log('🔄 エンジンリセット完了');
    }
  }
  
  /**
   * スコアの色分け
   */
  function getScoreColor(score) {
    if (score >= 90) return '#10b981'; // 緑
    if (score >= 80) return '#3b82f6'; // 青
    if (score >= 70) return '#f59e0b'; // 黄
    if (score >= 60) return '#f97316'; // オレンジ
    return '#ef4444'; // 赤
  }
  
  /**
   * 成績の色分け
   */
  function getGradeColor(grade) {
    if (['S', 'A+', 'A'].includes(grade)) return '#10b981';
    if (['B+', 'B'].includes(grade)) return '#3b82f6';
    if (['C+', 'C'].includes(grade)) return '#f59e0b';
    if (['D+', 'D'].includes(grade)) return '#f97316';
    return '#ef4444';
  }
</script>

<svelte:head>
  <title>Enhanced Scoring Engine - Test Page</title>
</svelte:head>

<!-- メインコンテナ -->
<div class="container">
  <header class="header">
    <h1>🎯 Enhanced Scoring Engine</h1>
    <p>統合採点エンジンのテストページ</p>
    <div class="status">
      <span class="status-indicator" class:ready={isInitialized} class:error={!isInitialized}></span>
      <span>{isInitialized ? '準備完了' : '初期化中...'}</span>
    </div>
  </header>

  <!-- コントロールパネル -->
  <section class="controls">
    <button 
      class="btn btn-primary" 
      on:click={runAllTests} 
      disabled={!isInitialized || isRunning}
    >
      {#if isRunning}
        🔄 テスト実行中...
      {:else}
        🧪 全テスト実行
      {/if}
    </button>
    
    <button 
      class="btn btn-secondary" 
      on:click={resetEngine} 
      disabled={!isInitialized || isRunning}
    >
      🔄 リセット
    </button>
  </section>

  <!-- 実行中表示 -->
  {#if isRunning && currentTest}
    <section class="current-test">
      <h3>📊 実行中: {currentTest.name}</h3>
      <div class="progress">
        <div class="progress-bar" style="width: {((currentScenarioIndex + 1) / testScenarios.length) * 100}%"></div>
      </div>
      <p>{currentScenarioIndex + 1} / {testScenarios.length}</p>
    </section>
  {/if}

  <!-- テスト結果表示 -->
  {#if testResults.length > 0}
    <section class="results">
      <h2>📋 テスト結果</h2>
      
      {#each testResults as testResult, index}
        <div class="result-card">
          <div class="result-header">
            <h3>{testResult.scenario}</h3>
            <span class="timestamp">{testResult.timestamp}</span>
          </div>
          
          {#if testResult.error}
            <div class="error">
              ❌ エラー: {testResult.error}
            </div>
          {:else}
            <div class="result-content">
              <!-- スコア表示 -->
              <div class="score-display">
                <div class="total-score">
                  <span 
                    class="score-value" 
                    style="color: {getScoreColor(testResult.result.score.total)}"
                  >
                    {testResult.result.score.total}
                  </span>
                  <span 
                    class="grade" 
                    style="color: {getGradeColor(testResult.result.score.grade)}"
                  >
                    {testResult.result.score.grade}
                  </span>
                </div>
                
                <!-- 成分スコア -->
                <div class="component-scores">
                  <div class="component">
                    <span class="label">音程精度:</span>
                    <span class="value">{testResult.result.score.components.pitchAccuracy}%</span>
                  </div>
                  <div class="component">
                    <span class="label">認識速度:</span>
                    <span class="value">{testResult.result.score.components.recognitionSpeed}%</span>
                  </div>
                  <div class="component">
                    <span class="label">音程習得度:</span>
                    <span class="value">{testResult.result.score.components.intervalMastery}%</span>
                  </div>
                  <div class="component">
                    <span class="label">方向性精度:</span>
                    <span class="value">{testResult.result.score.components.directionAccuracy}%</span>
                  </div>
                  <div class="component">
                    <span class="label">一貫性:</span>
                    <span class="value">{testResult.result.score.components.consistency}%</span>
                  </div>
                </div>
              </div>
              
              <!-- フィードバック -->
              <div class="feedback">
                <h4>💬 フィードバック</h4>
                <p class="primary-feedback">{testResult.result.feedback.primary}</p>
                
                {#if testResult.result.feedback.detailed}
                  <div class="detailed-feedback">
                    <div class="feedback-item">
                      <strong>音程:</strong> {testResult.result.feedback.detailed.interval}
                    </div>
                    <div class="feedback-item">
                      <strong>方向性:</strong> {testResult.result.feedback.detailed.direction}
                    </div>
                    <div class="feedback-item">
                      <strong>一貫性:</strong> {testResult.result.feedback.detailed.consistency}
                    </div>
                    <div class="feedback-item">
                      <strong>速度:</strong> {testResult.result.feedback.detailed.speed}
                    </div>
                  </div>
                {/if}
              </div>
              
              <!-- 期待値との比較 -->
              <div class="expectation">
                <strong>期待値:</strong> {testResult.expected}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </section>
  {/if}

  <!-- 統計情報 -->
  {#if engineStats}
    <section class="statistics">
      <h2>📊 エンジン統計</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>セッション情報</h3>
          <div class="stat-item">
            <span class="label">総試行回数:</span>
            <span class="value">{engineStats.session.totalAttempts}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均スコア:</span>
            <span class="value">{engineStats.session.overallScore.toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <span class="label">現在レベル:</span>
            <span class="value">{engineStats.session.currentLevel}</span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>パフォーマンス</h3>
          <div class="stat-item">
            <span class="label">平均速度:</span>
            <span class="value">{engineStats.performance.averageSpeed.toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <span class="label">精度トレンド:</span>
            <span class="value">{engineStats.performance.accuracyTrend}</span>
          </div>
          <div class="stat-item">
            <span class="label">セッション進捗:</span>
            <span class="value">{engineStats.performance.sessionProgress}%</span>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>分析器統計</h3>
          <div class="stat-item">
            <span class="label">音程分析:</span>
            <span class="value">{engineStats.analyzers.interval.totalAnalyses}回</span>
          </div>
          <div class="stat-item">
            <span class="label">方向性分析:</span>
            <span class="value">{engineStats.analyzers.direction.totalAnalyses}回</span>
          </div>
          <div class="stat-item">
            <span class="label">一貫性追跡:</span>
            <span class="value">{engineStats.analyzers.consistency.totalAttempts}回</span>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
  }
  
  .header h1 {
    margin: 0 0 10px 0;
    font-size: 2.5rem;
  }
  
  .header p {
    margin: 0 0 15px 0;
    opacity: 0.9;
  }
  
  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ef4444;
    transition: background 0.3s;
  }
  
  .status-indicator.ready {
    background: #10b981;
  }
  
  .controls {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 8px;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
    transform: translateY(-1px);
  }
  
  .current-test {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .current-test h3 {
    margin: 0 0 15px 0;
    color: #1e293b;
  }
  
  .progress {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.5s ease;
  }
  
  .results h2 {
    color: #1e293b;
    margin-bottom: 20px;
  }
  
  .result-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .result-header h3 {
    margin: 0;
    color: #1e293b;
  }
  
  .timestamp {
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .error {
    color: #ef4444;
    font-weight: 600;
    padding: 10px;
    background: #fef2f2;
    border-radius: 6px;
  }
  
  .result-content {
    display: grid;
    gap: 20px;
  }
  
  .score-display {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    align-items: start;
  }
  
  .total-score {
    text-align: center;
    padding: 15px;
    background: #f8fafc;
    border-radius: 8px;
  }
  
  .score-value {
    display: block;
    font-size: 2.5rem;
    font-weight: bold;
    line-height: 1;
  }
  
  .grade {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    margin-top: 5px;
  }
  
  .component-scores {
    display: grid;
    gap: 8px;
  }
  
  .component {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f1f5f9;
    border-radius: 6px;
  }
  
  .component .label {
    color: #475569;
    font-weight: 500;
  }
  
  .component .value {
    font-weight: 600;
    color: #1e293b;
  }
  
  .feedback {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 15px;
  }
  
  .feedback h4 {
    margin: 0 0 10px 0;
    color: #0c4a6e;
  }
  
  .primary-feedback {
    font-weight: 600;
    color: #0c4a6e;
    margin-bottom: 15px;
  }
  
  .detailed-feedback {
    display: grid;
    gap: 8px;
  }
  
  .feedback-item {
    font-size: 0.9rem;
    color: #374151;
  }
  
  .expectation {
    padding: 10px;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 6px;
    color: #92400e;
    font-size: 0.9rem;
  }
  
  .statistics {
    margin-top: 40px;
  }
  
  .statistics h2 {
    color: #1e293b;
    margin-bottom: 20px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .stat-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .stat-card h3 {
    margin: 0 0 15px 0;
    color: #1e293b;
    font-size: 1.1rem;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .stat-item .label {
    color: #64748b;
    font-weight: 500;
  }
  
  .stat-item .value {
    font-weight: 600;
    color: #1e293b;
  }
  
  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
    
    .header {
      padding: 15px;
    }
    
    .header h1 {
      font-size: 2rem;
    }
    
    .score-display {
      grid-template-columns: 1fr;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>