<script>
  import Card from './Card.svelte';
  import VolumeBar from './VolumeBar.svelte';
  
  // Props
  export let frequency = 0;
  export let note = 'ーー';
  export let volume = 0;
  export let isMuted = false;
  export let muteMessage = '待機中...';
  export let className = '';
  
  // 音程ガイダンス用
  export let targetFrequency = 0;  // 目標周波数
  export let targetNote = '';      // 目標音程
  export let centDiff = 0;         // セント差
  export let showGuidance = false; // ガイダンス表示フラグ
  
  // セント差による色分け
  $: accuracyLevel = getAccuracyLevel(centDiff);
  
  function getAccuracyLevel(cent) {
    const abs = Math.abs(cent);
    if (abs <= 30) return 'excellent';
    if (abs <= 60) return 'good';
    if (abs <= 120) return 'okay';
    if (abs <= 200) return 'poor';
    return 'very-poor';
  }
  
  function getAccuracyMessage(level, cent) {
    const abs = Math.abs(cent);
    
    if (level === 'excellent') return '🎯 完璧！';
    if (level === 'good') return '✅ とても良い';
    if (level === 'okay') return '🔶 もう少し';
    if (level === 'poor') return cent > 0 ? '📈 もっと高く' : '📉 もっと低く';
    return cent > 0 ? '⬆️ かなり高く' : '⬇️ かなり低く';
  }
</script>

<Card class="main-card {className}">
  <div class="card-header">
    <h3 class="section-title">🎙️ リアルタイム音程検出</h3>
  </div>
  <div class="card-content">
    <div class="pitch-detector">
      <div class="detection-display">
        <div class="detection-card">
          {#if isMuted}
            <span class="muted-message">{muteMessage}</span>
          {:else}
            <div class="detection-values">
              <span class="detected-frequency">{frequency > 0 ? Math.round(frequency) : '---'}</span>
              <span class="hz-suffix">Hz</span>
              <span class="divider">|</span>
              <span class="detected-note">{note}</span>
            </div>
            
            {#if showGuidance && targetFrequency > 0}
              <div class="guidance-section">
                <div class="target-info">
                  <span class="target-label">目標:</span>
                  <span class="target-frequency">{Math.round(targetFrequency)}Hz</span>
                  <span class="target-note">({targetNote})</span>
                </div>
                {#if frequency > 0}
                  <div class="accuracy-feedback accuracy-{accuracyLevel}">
                    <span class="cent-diff">{centDiff > 0 ? '+' : ''}{Math.round(centDiff)}¢</span>
                    <span class="accuracy-message">{getAccuracyMessage(accuracyLevel, centDiff)}</span>
                  </div>
                {/if}
              </div>
            {/if}
          {/if}
        </div>
        
        <VolumeBar volume={!isMuted && frequency > 0 ? volume : 0} className="volume-bar" />
      </div>
    </div>
  </div>
</Card>

<style>
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

  /* 音程検出表示 */
  .pitch-detector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detection-card {
    background: hsl(210 40% 96.1%);
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    min-height: 80px;
  }

  /* 検出値のコンテナ */
  .detection-values {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  /* ミュート時のメッセージ */
  .muted-message {
    font-size: 1.125rem;
    color: hsl(215.4 16.3% 46.9%);
    font-weight: 500;
  }

  /* 周波数表示 */
  .detected-frequency {
    font-size: 2rem;
    font-weight: 700;
    color: hsl(142.1 76.2% 36.3%);
  }

  .hz-suffix {
    font-size: 1rem;
    color: hsl(215.4 16.3% 46.9%);
    font-weight: 400;
  }

  .divider {
    color: hsl(214.3 31.8% 91.4%);
    margin: 0 0.5rem;
  }

  .detected-note {
    font-size: 1.5rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
  }

  /* ガイダンスセクション */
  .guidance-section {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  
  .target-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .target-label {
    font-weight: 600;
  }
  
  .target-frequency {
    font-weight: 700;
    color: hsl(217.2 32.6% 17.5%);
  }
  
  .target-note {
    font-weight: 600;
    color: hsl(217.2 32.6% 17.5%);
  }
  
  .accuracy-feedback {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .cent-diff {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 700;
  }
  
  /* 精度レベル別の色分け */
  .accuracy-excellent {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #34d399;
  }
  
  .accuracy-good {
    background-color: #dbeafe;
    color: #1e40af;
    border: 1px solid #60a5fa;
  }
  
  .accuracy-okay {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }
  
  .accuracy-poor {
    background-color: #fed7d7;
    color: #c53030;
    border: 1px solid #fc8181;
  }
  
  .accuracy-very-poor {
    background-color: #fecaca;
    color: #991b1b;
    border: 1px solid #f87171;
  }

  /* VolumeBar用のスタイル */
  :global(.volume-bar) {
    margin-top: 0.5rem;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .detection-card {
      font-size: 1.25rem;
      padding: 1rem;
      min-height: 60px;
    }

    .detected-frequency {
      font-size: 1.5rem;
    }

    .detected-note {
      font-size: 1.25rem;
    }

    .muted-message {
      font-size: 1rem;
    }
  }
</style>