<script>
  import { Target, Zap, BarChart3, Navigation, Activity } from 'lucide-svelte';
  
  export let totalScore = 0;
  export let grade = 'C';
  export let componentScores = {};
  export let className = '';
  
  // グレードに応じた色とスタイルを取得
  const getGradeStyle = (grade) => {
    const styles = {
      'S': { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-900', shadow: 'shadow-yellow-200' },
      'A+': { bg: 'from-green-400 to-green-600', text: 'text-green-900', shadow: 'shadow-green-200' },
      'A': { bg: 'from-green-500 to-green-700', text: 'text-green-900', shadow: 'shadow-green-200' },
      'B+': { bg: 'from-blue-400 to-blue-600', text: 'text-blue-900', shadow: 'shadow-blue-200' },
      'B': { bg: 'from-blue-500 to-blue-700', text: 'text-blue-900', shadow: 'shadow-blue-200' },
      'C+': { bg: 'from-orange-400 to-orange-600', text: 'text-orange-900', shadow: 'shadow-orange-200' },
      'C': { bg: 'from-orange-500 to-orange-700', text: 'text-orange-900', shadow: 'shadow-orange-200' },
      'D+': { bg: 'from-red-400 to-red-600', text: 'text-red-900', shadow: 'shadow-red-200' },
      'D': { bg: 'from-red-500 to-red-700', text: 'text-red-900', shadow: 'shadow-red-200' },
      'F': { bg: 'from-gray-400 to-gray-600', text: 'text-gray-900', shadow: 'shadow-gray-200' }
    };
    return styles[grade] || styles['C'];
  };
  
  // 5側面採点項目の定義
  const scoringAspects = [
    { key: 'pitchAccuracy', name: '音程精度', icon: Target, weight: 40 },
    { key: 'recognitionSpeed', name: '認識速度', icon: Zap, weight: 20 },
    { key: 'intervalMastery', name: '音程習得', icon: BarChart3, weight: 20 },
    { key: 'directionAccuracy', name: '方向精度', icon: Navigation, weight: 10 },
    { key: 'consistency', name: '一貫性', icon: Activity, weight: 10 }
  ];
  
  $: gradeStyle = getGradeStyle(grade);
</script>

<div class="score-result-panel {className} bg-white rounded-xl shadow-lg overflow-hidden">
  <!-- 総合スコアセクション -->
  <div class="bg-gradient-to-r {gradeStyle.bg} p-6">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-4">
        <div class="text-center">
          <div class="text-5xl font-bold {gradeStyle.text}">{totalScore}</div>
          <div class="text-sm text-gray-600">点</div>
        </div>
      </div>
      <div class="text-white">
        <div class="text-4xl font-bold mb-2">{grade}</div>
        <div class="text-lg opacity-90">グレード</div>
      </div>
    </div>
  </div>
  
  <!-- 5側面採点詳細 -->
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">採点詳細</h3>
    <div class="space-y-3">
      {#each scoringAspects as aspect}
        <div class="scoring-aspect">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <svelte:component this={aspect.icon} class="w-5 h-5 text-gray-600" />
              <span class="font-medium text-gray-700">{aspect.name}</span>
              <span class="text-xs text-gray-500">({aspect.weight}%)</span>
            </div>
            <span class="font-bold text-lg text-gray-800">
              {componentScores[aspect.key] || 0}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
              style="width: {componentScores[aspect.key] || 0}%"
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .score-result-panel {
    transition: transform 0.2s ease;
  }
  
  .score-result-panel:hover {
    transform: translateY(-2px);
  }
  
  .scoring-aspect {
    transition: all 0.2s ease;
  }
  
  .scoring-aspect:hover {
    background-color: #f9fafb;
    padding: 8px;
    margin: -8px;
    border-radius: 8px;
  }
</style>