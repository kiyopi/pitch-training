<script>
  import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
  
  export let consistencyData = [];
  export let className = '';
  export let height = 200;
  export let showTechnicalErrorCorrection = false; // 技術誤差補正表示フラグ
  export let correctedData = []; // 技術誤差補正後データ
  
  // グラフ表示用のデータを準備
  $: graphData = prepareGraphData(consistencyData);
  $: correctedGraphData = showTechnicalErrorCorrection && correctedData.length > 0 
    ? prepareGraphData(correctedData) 
    : null;
  
  function prepareGraphData(data) {
    if (!data || data.length === 0) return { points: '', max: 100, min: 0 };
    
    const values = data.map(d => d.score);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    // SVGパス用の座標を計算
    const width = 400;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.score - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return { points, max, min, values };
  }
  
  // 一貫性スコアに応じた色を取得
  function getConsistencyColor(score) {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }
  
  // 平均スコアを計算
  $: averageScore = consistencyData.length > 0
    ? consistencyData.reduce((sum, d) => sum + d.score, 0) / consistencyData.length
    : 0;
    
  // 最新のトレンドを計算
  $: trend = calculateTrend(consistencyData);
  
  function calculateTrend(data) {
    if (data.length < 2) return 'neutral';
    const recent = data.slice(-5); // 最新5件
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'improving';
    if (secondAvg < firstAvg - 5) return 'declining';
    return 'stable';
  }
</script>

<div class="consistency-graph {className} bg-white rounded-xl shadow-lg p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-800">一貫性グラフ</h3>
    <div class="flex items-center gap-4">
      <div class="text-sm">
        <span class="text-gray-500">平均:</span>
        <span class="font-bold" style="color: {getConsistencyColor(averageScore)}">
          {averageScore.toFixed(1)}%
        </span>
      </div>
      <div class="flex items-center gap-1">
        {#if trend === 'improving'}
          <span class="text-green-500">↑</span>
          <span class="text-sm text-green-600">改善中</span>
        {:else if trend === 'declining'}
          <span class="text-red-500">↓</span>
          <span class="text-sm text-red-600">低下中</span>
        {:else}
          <span class="text-gray-500">→</span>
          <span class="text-sm text-gray-600">安定</span>
        {/if}
      </div>
    </div>
  </div>
  
  {#if consistencyData.length > 0}
    <div class="graph-container">
      <svg viewBox="0 0 400 {height}" class="w-full" style="height: {height}px">
        <!-- グリッド線 -->
        <g class="grid-lines">
          {#each [0, 25, 50, 75, 100] as value}
            <line
              x1="0"
              y1="{height - (value / 100) * height}"
              x2="400"
              y2="{height - (value / 100) * height}"
              stroke="#e5e7eb"
              stroke-width="1"
              stroke-dasharray="2,2"
            />
            <text
              x="-5"
              y="{height - (value / 100) * height + 5}"
              text-anchor="end"
              fill="#9ca3af"
              font-size="12"
            >
              {value}%
            </text>
          {/each}
        </g>
        
        <!-- グラフ背景 -->
        <defs>
          <linearGradient id="consistency-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </linearGradient>
        </defs>
        
        <!-- グラフエリア -->
        {#if graphData.points}
          <polygon
            points="0,{height} {graphData.points} 400,{height}"
            fill="url(#consistency-gradient)"
          />
          
          <!-- グラフ線（生データ） -->
          <polyline
            points="{graphData.points}"
            fill="none"
            stroke="{showTechnicalErrorCorrection ? '#94a3b8' : '#3b82f6'}"
            stroke-width="{showTechnicalErrorCorrection ? 1.5 : 2}"
            stroke-dasharray="{showTechnicalErrorCorrection ? '4,2' : 'none'}"
          />
          
          <!-- データポイント -->
          {#each consistencyData as point, i}
            <circle
              cx="{(i / (consistencyData.length - 1)) * 400}"
              cy="{height - ((point.score - graphData.min) / (graphData.max - graphData.min)) * height}"
              r="4"
              fill="{getConsistencyColor(point.score)}"
              stroke="white"
              stroke-width="2"
            />
          {/each}
        {/if}

        <!-- 技術誤差補正後グラフ -->
        {#if showTechnicalErrorCorrection && correctedGraphData?.points}
          <defs>
            <linearGradient id="corrected-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.1" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
            </linearGradient>
          </defs>
          
          <polygon
            points="0,{height} {correctedGraphData.points} 400,{height}"
            fill="url(#corrected-gradient)"
          />
          <polyline
            points="{correctedGraphData.points}"
            fill="none"
            stroke="#10b981"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- 補正後データポイント -->
          {#each correctedData as point, i}
            <circle
              cx="{(i / (correctedData.length - 1)) * 400}"
              cy="{height - ((point.score - correctedGraphData.min) / (correctedGraphData.max - correctedGraphData.min)) * height}"
              r="3"
              fill="#10b981"
              stroke="white"
              stroke-width="1.5"
            />
          {/each}
        {/if}
      </svg>
      
      <!-- 凡例（技術誤差補正表示時） -->
      {#if showTechnicalErrorCorrection}
        <div class="mt-2 flex items-center gap-4 text-xs text-gray-600">
          <div class="flex items-center gap-1">
            <div class="w-4 h-0.5 bg-gray-400" style="border-top: 1.5px dashed #94a3b8;"></div>
            <span>生データ</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-4 h-0.5 bg-green-500"></div>
            <span>技術誤差補正後</span>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- 最近のデータポイント -->
    <div class="mt-4 flex gap-2 overflow-x-auto">
      {#each consistencyData.slice(-10) as point, i}
        <div class="flex-shrink-0 text-center">
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style="background-color: {getConsistencyColor(point.score)}"
          >
            {point.score}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {i + 1}回前
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-12 text-gray-500">
      <div class="text-4xl mb-2">📈</div>
      <div>一貫性データがまだありません</div>
      <div class="text-sm mt-2">複数回チャレンジするとグラフが表示されます</div>
    </div>
  {/if}
</div>

<style>
  .graph-container {
    position: relative;
  }
  
  .grid-lines text {
    user-select: none;
  }
</style>