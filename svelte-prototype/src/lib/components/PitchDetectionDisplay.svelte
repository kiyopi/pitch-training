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
            <span class="detected-frequency">{frequency > 0 ? Math.round(frequency) : '---'}</span>
            <span class="hz-suffix">Hz</span>
            <span class="divider">|</span>
            <span class="detected-note">{note}</span>
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
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: hsl(222.2 84% 4.9%);
    min-height: 80px;
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