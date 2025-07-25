<script>
  import { onMount, onDestroy } from 'svelte';
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

  // マイクテスト状態管理（シンプル版）
  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied'
  let isListening = false;
  let volumeDetected = false;
  let frequencyDetected = false;
  let audioConfirmationComplete = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  
  // Web Audio API変数
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let animationFrame = null;

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
  
  // ボタン状態の計算
  $: {
    if (volumeDetected && frequencyDetected && !audioConfirmationComplete) {
      // 音声確認完了の即座設定
      audioConfirmationComplete = true;
    }
  }
  
  // マイク許可リクエスト（シンプル版）
  async function requestMicrophone() {
    micPermission = 'pending';
    
    try {
      // シンプルな設定でマイクアクセス
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micPermission = 'granted';
      
      // AudioContextをユーザーアクション内で作成
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // AudioContextがsuspendedの場合は再開
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // アナライザー設定（最適化）
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      
      isListening = true;
      analyzeAudio();
      
    } catch (error) {
      micPermission = 'denied';
    }
  }
  
  // 音声解析ループ（最適化済み）
  function analyzeAudio() {
    if (!isListening || !analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // 周波数データ取得
    analyser.getByteFrequencyData(dataArray);
    
    // RMS音量計算（マイクレベル最適化）
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    currentVolume = Math.min(100, (rms / 64) * 100);
    
    if (currentVolume > 15) {
      volumeDetected = true;
    }
    
    // 時間領域データ取得
    const timeDataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDataArray);
    
    // 音程検出
    const frequency = detectPitch(timeDataArray, audioContext.sampleRate);
    if (frequency > 80 && frequency < 800) {
      currentFrequency = frequency;
      currentNote = frequencyToNote(frequency);
      frequencyDetected = true;
    } else {
      currentFrequency = 0;
      currentNote = '';
    }
    
    animationFrame = requestAnimationFrame(analyzeAudio);
  }
  
  // シンプルな音程検出（最適化済み）
  function detectPitch(buffer, sampleRate) {
    // 音量チェック
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.005) return 0;
    
    // 自己相関関数
    const minPeriod = Math.floor(sampleRate / 800);
    const maxPeriod = Math.floor(sampleRate / 80);
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let normalizer = 0;
      
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
        normalizer += buffer[i] * buffer[i];
      }
      
      if (normalizer > 0) {
        correlation = correlation / Math.sqrt(normalizer);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
    }
    
    return bestCorrelation > 0.25 ? sampleRate / bestPeriod : 0;
  }
  
  // 周波数から音名へ変換
  function frequencyToNote(frequency) {
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
  
  // リスニング停止
  function stopListening() {
    isListening = false;
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    analyser = null;
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
            <h3 class="instructions-title">マイクのテストを開始します</h3>
            <p class="instructions-description">マイクテスト開始ボタンを押してマイクの使用を許可してください</p>
            
            {#if micPermission === 'pending'}
              <p class="status-text">マイク準備中...</p>
            {:else if micPermission === 'granted' && isListening && (!volumeDetected || !frequencyDetected)}
              <p class="status-text voice-instruction">「ドー」と発声してください</p>
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
            <h3 class="training-mode-title">{selectedMode.name}へ進みます</h3>
            <p class="training-mode-description">
              {selectedMode.description}
            </p>
            
            <div class="training-start-button-area">
              <button class="training-start-button enabled" on:click={() => window.location.href = selectedMode.path}>
                トレーニング開始
              </button>
            </div>
          {/if}
        </div>
      </Card>
    </div>

    <!-- マイクテストセクション -->
    <div class="test-section">
      <Card variant="default" padding="lg">
        <div class="mic-test-content">
          

          <!-- リアルタイム表示（常時表示） -->
          <div class="realtime-display">
            <!-- 音量レベル -->
            <div class="volume-section">
              <h3 class="display-title">音量レベル</h3>
              {#if isListening}
                <div class="guidance-text">「ド」を発声してください</div>
              {/if}
              <div class="volume-bar-container">
                <div class="volume-bar" style="width: {currentVolume}%"></div>
              </div>
              <div class="volume-text">{currentVolume.toFixed(1)}%</div>
              <div class="volume-status">
                <span class="status-pending">
                  {#if !volumeDetected && isListening}
                    ⏳ 声を出して音量を確認してください
                  {:else if !isListening}
                    マイクテスト開始後に表示されます
                  {:else}
                    &nbsp;
                  {/if}
                </span>
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
                <span class="status-pending">
                  {#if !frequencyDetected && isListening}
                    ⏳ 「ド」を発声して音程を確認してください
                  {:else if !isListening}
                    マイクテスト開始後に表示されます
                  {:else}
                    &nbsp;
                  {/if}
                </span>
              </div>
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
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .instructions-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
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

  .volume-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 120px;
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
    background-color: #10b981;
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


  .start-content {
    text-align: center;
  }

  @media (min-width: 768px) {
    .mic-test-header {
      flex-direction: row;
      text-align: left;
    }

    .realtime-display {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>