<script>
  import { onMount } from 'svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';

  // トレーニング状態管理
  let direction = 'ascending'; // 'ascending' | 'descending'
  let isPlaying = false;
  let isDetecting = false;
  let currentBaseNote = 'C4';
  let currentScaleIndex = 0;
  let scaleResults = [];
  let showResults = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  
  // 12音階システム（クロマチック）
  const chromaticNotesAsc = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
  const chromaticNotesDesc = ['シ', 'ラ#', 'ラ', 'ソ#', 'ソ', 'ファ#', 'ファ', 'ミ', 'レ#', 'レ', 'ド#', 'ド'];
  
  // 現在の音階配列
  $: currentScale = direction === 'ascending' ? chromaticNotesAsc : chromaticNotesDesc;
  
  // 固定基音（C4）
  const baseNote = 'C4';

  // トレーニング開始
  function startTraining() {
    // リセット
    currentScaleIndex = 0;
    scaleResults = [];
    showResults = false;
    
    // 基音再生
    playBaseNote(baseNote);
  }

  // 基音再生（モック）
  function playBaseNote(note) {
    isPlaying = true;
    currentBaseNote = note;
    console.log(`基音再生: ${note} (${direction === 'ascending' ? '上行' : '下行'})`);
    
    // 3秒後に再生完了、検出開始
    setTimeout(() => {
      isPlaying = false;
      startDetection();
    }, 3000);
  }

  // 音程検出開始（モック）
  function startDetection() {
    isDetecting = true;
    
    // モック：音程検出シミュレート
    const detectionInterval = setInterval(() => {
      if (!isDetecting) {
        clearInterval(detectionInterval);
        return;
      }
      
      // ランダムな音量・周波数データ
      currentVolume = Math.random() * 100;
      
      // クロマチック音程の周波数（C4基準）
      const chromaticFreqs = [
        261.63, 277.18, 293.66, 311.13, 329.63, 349.23,
        369.99, 392.00, 415.30, 440.00, 466.16, 493.88
      ];
      currentFrequency = chromaticFreqs[Math.floor(Math.random() * chromaticFreqs.length)];
      currentNote = currentScale[Math.floor(Math.random() * currentScale.length)];
      
      // モック：正解判定（ランダム）
      if (Math.random() > 0.6) {
        const isCorrect = Math.random() > 0.4; // 60%の確率で正解
        scaleResults[currentScaleIndex] = isCorrect;
        currentScaleIndex++;
        
        // 12音階完了チェック
        if (currentScaleIndex >= 12) {
          finishTraining();
        }
      }
    }, 600);
  }

  // トレーニング終了
  function finishTraining() {
    isDetecting = false;
    showResults = true;
  }

  // 方向切り替え
  function switchDirection() {
    direction = direction === 'ascending' ? 'descending' : 'ascending';
  }

  // 音量バー幅計算
  $: volumeWidth = Math.max(0, Math.min(100, currentVolume));
  
  // スコア計算
  $: correctCount = scaleResults.filter(result => result).length;
  $: score = Math.round((correctCount / 12) * 100);
</script>

