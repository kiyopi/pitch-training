<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';
  
  // Tone.js変数
  let Tone = null;
  let sampler = null;
  let isToneLoaded = false;

  // トレーニング状態管理
  let isPlaying = false;
  let isDetecting = false;
  let currentBaseNote = '';
  let currentScaleIndex = 0;
  let scaleResults = [];
  let showResults = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  
  // 音階システム
  const scaleNotes = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
  const baseNotes = ['Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'Ab4']; // 10種類の基音
  
  // Tone.js初期化
  async function initializeTone() {
    try {
      // Tone.js CDNから読み込み
      if (typeof window !== 'undefined' && !window.Tone) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tone@14.7.77/build/Tone.js';
        script.onload = async () => {
          window.Tone = window.Tone;
          Tone = window.Tone;
          await setupSampler();
        };
        document.head.appendChild(script);
      } else if (window.Tone) {
        Tone = window.Tone;
        await setupSampler();
      }
    } catch (error) {
      console.error('Tone.js初期化エラー:', error);
    }
  }
  
  // Salamander Grand Piano サンプラー設定
  async function setupSampler() {
    try {
      if (!Tone) return;
      
      // AudioContextが停止している場合は開始
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // Salamander Grand Piano音源でサンプラー作成
      sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        onload: () => {
          isToneLoaded = true;
          console.log('Salamander Grand Piano読み込み完了');
        }
      }).toDestination();
      
    } catch (error) {
      console.error('サンプラー設定エラー:', error);
    }
  }
  
  onMount(() => {
    initializeTone();
  });
  
  onDestroy(() => {
    if (sampler) {
      sampler.dispose();
    }
  });
  
  // 基音ランダム選択
  function selectRandomBase() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    currentBaseNote = baseNotes[randomIndex];
    return currentBaseNote;
  }

  // トレーニング開始
  function startTraining() {
    // リセット
    currentScaleIndex = 0;
    scaleResults = [];
    showResults = false;
    
    // 基音選択・再生
    const baseNote = selectRandomBase();
    playBaseNote(baseNote);
  }

  // 基音再生（実装）
  async function playBaseNote(note) {
    isPlaying = true;
    console.log(`基音再生: ${note}`);
    
    try {
      if (!isToneLoaded || !sampler) {
        console.warn('Tone.js または Sampler が未初期化');
        // フォールバック: モックタイミング
        setTimeout(() => {
          isPlaying = false;
          startDetection();
        }, 2500);
        return;
      }
      
      // AudioContext開始（ユーザー操作後なので安全）
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      // 基音を2.5秒間再生
      sampler.triggerAttackRelease(note, "2.5");
      console.log(`Salamander Grand Piano で ${note} 再生開始`);
      
      // 2.5秒後に再生完了、検出開始
      setTimeout(() => {
        isPlaying = false;
        startDetection();
      }, 2500);
      
    } catch (error) {
      console.error('基音再生エラー:', error);
      // エラー時もフォールバック
      setTimeout(() => {
        isPlaying = false;
        startDetection();
      }, 2500);
    }
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
          finishTraining();
        }
      }
    }, 500);
  }

  // トレーニング終了
  function finishTraining() {
    isDetecting = false;
    showResults = true;
  }

  // 音量バー幅計算
  
  // スコア計算
  $: correctCount = scaleResults.filter(result => result).length;
  $: score = Math.round((correctCount / 8) * 100);
</script>

