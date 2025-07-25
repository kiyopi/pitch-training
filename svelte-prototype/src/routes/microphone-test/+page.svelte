<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';

  // URL パラメータから mode を取得
  let mode = 'random';
  
  onMount(() => {
    if ($page.url.searchParams.has('mode')) {
      mode = $page.url.searchParams.get('mode') || 'random';
    }
  });

  // マイクテスト状態管理
  let micPermission = 'pending'; // 'pending' | 'granted' | 'denied' | 'error'
  let volumeDetected = false;
  let frequencyDetected = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  let isListening = false;

  // トレーニングモード設定
  const trainingModes = {
    random: {
      name: 'ランダム基音モード',
      description: '10種類の基音からランダムに選択してトレーニング',
      color: 'green',
      path: './training/random'
    },
    continuous: {
      name: '連続チャレンジモード',
      description: '選択した回数だけ連続で実行し、総合評価を確認',
      color: 'orange',
      path: './training/continuous'
    },
    chromatic: {
      name: '12音階モード',
      description: 'クロマチックスケールの上行・下行で完全制覇',
      color: 'purple',
      path: './training/chromatic'
    }
  };

  const selectedMode = trainingModes[mode] || trainingModes.random;
  $: startButtonEnabled = micPermission === 'granted' && volumeDetected && frequencyDetected;

  // 音名変換
  function frequencyToNote(frequency) {
    if (frequency <= 0) return 'C4（ド4）';
    
    const A4 = 440;
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = ((semitonesFromA4 + 9) % 12 + 12) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    const note = noteNames[noteIndex];
    const noteNamesJa = {
      'C': 'ド', 'C#': 'ド#', 'D': 'レ', 'D#': 'レ#', 'E': 'ミ', 'F': 'ファ',
      'F#': 'ファ#', 'G': 'ソ', 'G#': 'ソ#', 'A': 'ラ', 'A#': 'ラ#', 'B': 'シ'
    };
    
    return `${note}${octave}（${noteNamesJa[note]}${octave}）`;
  }

  // マイク許可テスト（モック）
  function requestMicrophone() {
    micPermission = 'pending';
    // モック処理：実際のマイク許可をシミュレート
    setTimeout(() => {
      micPermission = 'granted';
      startListening();
    }, 1000);
  }

  // リスニング開始（モック）
  function startListening() {
    if (micPermission !== 'granted') return;
    
    isListening = true;
    
    // モック：音量・周波数データのシミュレート
    const interval = setInterval(() => {
      if (!isListening) {
        clearInterval(interval);
        return;
      }
      
      // ランダムな音量（0-100）
      currentVolume = Math.random() * 100;
      if (currentVolume > 20) {
        volumeDetected = true;
      }
      
      // ランダムな周波数（C3-C6の範囲）
      const frequencies = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63];
      currentFrequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      currentNote = frequencyToNote(currentFrequency);
      
      if (currentFrequency > 0) {
        frequencyDetected = true;
      }
    }, 200);
  }

  onMount(() => {
    // ページ読み込み時にマイク許可をリクエスト
    setTimeout(() => {
      requestMicrophone();
    }, 500);
  });
</script>

<svelte:head>
  <title>マイクテスト - 相対音感トレーニング</title>
</svelte:head>

