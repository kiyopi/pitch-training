<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import PitchDetector from '$lib/components/PitchDetector.svelte';
  import { audioManager } from '$lib/audio/AudioManager.js';
  
  // URL パラメータから mode を取得
  let mode = 'random';
  
  onMount(() => {
    if ($page.url.searchParams.has('mode')) {
      mode = $page.url.searchParams.get('mode') || 'random';
    }
  });

  // マイクテスト状態管理（PitchDetector対応版）
  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied'
  let isListening = false;       // PitchDetectorが動作中かどうか
  let volumeDetected = false;
  let frequencyDetected = false;
  let audioConfirmationComplete = false;
  
  // PitchDetectorから取得するデータ
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = 'ーー';
  let pitchClarity = 0;
  
  // ノイズリダクション効果確認用
  let rawVolume = 0;        // フィルター前の音量（PitchDetectorから取得）
  let filteredVolume = 0;   // フィルター後の音量（PitchDetectorから取得）
  let noiseReduction = 0;   // ノイズ削減率（%）
  
  // PitchDetectorコンポーネント参照
  let pitchDetectorComponent = null;

  // トレーニングモード設定
  const trainingModes = {
    random: {
      name: 'ランダム基音モード',
      description: '10種類の基音からランダムに選択してトレーニング',
      color: 'green',
      path: '/training/random'
    },
    continuous: {
      name: '連続チャレンジモード',
      description: '選択した回数だけ連続で実行し、総合評価を確認',
      color: 'orange',
      path: '/training/continuous'
    },
    chromatic: {
      name: '12音階モード',
      description: 'クロマチックスケールの上行・下行で完全制覇',
      color: 'purple',
      path: '/training/chromatic'
    }
  };

  const selectedMode = trainingModes[mode] || trainingModes.random;
  
  // ボタン状態の計算
  $: {
    if (volumeDetected && frequencyDetected && !audioConfirmationComplete) {
      // 音声確認完了の即座設定
      audioConfirmationComplete = true;
    }
  }
  
  // マイク許可リクエスト（PitchDetector対応版）
  async function requestMicrophone() {
    micPermission = 'pending';
    
    try {
      console.log('🎤 [MicTest] PitchDetector経由でマイク許可リクエスト開始');
      
      // PitchDetectorを初期化（AudioManager統合済み）
      if (pitchDetectorComponent) {
        await pitchDetectorComponent.initialize();
        console.log('✅ [MicTest] PitchDetector初期化完了');
      }
      
      micPermission = 'granted';
      isListening = true;  // PitchDetectorがアクティブになる
      console.log('✅ [MicTest] マイク許可完了');
      
    } catch (error) {
      console.error('❌ [MicTest] マイク許可エラー:', error);
      micPermission = 'denied';
    }
  }
  
  // PitchDetectorからの音程更新イベントハンドラー
  function handlePitchUpdate(event) {
    const { frequency, note, volume, rawVolume: rawVol, clarity } = event.detail;
    
    // データを更新
    currentFrequency = frequency;
    currentNote = note;
    currentVolume = volume;
    pitchClarity = clarity;
    
    // ノイズリダクション効果の表示用
    rawVolume = rawVol;
    filteredVolume = volume;
    
    // ノイズ削減率計算（フィルター前後の差分）
    if (rawVolume > 0) {
      noiseReduction = Math.max(0, Math.round(((rawVolume - filteredVolume) / rawVolume) * 100));
    } else {
      noiseReduction = 0;
    }
    
    // 検出判定
    if (currentVolume > 5) {  // 閾値を下げて感度を上げる
      volumeDetected = true;
    }
    
    if (frequency > 80 && frequency < 800) {
      frequencyDetected = true;
    }
    
    // デバッグログ（最初の数回のみ）
    if (!window.micTestDebugCount) window.micTestDebugCount = 0;
    if (window.micTestDebugCount < 5) {
      window.micTestDebugCount++;
      console.log(`🎙️ [MicTest] PitchUpdate ${window.micTestDebugCount}:`, {
        frequency: frequency.toFixed(1),
        volume: volume.toFixed(1),
        rawVolume: rawVol.toFixed(1),
        note
      });
    }
  }
  
  // PitchDetectorエラーハンドラー
  function handlePitchDetectorError(event) {
    const { error, reason, recovery } = event.detail;
    console.error('🚨 [MicTest] PitchDetectorエラー:', { error, reason, recovery });
    
    if (reason === 'mediastream_ended') {
      console.error('🚨 [MicTest] MediaStream終了 - マイク許可をリセット');
      micPermission = 'denied';
      isListening = false;
      volumeDetected = false;
      frequencyDetected = false;
      audioConfirmationComplete = false;
      
      // ユーザーに再試行を促す
      alert('マイクアクセスが中断されました。マイクテストを再開してください。');
    }
  }
  
  // PitchDetector警告ハンドラー
  function handlePitchDetectorWarning(event) {
    const { reason, track } = event.detail;
    console.warn('⚠️ [MicTest] PitchDetector警告:', { reason, track });
    
    if (reason === 'track_muted') {
      console.warn('⚠️ [MicTest] マイクがミュート状態です');
    }
  }
  
  // リスニング停止（PitchDetector対応版）
  function stopListening() {
    console.log('🛑 [MicTest] リスニング停止開始');
    
    // PitchDetectorの検出を停止
    if (pitchDetectorComponent) {
      pitchDetectorComponent.stopDetection();
      console.log('✅ [MicTest] PitchDetector検出停止');
    }
    
    console.log('✅ [MicTest] リスニング停止完了');
  }
  
  // トレーニング開始関数
  function startTraining() {
    console.log('🚀 [MicTest] トレーニング開始 - ランダム基音モードへ遷移');
    goto(`${base}/training/random?from=microphone-test`);
  }
  
  // ページ離脱時のクリーンアップ
  onDestroy(() => {
    stopListening();
  });