<svelte:head>
  <title>ランダム基音モード - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="random-training">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mode-header">
        <div class="mode-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <div>
          <h1 class="mode-title">ランダム基音モード</h1>
          <p class="mode-description">10種類の基音からランダムに選択してトレーニング</p>
        </div>
      </div>
    </div>

    {#if !isPlaying && !isDetecting && !showResults}
      <!-- 開始画面 -->
      <div class="start-screen">
        <Card variant="default" padding="lg">
          <div class="start-content">
            <h2 class="start-title">トレーニング開始</h2>
            <p class="start-description">
              基音を聞いた後、その音を「ド」として<br>
              ドレミファソラシドを連続して歌ってください
            </p>
            
            <div class="instructions">
              <div class="instruction-item">
                <span class="step-number">1</span>
                <div>
                  <h3>基音を聞く</h3>
                  <p>ランダムに選ばれた基音をピアノで再生します</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">2</span>
                <div>
                  <h3>連続歌唱</h3>
                  <p>基音を「ド」として、ドレミファソラシドを連続して歌います</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <span class="step-number">3</span>
                <div>
                  <h3>自動判定</h3>
                  <p>歌唱中にリアルタイムで各音階を自動判定します</p>
                </div>
              </div>
            </div>

            <Button variant="success" size="lg" fullWidth on:click={startTraining} disabled={!isToneLoaded}>
              {#if !isToneLoaded}
                ピアノ音源読み込み中...
              {:else}
                トレーニング開始
              {/if}
            </Button>
            
            {#if !isToneLoaded}
              <p class="loading-message">
                Salamander Grand Piano 音源を読み込んでいます
              </p>
            {/if}
          </div>
        </Card>
      </div>
    {:else if isPlaying}
      <!-- 基音再生中 -->
      <div class="playing-screen">
        <Card variant="success" padding="lg">
          <div class="playing-content">
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
                <VolumeBar volume={currentVolume} height="20px" />
              </div>
            </Card>

            <!-- 音程表示 -->
            <Card variant="default" padding="md">
              <PitchDisplay 
                frequency={currentFrequency}
                targetNote={scaleNotes[currentScaleIndex]}
                currentNote={currentNote}
                accuracy={0}
                isDetecting={isDetecting}
              />
            </Card>
          </div>
        </div>

        <!-- 進行状況 -->
        <Card variant="default" padding="md">
          <div class="progress-info">
            <h3 class="progress-title">進行状況</h3>
            <div class="progress-details">
              <span>現在: {scaleNotes[currentScaleIndex]} ({currentScaleIndex + 1}/8)</span>
              <span>正解: {correctCount}/{currentScaleIndex}</span>
            </div>
          </div>
        </Card>
      </div>
    {:else if showResults}
      <!-- 結果表示 -->
      <div class="results-screen">
        <Card variant="default" padding="lg">
          <div class="results-content">
            <h2 class="results-title">トレーニング結果</h2>
            
            <!-- スコア表示 -->
            <div class="score-display">
              <div class="score-circle">
                <span class="score-value">{score}</span>
                <span class="score-unit">点</span>
              </div>
              <p class="score-description">
                8音階中 {correctCount}音階 正解
              </p>
            </div>

            <!-- 音階別結果 -->
            <div class="detailed-results">
              <h3 class="details-title">音階別結果</h3>
              <div class="scale-results">
                {#each scaleNotes as note, index}
                  <div class="scale-result">
                    <span class="scale-note-name">{note}</span>
                    <span class="scale-result-icon {scaleResults[index] ? 'correct' : 'incorrect'}">
                      {scaleResults[index] ? '✓' : '×'}
                    </span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="action-buttons">
              <Button variant="success" size="lg" fullWidth on:click={startTraining}>
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
  .random-training {
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
    background-color: #d1fae5;
    color: #059669;
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
    background-color: var(--color-primary);
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

  .playing-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: var(--color-primary-pale);
    color: var(--color-primary);
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
    color: var(--color-primary);
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
    background-color: var(--color-primary);
    animation: progress 2.5s ease-in-out;
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
    background-color: var(--color-primary);
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
    background-color: var(--color-primary-pale);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-3) auto;
    border: 4px solid var(--color-primary);
  }

  .score-value {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--color-primary);
  }

  .score-unit {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-primary);
    margin-left: var(--space-1);
  }

  .score-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .details-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4) 0;
  }

  .scale-results {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--space-2);
    margin-bottom: var(--space-8);
  }

  .scale-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-2);
    border-radius: 8px;
    background-color: var(--color-gray-50);
  }

  .scale-note-name {
    font-weight: 600;
    color: var(--color-gray-900);
    margin-bottom: var(--space-1);
  }

  .scale-result-icon {
    font-size: var(--text-lg);
    font-weight: 600;
  }

  .scale-result-icon.correct {
    color: var(--color-success);
  }

  .scale-result-icon.incorrect {
    color: var(--color-error);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .loading-message {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    text-align: center;
    margin: var(--space-2) 0 0 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 767px) {
    .scale-guide,
    .scale-results {
      grid-template-columns: repeat(4, 1fr);
    }

    .display-grid {
      grid-template-columns: 1fr;
    }

    .mode-header {
      flex-direction: column;
      text-align: center;
    }
  }
</style>