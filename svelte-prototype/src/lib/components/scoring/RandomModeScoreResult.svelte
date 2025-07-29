<script>
  import { Trophy, Star, ThumbsUp, Frown, AlertCircle, Music, Target, Mic, 
           AlertTriangle, Lightbulb, Flame, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { fly, fade, slide } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  
  export let noteResults = [];
  export let className = '';
  
  let showDetails = false;
  let showFrequencyDetails = {};
  
  // 4段階評価の定義
  const gradeDefinitions = {
    excellent: { name: '優秀', icon: Trophy, range: '±15¢以内', color: 'text-yellow-500' },
    good: { name: '良好', icon: Star, range: '±25¢以内', color: 'text-green-500' },
    pass: { name: '合格', icon: ThumbsUp, range: '±40¢以内', color: 'text-blue-500' },
    needWork: { name: '要練習', icon: Frown, range: '±41¢以上', color: 'text-red-500' },
    notMeasured: { name: '測定不可', icon: AlertCircle, range: '音声未検出', color: 'text-gray-500' }
  };
  
  // アニメーション用のスコア
  const displayScore = tweened(0, {
    duration: 1000,
    easing: cubicOut
  });
  
  // 評価分布バーのアニメーション用
  const excellentWidth = tweened(0, { duration: 800, easing: cubicOut, delay: 0 });
  const goodWidth = tweened(0, { duration: 800, easing: cubicOut, delay: 100 });
  const passWidth = tweened(0, { duration: 800, easing: cubicOut, delay: 200 });
  const needWorkWidth = tweened(0, { duration: 800, easing: cubicOut, delay: 300 });
  const notMeasuredWidth = tweened(0, { duration: 800, easing: cubicOut, delay: 400 });

  
  // 評価を計算
  function calculateGrade(cents) {
    // 測定できなかった場合（centsがnullやundefined）
    if (cents === null || cents === undefined || isNaN(cents)) {
      return 'notMeasured';
    }
    const absCents = Math.abs(cents);
    if (absCents <= 15) return 'excellent';
    if (absCents <= 25) return 'good';
    if (absCents <= 40) return 'pass';
    return 'needWork';
  }
  
  // 結果の集計
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
  
  // 総合グレード判定
  $: overallGrade = (() => {
    // 測定不可が多い場合は要練習
    if (results.notMeasured > 3) return 'needWork';
    if (results.needWork > 2) return 'needWork';
    if (results.needWork > 0 && outliers.length > 0) return 'needWork';
    // 測定できた音のみで評価
    if (results.measuredCount === 0) return 'needWork';
    if (averageError <= 20 && results.excellent >= 6) return 'excellent';
    if (averageError <= 30 && passCount >= 7) return 'good';
    if (passCount >= 5) return 'pass';
    return 'needWork';
  })();
  
  // ペナルティ計算
  $: penalty = outliers.reduce((sum, note) => {
    const severity = Math.abs(note.cents) > 100 ? 16 : 8;
    return sum + severity;
  }, 0);
  
  // アニメーション実行
  $: if (noteResults.length > 0) {
    const baseScore = Math.max(0, 100 - Math.round(averageError / 10));
    displayScore.set(baseScore - penalty);
    
    // 評価分布バーのアニメーション開始
    setTimeout(() => {
      excellentWidth.set((results.excellent / 8) * 100);
      goodWidth.set((results.good / 8) * 100);
      passWidth.set((results.pass / 8) * 100);
      needWorkWidth.set((results.needWork / 8) * 100);
      notMeasuredWidth.set((results.notMeasured / 8) * 100);
    }, 300); // 総合評価の後にバーアニメーション開始
  }
</script>

<div class="random-mode-score-result {className}">
  <!-- 総合評価セクション -->
  <div class="overall-score-section">
    <div class="grade-display-enhanced" in:fly={{ y: -20, duration: 500 }}>
      <!-- 大型アイコンとエフェクト -->
      <div class="grade-icon-container {overallGrade}">
        <div class="grade-icon-bg"></div>
        <svelte:component 
          this={gradeDefinitions[overallGrade].icon} 
          class="grade-icon-large {gradeDefinitions[overallGrade].color}" 
        />
        {#if overallGrade === 'excellent'}
          <div class="sparkle-effect">
            <div class="sparkle sparkle-1">✨</div>
            <div class="sparkle sparkle-2">⭐</div>
            <div class="sparkle sparkle-3">💫</div>
            <div class="sparkle sparkle-4">🌟</div>
          </div>
        {/if}
        {#if overallGrade === 'good'}
          <div class="shine-effect"></div>
        {/if}
      </div>
      
      <h2 class="grade-title {gradeDefinitions[overallGrade].color}">
        {gradeDefinitions[overallGrade].name}
      </h2>
      <p class="grade-subtitle">
        平均誤差: {averageError}¢
      </p>
      {#if penalty > 0}
        <p class="penalty-notice" transition:fade>
          外れ値ペナルティ: -{penalty}点
        </p>
      {/if}
    </div>
  </div>
  
  <!-- 評価分布セクション -->
  <div class="rating-distribution" in:fly={{ y: 20, duration: 500, delay: 200 }}>
    <h3 class="section-title">評価分布</h3>
    
    <div class="distribution-bars">
      {#each Object.entries(gradeDefinitions) as [key, def], i}
        {@const count = results[key] || 0}
        {@const percentage = (count / 8) * 100}
        <div class="distribution-row" style="animation-delay: {i * 0.1}s">
          <div class="grade-label">
            <svelte:component this={def.icon} class="w-5 h-5 {def.color}" />
            <span>{def.name}</span>
          </div>
          
          <div class="bar-container">
            <div class="distribution-bar {key === 'needWork' && count > 0 ? 'warning' : ''}" 
                 style="width: {key === 'excellent' ? $excellentWidth : 
                               key === 'good' ? $goodWidth : 
                               key === 'pass' ? $passWidth : 
                               key === 'needWork' ? $needWorkWidth : 
                               key === 'notMeasured' ? $notMeasuredWidth : 0}%">
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
           class:outlier={isOutlier}
           in:fly={{ x: -20, duration: 300, delay: 300 + i * 50 }}>
        
        <!-- ヘッダー -->
        <div class="note-header">
          <div class="note-info">
            <svelte:component 
              this={gradeDefinitions[grade].icon} 
              class="w-5 h-5 {gradeDefinitions[grade].color}" 
            />
            <span class="note-name">{note.name}</span>
          </div>
          
          <div class="cents-display {grade}">
            {#if grade === 'notMeasured'}
              測定不可
            {:else}
              {note.cents > 0 ? '+' : ''}{note.cents}¢
              {#if isOutlier}
                <span class="outlier-badge">
                  {Math.abs(note.cents) > 100 ? '重大' : '注意'}
                </span>
              {/if}
            {/if}
          </div>
        </div>
        
        <!-- 精度バー -->
        {#if grade !== 'notMeasured'}
          <div class="accuracy-bar">
            <div class="bar-track">
              <div class="center-line-enhanced">
                <div class="center-marker"></div>
                <span class="center-label">正確</span>
              </div>
              <div class="accuracy-indicator {grade}" 
                   style="left: {Math.max(0, Math.min(100, 50 + (note.cents / 100) * 50))}%">
              </div>
            </div>
          </div>
        {:else}
          <div class="not-measured-indicator">
            <AlertCircle class="w-6 h-6 text-gray-400" />
            <span class="not-measured-text">音声を検出できませんでした</span>
          </div>
        {/if}
        
        <!-- 周波数詳細（常時表示） -->
        <div class="frequency-details-simple">
          <div class="freq-row">
            <Target class="w-4 h-4 text-gray-500" />
            <span>正解: {note.targetFreq}Hz</span>
          </div>
          <div class="freq-row">
            <Mic class="w-4 h-4 text-gray-500" />
            {#if grade === 'notMeasured'}
              <span>あなた: 検出できませんでした</span>
            {:else}
              <span>あなた: {note.detectedFreq}Hz ({note.diff > 0 ? '+' : ''}{note.diff}Hz)</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- 外れ値警告 -->
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
  
  <!-- 改善アドバイス -->
  <div class="advice-section" in:fade={{ delay: 600 }}>
    <h4>
      <Lightbulb class="w-5 h-5 text-yellow-500" />
      改善アドバイス
    </h4>
    <div class="advice-content">
      {#if needWorkNotes.length > 0}
        <p>
          <Target class="w-4 h-4 text-red-500" />
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
          <TrendingUp class="w-4 h-4 text-green-500" />
          良い調子です！継続的な練習で更なる向上を
        </p>
      {/if}
    </div>
  </div>
  
  <!-- 判定基準（折りたたみ） -->
  <details class="criteria-section">
    <summary>
      <Info class="w-4 h-4" />
      判定結果の見方
    </summary>
    <div class="criteria-content">
      {#each Object.entries(gradeDefinitions) as [key, def]}
        <div class="criteria-item">
          <svelte:component this={def.icon} class="w-4 h-4 {def.color}" />
          <strong>{def.name}:</strong> {def.range}
        </div>
      {/each}
      <div class="info-note">
        <p>¢（セント）: 音程の精度単位。100¢ = 半音1つ分</p>
        <p>外れ値ペナルティ: ±50セント超の大きな外れがあると評価が下がります</p>
      </div>
    </div>
  </details>
</div>

<style>
  .random-mode-score-result {
    padding: 1.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  /* 総合評価 */
  .overall-score-section {
    text-align: center;
    padding: 2rem 0;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
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

  /* 大型グレードアイコンコンテナ */
  .grade-icon-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: visible;
  }

  .grade-icon-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.6) 100%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .grade-icon-container.excellent .grade-icon-bg {
    background: radial-gradient(circle, rgba(255,248,220,0.9) 0%, rgba(255,235,59,0.3) 100%);
    box-shadow: 0 8px 32px rgba(234, 179, 8, 0.3);
  }

  .grade-icon-container.good .grade-icon-bg {
    background: radial-gradient(circle, rgba(236,253,245,0.9) 0%, rgba(16,185,129,0.3) 100%);
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  }

  .grade-icon-container.pass .grade-icon-bg {
    background: radial-gradient(circle, rgba(239,246,255,0.9) 0%, rgba(59,130,246,0.3) 100%);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  }

  .grade-icon-container.needWork .grade-icon-bg {
    background: radial-gradient(circle, rgba(254,242,242,0.9) 0%, rgba(239,68,68,0.3) 100%);
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
  }

  .grade-icon-large {
    position: relative;
    z-index: 2;
    width: 64px !important;
    height: 64px !important;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  /* スパークルエフェクト（優秀グレード用） */
  .sparkle-effect {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .sparkle {
    position: absolute;
    font-size: 1.5rem;
    animation: sparkleRotate 3s infinite;
    opacity: 0.8;
  }

  .sparkle-1 {
    top: 10%;
    right: 15%;
    animation-delay: 0s;
  }

  .sparkle-2 {
    bottom: 15%;
    left: 10%;
    animation-delay: 0.7s;
  }

  .sparkle-3 {
    top: 20%;
    left: 20%;
    animation-delay: 1.4s;
  }

  .sparkle-4 {
    bottom: 25%;
    right: 25%;
    animation-delay: 2.1s;
  }

  /* シャインエフェクト（良好グレード用） */
  .shine-effect {
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent, rgba(16,185,129,0.4), transparent, rgba(16,185,129,0.4), transparent);
    animation: shineRotate 4s linear infinite;
    pointer-events: none;
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
    display: grid;
    grid-template-columns: 120px 1fr 80px;
    align-items: center;
    gap: 1rem;
    opacity: 0;
    animation: fadeInUp 0.3s forwards;
  }
  
  .grade-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }
  
  .bar-container {
    height: 24px;
    background: #f3f4f6;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }
  
  .distribution-bar {
    height: 100%;
    border-radius: 12px;
    background: #3b82f6;
    transition: width 0.3s ease-out;
  }
  
  .distribution-bar.warning {
    background: #ef4444;
  }
  
  .count-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
    font-weight: 600;
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
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
  }
  
  .note-result:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .note-result.outlier {
    border-color: #fca5a5;
    background: #fef2f2;
  }
  
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
  
  /* 判定基準 */
  .criteria-section {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .criteria-section summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    color: #374151;
  }
  
  .criteria-content {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .criteria-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    color: #6b7280;
  }
  
  .info-note {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .info-note p {
    margin: 0.25rem 0;
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

  @keyframes sparkleRotate {
    0% {
      transform: rotate(0deg) scale(1);
      opacity: 0.8;
    }
    25% {
      opacity: 1;
      transform: rotate(90deg) scale(1.2);
    }
    50% {
      transform: rotate(180deg) scale(1);
      opacity: 0.6;
    }
    75% {
      opacity: 1;
      transform: rotate(270deg) scale(1.1);
    }
    100% {
      transform: rotate(360deg) scale(1);
      opacity: 0.8;
    }
  }

  @keyframes shineRotate {
    0% {
      transform: rotate(0deg);
      opacity: 0.6;
    }
    50% {
      opacity: 0.9;
    }
    100% {
      transform: rotate(360deg);
      opacity: 0.6;
    }
  }
  
</style>