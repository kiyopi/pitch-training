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
  let detectionConfidence = 0; // 検出信頼度 (0-100)
  let audioContextBlocked = false; // AudioContext開始がブロックされた場合
  
  // 周波数平滑化のための履歴
  let frequencyHistory = [];
  const HISTORY_SIZE = 5;

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

  // マイク許可リクエスト（AudioContextは作成しない）
  async function requestMicrophone() {
    console.log('マイク許可リクエスト開始');
    micPermission = 'pending';
    
    try {
      // マイクアクセス許可をリクエスト
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('マイク許可取得成功');
      micPermission = 'granted';
      
      // テスト用ストリームを停止
      stream.getTracks().forEach(track => track.stop());
      
      // AudioContextの作成はユーザークリックまで待機
      console.log('マイク許可完了 - ユーザークリックでAudioContext開始を待機');
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

  // リスニング開始（AudioContextは既に作成済み前提）
  async function startListening() {
    console.log('startListening 開始, micPermission:', micPermission);
    
    if (micPermission !== 'granted') {
      console.log('マイク許可がありません');
      return;
    }

    if (!audioContext) {
      console.log('AudioContextが作成されていません');
      audioContextBlocked = true;
      return;
    }
    
    try {
      console.log('AudioContext state:', audioContext.state);
      
      console.log('マイクアクセス開始...');
      // マイクアクセス
      mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      console.log('アナライザー設定中...');
      // アナライザー設定
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      console.log('メディアストリームソース接続完了');
      
      // データ配列
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      console.log('データ配列準備完了, bufferLength:', bufferLength);
      
      isListening = true;
      console.log('リアルタイム解析開始');
      
      // リアルタイム解析開始
      analyzeAudio();
      
    } catch (error) {
      console.error('マイクアクセスエラー:', error);
      micPermission = 'error';
    }
  }

  // 音声解析ループ
  function analyzeAudio() {
    if (!isListening || !analyser) {
      console.log('解析停止: isListening=', isListening, 'analyser=', !!analyser);
      return;
    }
    
    // 最初の実行ログ（1回だけ）
    if (!window.firstAnalysisLogged) {
      console.log('初回音声解析実行中...');
      window.firstAnalysisLogged = true;
    }
    
    // 周波数データ取得（音量計算用）
    analyser.getByteFrequencyData(dataArray);
    
    // 音量計算（RMS）
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    currentVolume = Math.min(100, (rms / 128) * 100);
    
    if (currentVolume > 20) {
      if (!volumeDetected) {
        console.log('音量検出成功:', currentVolume);
      }
      volumeDetected = true;
    }
    
    // 時間領域データ取得（音程検出用）
    const timeDataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDataArray);
    
    // 自己相関関数による基本周波数検出
    const detectionResult = detectPitchWithAutocorrelation(timeDataArray, audioContext.sampleRate);
    
    if (detectionResult.frequency > 0) {
      // 周波数履歴に追加
      frequencyHistory.push(detectionResult.frequency);
      if (frequencyHistory.length > HISTORY_SIZE) {
        frequencyHistory.shift();
      }
      
      // 平滑化された周波数を計算
      const smoothedFrequency = smoothFrequency(frequencyHistory);
      currentFrequency = smoothedFrequency;
      currentNote = frequencyToNote(currentFrequency);
      detectionConfidence = Math.round(detectionResult.confidence * 100);
      
      if (currentFrequency > 80 && currentFrequency < 800) { // 人声範囲
        if (!frequencyDetected) {
          console.log('周波数検出成功:', currentFrequency, 'Hz', currentNote);
        }
        frequencyDetected = true;
      }
    } else {
      // 検出失敗時は履歴をクリア
      frequencyHistory = [];
      currentFrequency = 0;
      currentNote = '';
      detectionConfidence = 0;
    }
    
    // 次のフレーム
    animationFrame = requestAnimationFrame(analyzeAudio);
  }

  // 自己相関関数による音程検出（改良版）
  function detectPitchWithAutocorrelation(buffer, sampleRate) {
    // 音量チェック（閾値以下は処理しない）
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return 0; // 音量が小さすぎる場合
    
    // ハイパスフィルター適用（低周波ノイズ除去）
    const filteredBuffer = applyHighPassFilter(buffer, sampleRate, 70);
    
    // 自己相関関数計算の範囲設定
    const minPeriod = Math.floor(sampleRate / 800); // 最高800Hz
    const maxPeriod = Math.floor(sampleRate / 70);  // 最低70Hz
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    let secondBestCorrelation = 0;
    
    // 各遅延（period）での自己相関を計算
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let normalizer = 0;
      
      // 正規化された自己相関計算
      for (let i = 0; i < filteredBuffer.length - period; i++) {
        correlation += filteredBuffer[i] * filteredBuffer[i + period];
        normalizer += filteredBuffer[i] * filteredBuffer[i];
      }
      
      if (normalizer > 0) {
        correlation = correlation / Math.sqrt(normalizer);
        
        // 相関値の更新
        if (correlation > bestCorrelation) {
          secondBestCorrelation = bestCorrelation;
          bestCorrelation = correlation;
          bestPeriod = period;
        } else if (correlation > secondBestCorrelation) {
          secondBestCorrelation = correlation;
        }
      }
    }
    
    // 明確なピークがある場合のみ周波数を返す
    const clarity = bestCorrelation - secondBestCorrelation;
    if (bestCorrelation > 0.3 && clarity > 0.05 && bestPeriod > 0) {
      // 信頼度を計算 (0.0 - 1.0)
      const confidence = Math.min(1.0, bestCorrelation * clarity * 2);
      return {
        frequency: sampleRate / bestPeriod,
        confidence: confidence
      };
    }
    
    return { frequency: 0, confidence: 0 };
  }

  // シンプルなハイパスフィルター（IIR 1次）
  function applyHighPassFilter(buffer, sampleRate, cutoffFreq) {
    const dt = 1.0 / sampleRate;
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const alpha = rc / (rc + dt);
    
    const filtered = new Float32Array(buffer.length);
    filtered[0] = buffer[0];
    
    for (let i = 1; i < buffer.length; i++) {
      filtered[i] = alpha * (filtered[i-1] + buffer[i] - buffer[i-1]);
    }
    
    return filtered;
  }

  // 周波数平滑化関数
  function smoothFrequency(frequencies) {
    if (frequencies.length === 0) return 0;
    if (frequencies.length === 1) return frequencies[0];
    
    // 外れ値を除去した中央値的な平滑化
    const sorted = [...frequencies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // 中央値から大きく外れた値を除外
    const filtered = frequencies.filter(f => Math.abs(f - median) / median < 0.1);
    
    if (filtered.length === 0) return median;
    
    // 残った値の加重平均（新しい値ほど重み大）
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < filtered.length; i++) {
      const weight = (i + 1); // 新しい値ほど重い
      weightedSum += filtered[i] * weight;
      totalWeight += weight;
    }
    
    return weightedSum / totalWeight;
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

  // ユーザークリックでAudioContextを開始
  async function startAudioContextManually() {
    console.log('ユーザークリックでAudioContext開始...');
    
    if (micPermission !== 'granted') {
      console.log('マイク許可が必要です');
      return;
    }

    try {
      // 新しいAudioContextを作成
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext作成完了, state:', audioContext.state);
      
      audioContextBlocked = false;
      
      // リスニング開始
      await startListening();
    } catch (error) {
      console.error('AudioContext開始失敗:', error);
      audioContextBlocked = true;
    }
  }

  onMount(() => {
    // 自動マイク許可は実行しない（ユーザー操作を待つ）
    console.log('ページ読み込み完了 - ユーザー操作を待機中');
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
          
          <!-- マイク状態表示 -->
          <div class="mic-status">
            {#if micPermission === 'pending'}
              <div class="status-indicator pending">⏳ マイク許可を確認中...</div>
            {:else if micPermission === 'granted'}
              <div class="status-indicator granted">✅ マイクアクセス許可済み</div>
              {#if !isListening && !audioContextBlocked}
                <div class="status-indicator warning">🎵 音声機能を開始してください</div>
                <button class="retry-button" on:click={startAudioContextManually}>
                  🎤 マイクテストを開始
                </button>
              {:else if !isListening && audioContextBlocked}
                <div class="status-indicator warning">⚠️ 音声コンテキストがブロックされています</div>
                <button class="retry-button" on:click={startAudioContextManually}>
                  音声機能を再試行
                </button>
              {:else if isListening}
                <div class="status-indicator success">🎤 リアルタイム解析中</div>
              {/if}
            {:else if micPermission === 'denied'}
              <div class="status-indicator error">❌ マイクアクセスが拒否されました</div>
              <button class="retry-button" on:click={requestMicrophone}>
                マイク許可を再試行
              </button>
            {:else if micPermission === 'error'}
              <div class="status-indicator error">❌ マイクアクセスエラーが発生しました</div>
              <button class="retry-button" on:click={requestMicrophone}>
                マイク許可を再試行
              </button>
            {:else}
              <div class="status-indicator pending">🎤 マイクテストを開始してください</div>
              <button class="retry-button" on:click={requestMicrophone}>
                マイク許可を取得
              </button>
            {/if}
          </div>

          <!-- リアルタイム表示 -->
          {#if micPermission === 'granted' && isListening}
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
                  {#if detectionConfidence > 0}
                    <div class="confidence-display">
                      信頼度: {detectionConfidence}%
                      <div class="confidence-bar">
                        <div 
                          class="confidence-fill" 
                          style="width: {detectionConfidence}%; background-color: {detectionConfidence > 70 ? '#10b981' : detectionConfidence > 40 ? '#f59e0b' : '#ef4444'}"
                        ></div>
                      </div>
                    </div>
                  {/if}
                </div>
                <div class="frequency-status">
                  {#if !frequencyDetected}
                    <span class="status-pending">⏳ 「ド」を発声して音程を確認してください</span>
                  {:else if detectionConfidence < 50}
                    <span class="status-warning">⚠️ より明確に発声してください</span>
                  {:else}
                    <span class="status-success">✅ 音程検出中</span>
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

  .status-indicator.granted {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  .status-indicator.success {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  .status-indicator.warning {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .status-indicator.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .retry-button {
    padding: var(--space-2) var(--space-4);
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-button:hover {
    background-color: #1d4ed8;
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

  .status-warning {
    color: #f59e0b;
    font-weight: 600;
  }

  .confidence-display {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-gray-700);
  }

  .confidence-bar {
    width: 100%;
    height: 8px;
    background-color: var(--color-gray-200);
    border-radius: 4px;
    margin-top: var(--space-1);
    overflow: hidden;
  }

  .confidence-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.2s ease, background-color 0.2s ease;
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