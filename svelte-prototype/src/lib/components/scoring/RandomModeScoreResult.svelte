<script>
  import { Trophy, Star, ThumbsUp, Frown, AlertCircle, Music, Meh, Mic, 
           AlertTriangle, Lightbulb, Flame, Sprout, Info, ChevronDown, ChevronUp, HelpCircle, Medal, BookOpenCheck } from 'lucide-svelte';
  import { fly, fade, slide } from 'svelte/transition';
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  import { EvaluationEngine } from '$lib/evaluation/EvaluationEngine';
  import { GradeDefinitions } from '$lib/evaluation/GradeDefinitions';
  
  export let noteResults = [];
  export let className = '';
  export let sessionIndex = null; // セッション番号（0ベース）
  export let baseNote = null; // 基音名
  
  // データ準備完了チェック
  $: isDataReady = noteResults && noteResults.length > 0 && noteResults.some(note => note.name);
  
  let showDetails = false;
  let showFrequencyDetails = {};
  
  // ポップオーバー管理
  
  // 統一評価定義を使用
  const gradeDefinitions = GradeDefinitions.getAllNoteGrades();
  const sessionGradeDefinitions = GradeDefinitions.getAllSessionGrades();
  
  // スコア計算（アニメーションなし）
  let displayScore = 0;

  
  // 評価を計算（EvaluationEngineを使用）
  function calculateGrade(cents) {
    return EvaluationEngine.evaluateNote(cents);
  }
  
  // ポップオーバー制御関数
  function toggleSessionHelp() {
    console.log('[RandomModeScoreResult] toggleSessionHelp clicked, dispatching event');
    dispatch('show-session-help');
  }
  
  
  // 結果の集計
  $: if (noteResults.length > 0) {
    console.log('🔍 Phase1: データ構造確認', noteResults[0]);
    console.log('🔍 Phase1: 利用可能プロパティ', Object.keys(noteResults[0]));
    noteResults.forEach((note, i) => {
      console.log(`🔍 Phase1: Note ${i}:`, {
        name: note.name,
        detectedFreq: note.detectedFreq,
        adjustedFrequency: note.adjustedFrequency,
        detectedFrequency: note.detectedFrequency
      });
    });
  }
  
  $: results = noteResults.reduce((acc, note) => {
    const grade = calculateGrade(note.cents);
    acc[grade] = (acc[grade] || 0) + 1;
    // 測定できなかった場合はエラー計算から除外
    if (grade !== 'notMeasured') {
      acc.totalError += Math.abs(note.cents);
      acc.measuredCount += 1;
    }
    return acc;
  }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });
  
  $: averageError = results.measuredCount > 0 ? Math.round(results.totalError / results.measuredCount) : 0;
  $: passCount = results.excellent + results.good + results.pass;
  $: outliers = noteResults.filter(n => calculateGrade(n.cents) !== 'notMeasured' && Math.abs(n.cents) > 50);
  $: needWorkNotes = noteResults.filter(n => calculateGrade(n.cents) === 'needWork').map(n => n.name);
  
  // 総合グレード判定（EvaluationEngineを使用）
  $: overallGrade = EvaluationEngine.evaluateSession(noteResults);
  
  // ペナルティ計算
  $: penalty = outliers.reduce((sum, note) => {
    const severity = Math.abs(note.cents) > 100 ? 16 : 8;
    return sum + severity;
  }, 0);
  
  // スコア計算実行
  $: if (noteResults.length > 0) {
    const baseScore = Math.max(0, 100 - Math.round(averageError / 10));
    // 技術的ブレ検証中のためペナルティを一時的に除外
    displayScore = baseScore; // - penalty
  }
</script>

