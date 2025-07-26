<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';

  // 基本状態管理
  let trainingPhase = 'setup'; // 'setup' | 'listening' | 'detecting' | 'completed'
  let microphoneState = 'checking'; // 'checking' | 'granted' | 'denied' | 'error'
  
  // 基音関連
  let currentBaseNote = '';
  let currentBaseFrequency = 0;
  let isPlaying = false;
  
  // 音程ガイド
  let currentScaleIndex = 0;
  let scaleSteps = [
    { name: 'ド', state: 'inactive', completed: false },
    { name: 'レ', state: 'inactive', completed: false },
    { name: 'ミ', state: 'inactive', completed: false },
    { name: 'ファ', state: 'inactive', completed: false },
    { name: 'ソ', state: 'inactive', completed: false },
    { name: 'ラ', state: 'inactive', completed: false },
    { name: 'シ', state: 'inactive', completed: false },
    { name: 'ド（高）', state: 'inactive', completed: false }
  ];
  
  // 音程検出
  let currentVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchDifference = 0;
  
  // セッション結果
  let sessionResults = {
    correctCount: 0,
    totalCount: 8,
    averageAccuracy: 0,
    averageTime: 0,
    isCompleted: false
  };

  // 基音候補（10種類）
  const baseNotes = [
    { note: 'C4', name: 'ド（低）', frequency: 261.63 },
    { note: 'D4', name: 'レ（低）', frequency: 293.66 },
    { note: 'E4', name: 'ミ（低）', frequency: 329.63 },
    { note: 'F4', name: 'ファ（低）', frequency: 349.23 },
    { note: 'G4', name: 'ソ（低）', frequency: 392.00 },
    { note: 'A4', name: 'ラ（中）', frequency: 440.00 },
    { note: 'B4', name: 'シ（中）', frequency: 493.88 },
    { note: 'C5', name: 'ド（高）', frequency: 523.25 },
    { note: 'D5', name: 'レ（高）', frequency: 587.33 },
    { note: 'E5', name: 'ミ（高）', frequency: 659.25 }
  ];

  // マイクロフォン許可チェック
  async function checkMicrophonePermission() {
    microphoneState = 'checking';
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        microphoneState = 'error';
        return;
      }
      
      // 簡単な許可チェック
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      microphoneState = 'granted';
      trainingPhase = 'setup';
    } catch (error) {
      console.error('マイク許可エラー:', error);
      microphoneState = (error && error.name === 'NotAllowedError') ? 'denied' : 'error';
    }
  }

  // ランダム基音選択
  function selectRandomBaseNote() {
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    const selectedNote = baseNotes[randomIndex];
    currentBaseNote = selectedNote.name;
    currentBaseFrequency = selectedNote.frequency;
    console.log('選択された基音:', currentBaseNote, currentBaseFrequency + 'Hz');
  }

  // 基音再生（プレースホルダー）
  async function playBaseNote() {
    if (isPlaying) return;
    
    isPlaying = true;
    selectRandomBaseNote();
    
    // TODO: Tone.js実装
    console.log('基音再生:', currentBaseNote);
    
    // 3秒後に検出フェーズに移行
    setTimeout(() => {
      isPlaying = false;
      trainingPhase = 'detecting';
      scaleSteps[0].state = 'active'; // 最初の「ド」をアクティブに
    }, 3000);
  }

  // スケールガイドの状態取得
  function getScaleVariant(state) {
    switch (state) {
      case 'active': return 'warning';
      case 'correct': return 'success';
      case 'incorrect': return 'default';
      default: return 'default';
    }
  }

  // ステータスメッセージ取得
  function getStatusMessage() {
    switch (trainingPhase) {
      case 'setup':
        return '🎤 マイク準備完了 - トレーニング開始可能';
      case 'listening':
        return '🎵 基音再生中...';
      case 'detecting':
        return '🎙️ 練習中 - ドレミファソラシドを歌ってください';
      case 'completed':
        return '🎉 セッション完了！';
      default:
        return '🔄 準備中...';
    }
  }

  // マイクテストページへの誘導
  function goToMicrophoneTest() {
    window.location.href = '/microphone-test?mode=random';
  }

  // ホームページに戻る
  function goHome() {
    window.location.href = '/';
  }

  // 初期化
  onMount(() => {
    checkMicrophonePermission();
  });
</script>

