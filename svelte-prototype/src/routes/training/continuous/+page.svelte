<script>
  import { onMount } from 'svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';

  // トレーニング状態管理
  let challengeCount = 5;
  let currentChallenge = 0;
  let isPlaying = false;
  let isDetecting = false;
  let currentBaseNote = '';
  let currentScaleIndex = 0;
  let scaleResults = [];
  let challengeResults = [];
  let showFinalResults = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  
  // 音階システム
  const scaleNotes = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
  const baseNotes = ['Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4'];
  
  // チャレンジ回数設定
  const challengeOptions = [3, 5, 10, 15, 20];
  
  // 基音ランダム選択
  function selectRandomBase() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    currentBaseNote = baseNotes[randomIndex];
    return currentBaseNote;
  }

  // チャレンジ開始
  function startChallenges() {
    // リセット
    currentChallenge = 0;
    challengeResults = [];
    showFinalResults = false;
    
    startSingleChallenge();
  }

  // 単一チャレンジ開始
  function startSingleChallenge() {
    // リセット
    currentScaleIndex = 0;
    scaleResults = [];
    
    // 基音選択・再生
    const baseNote = selectRandomBase();
    playBaseNote(baseNote);
  }

  // 基音再生（モック）
  function playBaseNote(note) {
    isPlaying = true;
    console.log(`基音再生: ${note}`);
    
    // 2.5秒後に再生完了、検出開始
    setTimeout(() => {
      isPlaying = false;
      startDetection();
    }, 2500);
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
      const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
      currentFrequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      currentNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
      
      // モック：正解判定（ランダム）
      if (Math.random() > 0.7) {
        const isCorrect = Math.random() > 0.3; // 70%の確率で正解
        scaleResults[currentScaleIndex] = isCorrect;
        currentScaleIndex++;
        
        // 8音階完了チェック
        if (currentScaleIndex >= 8) {
          finishSingleChallenge();
        }
      }
    }, 500);
  }

  // 単一チャレンジ終了
  function finishSingleChallenge() {
    isDetecting = false;
    
    // チャレンジ結果を記録
    const correctCount = scaleResults.filter(result => result).length;
    const score = Math.round((correctCount / 8) * 100);
    challengeResults.push({
      challenge: currentChallenge + 1,
      baseNote: currentBaseNote,
      scaleResults: [...scaleResults],
      score: score
    });
    
    currentChallenge++;
    
    // 全チャレンジ完了チェック
    if (currentChallenge >= challengeCount) {
      showFinalResults = true;
    } else {
      // 次のチャレンジまで少し待機
      setTimeout(() => {
        startSingleChallenge();
      }, 1500);
    }
  }

  // 音量バー幅計算
  $: volumeWidth = Math.max(0, Math.min(100, currentVolume));
  
  // 総合成績計算
  $: totalScore = challengeResults.length > 0 ? 
    Math.round(challengeResults.reduce((sum, result) => sum + result.score, 0) / challengeResults.length) : 0;
  $: totalCorrect = challengeResults.reduce((sum, result) => 
    sum + result.scaleResults.filter(r => r).length, 0);
  $: totalNotes = challengeResults.length * 8;
</script>

