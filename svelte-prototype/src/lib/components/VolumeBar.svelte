<script>
  import { onMount } from 'svelte';
  
  export let volume = 0; // 0-100の音量値
  export let threshold = 30; // しきい値
  export let height = '12px';
  export let className = '';
  
  let barElement;
  
  // 音量レベルに応じた色の計算
  function getVolumeColor(volume) {
    if (volume < threshold) return '#94a3b8'; // グレー - 低音量
    if (volume < 60) return '#10b981'; // 緑 - 良好
    if (volume < 80) return '#f59e0b'; // オレンジ - 高め
    return '#ef4444'; // 赤 - 過大
  }
  
  // 音量バーの更新（DOM直接操作）
  function updateVolumeBar(newVolume) {
    if (barElement) {
      const clampedVolume = Math.max(0, Math.min(100, newVolume));
      const color = getVolumeColor(clampedVolume);
      
      // デバッグログ（初回と大きな変化時のみ）
      if (!window.volumeBarLastUpdate || Math.abs(window.volumeBarLastUpdate - clampedVolume) > 10) {
        console.log('VolumeBar更新:', clampedVolume.toFixed(1), '%', 'color:', color);
        window.volumeBarLastUpdate = clampedVolume;
      }
      
      barElement.style.width = `${clampedVolume}%`;
      barElement.style.backgroundColor = color;
    }
  }
  
  // volumeプロパティの変更を監視
  $: updateVolumeBar(volume);
  
  onMount(() => {
    // 初期スタイル設定（iPhone WebKit対応）
    if (barElement) {
      barElement.style.width = '0%';
      barElement.style.backgroundColor = '#94a3b8';
      barElement.style.height = height;
      barElement.style.borderRadius = '9999px';
      barElement.style.transition = 'all 0.1s ease-out';
    }
  });
</script>

<div class="volume-bar-container {className}">
  <div class="volume-bar-bg" style="height: {height}; border-radius: 9999px; background-color: #e2e8f0; position: relative; overflow: hidden;">
    <div 
      bind:this={barElement}
      class="volume-bar-fill"
      style="position: absolute; top: 0; left: 0; height: 100%;"
    ></div>
  </div>
  
  <!-- しきい値インジケーター -->
  <div 
    class="threshold-indicator" 
    style="position: absolute; top: 0; left: {threshold}%; width: 2px; height: {height}; background-color: #64748b; border-radius: 1px;"
  ></div>
</div>

<style>
  .volume-bar-container {
    position: relative;
    width: 100%;
  }
  
  .threshold-indicator {
    opacity: 0.6;
    pointer-events: none;
  }
</style>