<PageLayout showBackButton={true}>
  <div class="microphone-test">
    <!-- ヘッダー -->
    <div class="header">
      <div class="mode-info">
        <div class="mode-icon {selectedMode.color}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            {#if selectedMode.color === 'green'}
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            {:else if selectedMode.color === 'orange'}
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            {:else}
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            {/if}
          </svg>
        </div>
        <div>
          <h1 class="mode-title">{selectedMode.name}</h1>
          <p class="mode-description">{selectedMode.description}</p>
        </div>
      </div>
    </div>

    <!-- マイクテストセクション -->
    <div class="test-section">
      <Card variant="default" padding="lg">
        <div class="mic-test-content">
          <h2 class="section-title">マイクロフォンテスト</h2>
          <p class="section-description">
            音感トレーニングを始める前に、マイクの動作を確認します
          </p>

          <!-- マイク許可状態 -->
          <div class="status-card">
            <div class="status-item">
              <div class="status-icon {micPermission === 'granted' ? 'success' : 'pending'}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1v6l4-4-4-4z"/>
                  <path d="M12 17.5c-2.5 0-4.5-2-4.5-4.5V7c0-2.5 2-4.5 4.5-4.5S16.5 4.5 16.5 7v6c0 2.5-2 4.5-4.5 4.5z"/>
                </svg>
              </div>
              <div>
                <span class="status-label">マイク許可</span>
                <span class="status-value">
                  {#if micPermission === 'pending'}
                    許可を要求中...
                  {:else if micPermission === 'granted'}
                    ✅ 許可済み
                  {:else if micPermission === 'denied'}
                    ❌ 拒否されました
                  {:else}
                    ❌ エラーが発生しました
                  {/if}
                </span>
              </div>
            </div>
          </div>

          <!-- リアルタイム表示 -->
          {#if micPermission === 'granted'}
            <div class="realtime-display">
              <!-- 音量レベル -->
              <div class="volume-section">
                <h3 class="display-title">音量レベル</h3>
                <div class="volume-bar-container">
                  <div class="volume-bar">
                    <div class="volume-fill" style="width: {currentVolume}%"></div>
                  </div>
                  <span class="volume-text">{Math.round(currentVolume)}%</span>
                </div>
                <div class="volume-status">
                  {#if volumeDetected}
                    <span class="status-success">✅ 音量を検出しています</span>
                  {:else}
                    <span class="status-pending">⏳ 声を出して音量を確認してください</span>
                  {/if}
                </div>
              </div>

              <!-- 周波数・音程表示 -->
              <div class="frequency-section">
                <h3 class="display-title">音程検出</h3>
                <div class="frequency-display">
                  <div class="frequency-value">{currentFrequency.toFixed(1)} Hz</div>
                  <div class="note-value">{currentNote}</div>
                </div>
                <div class="frequency-status">
                  {#if frequencyDetected}
                    <span class="status-success">✅ 音程を検出しています</span>
                  {:else}
                    <span class="status-pending">⏳ 「ド」を発声して音程を確認してください</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- ガイダンス -->
            {#if volumeDetected && !frequencyDetected}
              <div class="guidance">
                <div class="guidance-content">
                  <h3>「ド」を発声してください</h3>
                  <p>任意の高さで「ドー」と歌うように発声してください</p>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </Card>
    </div>

    <!-- スタートボタン -->
    <div class="start-section">
      <Card variant="default" padding="lg">
        <div class="start-content">
          <h3 class="start-title">準備完了</h3>
          <p class="start-description">
            マイクの動作確認が完了したら、トレーニングを開始できます
          </p>
          
          {#if startButtonEnabled}
            <Button 
              href={selectedMode.path} 
              variant="primary" 
              size="lg" 
              fullWidth
            >
              トレーニング開始
            </Button>
          {:else}
            <Button 
              variant="disabled" 
              size="lg" 
              fullWidth 
              disabled
            >
              マイクテスト完了後に開始
            </Button>
          {/if}
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

  .mode-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .mode-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .mode-icon.green {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .mode-icon.orange {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .mode-icon.purple {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .mode-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .mode-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .mic-test-content {
    text-align: center;
  }

  .section-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .section-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
  }

  .status-card {
    margin-bottom: var(--space-6);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-gray-50);
    border-radius: 8px;
  }

  .status-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .status-icon.pending {
    background-color: var(--color-gray-200);
    color: var(--color-gray-600);
  }

  .status-icon.success {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .status-label {
    display: block;
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .status-value {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-gray-600);
  }

  .realtime-display {
    display: grid;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
  }

  .display-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-3) 0;
  }

  .volume-bar-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .volume-bar {
    flex: 1;
    height: 12px;
    background: var(--color-gray-200);
    border-radius: 6px;
    overflow: hidden;
  }

  .volume-fill {
    height: 100%;
    background: linear-gradient(to right, #3b82f6, #93c5fd);
    transition: width 0.1s ease;
  }

  .volume-text {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-gray-700);
    min-width: 40px;
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
  }

  .status-success {
    color: var(--color-success);
    font-weight: 600;
  }

  .status-pending {
    color: var(--color-gray-600);
  }

  .guidance {
    padding: var(--space-4);
    background: #dbeafe;
    border-radius: 8px;
    border: 1px solid #93c5fd;
  }

  .guidance-content h3 {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-1) 0;
  }

  .guidance-content p {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
  }

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
  }

  @media (min-width: 768px) {
    .mode-info {
      flex-direction: row;
      text-align: left;
    }

    .realtime-display {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>