<svelte:head>
  <title>連続チャレンジモード - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="continuous-training">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mode-header">
        <div class="mode-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div>
          <h1 class="mode-title">連続チャレンジモード</h1>
          <p class="mode-description">選択した回数だけ連続で実行し、総合評価を確認</p>
        </div>
      </div>
    </div>

    {#if !isPlaying && !isDetecting && !showFinalResults && currentChallenge === 0}
      <!-- 設定画面 -->
      <div class="setup-screen">
        <Card variant="default" padding="lg">
          <div class="setup-content">
            <h2 class="setup-title">連続チャレンジ設定</h2>
            <p class="setup-description">
              連続でトレーニングを実行し、総合的な相対音感を評価します
            </p>
            
            <!-- チャレンジ回数選択 -->
            <div class="challenge-selector">
              <h3 class="selector-title">チャレンジ回数</h3>
              <div class="challenge-options">
                {#each challengeOptions as option}
                  <button 
                    class="challenge-option {challengeCount === option ? 'selected' : ''}"
                    on:click={() => challengeCount = option}
                  >
                    {option}回
                  </button>
                {/each}
              </div>
            </div>
            
            <div class="instructions">
              <div class="instruction-item">
                <span class="step-number">1</span>
                <div>
                  <h3>連続実行</h3>
                  <p>{challengeCount}回のトレーニングを連続で実行します</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">2</span>
                <div>
                  <h3>自動進行</h3>
                  <p>各チャレンジ完了後、自動的に次のチャレンジが開始されます</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">3</span>
                <div>
                  <h3>総合評価</h3>
                  <p>全チャレンジ完了後、詳細な成績分析を表示します</p>
                </div>
              </div>
            </div>

            <Button variant="warning" size="lg" fullWidth on:click={startChallenges}>
              連続チャレンジ開始
            </Button>
          </div>
        </Card>
      </div>
    {:else if isPlaying}
      <!-- 基音再生中 -->
      <div class="playing-screen">
        <Card variant="warning" padding="lg">
          <div class="playing-content">
            <div class="challenge-progress">
              <span class="progress-text">チャレンジ {currentChallenge + 1} / {challengeCount}</span>
            </div>
            
            <div class="playing-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16"/>
              </svg>
            </div>
            <h2 class="playing-title">基音再生中</h2>
            <p class="playing-note">基音: {currentBaseNote}</p>
            <p class="playing-instruction">
              この音を覚えて「ド」として認識してください
            </p>
            
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
        <!-- チャレンジ進行状況 -->
        <Card variant="default" padding="md">
          <div class="challenge-status">
            <div class="status-row">
              <span>チャレンジ進行: {currentChallenge + 1} / {challengeCount}</span>
              <span>完了: {challengeResults.length}</span>
            </div>
          </div>
        </Card>

        <!-- ガイドアニメーション -->
        <Card variant="default" padding="lg">
          <div class="guide-content">
            <h2 class="guide-title">ドレミファソラシドを歌ってください</h2>
            <div class="scale-guide">
              {#each scaleNotes as note, index}
                <div class="scale-note" class:active={index === currentScaleIndex} class:completed={scaleResults[index] !== undefined}>
                  <span class="note-text">{note}</span>
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
      </div>
    {:else if showFinalResults}
      <!-- 最終結果表示 -->
      <div class="results-screen">
        <Card variant="default" padding="lg">
          <div class="results-content">
            <h2 class="results-title">連続チャレンジ結果</h2>
            
            <!-- 総合スコア表示 -->
            <div class="total-score-display">
              <div class="score-circle">
                <span class="score-value">{totalScore}</span>
                <span class="score-unit">点</span>
              </div>
              <p class="score-description">
                平均スコア ({challengeCount}回チャレンジ)
              </p>
              <p class="total-stats">
                {totalNotes}音階中 {totalCorrect}音階 正解
              </p>
            </div>

            <!-- チャレンジ別結果 -->
            <div class="detailed-results">
              <h3 class="details-title">チャレンジ別結果</h3>
              <div class="challenge-results">
                {#each challengeResults as result, index}
                  <div class="challenge-result">
                    <div class="challenge-header">
                      <span class="challenge-number">#{result.challenge}</span>
                      <span class="challenge-score">{result.score}点</span>
                      <span class="challenge-base">基音: {result.baseNote}</span>
                    </div>
                    <div class="challenge-scales">
                      {#each result.scaleResults as scaleResult, scaleIndex}
                        <span class="scale-result-mini {scaleResult ? 'correct' : 'incorrect'}">
                          {scaleNotes[scaleIndex]}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="action-buttons">
              <Button variant="warning" size="lg" fullWidth on:click={() => { currentChallenge = 0; challengeResults = []; showFinalResults = false; }}>
                もう一度チャレンジ
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
  .continuous-training {
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
    background-color: #fed7aa;
    color: #ea580c;
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

  /* 設定画面 */
  .setup-content {
    text-align: center;
  }

  .setup-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .setup-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
    line-height: 1.6;
  }

  .challenge-selector {
    margin-bottom: var(--space-8);
  }

  .selector-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4) 0;
  }

  .challenge-options {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    flex-wrap: wrap;
  }

  .challenge-option {
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--color-gray-300);
    border-radius: 8px;
    background: white;
    color: var(--color-gray-700);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .challenge-option:hover {
    border-color: #ea580c;
    color: #ea580c;
  }

  .challenge-option.selected {
    border-color: #ea580c;
    background-color: #ea580c;
    color: white;
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
    background-color: #ea580c;
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

  .challenge-progress {
    margin-bottom: var(--space-4);
  }

  .progress-text {
    font-size: var(--text-sm);
    font-weight: 600;
    color: #ea580c;
    background-color: #fed7aa;
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
  }

  .playing-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #fed7aa;
    color: #ea580c;
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
    color: #ea580c;
    margin: 0 0 var(--space-2) 0;
  }

  .playing-instruction {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
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
    background-color: #ea580c;
    animation: progress 2.5s ease-in-out;
  }

  @keyframes progress {
    from { width: 0%; }
    to { width: 100%; }
  }

  /* チャレンジステータス */
  .challenge-status {
    text-align: center;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  /* 検出画面（共通スタイル再利用） */
  .guide-content {
    text-align: center;
  }

  .guide-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-6) 0;
  }

  .scale-guide {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--space-2);
  }

  .scale-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-3);
    border-radius: 8px;
    background-color: var(--color-gray-100);
    transition: all 0.3s ease;
  }

  .scale-note.active {
    background-color: #ea580c;
    color: white;
    transform: scale(1.1);
  }

  .scale-note.completed {
    background-color: var(--color-gray-200);
  }

  .note-text {
    font-weight: 600;
    margin-bottom: var(--space-1);
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
    background: linear-gradient(to right, #ea580c, #fed7aa);
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

  .total-score-display {
    margin-bottom: var(--space-8);
  }

  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: #fed7aa;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-3) auto;
    border: 4px solid #ea580c;
  }

  .score-value {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: #ea580c;
  }

  .score-unit {
    font-size: var(--text-lg);
    font-weight: 600;
    color: #ea580c;
    margin-left: var(--space-1);
  }

  .score-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-1) 0;
  }

  .total-stats {
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

  .challenge-results {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-8);
  }

  .challenge-result {
    padding: var(--space-4);
    border: 1px solid var(--color-gray-200);
    border-radius: 8px;
    background: var(--color-gray-50);
  }

  .challenge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .challenge-number {
    color: #ea580c;
  }

  .challenge-score {
    color: var(--color-gray-900);
  }

  .challenge-base {
    color: var(--color-gray-600);
  }

  .challenge-scales {
    display: flex;
    gap: var(--space-1);
    justify-content: center;
  }

  .scale-result-mini {
    padding: var(--space-1) var(--space-2);
    border-radius: 4px;
    font-size: var(--text-xs);
    font-weight: 600;
  }

  .scale-result-mini.correct {
    background-color: var(--color-success-pale);
    color: var(--color-success);
  }

  .scale-result-mini.incorrect {
    background-color: var(--color-error-pale);
    color: var(--color-error);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  @media (max-width: 767px) {
    .scale-guide {
      grid-template-columns: repeat(4, 1fr);
    }

    .display-grid {
      grid-template-columns: 1fr;
    }

    .mode-header {
      flex-direction: column;
      text-align: center;
    }

    .challenge-options {
      gap: var(--space-1);
    }

    .challenge-option {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
    }

    .challenge-header {
      flex-direction: column;
      gap: var(--space-1);
      align-items: flex-start;
    }
  }
</style>