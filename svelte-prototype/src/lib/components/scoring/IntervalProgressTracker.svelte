<script>
  export let intervalData = [];
  export let className = '';
  
  // 音程の表示名と色の定義
  const intervalInfo = {
    'unison': { name: 'ユニゾン', color: 'from-gray-400 to-gray-600' },
    'minor_second': { name: '短2度', color: 'from-purple-400 to-purple-600' },
    'major_second': { name: '長2度', color: 'from-indigo-400 to-indigo-600' },
    'minor_third': { name: '短3度', color: 'from-blue-400 to-blue-600' },
    'major_third': { name: '長3度', color: 'from-cyan-400 to-cyan-600' },
    'perfect_fourth': { name: '完全4度', color: 'from-teal-400 to-teal-600' },
    'tritone': { name: 'トライトーン', color: 'from-green-400 to-green-600' },
    'perfect_fifth': { name: '完全5度', color: 'from-lime-400 to-lime-600' },
    'minor_sixth': { name: '短6度', color: 'from-yellow-400 to-yellow-600' },
    'major_sixth': { name: '長6度', color: 'from-amber-400 to-amber-600' },
    'minor_seventh': { name: '短7度', color: 'from-orange-400 to-orange-600' },
    'major_seventh': { name: '長7度', color: 'from-red-400 to-red-600' },
    'octave': { name: 'オクターブ', color: 'from-pink-400 to-pink-600' }
  };
  
  // 習得レベルに応じたメッセージ
  const getMasteryMessage = (mastery) => {
    if (mastery >= 90) return 'マスター';
    if (mastery >= 70) return '習得中';
    if (mastery >= 50) return '練習中';
    if (mastery >= 30) return '初級';
    return '未習得';
  };
  
  // 習得レベルに応じたアイコン
  const getMasteryIcon = (mastery) => {
    if (mastery >= 90) return '⭐';
    if (mastery >= 70) return '🌟';
    if (mastery >= 50) return '💪';
    if (mastery >= 30) return '🌱';
    return '🌰';
  };
</script>

<div class="interval-progress-tracker {className} bg-white rounded-xl shadow-lg p-6">
  <h3 class="text-lg font-semibold text-gray-800 mb-4">音程別習得状況</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each intervalData as interval}
      <div class="interval-card bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-200">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{getMasteryIcon(interval.mastery)}</span>
            <div>
              <div class="font-medium text-gray-800">
                {intervalInfo[interval.type]?.name || interval.type}
              </div>
              <div class="text-xs text-gray-500">
                {getMasteryMessage(interval.mastery)}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg text-gray-800">
              {interval.mastery}%
            </div>
            <div class="text-xs text-gray-500">
              {interval.attempts}回挑戦
            </div>
          </div>
        </div>
        
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r {intervalInfo[interval.type]?.color || 'from-gray-400 to-gray-600'} h-3 transition-all duration-500"
            style="width: {interval.mastery}%"
          />
        </div>
        
        {#if interval.accuracy !== undefined}
          <div class="mt-2 text-xs text-gray-600">
            平均精度: {interval.accuracy.toFixed(1)}%
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  {#if intervalData.length === 0}
    <div class="text-center py-8 text-gray-500">
      <div class="text-4xl mb-2">🎵</div>
      <div>まだ音程データがありません</div>
    </div>
  {/if}
</div>

<style>
  .interval-card {
    border: 1px solid transparent;
  }
  
  .interval-card:hover {
    border-color: #e5e7eb;
    transform: translateY(-1px);
  }
</style>