<svelte:head>
  <title>12音階モード - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="chromatic-training">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mode-header">
        <div class="mode-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </div>
        <div>
          <h1 class="mode-title">12音階モード</h1>
          <p class="mode-description">クロマチックスケールの上行・下行で完全制覇</p>
        </div>
      </div>
    </div>

    {#if !isPlaying && !isDetecting && !showResults}
      <!-- 開始画面 -->
      <div class="start-screen">
        <Card variant="default" padding="lg">
          <div class="start-content">
            <h2 class="start-title">12音階トレーニング</h2>
            <p class="start-description">
              半音階（クロマチック）を使った高度な相対音感トレーニング
            </p>
            
            <!-- 方向選択 -->
            <div class="direction-selector">
              <h3 class="selector-title">スケール方向</h3>
              <div class="direction-options">
                <button 
                  class="direction-option {direction === 'ascending' ? 'selected' : ''}"
                  on:click={() => direction = 'ascending'}
                >
                  <div class="option-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 17L17 7"/>
                      <path d="M7 7h10v10"/>
                    </svg>
                  </div>
                  <div>
                    <div class="option-title">上行</div>
                    <div class="option-desc">ド → ド#→ レ → ... → シ</div>
                  </div>
                </button>
                
                <button 
                  class="direction-option {direction === 'descending' ? 'selected' : ''}"
                  on:click={() => direction = 'descending'}
                >
                  <div class="option-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 7L7 17"/>
                      <path d="M17 17H7V7"/>
                    </svg>
                  </div>
                  <div>
                    <div class="option-title">下行</div>
                    <div class="option-desc">シ → ラ#→ ラ → ... → ド</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div class="instructions">
              <div class="instruction-item">
                <span class="step-number">1</span>
                <div>
                  <h3>基音確認</h3>
                  <p>C4（ド4）の音程を基準として聞きます</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">2</span>
                <div>
                  <h3>半音階歌唱</h3>
                  <p>選択した方向で12音すべてを半音ずつ歌います</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">3</span>
                <div>
                  <h3>高精度判定</h3>
                  <p>半音の微細な音程差まで厳密に判定します</p>
                </div>
              </div>
            </div>

            <Button variant="tertiary" size="lg" fullWidth on:click={startTraining}>
              {direction === 'ascending' ? '上行' : '下行'}12音階開始
            </Button>
          </div>
        </Card>
      </div>
    {:else if isPlaying}
      <!-- 基音再生中 -->
      <div class="playing-screen">
        <Card variant="tertiary" padding="lg">
          <div class="playing-content">
            <div class="direction-indicator">
              <span class="direction-text">
                {direction === 'ascending' ? '📈 上行（Ascending）' : '📉 下行（Descending）'}
              </span>
            </div>
            
            <div class="playing-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16"/>
              </svg>
            </div>
            <h2 class="playing-title">基音再生中</h2>
            <p class="playing-note">基音: {currentBaseNote}（ド4）</p>
            <p class="playing-instruction">
              この音を基準として、{direction === 'ascending' ? '上行' : '下行'}クロマチックスケールを歌います
            </p>
            
            <div class="scale-preview">
              <h4>歌唱する順序:</h4>
              <div class="scale-sequence">
                {#each currentScale as note, index}
                  <span class="sequence-note" class:first={index === 0}>
                    {note}
                  </span>
                  {#if index < currentScale.length - 1}
                    <span class="sequence-arrow">→</span>
                  {/if}
                {/each}
              </div>
            </div>
            
            <div class="playing-progress">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    {:else if isDetecting}
      <!-- 音程検出中 -->
      <div class="detection-screen">
        <!-- ガイドアニメーション -->
        <Card variant="default" padding="lg">
          <div class="guide-content">
            <h2 class="guide-title">
              {direction === 'ascending' ? '上行' : '下行'}クロマチックスケールを歌ってください
            </h2>
            <div class="chromatic-guide">
              {#each currentScale as note, index}
                <div class="chromatic-note" 
                     class:active={index === currentScaleIndex} 
                     class:completed={scaleResults[index] !== undefined}>
                  <span class="note-text">{note}</span>
                  <span class="note-number">{index + 1}</span>
                  {#if scaleResults[index] !== undefined}
                    <span class="result-icon {scaleResults[index] ? 'correct' : 'incorrect'}">
                      {scaleResults[index] ? '✓' : '×'}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </Card>

        <!-- リアルタイム表示 -->
        <div class="realtime-display">
          <div class="display-grid">
            <!-- 音量表示 -->
            <Card variant="default" padding="md">
              <div class="volume-display">
                <h3 class="display-title">音量レベル</h3>
                <div class="volume-bar-container">
                  <div class="volume-bar">
                    <div class="volume-fill" style="width: {volumeWidth}%"></div>
                  </div>
                  <span class="volume-text">{Math.round(currentVolume)}%</span>
                </div>
              </div>
            </Card>

            <!-- 音程表示 -->
            <Card variant="default" padding="md">
              <div class="pitch-display">
                <h3 class="display-title">検出音程</h3>
                <div class="pitch-info">
                  <div class="frequency-value">{currentFrequency.toFixed(1)} Hz</div>
                  <div class="note-value">{currentNote}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- 進行状況 -->
        <Card variant="default" padding="md">
          <div class="progress-info">
            <h3 class="progress-title">進行状況</h3>
            <div class="progress-details">
              <span>現在: {currentScale[currentScaleIndex]} ({currentScaleIndex + 1}/12)</span>
              <span>正解: {correctCount}/{currentScaleIndex}</span>
            </div>
            <div class="progress-direction">
              方向: {direction === 'ascending' ? '上行 📈' : '下行 📉'}
            </div>
          </div>
        </Card>
      </div>
    {:else if showResults}
      <!-- 結果表示 -->
      <div class="results-screen">
        <Card variant="default" padding="lg">
          <div class="results-content">
            <h2 class="results-title">12音階トレーニング結果</h2>
            
            <!-- スコア表示 -->
            <div class="score-display">
              <div class="score-circle">
                <span class="score-value">{score}</span>
                <span class="score-unit">点</span>
              </div>
              <p class="score-description">
                {direction === 'ascending' ? '上行' : '下行'}クロマチック
              </p>
              <p class="score-stats">
                12音階中 {correctCount}音階 正解
              </p>
            </div>

            <!-- 音階別結果 -->
            <div class="detailed-results">
              <h3 class="details-title">音階別結果</h3>
              <div class="chromatic-results">
                {#each currentScale as note, index}
                  <div class="chromatic-result">
                    <span class="chromatic-note-name">{note}</span>
                    <span class="chromatic-note-number">#{index + 1}</span>
                    <span class="chromatic-result-icon {scaleResults[index] ? 'correct' : 'incorrect'}">
                      {scaleResults[index] ? '✓' : '×'}
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="action-buttons">
              <Button variant="tertiary" size="lg" fullWidth on:click={startTraining}>
                同じ方向でもう一度
              </Button>
              <Button variant="secondary" size="md" fullWidth on:click={switchDirection}>
                {direction === 'ascending' ? '下行' : '上行'}に切り替え
              </Button>
              <Button variant="secondary" size="md" fullWidth>
                結果を保存
              </Button>
            </div>
          </div>
        </Card>
      </div>
    {/if}
  </div>
</PageLayout>

<style>
  .chromatic-training {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .header {
    text-align: center;
  }

  .mode-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
  }

  .mode-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #e9d5ff;
    color: #9333ea;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mode-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-1) 0;
  }

  .mode-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  /* 開始画面 */
  .start-content {
    text-align: center;
  }

  .start-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .start-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
    line-height: 1.6;
  }

  .direction-selector {
    margin-bottom: var(--space-8);
  }

  .selector-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4) 0;
  }

  .direction-options {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: 1fr 1fr;
  }

  .direction-option {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 2px solid var(--color-gray-300);
    border-radius: 8px;
    background: white;
    color: var(--color-gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .direction-option:hover {
    border-color: #9333ea;
    color: #9333ea;
  }

  .direction-option.selected {
    border-color: #9333ea;
    background-color: #9333ea;
    color: white;
  }

  .option-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--color-gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .direction-option.selected .option-icon {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .option-title {
    font-weight: 600;
    margin-bottom: var(--space-1);
  }

  .option-desc {
    font-size: var(--text-xs);
    opacity: 0.8;
  }

  .instructions {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    text-align: left;
  }

  .instruction-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #9333ea;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  }

  .instruction-item h3 {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-1) 0;
  }

  .instruction-item p {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
  }

  /* 基音再生画面 */
  .playing-content {
    text-align: center;
  }

  .direction-indicator {
    margin-bottom: var(--space-4);
  }

  .direction-text {
    font-size: var(--text-sm);
    font-weight: 600;
    color: #9333ea;
    background-color: #e9d5ff;
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
  }

  .playing-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #e9d5ff;
    color: #9333ea;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-4) auto;
  }

  .playing-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .playing-note {
    font-size: var(--text-lg);
    font-weight: 600;
    color: #9333ea;
    margin: 0 0 var(--space-2) 0;
  }

  .playing-instruction {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
  }

  .scale-preview {
    margin-bottom: var(--space-6);
  }

  .scale-preview h4 {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-gray-700);
    margin: 0 0 var(--space-2) 0;
  }

  .scale-sequence {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    flex-wrap: wrap;
  }

  .sequence-note {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-gray-600);
    padding: var(--space-1) var(--space-2);
    background-color: var(--color-gray-100);
    border-radius: 4px;
  }

  .sequence-note.first {
    background-color: #9333ea;
    color: white;
  }

  .sequence-arrow {
    font-size: var(--text-xs);
    color: var(--color-gray-400);
  }

  .playing-progress {
    margin: 0 auto;
    max-width: 200px;
  }

  .progress-bar {
    height: 8px;
    background-color: var(--color-gray-200);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #9333ea;
    animation: progress 3s ease-in-out;
  }

  @keyframes progress {
    from { width: 0%; }
    to { width: 100%; }
  }

  /* 検出画面 */
  .guide-content {
    text-align: center;
  }

  .guide-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-6) 0;
  }

  .chromatic-guide {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-2);
  }

  .chromatic-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-3);
    border-radius: 8px;
    background-color: var(--color-gray-100);
    transition: all 0.3s ease;
  }

  .chromatic-note.active {
    background-color: #9333ea;
    color: white;
    transform: scale(1.1);
  }

  .chromatic-note.completed {
    background-color: var(--color-gray-200);
  }

  .note-text {
    font-weight: 600;
    margin-bottom: var(--space-1);
  }

  .note-number {
    font-size: var(--text-xs);
    color: var(--color-gray-500);
    margin-bottom: var(--space-1);
  }

  .chromatic-note.active .note-number {
    color: rgba(255, 255, 255, 0.7);
  }

  .result-icon {
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .result-icon.correct {
    color: var(--color-success);
  }

  .result-icon.incorrect {
    color: var(--color-error);
  }

  .realtime-display {
    margin-top: var(--space-6);
  }

  .display-grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: 1fr 1fr;
  }

  .display-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-3) 0;
    text-align: center;
  }

  .volume-bar-container {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .volume-bar {
    flex: 1;
    height: 8px;
    background: var(--color-gray-200);
    border-radius: 4px;
    overflow: hidden;
  }

  .volume-fill {
    height: 100%;
    background: linear-gradient(to right, #9333ea, #e9d5ff);
    transition: width 0.1s ease;
  }

  .volume-text {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-gray-700);
    min-width: 30px;
  }

  .pitch-info {
    text-align: center;
  }

  .frequency-value {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-gray-900);
    margin-bottom: var(--space-1);
  }

  .note-value {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .progress-info {
    text-align: center;
  }

  .progress-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin-bottom: var(--space-1);
  }

  .progress-direction {
    font-size: var(--text-xs);
    color: #9333ea;
    font-weight: 600;
  }

  /* 結果画面 */
  .results-content {
    text-align: center;
  }

  .results-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-6) 0;
  }

  .score-display {
    margin-bottom: var(--space-6);
  }

  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #e9d5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-3) auto;
    border: 4px solid #9333ea;
  }

  .score-value {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: #9333ea;
  }

  .score-unit {
    font-size: var(--text-lg);
    font-weight: 600;
    color: #9333ea;
    margin-left: var(--space-1);
  }

  .score-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-1) 0;
  }

  .score-stats {
    font-size: var(--text-sm);
    color: var(--color-gray-500);
    margin: 0;
  }

  .details-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4) 0;
  }

  .chromatic-results {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-2);
    margin-bottom: var(--space-8);
  }

  .chromatic-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-2);
    border-radius: 8px;
    background-color: var(--color-gray-50);
  }

  .chromatic-note-name {
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--space-1);
  }

  .chromatic-note-number {
    font-size: var(--text-xs);
    color: var(--color-gray-500);
    margin-bottom: var(--space-1);
  }

  .chromatic-result-icon {
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .chromatic-result-icon.correct {
    color: var(--color-success);
  }

  .chromatic-result-icon.incorrect {
    color: var(--color-error);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  @media (max-width: 767px) {
    .chromatic-guide,
    .chromatic-results {
      grid-template-columns: repeat(4, 1fr);
    }

    .display-grid {
      grid-template-columns: 1fr;
    }

    .mode-header {
      flex-direction: column;
      text-align: center;
    }

    .direction-options {
      grid-template-columns: 1fr;
    }

    .direction-option {
      flex-direction: column;
      text-align: center;
      gap: var(--space-2);
    }

    .scale-sequence {
      justify-content: flex-start;
    }
  }
</style>