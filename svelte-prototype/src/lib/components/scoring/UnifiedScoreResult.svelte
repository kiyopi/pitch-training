<script>
  import { Trophy, Crown, Star, Award, Target, TrendingUp, Music, BarChart3, Flame, Timer, Piano } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import SNSShareButtons from './SNSShareButtons.svelte';
  
  export let scoreData = null;
  export let showDetails = false;
  export let className = '';
  
  // グレード定義（S〜E級）
  const gradeDefinitions = {
    S: { 
      name: 'S級マスター', 
      icon: Trophy, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: '完璧な演奏です！'
    },
    A: { 
      name: 'A級エキスパート', 
      icon: Crown, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: '素晴らしい精度です！'
    },
    B: { 
      name: 'B級プロフィシエント', 
      icon: Star, 
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: '良い調子です！'
    },
    C: { 
      name: 'C級アドバンス', 
      icon: Award, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: '着実に上達しています'
    },
    D: { 
      name: 'D級ビギナー', 
      icon: Target, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: '練習を続けましょう'
    },
    E: { 
      name: 'E級スターター', 
      icon: TrendingUp, 
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: '基礎から頑張りましょう'
    }
  };
  
  // アニメーション用
  const iconScale = tweened(0, { duration: 600, easing: cubicOut });
  const bgOpacity = tweened(0, { duration: 300, easing: cubicOut });
  
  // グレード計算関数
  function calculateOverallGrade(data) {
    if (!data) return 'E';
    
    switch(data.mode) {
      case 'random':
        return calculateRandomGrade(data);
      case 'continuous':
        return calculateContinuousGrade(data);
      case 'chromatic':
        return calculateChromaticGrade(data);
      default:
        return 'E';
    }
  }
  
  // ランダムモードのグレード計算
  function calculateRandomGrade(data) {
    const weights = {
      accuracy: 0.4,
      consistency: 0.3,
      difficulty: 0.2,
      completion: 0.1
    };
    
    // 精度スコア
    const accuracyScore = data.averageAccuracy / 100;
    
    // 一貫性スコア（標準偏差から計算）
    const consistencyScore = calculateConsistencyScore(data.noteResults);
    
    // 難易度スコア（基音による）
    const difficultyScore = calculateDifficultyScore(data.baseNote);
    
    // 完成度スコア
    const completionScore = data.measuredNotes / data.totalNotes;
    
    const totalScore = 
      accuracyScore * weights.accuracy +
      consistencyScore * weights.consistency +
      difficultyScore * weights.difficulty +
      completionScore * weights.completion;
    
    return scoreToGrade(totalScore);
  }
  
  // 連続モードのグレード計算
  function calculateContinuousGrade(data) {
    const weights = {
      streak: 0.5,
      accuracy: 0.3,
      endurance: 0.2
    };
    
    const maxStreak = data.overallStats?.maxStreak || 0;
    const streakScore = Math.min(maxStreak / 20, 1);
    const accuracyScore = data.averageAccuracy / 100;
    const enduranceScore = Math.min(data.duration / 300, 1);
    
    const totalScore = 
      streakScore * weights.streak +
      accuracyScore * weights.accuracy +
      enduranceScore * weights.endurance;
    
    return scoreToGrade(totalScore);
  }
  
  // 12音階モードのグレード計算
  function calculateChromaticGrade(data) {
    const weights = {
      accuracy: 0.3,
      semitones: 0.4,
      coverage: 0.3
    };
    
    const accuracyScore = data.averageAccuracy / 100;
    // overallChromaticAccuracy を使用するように修正
    const chromaticResults = data.overallChromaticAccuracy || {};
    const avgChromaticScore = Object.keys(chromaticResults).length > 0 
      ? Object.values(chromaticResults).reduce((sum, val) => sum + val, 0) / Object.keys(chromaticResults).length / 100
      : 0;
    const coverageScore = data.measuredNotes / 12;
    
    const totalScore = 
      accuracyScore * weights.accuracy +
      avgChromaticScore * weights.semitones +
      coverageScore * weights.coverage;
    
    return scoreToGrade(totalScore);
  }
  
  // 一貫性スコア計算
  function calculateConsistencyScore(noteResults) {
    if (!noteResults || noteResults.length === 0) return 0;
    
    const accuracies = noteResults
      .filter(n => n.cents !== null)
      .map(n => Math.abs(n.cents));
    
    if (accuracies.length === 0) return 0;
    
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);
    
    // 標準偏差が小さいほど高スコア
    return Math.max(0, 1 - (stdDev / 50));
  }
  
  // 難易度スコア計算
  function calculateDifficultyScore(baseNote) {
    const difficultyMap = {
      'C': 0.7, 'D': 0.8, 'E': 0.9, 'F': 0.8,
      'G': 0.7, 'A': 0.8, 'B': 0.9,
      'C#': 1.0, 'D#': 1.0, 'F#': 1.0, 'G#': 1.0, 'A#': 1.0
    };
    
    const noteOnly = baseNote.replace(/[0-9]/g, '');
    return difficultyMap[noteOnly] || 0.8;
  }
  
  // スコアからグレードへの変換
  function scoreToGrade(score) {
    if (score >= 0.95) return 'S';
    if (score >= 0.85) return 'A';
    if (score >= 0.75) return 'B';
    if (score >= 0.65) return 'C';
    if (score >= 0.50) return 'D';
    return 'E';
  }
  
  // 時間フォーマット
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  $: overallGrade = calculateOverallGrade(scoreData);
  $: gradeDef = gradeDefinitions[overallGrade];
  
  onMount(() => {
    // アニメーション開始
    bgOpacity.set(1);
    setTimeout(() => {
      iconScale.set(1.2);
      setTimeout(() => {
        iconScale.set(1);
      }, 200);
    }, 100);
  });