<div class="random-mode-score-result {className}">
  
  <!-- データ準備待ち表示 -->
  {#if !isDataReady}
    <div class="carousel-navigation-only">
      <div class="session-info">
        {#if sessionIndex !== null && baseNote}
          <h3>セッション{sessionIndex + 1} - 基音: {baseNote}</h3>
        {:else}
          <h3>セッションデータ</h3>
        {/if}
        <p>カルーセルの移動ボタンで他のセッションを確認できます</p>
      </div>
    </div>
  {:else}
  
  <!-- 総合評価セクション -->
  <div class="overall-score-section">
    <div class="grade-display-enhanced" in:fly={{ y: -20, duration: 500 }}>
      <!-- シンプルアイコン（アニメーション完全削除） -->
      <div class="simple-grade-icon">
        <svelte:component 
          this={sessionGradeDefinitions[overallGrade]?.icon || sessionGradeDefinitions.needWork.icon} 
          size="120"
          class="grade-icon-simple" 
          style="color: {sessionGradeDefinitions[overallGrade]?.colorValue || sessionGradeDefinitions.needWork.colorValue};"
        />
      </div>
      
      <div class="grade-title-with-help">
        <h2 class="grade-title {sessionGradeDefinitions[overallGrade]?.color || sessionGradeDefinitions.needWork.color}">
          {sessionGradeDefinitions[overallGrade]?.name || sessionGradeDefinitions.needWork.name}
        </h2>
        <button 
          class="session-help-icon-button" 
          on:click|stopPropagation={toggleSessionHelp}
          aria-label="セッション判定基準を表示"
        >
          <HelpCircle 
            size="16" 
            style="color: #6b7280;" 
          />
        </button>
      </div>
      
      <!-- セッション判定基準ポップオーバー - カルーセル制約回避のため外部レンダリング -->
      <!-- セッション判定基準ヘルプ - 親コンポーネントで管理 -->
      
      <p class="grade-subtitle">
        {#if sessionIndex !== null && baseNote}
          セッション{sessionIndex + 1} - 基音: {baseNote}　平均誤差: {averageError}¢
        {:else}
          平均誤差: {averageError}¢
        {/if}
      </p>
      <!-- 技術的ブレ検証中のため一時的に非表示
      {#if penalty > 0}
        <p class="penalty-notice" transition:fade>
          外れ値ペナルティ: -{penalty}点
        </p>
      {/if}
      -->
    </div>
  </div>
  
  <!-- 評価分布セクション -->
  <div class="rating-distribution" in:fly={{ y: 20, duration: 500, delay: 200 }}>
    <h3 class="section-title">評価分布</h3>
    
    
    <div class="distribution-bars">
      {#each Object.entries(gradeDefinitions) as [key, def], i}
        {@const count = results[key] || 0}
        {@const percentage = (count / 8) * 100}
        <div class="distribution-row" in:fly={{ y: 10, duration: 300, delay: i * 100 }}>
          <div class="grade-label">
            <svelte:component this={def.icon} class="w-5 h-5 {def.color}" />
            <span>{def.name}</span>
          </div>
          
          <div class="bar-container" style="background: #f3f4f6 !important;">
            <div class="distribution-bar {key === 'needWork' && count > 0 ? 'warning' : ''}" 
                 style="width: {Math.max((count / 8) * 100, count > 0 ? 8 : 0)}%; background-color: {key === 'excellent' ? '#fbbf24' : 
                                                                       key === 'good' ? '#34d399' : 
                                                                       key === 'pass' ? '#60a5fa' : 
                                                                       key === 'needWork' ? '#f87171' : 
                                                                       key === 'notMeasured' ? '#9ca3af' : '#9ca3af'} !important;">
            </div>
          </div>
          
          <div class="count-display">
            <span class="count">{count}/8</span>
            {#if key === 'needWork' && count > 0}
              <AlertCircle class="w-4 h-4 text-red-500 animate-pulse" />
            {/if}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- サマリー -->
    <div class="distribution-summary">
      {#if results.notMeasured > 0}
        <div class="summary-item warning">
          <AlertCircle class="w-5 h-5" />
          <span>{results.notMeasured}音が測定できませんでした</span>
        </div>
      {/if}
      {#if results.needWork > 0}
        <div class="summary-item warning">
          <AlertCircle class="w-5 h-5" />
          <span>{results.needWork}音が要改善です</span>
        </div>
      {:else if results.excellent >= 6}
        <div class="summary-item excellent">
          <Trophy class="w-5 h-5" />
          <span>素晴らしい！ほとんどの音が完璧です</span>
        </div>
      {:else}
        <div class="summary-item good">
          <Star class="w-5 h-5" />
          <span>良い調子です！</span>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- 8音階の詳細 -->
  <div class="note-details">
    <h3 class="section-title">
      <Music class="w-5 h-5" />
      各音程の詳細結果
    </h3>
    
    {#each noteResults as note, i}
      {@const grade = calculateGrade(note.cents)}
      {@const isOutlier = Math.abs(note.cents) > 50}
      <div class="note-result {grade}" 
           in:fly={{ x: -20, duration: 300, delay: 300 + i * 50 }}>
        
        <!-- シンプル統合ヘッダー（色分けのみ） -->
        <div class="simple-header {grade}">
          {#if grade === 'notMeasured'}
            <div class="simple-info">
              <svelte:component 
                this={gradeDefinitions[grade].icon} 
                class="w-4 h-4 {gradeDefinitions[grade].color}" 
              />
              <span class="note-name-simple">{note.name}</span>
              <span class="detection-failed">測定できませんでした</span>
            </div>
          {:else}
            <div class="simple-info">
              <svelte:component 
                this={gradeDefinitions[grade].icon} 
                class="w-4 h-4 {gradeDefinitions[grade].color}" 
              />
              <span class="note-name-simple">{note.name}（{note.targetFreq}Hz）</span>
              <span class="detection-result">あなた: {note.detectedFreq || note.adjustedFrequency || note.detectedFrequency || 'データなし'}Hz ({note.diff > 0 ? '+' : ''}{note.diff}Hz) {note.cents > 0 ? '+' : ''}{note.cents}¢</span>
            </div>
          {/if}
        </div>
        
        <!-- 精度バー（矢印は後回し） -->
        {#if grade !== 'notMeasured'}
          <div class="accuracy-bar">
            <div class="bar-track">
              <div class="center-line-enhanced">
                <div class="center-marker"></div>
                <span class="center-label">正確</span>
              </div>
              <div class="accuracy-indicator {grade}" 
                   style="left: {Math.max(0, Math.min(100, 50 + (note.cents / 120) * 50))}%">
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- 技術的ブレ検証中のため一時的に非表示
  {#if outliers.length > 0}
    <div class="outlier-section" in:fade={{ delay: 500 }}>
      <h4>
        <AlertTriangle class="w-5 h-5 text-red-500" />
        外れ値検出
      </h4>
      <div class="outlier-list">
        {#each outliers as outlier}
          <div class="outlier-item">
            <span class="note-badge">{outlier.name}</span>
            <span class="cents-value">{outlier.cents > 0 ? '+' : ''}{outlier.cents}¢</span>
            <span class="severity-badge {Math.abs(outlier.cents) > 100 ? 'critical' : 'warning'}">
              {Math.abs(outlier.cents) > 100 ? '重大' : '注意'}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  -->
  
  <!-- 改善アドバイス -->
  <div class="advice-section" in:fade={{ delay: 600 }}>
    <h4>
      <Lightbulb class="w-5 h-5 text-yellow-500" />
      改善アドバイス
    </h4>
    <div class="advice-content">
      {#if needWorkNotes.length > 0}
        <p>
          <Meh class="w-4 h-4 text-red-500" />
          重点練習: {needWorkNotes.join('、')}の精度向上
        </p>
      {/if}
      {#if averageError > 200}
        <p>
          <Flame class="w-4 h-4 text-orange-500" />
          基礎練習: 音程感覚の根本的な見直しが必要
        </p>
      {:else if averageError < 20}
        <p>
          <Trophy class="w-4 h-4 text-yellow-500" />
          素晴らしい精度です！この調子を維持しましょう
        </p>
      {:else}
        <p>
          <Sprout class="w-4 h-4 text-green-500" />
          良い調子です！継続的な練習で更なる向上を
        </p>
      {/if}
    </div>
  </div>
  
  {/if}
</div>

<style>
  .random-mode-score-result {
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* ローディング状態 */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #6b7280;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* 総合評価 */
  .overall-score-section {
    text-align: center;
    padding: 2rem 0;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
    border-radius: 12px 12px 0 0;
  }
  
  .grade-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .grade-display-enhanced {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  /* シンプルグレードアイコン */
  .simple-grade-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 160px;
    height: 160px;
  }

  .grade-icon-simple {
    width: 120px !important;
    height: 120px !important;
    min-width: 120px !important;
    min-height: 120px !important;
    max-width: 120px !important;
    max-height: 120px !important;
    font-size: 120px !important;
  }


  .grade-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .grade-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    margin: 0;
  }

  .penalty-notice {
    font-size: 1rem;
    color: #ef4444;
    font-weight: 600;
    background: rgba(239, 68, 68, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin: 0;
  }
  
  /* 評価分布 */
  .rating-distribution {
    margin-bottom: 2rem;
  }
  
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .distribution-bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .distribution-row {
    display: flex;
    display: -webkit-flex;
    align-items: center;
    -webkit-align-items: center;
    gap: 1rem;
    width: 100%;
  }
  
  .grade-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    min-width: 120px;
    flex-shrink: 0;
  }
  
  .bar-container {
    height: 12px;
    background: #f3f4f6;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    flex: 1;
    min-width: 0;
    width: 100%;
    -webkit-flex: 1;
    -webkit-box-flex: 1;
  }
  
  .distribution-bar {
    height: 100%;
    border-radius: 12px;
    transition: width 0.3s ease-out;
  }
  
  /* 各グレードの分布バー色を詳細結果と統一（適度な濃さ） */
  .distribution-row:nth-child(1) .distribution-bar { background: #fbbf24; } /* excellent - 適度な金 */
  .distribution-row:nth-child(2) .distribution-bar { background: #34d399; } /* good - 適度な緑 */
  .distribution-row:nth-child(3) .distribution-bar { background: #60a5fa; } /* pass - 適度な青 */
  .distribution-row:nth-child(4) .distribution-bar { background: #f87171; } /* needWork - 適度な赤 */
  .distribution-row:nth-child(5) .distribution-bar { background: #9ca3af; } /* notMeasured - 適度なグレー */
  
  .count-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
    font-weight: 600;
    min-width: 80px;
    flex-shrink: 0;
  }
  
  .distribution-summary {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .summary-item.warning {
    color: #ef4444;
  }
  
  .summary-item.excellent {
    color: #eab308;
  }
  
  .summary-item.good {
    color: #10b981;
  }
  
  /* 音階詳細 */
  .note-details {
    margin-bottom: 2rem;
  }
  
  .note-result {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    transition: all 0.2s;
  }
  
  .note-result:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* 評価別の枠線色 */
  .note-result.excellent {
    border-color: #fbbf24;
    background: #fffbeb;
  }
  
  .note-result.good {
    border-color: #10b981;
    background: #ecfdf5;
  }
  
  .note-result.pass {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .note-result.needWork {
    border-color: #ef4444;
    background: #fef2f2;
  }
  
  .note-result.notMeasured {
    border-color: #9ca3af;
    background: #f9fafb;
  }
  
  /* outlierクラスは削除（評価別枠線で代替） */
  
  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .note-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .note-name {
    font-weight: 600;
    font-size: 1.125rem;
  }
  
  .cents-display {
    font-weight: 700;
    font-size: 1.125rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .cents-display.excellent { color: #eab308; }
  .cents-display.good { color: #10b981; }
  .cents-display.pass { color: #3b82f6; }
  .cents-display.needWork { color: #ef4444; }
  .cents-display.notMeasured { color: #6b7280; }
  
  .outlier-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    background: #ef4444;
    color: white;
  }
  
  /* 精度バー */
  .accuracy-bar {
    margin: 0.75rem 0;
  }
  
  .bar-track {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }
  
  .center-line {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #6b7280;
    transform: translateX(-50%);
  }

  .center-line-enhanced {
    position: absolute;
    left: 50%;
    top: -8px;
    bottom: -8px;
    width: 4px;
    background: linear-gradient(to bottom, #374151, #6b7280, #374151);
    transform: translateX(-50%);
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(107, 114, 128, 0.5);
  }

  .center-marker {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    background: #374151;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .center-label {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    background: white;
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }
  
  .accuracy-indicator {
    position: absolute;
    top: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transform: translateX(-50%);
    transition: left 0.5s ease-out;
  }
  
  .accuracy-indicator.excellent { background: #eab308; }
  .accuracy-indicator.good { background: #10b981; }
  .accuracy-indicator.pass { background: #3b82f6; }
  .accuracy-indicator.needWork { background: #ef4444; }

  /* 測定不可表示 */
  .not-measured-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    margin: 0.75rem 0;
  }

  .not-measured-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
    text-align: center;
  }
  
  /* 周波数詳細 */
  .freq-toggle {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    color: #6b7280;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0.25rem;
    transition: color 0.2s;
  }
  
  .freq-toggle:hover {
    color: #374151;
  }
  
  .frequency-details {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .freq-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    color: #6b7280;
  }

  .frequency-details-simple {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-size: 0.875rem;
  }

  /* シンプル色分けヘッダー */
  .simple-header {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border-left: 4px solid;
    border-radius: 4px;
  }

  .simple-header.excellent {
    background: #fef3c7;
    border-color: #f59e0b;
  }

  .simple-header.good {
    background: #d1fae5;
    border-color: #10b981;
  }

  .simple-header.pass {
    background: #dbeafe;
    border-color: #3b82f6;
  }

  .simple-header.needWork {
    background: #fee2e2;
    border-color: #ef4444;
  }

  .simple-header.notMeasured {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .simple-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
  }

  .note-name-simple {
    font-weight: 600;
    color: #374151;
    min-width: 120px;
  }

  .detection-result {
    color: #6b7280;
    flex: 1;
  }

  .detection-failed {
    color: #ef4444;
    font-weight: 500;
  }


  /* 精度バー矢印（後回し） */

  /* プルダウンアイコン */
  .chevron-icon {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  details[open] .chevron-icon {
    transform: rotate(180deg);
  }
  
  /* 外れ値セクション */
  .outlier-section {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .outlier-section h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #991b1b;
  }
  
  .outlier-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .outlier-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .note-badge {
    font-weight: 600;
    color: #374151;
  }
  
  .cents-value {
    font-weight: 700;
    color: #ef4444;
  }
  
  .severity-badge {
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .severity-badge.critical {
    background: #991b1b;
    color: white;
  }
  
  .severity-badge.warning {
    background: #f59e0b;
    color: white;
  }
  
  /* アドバイスセクション */
  .advice-section {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .advice-section h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #0369a1;
  }
  
  .advice-content p {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    color: #0c4a6e;
  }
  
  
  
  /* アニメーション */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ポップオーバー式評価基準表示 */
  .grade-title-with-help {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .session-help-icon-button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  
  .session-help-icon-button:hover {
    background: #f3f4f6;
    opacity: 0.8;
  }
  
  .session-help-icon-button:active {
    background: #e5e7eb;
  }
  
  .popover-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998 !important;
  }

  .session-criteria-popover {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 999999 !important;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    min-width: 320px;
    max-width: 400px;
    margin: 0 !important;
  }
  
  .popover-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    color: #374151;
    text-align: center;
  }
  
  .session-criteria-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .session-criteria-item:last-child {
    margin-bottom: 0;
  }
  
  .criteria-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .criteria-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    min-width: 60px;
  }
  
  .criteria-detail {
    font-size: 0.8125rem;
    color: #6b7280;
    line-height: 1.4;
  }

  /* iPhone用レスポンシブ最適化 */
  @media (max-width: 640px) {
    /* コンテナ全体: パディング完全削除で表示領域最大化 */
    .random-mode-score-result {
      padding: 0.5rem !important;
      margin: 0 !important;
      margin-bottom: 0 !important;
      border-radius: 6px !important;
      box-shadow: none !important;
    }
    
    /* 評価分布セクション: 右はみ出し防止・左右マージン完全削除 */
    .rating-distribution {
      overflow-x: hidden;
      margin-left: -1.5rem;
      margin-right: -1.5rem;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }
    
    /* 評価分布バー: ラベル幅縮小でバー表示領域拡大 */
    .grade-label {
      min-width: 50px;
      font-size: 0.7rem;
      gap: 0.25rem;
    }
    
    /* 評価分布バー: カウント表示幅縮小 */
    .count-display {
      min-width: 35px;
      font-size: 0.7rem;
      gap: 0.25rem;
    }
    
    /* 評価分布行: ギャップ縮小でスペース効率化 */
    .distribution-row {
      gap: 0.3rem;
      padding: 0 0.25rem;
    }
    
    /* バーコンテナ: 最大幅確保＋余白調整 */
    .bar-container {
      flex: 1;
      min-width: 0;
      max-width: 100%;
    }
    
    /* アイコンサイズ調整 */
    .grade-label svg {
      width: 16px;
      height: 16px;
    }
  }

  
</style>

