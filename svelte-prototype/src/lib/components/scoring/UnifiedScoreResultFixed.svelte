<script>
  import { Trophy, Crown, Star, Award, Target, TrendingUp, ThumbsUp, Frown, AlertCircle, Music, BarChart3, Flame, Timer, Piano } from 'lucide-svelte';
  import { fly, fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import SNSShareButtons from './SNSShareButtons.svelte';
  import SessionCarousel from './SessionCarousel.svelte';
  import RandomModeScoreResult from './RandomModeScoreResult.svelte';
  
  export let scoreData = null;
  export let showDetails = false;
  export let className = '';
  
  // 4段階評価の定義（個別セッション用、RandomModeScoreResultと統一）
  const sessionGradeDefinitions = {
    excellent: { name: '優秀', icon: Trophy, range: '±15¢以内', color: 'text-yellow-500', bgColor: '#fffbeb', borderColor: '#fbbf24' },
    good: { name: '良好', icon: Star, range: '±25¢以内', color: 'text-green-500', bgColor: '#ecfdf5', borderColor: '#10b981' },
    pass: { name: '合格', icon: ThumbsUp, range: '±40¢以内', color: 'text-blue-500', bgColor: '#eff6ff', borderColor: '#3b82f6' },
    needWork: { name: '要練習', icon: Frown, range: '±41¢以上', color: 'text-red-500', bgColor: '#fef2f2', borderColor: '#ef4444' },
    notMeasured: { name: '測定不可', icon: AlertCircle, range: '音声未検出', color: 'text-gray-500', bgColor: '#f9fafb', borderColor: '#9ca3af' }
  };
  
  // S-E級統合評価システム（8セッション完走時用）
  const unifiedGradeDefinitions = {
    S: { 
      name: 'S級マスター', 
      icon: Trophy, 
      color: 'text-purple-500',
      bgColor: '#faf5ff',
      borderColor: '#8b5cf6',
      description: '完璧な演奏です！'
    },
    A: { 
      name: 'A級エキスパート', 
      icon: Crown, 
      color: 'text-yellow-500',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
      description: '素晴らしい精度です！'
    },
    B: { 
      name: 'B級プロフィシエント', 
      icon: Star, 
      color: 'text-green-500',
      bgColor: '#ecfdf5',
      borderColor: '#10b981',
      description: '良い調子です！'
    },
    C: { 
      name: 'C級アドバンス', 
      icon: Award, 
      color: 'text-blue-500',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
      description: '着実に上達しています'
    },
    D: { 
      name: 'D級ビギナー', 
      icon: Target, 
      color: 'text-orange-500',
      bgColor: '#fff7ed',
      borderColor: '#f97316',
      description: '練習を続けましょう'
    },
    E: { 
      name: 'E級スターター', 
      icon: TrendingUp, 
      color: 'text-red-500',
      bgColor: '#fef2f2',
      borderColor: '#ef4444',
      description: '基礎から頑張りましょう'
    }
  };
  
  // アニメーション用
  const iconScale = tweened(0, { duration: 600, easing: cubicOut });
  const bgOpacity = tweened(0, { duration: 300, easing: cubicOut });
  
  // カルーセル用
  let currentSessionIndex = 0;
  
  // セッション総合評価計算（8音の結果から4段階評価を算出）
  function calculateSessionGrade(sessionData) {
    if (!sessionData || !sessionData.noteResults) return 'needWork';
    
    const noteResults = sessionData.noteResults;
    const results = noteResults.reduce((acc, note) => {
      const grade = calculateNoteGrade(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== 'notMeasured') {
        acc.totalError += Math.abs(note.cents);
        acc.measuredCount += 1;
      }
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });
    
    const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;
    const passCount = results.excellent + results.good + results.pass;
    
    // RandomModeScoreResultと同じ判定ロジック
    if (results.notMeasured > 3) return 'needWork';
    if (results.needWork > 2) return 'needWork';
    if (results.measuredCount === 0) return 'needWork';
    if (averageError <= 20 && results.excellent >= 6) return 'excellent';
    if (averageError <= 30 && passCount >= 7) return 'good';
    if (passCount >= 5) return 'pass';
    return 'needWork';
  }
  
  // 音程評価計算（RandomModeScoreResultと統一）
  function calculateNoteGrade(cents) {
    if (cents === null || cents === undefined || isNaN(cents)) {
      return 'notMeasured';
    }
    const absCents = Math.abs(cents);
    if (absCents <= 15) return 'excellent';
    if (absCents <= 25) return 'good';
    if (absCents <= 40) return 'pass';
    return 'needWork';
  }
  
  // 時間フォーマット
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // セッション履歴からS-E級統合評価を算出
  $: unifiedGrade = (() => {
    if (!scoreData?.sessionHistory || scoreData.sessionHistory.length === 0) return 'E';
    
    const sessionGrades = scoreData.sessionHistory.map(session => session.grade);
    const excellentCount = sessionGrades.filter(g => g === 'excellent').length;
    const goodCount = sessionGrades.filter(g => g === 'good').length;
    const passCount = sessionGrades.filter(g => g === 'pass').length;
    const totalGoodSessions = excellentCount + goodCount + passCount;
    
    // 統合評価の計算（S-E級システム）
    const totalSessions = scoreData.sessionHistory.length;
    const excellentRatio = excellentCount / totalSessions;
    const goodRatio = totalGoodSessions / totalSessions;
    
    if (excellentRatio >= 0.9 && goodRatio >= 0.95) return 'S';
    if (excellentRatio >= 0.7 && goodRatio >= 0.85) return 'A';
    if (excellentRatio >= 0.5 && goodRatio >= 0.75) return 'B';
    if (goodRatio >= 0.65) return 'C';
    if (goodRatio >= 0.50) return 'D';
    return 'E';
  })();
  
  // 8セッション完走判定
  $: isCompleted = scoreData?.sessionHistory && scoreData.sessionHistory.length >= (scoreData.mode === 'chromatic' ? 12 : 8);
  
  $: gradeDef = isCompleted ? unifiedGradeDefinitions[unifiedGrade] : sessionGradeDefinitions[scoreData?.sessionHistory?.[scoreData.sessionHistory.length - 1]?.grade || 'needWork'];
  
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
  <!-- 総合評価表示（8セッション完走時のみ） -->
  {#if isCompleted}
    <div class="grade-display" 
         style="background-color: {gradeDef.bgColor}; border-color: {gradeDef.borderColor}; opacity: {$bgOpacity}">
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
        {gradeDef.description} - {scoreData?.sessionHistory?.length || 0}セッション完走おめでとうございます！
      </p>
    </div>
  {/if}
  
  <!-- モード別サマリー -->
  <div class="mode-summary" in:fly={{ y: 20, duration: 500, delay: 800 }}>
    {#if scoreData?.mode === 'random'}
      <!-- ランダムモードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Music class="w-4 h-4 text-gray-600" />
          <span>ランダム基音トレーニング</span>
        </div>
        <div class="stat-row">
          <BarChart3 class="w-4 h-4 text-gray-600" />
          <span>平均精度: {scoreData.averageAccuracy || 0}%</span>
        </div>
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              🎵 セッション履歴 ({scoreData.sessionHistory.length}/{scoreData.mode === 'chromatic' ? 12 : 8})
            </div>
            <div class="session-bars compact">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => currentSessionIndex = index}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array((scoreData.mode === 'chromatic' ? 12 : 8) - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              bind:currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
            >
              <div slot="default" let:session let:index>
                <div class="carousel-session-header">
                  <h3 class="carousel-session-title">
                    セッション{index + 1} - 基音: {session.baseNote}
                  </h3>
                  <div class="carousel-session-grade grade-{session.grade}">
                    <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="20" />
                    <span>{sessionGradeDefinitions[session.grade]?.name || '不明'}</span>
                  </div>
                </div>
                
                <!-- 8音階詳細表示 -->
                {#if session.noteResults}
                  <RandomModeScoreResult 
                    scoreData={{
                      baseNote: session.baseNote,
                      baseFrequency: session.baseFrequency,
                      noteResults: session.noteResults,
                      measuredNotes: session.measuredNotes,
                      totalNotes: 8,
                      overallGrade: session.grade,
                      timestamp: session.timestamp
                    }}
                    showDetails={true}
                    className="carousel-score-result"
                  />
                {:else}
                  <div class="no-details">
                    詳細データがありません
                  </div>
                {/if}
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
      
    {:else if scoreData?.mode === 'continuous'}
      <!-- 連続モードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Flame class="w-4 h-4 text-orange-500" />
          <span>連続チャレンジモード</span>
        </div>
        <div class="stat-row">
          <Timer class="w-4 h-4 text-blue-500" />
          <span>継続時間: {formatDuration(scoreData.duration || 0)}</span>
        </div>
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              ⏱️ セッション履歴 ({scoreData.sessionHistory.length}/{scoreData.mode === 'chromatic' ? 12 : 8})
            </div>
            <div class="session-bars compact">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => currentSessionIndex = index}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array((scoreData.mode === 'chromatic' ? 12 : 8) - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              bind:currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
            >
              <div slot="default" let:session let:index>
                <div class="carousel-session-header">
                  <h3 class="carousel-session-title">
                    セッション{index + 1} - 基音: {session.baseNote}
                  </h3>
                  <div class="carousel-session-grade grade-{session.grade}">
                    <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="20" />
                    <span>{sessionGradeDefinitions[session.grade]?.name || '不明'}</span>
                  </div>
                </div>
                
                <!-- 連続モード用の詳細表示（将来実装） -->
                <div class="no-details">
                  連続モードの詳細表示は準備中です
                </div>
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
      
    {:else if scoreData?.mode === 'chromatic'}
      <!-- 12音階モードサマリー -->
      <div class="summary-section">
        <div class="stat-row">
          <Piano class="w-4 h-4 text-purple-600" />
          <span>12音階マスターモード</span>
        </div>
        
        <!-- セッション履歴バー（コンパクト版） -->
        {#if scoreData.sessionHistory && scoreData.sessionHistory.length > 0}
          <div class="session-history-section compact">
            <div class="session-title">
              🎹 セッション履歴 ({scoreData.sessionHistory.length}/12)
            </div>
            <div class="session-bars compact chromatic-mode">
              {#each scoreData.sessionHistory as session, index}
                <button 
                  class="session-bar-button grade-{session.grade}"
                  class:active={index === currentSessionIndex}
                  on:click={() => currentSessionIndex = index}
                  title="セッション{index + 1}: {sessionGradeDefinitions[session.grade]?.name} (精度{session.accuracy}%)">
                  <span class="session-number">{index + 1}</span>
                  <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="14" />
                </button>
              {/each}
              <!-- 未完了セッション表示 -->
              {#each Array(12 - scoreData.sessionHistory.length) as _, index}
                <div class="session-bar-button empty">
                  <span class="session-number">{scoreData.sessionHistory.length + index + 1}</span>
                  <span class="empty-icon">-</span>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- セッションカルーセル -->
          <div class="carousel-wrapper">
            <SessionCarousel 
              bind:currentIndex={currentSessionIndex}
              sessionHistory={scoreData.sessionHistory}
              className="session-detail-carousel"
            >
              <div slot="default" let:session let:index>
                <div class="carousel-session-header">
                  <h3 class="carousel-session-title">
                    セッション{index + 1} - 半音階: {session.chromaticNote}
                  </h3>
                  <div class="carousel-session-grade grade-{session.grade}">
                    <svelte:component this={sessionGradeDefinitions[session.grade]?.icon || AlertCircle} size="20" />
                    <span>{sessionGradeDefinitions[session.grade]?.name || '不明'}</span>
                  </div>
                </div>
                
                <!-- 12音階モード用の詳細表示（将来実装） -->
                <div class="no-details">
                  12音階モードの詳細表示は準備中です
                </div>
              </div>
            </SessionCarousel>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- 共通統計 -->
    {#if scoreData}
      <div class="common-stats">
        <div class="stat-item">
          <span class="stat-label">測定率</span>
          <span class="stat-value">
            {Math.round((scoreData.measuredNotes / scoreData.totalNotes) * 100) || 0}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">総合精度</span>
          <span class="stat-value">{scoreData.averageAccuracy || 0}%</span>
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
  
  .session-history-section.compact {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
  }
  
  .session-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.25rem;
    text-align: left;
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
  
  .session-bars.compact {
    padding: 0.5rem;
    gap: 4px;
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
  
  
  .completion-message {
    text-align: center;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #059669;
    font-weight: 500;
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
  
  /* セッションバーボタン */
  .session-bar-button {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid;
    cursor: pointer;
    padding: 0;
    background: white;
    font-size: 0.7rem;
  }
  
  .session-bar-button:hover:not(.empty) {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .session-bar-button.active {
    box-shadow: 0 0 0 2px #3b82f6;
  }
  
  .session-bar-button.empty {
    border-color: #e5e7eb;
    background: #f9fafb;
    cursor: default;
    color: #d1d5db;
  }
  
  .session-bar-button .session-number {
    font-size: 0.6rem;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .session-bar-button .empty-icon {
    font-size: 0.875rem;
    color: #d1d5db;
  }
  
  /* 4段階評価別色分け（コンパクト版） */
  .session-bar-button.grade-excellent {
    background: #fffbeb;
    border-color: #fbbf24;
    color: #f59e0b;
  }
  
  .session-bar-button.grade-good {
    background: #ecfdf5;
    border-color: #10b981;
    color: #059669;
  }
  
  .session-bar-button.grade-pass {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
  }
  
  .session-bar-button.grade-needWork {
    background: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
  }
  
  .session-bar-button.grade-notMeasured {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #6b7280;
  }
  
  /* カルーセルラッパー */
  .carousel-wrapper {
    margin-top: 1rem;
  }
  
  .carousel-session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .carousel-session-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .carousel-session-grade {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .carousel-session-grade.grade-excellent {
    background: #fffbeb;
    color: #f59e0b;
  }
  
  .carousel-session-grade.grade-good {
    background: #ecfdf5;
    color: #059669;
  }
  
  .carousel-session-grade.grade-pass {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .carousel-session-grade.grade-needWork {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .carousel-score-result {
    margin-top: 0;
  }
  
  .no-details {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
    font-size: 0.875rem;
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
    
    .session-bar {
      min-width: 70px;
      height: 70px;
    }
  }
</style>