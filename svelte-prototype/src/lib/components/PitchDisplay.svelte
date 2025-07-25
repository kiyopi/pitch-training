<script>
  export let frequency = 0; // 検出された周波数
  export let targetNote = 'C'; // 目標音程
  export let currentNote = ''; // 現在の音程
  export let accuracy = 0; // 精度 (-100 から 100)
  export let isDetecting = false; // 音程検出中かどうか
  export let className = '';
  
  // 音程名の表示用フォーマット
  const noteNames = {
    'C': 'ド', 'C#': 'ド#', 'Db': 'レ♭',
    'D': 'レ', 'D#': 'レ#', 'Eb': 'ミ♭',
    'E': 'ミ',
    'F': 'ファ', 'F#': 'ファ#', 'Gb': 'ソ♭',
    'G': 'ソ', 'G#': 'ソ#', 'Ab': 'ラ♭',
    'A': 'ラ', 'A#': 'ラ#', 'Bb': 'シ♭',
    'B': 'シ'
  };
  
  // 精度に応じた色の取得
  function getAccuracyColor(accuracy) {
    const absAccuracy = Math.abs(accuracy);
    if (absAccuracy <= 10) return '#10b981'; // 緑 - 正確
    if (absAccuracy <= 25) return '#f59e0b'; // オレンジ - まあまあ
    return '#ef4444'; // 赤 - 不正確
  }
  
  // 精度に応じたメッセージ
  function getAccuracyMessage(accuracy) {
    const absAccuracy = Math.abs(accuracy);
    if (absAccuracy <= 10) return '素晴らしい！';
    if (absAccuracy <= 25) return 'もう少し！';
    return '調整が必要';
  }
  
  // 周波数を表示用にフォーマット
  function formatFrequency(freq) {
    return freq > 0 ? `${freq.toFixed(1)} Hz` : '--.- Hz';
  }
  
  // 音程名を日本語に変換
  function formatNoteName(note) {
    return noteNames[note] || note;
  }
</script>

<div class="pitch-display {className}">
  <!-- 目標音程表示 -->
  <div class="target-note">
    <div class="label">目標音程</div>
    <div class="note-name target">{formatNoteName(targetNote)}</div>
  </div>
  
  <!-- 現在の音程表示 -->
  <div class="current-note">
    <div class="label">現在の音程</div>
    <div class="note-name current" class:detecting={isDetecting}>
      {isDetecting ? formatNoteName(currentNote) || '---' : '---'}
    </div>
  </div>
  
  <!-- 周波数表示 -->
  <div class="frequency-display">
    <div class="label">周波数</div>
    <div class="frequency-value">{formatFrequency(frequency)}</div>
  </div>
  
  <!-- 精度インジケーター -->
  {#if isDetecting && currentNote}
    <div class="accuracy-display">
      <div class="label">精度</div>
      <div class="accuracy-bar-container">
        <div class="accuracy-bar" style="background-color: {getAccuracyColor(accuracy)}; width: {Math.abs(accuracy)}%"></div>
        <div class="accuracy-center"></div>
      </div>
      <div class="accuracy-text" style="color: {getAccuracyColor(accuracy)}">
        {getAccuracyMessage(accuracy)}
      </div>
      <div class="accuracy-value">
        {accuracy > 0 ? '+' : ''}{accuracy.toFixed(1)}%
      </div>
    </div>
  {/if}
</div>

<style>
  .pitch-display {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 2px solid #cbd5e1;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .label {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .target-note, .current-note, .frequency-display, .accuracy-display {
    margin-bottom: 20px;
  }
  
  .accuracy-display:last-child {
    margin-bottom: 0;
  }
  
  .note-name {
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    padding: 12px;
    border-radius: 12px;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .note-name.target {
    background-color: #3b82f6;
    color: white;
    border: 3px solid #1d4ed8;
  }
  
  .note-name.current {
    background-color: #f1f5f9;
    color: #64748b;
    border: 3px solid #cbd5e1;
    transition: all 0.3s ease;
  }
  
  .note-name.current.detecting {
    background-color: #10b981;
    color: white;
    border-color: #059669;
    animation: pulse 2s infinite;
  }
  
  .frequency-display {
    text-align: center;
  }
  
  .frequency-value {
    font-size: 24px;
    font-weight: 600;
    color: #374151;
    font-family: 'Courier New', monospace;
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
  }
  
  .accuracy-display {
    text-align: center;
  }
  
  .accuracy-bar-container {
    position: relative;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    margin: 12px 0;
    overflow: hidden;
  }
  
  .accuracy-bar {
    height: 100%;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  
  .accuracy-center {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 100%;
    background-color: #374151;
  }
  
  .accuracy-text {
    font-size: 16px;
    font-weight: 600;
    margin: 8px 0;
  }
  
  .accuracy-value {
    font-size: 14px;
    color: #6b7280;
    font-family: 'Courier New', monospace;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.02);
      opacity: 0.9;
    }
  }
</style>