</script>

<div class="unified-score-result {className}">
  <!-- 総合評価表示 -->
  <div class="grade-display {gradeDef.bgColor} {gradeDef.borderColor}"
       style="opacity: {$bgOpacity}">
    <div class="grade-icon-wrapper">
      <svelte:component 
        this={gradeDef.icon} 
        size="80"
        class="grade-icon {gradeDef.color}"
        style="transform: scale({$iconScale})"
      />
    </div>
    
    <h2 class="grade-name {gradeDef.color}" in:fade={{ delay: 400 }}>
      {gradeDef.name}
    </h2>
    
    <p class="grade-description" in:fade={{ delay: 600 }}>
      {gradeDef.description}
    </p>
  </div>
  
  <!-- モード別サマリー -->
  <div class="mode-summary" in:fly={{ y: 20, duration: 500, delay: 800 }}>
    {#if scoreData?.mode === 'random'}
      <!-- ランダムモードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Music class="w-4 h-4 text-gray-600" />
          <span>基音: {scoreData.baseNote} ({scoreData.baseFrequency}Hz)</span>
        </div>
        <div class="stat-row">
          <BarChart3 class="w-4 h-4 text-gray-600" />
          <span>平均精度: {scoreData.averageAccuracy}%</span>
        </div>
        
        <!-- セッション履歴表示 -->
        <div class="session-history-section">
          <div class="session-title">
            {#if scoreData.mode === 'random'}
              🎵 ランダム基音トレーニング完走履歴
            {:else if scoreData.mode === 'continuous'}
              ⏱️ 連続チャレンジモード完走履歴
            {:else if scoreData.mode === 'chromatic'}
              🎹 12音階マスターモード完走履歴
            {/if}
          </div>
          <div class="session-bars">
            {#if scoreData.sessionHistory}
              {#each scoreData.sessionHistory as session, index}
                <div class="session-bar completed grade-{session.grade.toLowerCase()}"
                     title="セッション{index + 1}: {session.grade}級 (精度{session.accuracy}%)">
                  <div class="session-number">{index + 1}</div>
                  <div class="session-grade">{session.grade}</div>
                  {#if scoreData.mode === 'random' || scoreData.mode === 'continuous'}
                    <div class="session-detail">{session.baseNote || 'N/A'}</div>
                  {:else if scoreData.mode === 'chromatic'}
                    <div class="session-detail">{session.chromaticNote || 'N/A'}</div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
          <div class="completion-message">
            🎉 {scoreData.sessionHistory?.length || 0}セッション完走おめでとうございます！
          </div>
        </div>
      </div>
      
    {:else if scoreData?.mode === 'continuous'}
      <!-- 連続モードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Flame class="w-4 h-4 text-orange-500" />
          <span>最高ストリーク: {scoreData.overallStats?.maxStreak || 0}連続</span>
        </div>
        <div class="stat-row">
          <Timer class="w-4 h-4 text-blue-500" />
          <span>継続時間: {formatDuration(scoreData.duration)}</span>
        </div>
        
        <!-- セッション履歴表示 -->
        <div class="session-history-section">
          <div class="session-title">
            ⏱️ 連続チャレンジモード完走履歴
          </div>
          <div class="session-bars">
            {#if scoreData.sessionHistory}
              {#each scoreData.sessionHistory as session, index}
                <div class="session-bar completed grade-{session.grade.toLowerCase()}"
                     title="セッション{index + 1}: {session.grade}級 (精度{session.accuracy}%)">
                  <div class="session-number">{index + 1}</div>
                  <div class="session-grade">{session.grade}</div>
                  <div class="session-detail">{session.baseNote || 'N/A'}</div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="completion-message">
            🎉 {scoreData.sessionHistory?.length || 0}セッション完走おめでとうございます！
          </div>
        </div>
      </div>
      
    {:else if scoreData?.mode === 'chromatic'}
      <!-- 12音階モードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Piano class="w-4 h-4 text-purple-600" />
          <span>半音精度: {scoreData.overallChromaticAccuracy || 0}%</span>
        </div>
        
        <!-- セッション履歴表示 -->
        <div class="session-history-section">
          <div class="session-title">
            🎹 12音階マスターモード完走履歴
          </div>
          <div class="session-bars chromatic-mode">
            {#if scoreData.sessionHistory}
              {#each scoreData.sessionHistory as session, index}
                <div class="session-bar completed grade-{session.grade.toLowerCase()}"
                     title="セッション{index + 1}: {session.grade}級 (精度{session.accuracy}%)">
                  <div class="session-number">{index + 1}</div>
                  <div class="session-grade">{session.grade}</div>
                  <div class="session-detail">{session.chromaticNote || 'N/A'}</div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="completion-message">
            🎉 {scoreData.sessionHistory?.length || 0}セッション完走おめでとうございます！
          </div>
        </div>
      </div>
    {/if}
    
    <!-- 共通統計 -->
    {#if scoreData}
      <div class="common-stats">
        <div class="stat-item">
          <span class="stat-label">測定率</span>
          <span class="stat-value">
            {Math.round((scoreData.measuredNotes / scoreData.totalNotes) * 100)}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">総合精度</span>
          <span class="stat-value">{scoreData.averageAccuracy}%</span>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- SNS共有ボタン -->
  {#if scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData.mode === 'chromatic' ? 12 : 8)}
    <SNSShareButtons {scoreData} />
  {/if}
  
  <!-- 詳細表示トグル -->
  {#if showDetails}
    <button class="details-toggle" on:click={() => showDetails = !showDetails}>
      詳細を表示
    </button>
  {/if}
</div>

<style>
  .unified-score-result {
    padding: 1.5rem;
  }
  
  .grade-display {
    text-align: center;
    padding: 2rem;
    border-radius: 12px;
    border: 2px solid;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }
  
  .grade-icon-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .grade-icon {
    transition: transform 0.3s ease;
  }
  
  .grade-name {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .grade-description {
    font-size: 1rem;
    color: #6b7280;
  }
  
  .mode-summary {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .summary-section {
    margin-bottom: 1rem;
  }
  
  .stat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
  }
  
  .session-history-section {
    margin-top: 1rem;
  }
  
  .session-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  .session-bars {
    display: flex;
    gap: 6px;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .session-bars.chromatic-mode {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
  }
  
  @media (max-width: 640px) {
    .session-bars.chromatic-mode {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .session-bar {
    flex: 1;
    min-width: 80px;
    height: 60px;
    border-radius: 6px;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 2px solid transparent;
    cursor: pointer;
  }
  
  .session-bar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .session-number {
    font-size: 0.7rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 2px;
  }
  
  .session-grade {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .session-detail {
    font-size: 0.6rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 1px;
  }
  
  .completion-message {
    text-align: center;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #059669;
    font-weight: 500;
  }
  
  /* グレード別色クラス */
  .session-bar.grade-s {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-color: #7c3aed;
  }
  
  .session-bar.grade-a {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    border-color: #d97706;
  }
  
  .session-bar.grade-b {
    background: linear-gradient(135deg, #10b981, #34d399);
    border-color: #059669;
  }
  
  .session-bar.grade-c {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
    border-color: #2563eb;
  }
  
  .session-bar.grade-d {
    background: linear-gradient(135deg, #f97316, #fb923c);
    border-color: #ea580c;
  }
  
  .session-bar.grade-e {
    background: linear-gradient(135deg, #ef4444, #f87171);
    border-color: #dc2626;
  }
  
  .note-indicator.excellent { background: #fbbf24; }
  .note-indicator.good { background: #10b981; }
  .note-indicator.pass { background: #3b82f6; }
  .note-indicator.needWork { background: #ef4444; }
  .note-indicator.notMeasured { 
    background: #e5e7eb; 
  }
  
  .note-indicator.notMeasured .note-name {
    color: #6b7280;
    text-shadow: none;
  }
  
  .common-stats {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .details-toggle {
    width: 100%;
    padding: 0.75rem;
    margin-top: 1rem;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .details-toggle:hover {
    background: #e5e7eb;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .unified-score-result {
      padding: 1rem;
    }
    
    .grade-display {
      padding: 1.5rem;
    }
    
    .grade-icon {
      font-size: 60px !important;
    }
    
    .grade-name {
      font-size: 1.5rem;
    }
    
    .common-stats {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>