<PageLayout>
  <!-- Header -->
  <div class="header-section">
    <h1 class="page-title">🎵 ランダム基音トレーニング</h1>
    <p class="page-description">10種類の基音からランダムに選択してドレミファソラシドを練習</p>
  </div>

  <!-- Status Bar -->
  <Card variant="primary" class="status-card">
    <div class="status-content">
      <div class="status-message">{getStatusMessage()}</div>
      {#if trainingPhase === 'detecting'}
        <div class="progress-indicator">
          進行状況: {currentScaleIndex + 1}/8
        </div>
      {/if}
    </div>
  </Card>

  {#if microphoneState === 'granted'}
    <!-- メイントレーニングインターフェース -->
    
    <!-- Base Tone Section -->
    <Card class="main-card">
      <div class="card-header">
        <h3 class="section-title">🎹 基音再生</h3>
      </div>
      <div class="card-content">
        <Button 
          class="primary-button {isPlaying ? 'playing' : ''}"
          disabled={isPlaying || trainingPhase === 'detecting'}
          on:click={playBaseNote}
        >
          {#if isPlaying}
            🎵 再生中...
          {:else if trainingPhase === 'setup'}
            🎹 ランダム基音再生
          {:else}
            🔄 再生
          {/if}
        </Button>
        
        {#if currentBaseNote}
          <div class="base-note-info">
            現在の基音: <strong>{currentBaseNote}</strong> ({currentBaseFrequency.toFixed(1)}Hz)
          </div>
        {/if}
      </div>
    </Card>

    <!-- Scale Guide Section -->
    <Card class="main-card">
      <div class="card-header">
        <h3 class="section-title">🎵 相対音程ガイド</h3>
      </div>
      <div class="card-content">
        <div class="scale-guide">
          {#each scaleSteps as step, index}
            <div 
              class="scale-item {step.state}"
              class:current={index === currentScaleIndex}
            >
              {step.name}
            </div>
          {/each}
        </div>
        {#if trainingPhase === 'detecting'}
          <div class="guide-instruction">
            現在: <strong>{scaleSteps[currentScaleIndex].name}</strong> を歌ってください
          </div>
        {/if}
      </div>
    </Card>

    <!-- Detection Section -->
    {#if trainingPhase === 'detecting'}
      <Card class="main-card">
        <div class="card-header">
          <h3 class="section-title">🎙️ リアルタイム音程検出</h3>
        </div>
        <div class="card-content">
          <div class="detection-display">
            <div class="detected-info">
              <span class="detected-label">検出中:</span>
              <span class="detected-note">{detectedNote}</span>
              <span class="pitch-diff">({pitchDifference > 0 ? '+' : ''}{pitchDifference}セント)</span>
            </div>
            
            <div class="volume-section">
              <div class="volume-label">音量レベル: {Math.round(currentVolume)}%</div>
              <VolumeBar volume={currentVolume} className="modern-volume-bar" />
            </div>
          </div>
        </div>
      </Card>
    {/if}

    <!-- Results Section -->
    {#if sessionResults.isCompleted}
      <Card class="main-card results-card">
        <div class="card-header">
          <h3 class="section-title">🎉 セッション完了</h3>
        </div>
        <div class="card-content">
          <div class="results-summary">
            <div class="result-item">
              <span class="result-label">正解率</span>
              <span class="result-value success">{sessionResults.correctCount}/{sessionResults.totalCount} ({Math.round(sessionResults.correctCount / sessionResults.totalCount * 100)}%)</span>
            </div>
            <div class="result-item">
              <span class="result-label">平均精度</span>
              <span class="result-value">{sessionResults.averageAccuracy}%</span>
            </div>
            <div class="result-item">
              <span class="result-label">平均時間</span>
              <span class="result-value">{sessionResults.averageTime}秒</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <Button class="primary-button" on:click={() => window.location.reload()}>
              🔄 再挑戦
            </Button>
            <Button class="secondary-button">
              🎊 SNS共有
            </Button>
            <Button class="secondary-button" on:click={goHome}>
              🏠 ホーム
            </Button>
          </div>
        </div>
      </Card>
    {/if}

  {:else if microphoneState === 'checking'}
    <!-- Loading State -->
    <Card class="error-card">
      <div class="error-content">
        <div class="loading-icon">🔄</div>
        <h3>マイク状態確認中...</h3>
        <p>マイクロフォンの使用許可を確認しています。</p>
      </div>
    </Card>

  {:else if microphoneState === 'denied' || microphoneState === 'error'}
    <!-- Error State -->
    <Card class="error-card">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>マイクアクセスが必要です</h3>
        <p>このトレーニングには音声入力が必要です。</p>
        
        <div class="recommendation">
          <p><strong>推奨:</strong> マイクテストページで音声確認後ご利用ください</p>
        </div>
        
        <div class="action-buttons">
          <Button class="primary-button" on:click={goToMicrophoneTest}>
            🎤 マイクテストページに移動
          </Button>
          <Button class="secondary-button" on:click={checkMicrophonePermission}>
            🔄 再試行
          </Button>
        </div>
      </div>
    </Card>
  {/if}
</PageLayout>

<style>
  /* === shadcn/ui風モダンデザイン === */
  
  /* ヘッダーセクション */
  .header-section {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 0.5rem;
  }
  
  .page-description {
    color: hsl(215.4 16.3% 46.9%);
    font-size: 1rem;
    margin: 0;
  }

  /* カードスタイル（shadcn/ui風） */
  :global(.main-card) {
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    background: hsl(0 0% 100%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06) !important;
    margin-bottom: 1.5rem;
  }
  
  :global(.status-card) {
    border-radius: 8px !important;
    margin-bottom: 1.5rem;
  }
  
  :global(.error-card) {
    border: 1px solid hsl(0 84.2% 60.2%) !important;
    background: hsl(0 84.2% 97%) !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important;
  }
  
  :global(.results-card) {
    border: 1px solid hsl(142.1 76.2% 36.3%) !important;
    background: linear-gradient(135deg, hsl(142.1 76.2% 95%) 0%, hsl(0 0% 100%) 100%) !important;
  }

  /* カードヘッダー */
  .card-header {
    padding-bottom: 1rem;
    border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin: 0;
  }

  /* カードコンテンツ */
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ステータス表示 */
  .status-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .status-message {
    font-weight: 500;
    color: hsl(222.2 84% 4.9%);
  }
  
  .progress-indicator {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  /* ボタンスタイル（shadcn/ui風） */
  :global(.primary-button) {
    background: hsl(222.2 47.4% 11.2%) !important;
    color: hsl(210 40% 98%) !important;
    border: 1px solid hsl(222.2 47.4% 11.2%) !important;
    border-radius: 6px !important;
    padding: 0.75rem 1.5rem !important;
    font-weight: 500 !important;
    min-width: 200px;
    transition: all 0.2s ease !important;
  }
  
  :global(.primary-button:hover) {
    background: hsl(222.2 47.4% 8%) !important;
    border-color: hsl(222.2 47.4% 8%) !important;
  }
  
  :global(.primary-button:disabled) {
    background: hsl(210 40% 96%) !important;
    color: hsl(215.4 16.3% 46.9%) !important;
    border-color: hsl(214.3 31.8% 91.4%) !important;
    cursor: not-allowed !important;
  }
  
  :global(.primary-button.playing) {
    background: hsl(47.9 95.8% 53.1%) !important;
    border-color: hsl(47.9 95.8% 53.1%) !important;
    color: hsl(222.2 84% 4.9%) !important;
  }
  
  :global(.secondary-button) {
    background: hsl(210 40% 96%) !important;
    color: hsl(222.2 84% 4.9%) !important;
    border: 1px solid hsl(214.3 31.8% 91.4%) !important;
    border-radius: 6px !important;
    padding: 0.5rem 1rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
  }
  
  :global(.secondary-button:hover) {
    background: hsl(210 40% 94%) !important;
  }

  /* 基音情報 */
  .base-note-info {
    text-align: center;
    padding: 1rem;
    background: hsl(210 40% 98%);
    border-radius: 6px;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  /* スケールガイド */
  .scale-guide {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .scale-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    background: hsl(0 0% 100%);
    color: hsl(215.4 16.3% 46.9%);
    transition: all 0.3s ease;
  }
  
  .scale-item.active {
    background: hsl(47.9 95.8% 53.1%);
    color: hsl(222.2 84% 4.9%);
    border-color: hsl(47.9 95.8% 53.1%);
    transform: scale(1.05);
    box-shadow: 0 4px 8px 0 rgb(245 158 11 / 0.3);
  }
  
  .scale-item.correct {
    background: hsl(142.1 76.2% 36.3%);
    color: hsl(210 40% 98%);
    border-color: hsl(142.1 76.2% 36.3%);
  }
  
  .scale-item.current {
    box-shadow: 0 0 0 2px hsl(222.2 84% 4.9%);
  }
  
  .guide-instruction {
    text-align: center;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    padding: 0.75rem;
    background: hsl(210 40% 98%);
    border-radius: 6px;
  }

  /* 検出表示 */
  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .detected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .detected-label {
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .detected-note {
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
  }
  
  .pitch-diff {
    color: hsl(47.9 95.8% 40%);
    font-weight: 500;
  }
  
  .volume-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .volume-label {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }
  
  :global(.modern-volume-bar) {
    border-radius: 4px !important;
  }

  /* 結果表示 */
  .results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .result-item {
    text-align: center;
    padding: 1rem;
    border-radius: 6px;
    background: hsl(0 0% 100%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
  }
  
  .result-label {
    display: block;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 0.25rem;
  }
  
  .result-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: hsl(222.2 84% 4.9%);
  }
  
  .result-value.success {
    color: hsl(142.1 76.2% 36.3%);
  }

  /* アクションボタン */
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* エラー表示 */
  .error-content {
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .error-icon, .loading-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .error-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    margin-bottom: 0.5rem;
  }
  
  .error-content p {
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 1rem;
  }
  
  .recommendation {
    background: hsl(210 40% 98%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .recommendation p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* レスポンシブ対応 */
  @media (min-width: 768px) {
    .scale-guide {
      grid-template-columns: repeat(8, 1fr);
    }
    
    .page-title {
      font-size: 2.5rem;
    }
    
    .results-summary {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (max-width: 640px) {
    .status-content {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .action-buttons {
      flex-direction: column;
    }
    
    :global(.primary-button), :global(.secondary-button) {
      min-width: 100% !important;
    }
  }
</style>