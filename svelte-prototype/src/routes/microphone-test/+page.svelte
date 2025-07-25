<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import VolumeBar from '$lib/components/VolumeBar.svelte';
  import PitchDisplay from '$lib/components/PitchDisplay.svelte';

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

  // マイク許可リクエスト
  async function requestMicrophone() {
    micPermission = 'pending';
    
    try {
      // マイクアクセス許可をリクエスト
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micPermission = 'granted';
      
      // テスト用ストリームを停止
      stream.getTracks().forEach(track => track.stop());
      
      // 自動でリスニング開始
      setTimeout(() => {
        startListening();
      }, 500);
    } catch (error) {
      console.error('マイク許可エラー:', error);
      micPermission = 'denied';
    }
  }

  // Web Audio API変数
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let dataArray = null;
  let animationFrame = null;

  // リスニング開始（実際のWeb Audio API）
  async function startListening() {
    if (micPermission !== 'granted') return;
    
    try {
      // Web Audio Context作成
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // マイクアクセス
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      // アナライザー設定
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      
      // データ配列
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      isListening = true;
      
      // リアルタイム解析開始
      analyzeAudio();
      
    } catch (error) {
      console.error('マイクアクセスエラー:', error);
      micPermission = 'denied';
    }
  }

  // 音声解析ループ
  function analyzeAudio() {
    if (!isListening || !analyser) return;
    
    // 周波数データ取得
    analyser.getByteFrequencyData(dataArray);
    
    // 音量計算（RMS）
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    currentVolume = Math.min(100, (rms / 128) * 100);
    
    if (currentVolume > 20) {
      volumeDetected = true;
    }
    
    // 基本的な周波数検出（最大振幅のbin）
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 1; i < dataArray.length / 4; i++) { // 低域のみ
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    
    if (maxValue > 50) { // 閾値
      const sampleRate = audioContext.sampleRate;
      currentFrequency = (maxIndex * sampleRate) / (analyser.fftSize);
      currentNote = frequencyToNote(currentFrequency);
      
      if (currentFrequency > 80 && currentFrequency < 800) { // 人声範囲
        frequencyDetected = true;
      }
    } else {
      currentFrequency = 0;
      currentNote = '';
    }
    
    // 次のフレーム
    animationFrame = requestAnimationFrame(analyzeAudio);
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
    dataArray = null;
  }

  // コンポーネント破棄時のクリーンアップ
  onDestroy(() => {
    stopListening();
  });

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

    <!-- マイクテストセクション -->
    <div class="test-section">
      <Card variant="default" padding="lg">
        <div class="mic-test-content">

          <!-- リアルタイム表示 -->
          {#if micPermission === 'granted'}
            <div class="realtime-display">
              <!-- 音量レベル -->
              <div class="volume-section">
                <h3 class="display-title">音量レベル</h3>
                <VolumeBar volume={currentVolume} height="16px" className="volume-bar-wrapper" />
                <div class="volume-status">
                  {#if !volumeDetected}
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
                  {#if !frequencyDetected}
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
          <h3 class="start-title">{selectedMode.name}</h3>
          <p class="start-description">
            {selectedMode.description}
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

  .mic-test-content {
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

  .volume-bar-wrapper {
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
    .mic-test-header {
      flex-direction: row;
      text-align: left;
    }

    .realtime-display {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>