</script>

<svelte:head>
  <title>マイクテスト - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <!-- PitchDetectorコンポーネント（非表示で音声処理のみ） -->
  <div style="display: none;">
    <PitchDetector
      bind:this={pitchDetectorComponent}
      isActive={micPermission === 'granted'}
      on:pitchUpdate={handlePitchUpdate}
      on:error={handlePitchDetectorError}
      on:warning={handlePitchDetectorWarning}
      debugMode={true}
    />
  </div>

  <div class="microphone-test">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mic-test-header">
        <div class="mic-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
            <line x1="8" x2="16" y1="22" y2="22"/>
          </svg>
        </div>
        <div>
          <h1 class="mic-test-title">マイクテスト</h1>
          <p class="mic-test-description">音感トレーニングを始める前に、マイクの動作を確認します</p>
        </div>
      </div>
    </div>

    <!-- トレーニングモード情報 -->
    <div class="training-mode-info">
      <Card variant="default" padding="lg">
        <div class="training-mode-content">
          {#if !audioConfirmationComplete}
            <!-- マイクテスト段階の表示 -->
            {#if micPermission === 'granted' && isListening && (!volumeDetected || !frequencyDetected)}
              <!-- 音声確認中は説明非表示 -->
              <p class="status-text voice-instruction">「ドー」と発声してください</p>
            {:else}
              <!-- 通常のマイクテスト説明 -->
              <h3 class="instructions-title">マイクのテストを開始します</h3>
              <p class="instructions-description">マイクテスト開始ボタンを押してマイクの使用を許可してください</p>
            {/if}
            
            {#if micPermission === 'pending'}
              <p class="status-text">マイク準備中...</p>
            {:else if micPermission === 'denied'}
              <div class="mic-test-button-area">
                <button class="mic-test-button retry" on:click={requestMicrophone}>
                  マイク許可を再試行
                </button>
              </div>
            {:else if micPermission === 'initial'}
              <div class="mic-test-button-area">
                <button class="mic-test-button start" on:click={requestMicrophone}>
                  マイクテストを開始
                </button>
              </div>
            {/if}
          {:else}
            <!-- トレーニング開始段階の表示 -->
            <h3 class="ready-title">マイク準備完了</h3>
            <p class="ready-description">トレーニング開始ボタンを押してランダム基音モードへ進んでください</p>
            
            <div class="training-start-button-area">
              <button class="training-start-button enabled" on:click={startTraining}>
                トレーニング開始
              </button>
            </div>
          {/if}
        </div>
      </Card>
    </div>

    <!-- マイクテストセクション -->
    <div class="test-section">
      <!-- 音量レベルカード -->
      <Card variant="default" padding="lg">
        <div class="card-inner">
          <div class="volume-section">
            <h3 class="display-title">音量レベル</h3>
            <div class="volume-bar-container">
              <div class="volume-bar" style="width: {currentVolume}%"></div>
            </div>
            <div class="volume-text">{currentVolume.toFixed(1)}%</div>
            
            <!-- ノイズリダクション効果表示 -->
            {#if isListening}
              <div class="noise-reduction-info">
                <div class="noise-stats">
                  <div class="stat-item">
                    <span class="stat-label">フィルター前:</span>
                    <span class="stat-value raw">{rawVolume.toFixed(1)}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">フィルター後:</span>
                    <span class="stat-value filtered">{filteredVolume.toFixed(1)}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">ノイズ削減:</span>
                    <span class="stat-value reduction">{noiseReduction}%</span>
                  </div>
                </div>
              </div>
            {/if}
            
            <div class="volume-status">
              <span class="status-pending">
                {#if !volumeDetected && isListening}
                  ⏳ 声を出して音量を確認してください
                {:else}
                  &nbsp;
                {/if}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <!-- 音程検出カード -->
      <Card variant="default" padding="lg">
        <div class="card-inner">
          <div class="frequency-section">
            <h3 class="display-title">音程検出</h3>
            <div class="frequency-display">
              <div class="frequency-value">{currentFrequency > 0 ? currentFrequency.toFixed(1) + ' Hz' : 'ーー'}</div>
              <div class="note-value">{currentNote}</div>
            </div>
            <div class="frequency-status">
              <span class="status-pending">
                {#if !frequencyDetected && isListening}
                  ⏳ 「ド」を発声して音程を確認してください
                {:else}
                  &nbsp;
                {/if}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>

  </div>
</PageLayout>

<style>
  .microphone-test {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .header {
    text-align: center;
  }

  .mic-test-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .mic-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #dbeafe;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mic-test-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .mic-test-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .training-mode-info {
    margin-bottom: var(--space-6);
  }

  .training-mode-content {
    text-align: center;
  }

  .training-mode-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .training-mode-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .mic-test-instructions {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .instructions-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: var(--space-4) 0 var(--space-2) 0;
    text-align: center;
  }

  .instructions-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
    text-align: center;
  }

  .status-text {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: var(--space-6) 0;
    text-align: center;
  }

  .status-text.voice-instruction {
    color: #2563eb;
    font-size: var(--text-xl);
    font-weight: 700;
  }

  .ready-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: #2563eb;
    margin: var(--space-4) 0 var(--space-2) 0;
    text-align: center;
  }

  .ready-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
    text-align: center;
  }

  .mic-test-button-area,
  .training-start-button-area {
    margin-top: var(--space-6);
    display: flex;
    justify-content: center;
  }

  .mic-test-button {
    max-width: 300px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .mic-test-button.start {
    background-color: #2563eb;
    color: white;
  }

  .mic-test-button.start:hover {
    background-color: #1d4ed8;
  }

  .mic-test-button.preparing {
    background-color: #f59e0b;
    color: white;
    cursor: not-allowed;
  }

  .mic-test-button.confirming {
    background-color: #8b5cf6;
    color: white;
    cursor: not-allowed;
  }

  .mic-test-button.retry {
    background-color: #dc2626;
    color: white;
  }

  .mic-test-button.retry:hover {
    background-color: #b91c1c;
  }

  .training-start-button {
    max-width: 300px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #059669;
    color: white;
  }

  .training-start-button.enabled:hover {
    background-color: #047857;
  }

  .mic-status-granted {
    margin-bottom: var(--space-4);
    text-align: center;
  }

  .status-indicator.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #34d399;
  }

  .mic-test-content {
    text-align: center;
  }

  .mic-status {
    margin-bottom: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .status-indicator {
    padding: var(--space-3);
    border-radius: 8px;
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .status-indicator.pending {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }


  .status-indicator.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .start-button,
  .retry-button {
    max-width: 300px;
    width: 100%;
    margin: 0 auto;
    padding: 12px 16px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .start-button:hover,
  .retry-button:hover {
    background-color: #1d4ed8;
  }

  .training-button {
    max-width: 300px;
    width: 100%;
    margin: 0 auto;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .training-button.enabled {
    background-color: #059669;
    color: white;
  }

  .training-button.enabled:hover {
    background-color: #047857;
  }

  .training-button.disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .guidance-text {
    font-size: var(--text-sm);
    color: #2563eb;
    font-weight: 600;
    margin-bottom: var(--space-2);
    text-align: center;
  }

  .test-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .display-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-3) 0;
  }

  .card-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }
  
  .volume-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    width: 100%;
  }
  
  .frequency-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .volume-bar-container {
    width: 100%;
    height: 20px;
    background-color: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: var(--space-2);
  }

  .volume-bar {
    height: 100%;
    background-color: #2563eb;
    border-radius: 10px;
    transition: width 0.1s ease;
  }

  .volume-text {
    text-align: center;
    font-weight: 600;
    color: var(--color-gray-700);
    margin-bottom: var(--space-2);
  }

  .frequency-display {
    margin-bottom: var(--space-2);
  }

  .frequency-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin-bottom: var(--space-1);
  }

  .note-value {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .volume-status,
  .frequency-status {
    text-align: center;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }


  .status-pending {
    color: var(--color-gray-600);
  }

  /* ノイズリダクション効果表示 */
  .noise-reduction-info {
    margin: var(--space-3) 0;
    padding: var(--space-3);
    background-color: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .noise-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-sm);
  }

  .stat-label {
    color: var(--color-gray-600);
    font-weight: 500;
  }

  .stat-value {
    font-weight: 600;
    font-family: 'Monaco', 'Menlo', monospace;
  }

  .stat-value.raw {
    color: #dc2626; /* 赤: フィルター前（ノイズ含む） */
  }

  .stat-value.filtered {
    color: #2563eb; /* 青: フィルター後（クリーン） */
  }

  .stat-value.reduction {
    color: #059669; /* 緑: 削減効果 */
    font-weight: 700;
  }

  .start-content {
    text-align: center;
  }

  @media (min-width: 768px) {
    .mic-test-header {
      flex-direction: row;
      text-align: left;
    }

    .test-section {
      flex-direction: row;
      align-items: stretch;
    }
    
    .test-section > :global(.card) {
      flex: 1;
    }
  }
</style>