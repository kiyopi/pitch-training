<script>
  import { Share2, Twitter, Download, Copy } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  export let scoreData = null;
  export let className = '';
  
  let canvas = null;
  let shareImageUrl = '';
  let copySuccess = false;
  
  // 4段階評価システム定義
  const gradeNames = {
    excellent: '優秀', good: '良好', pass: '合格', 
    needWork: '要練習', notMeasured: '測定不可'
  };
  
  // SNS共有画像生成
  async function generateShareImage() {
    if (!canvas || !scoreData) return '';
    
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 600;
    
    canvas.width = width;
    canvas.height = height;
    
    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // タイトル
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 相対音感トレーニング結果', width / 2, 80);
    
    // グレード表示（4段階評価システム）
    const gradeNames = {
      excellent: '優秀', good: '良好', pass: '合格', 
      needWork: '要練習', notMeasured: '測定不可'
    };
    const gradeColors = {
      excellent: '#fbbf24', good: '#10b981', pass: '#3b82f6',
      needWork: '#ef4444', notMeasured: '#9ca3af'
    };
    
    const grade = scoreData.overallGrade || 'needWork';
    const gradeName = gradeNames[grade] || '要練習';
    
    ctx.fillStyle = gradeColors[grade];
    ctx.font = 'bold 72px system-ui';
    ctx.fillText(`${gradeName}達成！`, width / 2, 180);
    
    // モード名
    const modeNames = {
      random: 'ランダム基音トレーニング',
      continuous: '連続チャレンジモード',
      chromatic: '12音階マスターモード'
    };
    
    ctx.fillStyle = '#64748b';
    ctx.font = '24px system-ui';
    ctx.fillText(modeNames[scoreData.mode] || '', width / 2, 220);
    
    // 統計情報
    ctx.fillStyle = '#374151';
    ctx.font = '20px system-ui';
    ctx.textAlign = 'left';
    
    const stats = [
      `📊 平均精度: ${scoreData.averageAccuracy}%`,
      `🎯 測定率: ${Math.round((scoreData.measuredNotes / scoreData.totalNotes) * 100)}%`,
      `📅 完走セッション: ${scoreData.sessionHistory?.length || 0}回`
    ];
    
    stats.forEach((stat, index) => {
      ctx.fillText(stat, 100, 300 + (index * 35));
    });
    
    // セッション履歴バー
    if (scoreData.sessionHistory) {
      const barWidth = 60;
      const barHeight = 80;
      const barGap = 10;
      const startX = (width - (scoreData.sessionHistory.length * (barWidth + barGap) - barGap)) / 2;
      const startY = 420;
      
      scoreData.sessionHistory.forEach((session, index) => {
        const x = startX + index * (barWidth + barGap);
        const color = gradeColors[session.grade] || '#6b7280';
        const sessionGradeName = gradeNames[session.grade] || '不明';
        
        // バー背景
        ctx.fillStyle = color;
        ctx.fillRect(x, startY, barWidth, barHeight);
        
        // セッション番号
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${index + 1}`, x + barWidth / 2, startY + 25);
        
        // グレード
        ctx.font = 'bold 20px system-ui';
        ctx.fillText(sessionGradeName, x + barWidth / 2, startY + 50);
      });
    }
    
    // フッター
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('https://kiyopi.github.io/pitch-training/', width / 2, height - 30);
    
    return canvas.toDataURL('image/png');
  }
  
  // Twitter共有
  async function shareToTwitter() {
    const imageUrl = await generateShareImage();
    const gradeName = gradeNames[scoreData.overallGrade] || '要練習';
    const text = `🎵 相対音感トレーニングで「${gradeName}」達成！\n平均精度: ${scoreData.averageAccuracy}%\n${scoreData.sessionHistory?.length || 0}セッション完走 🎉`;
    const url = 'https://kiyopi.github.io/pitch-training/';
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  }
  
  // 画像ダウンロード
  async function downloadImage() {
    const imageUrl = await generateShareImage();
    const gradeName = gradeNames[scoreData.overallGrade] || '要練習';
    const link = document.createElement('a');
    link.download = `pitch-training-result-${scoreData.mode}-${gradeName}.png`;
    link.href = imageUrl;
    link.click();
  }
  
  // URLコピー
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText('https://kiyopi.github.io/pitch-training/');
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  }
  
  // Web Share API（対応ブラウザのみ）
  async function shareNative() {
    if (!navigator.share) {
      await shareToTwitter();
      return;
    }
    
    try {
      const gradeName = gradeNames[scoreData.overallGrade] || '要練習';
      await navigator.share({
        title: '🎵 相対音感トレーニング結果',
        text: `「${gradeName}」達成！平均精度: ${scoreData.averageAccuracy}%`,
        url: 'https://kiyopi.github.io/pitch-training/'
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('共有に失敗しました:', err);
      }
    }
  }
</script>

<div class="sns-share-buttons {className}">
  <h3 class="share-title">🎉 結果をシェアしよう！</h3>
  
  <div class="button-grid">
    <!-- ネイティブ共有 / Twitter -->
    <button class="share-btn primary" on:click={shareNative}>
      <Share2 class="w-5 h-5" />
      <span>シェア</span>
    </button>
    
    <!-- Twitter直接 -->
    <button class="share-btn twitter" on:click={shareToTwitter}>
      <Twitter class="w-5 h-5" />
      <span>Twitter</span>
    </button>
    
    <!-- 画像ダウンロード -->
    <button class="share-btn download" on:click={downloadImage}>
      <Download class="w-5 h-5" />
      <span>画像保存</span>
    </button>
    
    <!-- URLコピー -->
    <button class="share-btn copy" on:click={copyUrl} class:success={copySuccess}>
      <Copy class="w-5 h-5" />
      <span>{copySuccess ? 'コピー完了!' : 'URLコピー'}</span>
    </button>
  </div>
  
  <!-- 隠しCanvas -->
  <canvas bind:this={canvas} style="display: none;"></canvas>
</div>

<style>
  .sns-share-buttons {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .share-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .button-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  
  .share-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .share-btn:active {
    transform: translateY(0);
  }
  
  .share-btn.primary {
    background: #3b82f6;
    color: white;
  }
  
  .share-btn.primary:hover {
    background: #2563eb;
  }
  
  .share-btn.twitter {
    background: #1da1f2;
    color: white;
  }
  
  .share-btn.twitter:hover {
    background: #1a91da;
  }
  
  .share-btn.download {
    background: #10b981;
    color: white;
  }
  
  .share-btn.download:hover {
    background: #059669;
  }
  
  .share-btn.copy {
    background: #6b7280;
    color: white;
  }
  
  .share-btn.copy:hover {
    background: #4b5563;
  }
  
  .share-btn.copy.success {
    background: #10b981;
  }
  
  @media (max-width: 640px) {
    .button-grid {
      grid-template-columns: 1fr;
    }
    
    .sns-share-buttons {
      padding: 1rem;
    }
  }
</style>