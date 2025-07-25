<script>
  import { onMount, onDestroy } from 'svelte';
  
  // 最小限の状態管理
  let micPermission = 'initial'; // 'initial' | 'pending' | 'granted' | 'denied' | 'error'
  let isListening = false;
  let currentVolume = 0;
  let currentFrequency = 0;
  let currentNote = '';
  
  // Web Audio API変数
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let animationFrame = null;
  
  // ログ表示用
  let logs = [];
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [`[${timestamp}] ${message}`, ...logs.slice(0, 19)]; // 最新20件のみ保持
  }
  
  // マイク許可リクエスト
  async function requestMicrophone() {
    addLog('マイク許可リクエスト開始');
    micPermission = 'pending';
    
    try {
      // 最もシンプルな設定でマイクアクセス
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('マイク許可取得成功');
      micPermission = 'granted';
      
      // AudioContextをユーザーアクション内で作成
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      addLog(`AudioContext作成完了, state: ${audioContext.state}`);
      
      // AudioContextがsuspendedの場合は再開
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog(`AudioContext再開完了, state: ${audioContext.state}`);
      }
      
      // アナライザー設定
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      addLog('アナライザー接続完了');
      
      // MediaStreamTrackの状態監視
      mediaStream.getTracks().forEach((track, index) => {
        addLog(`Track ${index}: ${track.kind}, ${track.label}, state: ${track.readyState}`);
        
        track.addEventListener('ended', () => {
          addLog(`Track ${index} ended`);
        });
        
        track.addEventListener('mute', () => {
          addLog(`Track ${index} muted`);
        });
        
        track.addEventListener('unmute', () => {
          addLog(`Track ${index} unmuted`);
        });
      });
      
      isListening = true;
      addLog('リアルタイム解析開始');
      analyzeAudio();
      
    } catch (error) {
      addLog(`マイクアクセスエラー: ${error.name} - ${error.message}`);
      micPermission = 'denied';
    }
  }
  
  // 音声解析ループ（最小限）
  function analyzeAudio() {
    if (!isListening || !analyser) {
      addLog('解析停止');
      return;
    }
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // 周波数データ取得
    analyser.getByteFrequencyData(dataArray);
    
    // RMS音量計算
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    currentVolume = Math.min(100, (rms / 128) * 100);
    
    // 時間領域データ取得
    const timeDataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDataArray);
    
    // シンプルな基本周波数検出
    const frequency = detectPitch(timeDataArray, audioContext.sampleRate);
    if (frequency > 80 && frequency < 800) {
      currentFrequency = frequency;
      currentNote = frequencyToNote(frequency);
    } else {
      currentFrequency = 0;
      currentNote = '';
    }
    
    animationFrame = requestAnimationFrame(analyzeAudio);
  }
  
  // シンプルな音程検出
  function detectPitch(buffer, sampleRate) {
    // 音量チェック
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return 0;
    
    // 自己相関関数
    const minPeriod = Math.floor(sampleRate / 500);
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
    
    return bestCorrelation > 0.3 ? sampleRate / bestPeriod : 0;
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
    addLog('リスニング停止開始');
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
      addLog('MediaStream停止完了');
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
      addLog('AudioContext終了完了');
    }
    
    analyser = null;
  }
  
  // ページ離脱時のクリーンアップ
  onDestroy(() => {
    stopListening();
  });
</script>

<svelte:head>
  <title>シンプルマイクテスト - 相対音感トレーニング</title>
</svelte:head>

<div class="simple-test">
  <div class="header">
    <h1>シンプルマイクテスト</h1>
    <p>自作コンポーネント不使用・最小限実装のテストページ</p>
  </div>
  
  <div class="test-controls">
    {#if micPermission === 'initial'}
      <button class="test-button" on:click={requestMicrophone}>
        🎤 マイクテスト開始
      </button>
    {:else if micPermission === 'pending'}
      <div class="status">⏳ マイク許可を確認中...</div>
    {:else if micPermission === 'granted'}
      <div class="status">✅ マイクアクセス許可済み</div>
      {#if isListening}
        <button class="test-button" on:click={stopListening}>
          ⏹️ テスト停止
        </button>
      {/if}
    {:else if micPermission === 'denied'}
      <div class="status error">❌ マイクアクセスが拒否されました</div>
      <button class="test-button" on:click={requestMicrophone}>
        再試行
      </button>
    {/if}
  </div>
  
  {#if isListening}
    <div class="results">
      <div class="volume-display">
        <h3>音量レベル</h3>
        <div class="volume-bar-container">
          <div class="volume-bar" style="width: {currentVolume}%"></div>
        </div>
        <div class="volume-text">{currentVolume.toFixed(1)}%</div>
      </div>
      
      <div class="frequency-display">
        <h3>周波数検出</h3>
        <div class="frequency-text">{currentFrequency.toFixed(1)} Hz</div>
        <div class="note-text">{currentNote}</div>
      </div>
    </div>
  {/if}
  
  <div class="logs">
    <h3>ログ（最新20件）</h3>
    <div class="log-container">
      {#each logs as log}
        <div class="log-entry">{log}</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .simple-test {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .header h1 {
    font-size: 2rem;
    color: #1f2937;
    margin: 0 0 10px 0;
  }
  
  .header p {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
  }
  
  .test-controls {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .test-button {
    background-color: #2563eb;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .test-button:hover {
    background-color: #1d4ed8;
  }
  
  .status {
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .status:not(.error) {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  
  .status.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
  
  .results {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .volume-display h3,
  .frequency-display h3 {
    font-size: 1.2rem;
    color: #1f2937;
    margin: 0 0 15px 0;
  }
  
  .volume-bar-container {
    width: 100%;
    height: 20px;
    background-color: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
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
    color: #374151;
  }
  
  .frequency-text {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 5px;
  }
  
  .note-text {
    font-size: 1.2rem;
    font-weight: 600;
    color: #6b7280;
    text-align: center;
  }
  
  .logs {
    margin-top: 30px;
  }
  
  .logs h3 {
    font-size: 1.2rem;
    color: #1f2937;
    margin: 0 0 15px 0;
  }
  
  .log-container {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 15px;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .log-entry {
    margin-bottom: 5px;
    line-height: 1.4;
  }
  
  .log-entry:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    .results {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
</style>