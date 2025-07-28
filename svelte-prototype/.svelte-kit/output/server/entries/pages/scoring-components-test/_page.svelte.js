import { c as create_ssr_component, e as escape, d as each, f as add_attribute, g as null_to_empty, v as validate_component } from "../../../chunks/ssr.js";
/* empty css                                                              */
const css$5 = {
  code: ".score-result-panel.svelte-1eorlgc{transition:transform 0.2s ease}.score-result-panel.svelte-1eorlgc:hover{transform:translateY(-2px)}.scoring-aspect.svelte-1eorlgc{transition:all 0.2s ease}.scoring-aspect.svelte-1eorlgc:hover{background-color:#f9fafb;padding:8px;margin:-8px;border-radius:8px}",
  map: `{"version":3,"file":"ScoreResultPanel.svelte","sources":["ScoreResultPanel.svelte"],"sourcesContent":["<script>\\n  export let totalScore = 0;\\n  export let grade = 'C';\\n  export let componentScores = {};\\n  export let className = '';\\n  \\n  // グレードに応じた色とスタイルを取得\\n  const getGradeStyle = (grade) => {\\n    const styles = {\\n      'S': { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-900', shadow: 'shadow-yellow-200' },\\n      'A+': { bg: 'from-green-400 to-green-600', text: 'text-green-900', shadow: 'shadow-green-200' },\\n      'A': { bg: 'from-green-500 to-green-700', text: 'text-green-900', shadow: 'shadow-green-200' },\\n      'B+': { bg: 'from-blue-400 to-blue-600', text: 'text-blue-900', shadow: 'shadow-blue-200' },\\n      'B': { bg: 'from-blue-500 to-blue-700', text: 'text-blue-900', shadow: 'shadow-blue-200' },\\n      'C+': { bg: 'from-orange-400 to-orange-600', text: 'text-orange-900', shadow: 'shadow-orange-200' },\\n      'C': { bg: 'from-orange-500 to-orange-700', text: 'text-orange-900', shadow: 'shadow-orange-200' },\\n      'D+': { bg: 'from-red-400 to-red-600', text: 'text-red-900', shadow: 'shadow-red-200' },\\n      'D': { bg: 'from-red-500 to-red-700', text: 'text-red-900', shadow: 'shadow-red-200' },\\n      'F': { bg: 'from-gray-400 to-gray-600', text: 'text-gray-900', shadow: 'shadow-gray-200' }\\n    };\\n    return styles[grade] || styles['C'];\\n  };\\n  \\n  // 5側面採点項目の定義\\n  const scoringAspects = [\\n    { key: 'pitchAccuracy', name: '音程精度', icon: '🎯', weight: 40 },\\n    { key: 'recognitionSpeed', name: '認識速度', icon: '⚡', weight: 20 },\\n    { key: 'intervalMastery', name: '音程習得', icon: '📊', weight: 20 },\\n    { key: 'directionAccuracy', name: '方向精度', icon: '🧭', weight: 10 },\\n    { key: 'consistency', name: '一貫性', icon: '🎪', weight: 10 }\\n  ];\\n  \\n  $: gradeStyle = getGradeStyle(grade);\\n<\/script>\\n\\n<div class=\\"score-result-panel {className} bg-white rounded-xl shadow-lg overflow-hidden\\">\\n  <!-- 総合スコアセクション -->\\n  <div class=\\"bg-gradient-to-r {gradeStyle.bg} p-6\\">\\n    <div class=\\"text-center\\">\\n      <div class=\\"inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-4\\">\\n        <div class=\\"text-center\\">\\n          <div class=\\"text-5xl font-bold {gradeStyle.text}\\">{totalScore}</div>\\n          <div class=\\"text-sm text-gray-600\\">点</div>\\n        </div>\\n      </div>\\n      <div class=\\"text-white\\">\\n        <div class=\\"text-4xl font-bold mb-2\\">{grade}</div>\\n        <div class=\\"text-lg opacity-90\\">グレード</div>\\n      </div>\\n    </div>\\n  </div>\\n  \\n  <!-- 5側面採点詳細 -->\\n  <div class=\\"p-6\\">\\n    <h3 class=\\"text-lg font-semibold text-gray-800 mb-4\\">採点詳細</h3>\\n    <div class=\\"space-y-3\\">\\n      {#each scoringAspects as aspect}\\n        <div class=\\"scoring-aspect\\">\\n          <div class=\\"flex items-center justify-between mb-1\\">\\n            <div class=\\"flex items-center gap-2\\">\\n              <span class=\\"text-xl\\">{aspect.icon}</span>\\n              <span class=\\"font-medium text-gray-700\\">{aspect.name}</span>\\n              <span class=\\"text-xs text-gray-500\\">({aspect.weight}%)</span>\\n            </div>\\n            <span class=\\"font-bold text-lg text-gray-800\\">\\n              {componentScores[aspect.key] || 0}\\n            </span>\\n          </div>\\n          <div class=\\"w-full bg-gray-200 rounded-full h-2\\">\\n            <div \\n              class=\\"bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500\\"\\n              style=\\"width: {componentScores[aspect.key] || 0}%\\"\\n            />\\n          </div>\\n        </div>\\n      {/each}\\n    </div>\\n  </div>\\n</div>\\n\\n<style>\\n  .score-result-panel {\\n    transition: transform 0.2s ease;\\n  }\\n  \\n  .score-result-panel:hover {\\n    transform: translateY(-2px);\\n  }\\n  \\n  .scoring-aspect {\\n    transition: all 0.2s ease;\\n  }\\n  \\n  .scoring-aspect:hover {\\n    background-color: #f9fafb;\\n    padding: 8px;\\n    margin: -8px;\\n    border-radius: 8px;\\n  }\\n</style>"],"names":[],"mappings":"AAiFE,kCAAoB,CAClB,UAAU,CAAE,SAAS,CAAC,IAAI,CAAC,IAC7B,CAEA,kCAAmB,MAAO,CACxB,SAAS,CAAE,WAAW,IAAI,CAC5B,CAEA,8BAAgB,CACd,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,8BAAe,MAAO,CACpB,gBAAgB,CAAE,OAAO,CACzB,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GACjB"}`
};
const ScoreResultPanel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let gradeStyle;
  let { totalScore = 0 } = $$props;
  let { grade = "C" } = $$props;
  let { componentScores = {} } = $$props;
  let { className = "" } = $$props;
  const getGradeStyle = (grade2) => {
    const styles = {
      "S": {
        bg: "from-yellow-400 to-yellow-600",
        text: "text-yellow-900",
        shadow: "shadow-yellow-200"
      },
      "A+": {
        bg: "from-green-400 to-green-600",
        text: "text-green-900",
        shadow: "shadow-green-200"
      },
      "A": {
        bg: "from-green-500 to-green-700",
        text: "text-green-900",
        shadow: "shadow-green-200"
      },
      "B+": {
        bg: "from-blue-400 to-blue-600",
        text: "text-blue-900",
        shadow: "shadow-blue-200"
      },
      "B": {
        bg: "from-blue-500 to-blue-700",
        text: "text-blue-900",
        shadow: "shadow-blue-200"
      },
      "C+": {
        bg: "from-orange-400 to-orange-600",
        text: "text-orange-900",
        shadow: "shadow-orange-200"
      },
      "C": {
        bg: "from-orange-500 to-orange-700",
        text: "text-orange-900",
        shadow: "shadow-orange-200"
      },
      "D+": {
        bg: "from-red-400 to-red-600",
        text: "text-red-900",
        shadow: "shadow-red-200"
      },
      "D": {
        bg: "from-red-500 to-red-700",
        text: "text-red-900",
        shadow: "shadow-red-200"
      },
      "F": {
        bg: "from-gray-400 to-gray-600",
        text: "text-gray-900",
        shadow: "shadow-gray-200"
      }
    };
    return styles[grade2] || styles["C"];
  };
  const scoringAspects = [
    {
      key: "pitchAccuracy",
      name: "音程精度",
      icon: "🎯",
      weight: 40
    },
    {
      key: "recognitionSpeed",
      name: "認識速度",
      icon: "⚡",
      weight: 20
    },
    {
      key: "intervalMastery",
      name: "音程習得",
      icon: "📊",
      weight: 20
    },
    {
      key: "directionAccuracy",
      name: "方向精度",
      icon: "🧭",
      weight: 10
    },
    {
      key: "consistency",
      name: "一貫性",
      icon: "🎪",
      weight: 10
    }
  ];
  if ($$props.totalScore === void 0 && $$bindings.totalScore && totalScore !== void 0) $$bindings.totalScore(totalScore);
  if ($$props.grade === void 0 && $$bindings.grade && grade !== void 0) $$bindings.grade(grade);
  if ($$props.componentScores === void 0 && $$bindings.componentScores && componentScores !== void 0) $$bindings.componentScores(componentScores);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$5);
  gradeStyle = getGradeStyle(grade);
  return `<div class="${"score-result-panel " + escape(className, true) + " bg-white rounded-xl shadow-lg overflow-hidden svelte-1eorlgc"}"> <div class="${"bg-gradient-to-r " + escape(gradeStyle.bg, true) + " p-6 svelte-1eorlgc"}"><div class="text-center"><div class="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-4"><div class="text-center"><div class="${"text-5xl font-bold " + escape(gradeStyle.text, true) + " svelte-1eorlgc"}">${escape(totalScore)}</div> <div class="text-sm text-gray-600" data-svelte-h="svelte-tq02xs">点</div></div></div> <div class="text-white"><div class="text-4xl font-bold mb-2">${escape(grade)}</div> <div class="text-lg opacity-90" data-svelte-h="svelte-1varsz0">グレード</div></div></div></div>  <div class="p-6"><h3 class="text-lg font-semibold text-gray-800 mb-4" data-svelte-h="svelte-1qj7xji">採点詳細</h3> <div class="space-y-3">${each(scoringAspects, (aspect) => {
    return `<div class="scoring-aspect svelte-1eorlgc"><div class="flex items-center justify-between mb-1"><div class="flex items-center gap-2"><span class="text-xl">${escape(aspect.icon)}</span> <span class="font-medium text-gray-700">${escape(aspect.name)}</span> <span class="text-xs text-gray-500">(${escape(aspect.weight)}%)</span></div> <span class="font-bold text-lg text-gray-800">${escape(componentScores[aspect.key] || 0)} </span></div> <div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500" style="${"width: " + escape(componentScores[aspect.key] || 0, true) + "%"}"></div></div> </div>`;
  })}</div></div> </div>`;
});
const css$4 = {
  code: ".interval-card.svelte-bryd2a{border:1px solid transparent}.interval-card.svelte-bryd2a:hover{border-color:#e5e7eb;transform:translateY(-1px)}",
  map: `{"version":3,"file":"IntervalProgressTracker.svelte","sources":["IntervalProgressTracker.svelte"],"sourcesContent":["<script>\\n  export let intervalData = [];\\n  export let className = '';\\n  \\n  // 音程の表示名と色の定義\\n  const intervalInfo = {\\n    'unison': { name: 'ユニゾン', color: 'from-gray-400 to-gray-600' },\\n    'minor_second': { name: '短2度', color: 'from-purple-400 to-purple-600' },\\n    'major_second': { name: '長2度', color: 'from-indigo-400 to-indigo-600' },\\n    'minor_third': { name: '短3度', color: 'from-blue-400 to-blue-600' },\\n    'major_third': { name: '長3度', color: 'from-cyan-400 to-cyan-600' },\\n    'perfect_fourth': { name: '完全4度', color: 'from-teal-400 to-teal-600' },\\n    'tritone': { name: 'トライトーン', color: 'from-green-400 to-green-600' },\\n    'perfect_fifth': { name: '完全5度', color: 'from-lime-400 to-lime-600' },\\n    'minor_sixth': { name: '短6度', color: 'from-yellow-400 to-yellow-600' },\\n    'major_sixth': { name: '長6度', color: 'from-amber-400 to-amber-600' },\\n    'minor_seventh': { name: '短7度', color: 'from-orange-400 to-orange-600' },\\n    'major_seventh': { name: '長7度', color: 'from-red-400 to-red-600' },\\n    'octave': { name: 'オクターブ', color: 'from-pink-400 to-pink-600' }\\n  };\\n  \\n  // 習得レベルに応じたメッセージ\\n  const getMasteryMessage = (mastery) => {\\n    if (mastery >= 90) return 'マスター';\\n    if (mastery >= 70) return '習得中';\\n    if (mastery >= 50) return '練習中';\\n    if (mastery >= 30) return '初級';\\n    return '未習得';\\n  };\\n  \\n  // 習得レベルに応じたアイコン\\n  const getMasteryIcon = (mastery) => {\\n    if (mastery >= 90) return '⭐';\\n    if (mastery >= 70) return '🌟';\\n    if (mastery >= 50) return '💪';\\n    if (mastery >= 30) return '🌱';\\n    return '🌰';\\n  };\\n<\/script>\\n\\n<div class=\\"interval-progress-tracker {className} bg-white rounded-xl shadow-lg p-6\\">\\n  <h3 class=\\"text-lg font-semibold text-gray-800 mb-4\\">音程別習得状況</h3>\\n  \\n  <div class=\\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\\">\\n    {#each intervalData as interval}\\n      <div class=\\"interval-card bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-200\\">\\n        <div class=\\"flex items-center justify-between mb-2\\">\\n          <div class=\\"flex items-center gap-2\\">\\n            <span class=\\"text-2xl\\">{getMasteryIcon(interval.mastery)}</span>\\n            <div>\\n              <div class=\\"font-medium text-gray-800\\">\\n                {intervalInfo[interval.type]?.name || interval.type}\\n              </div>\\n              <div class=\\"text-xs text-gray-500\\">\\n                {getMasteryMessage(interval.mastery)}\\n              </div>\\n            </div>\\n          </div>\\n          <div class=\\"text-right\\">\\n            <div class=\\"font-bold text-lg text-gray-800\\">\\n              {interval.mastery}%\\n            </div>\\n            <div class=\\"text-xs text-gray-500\\">\\n              {interval.attempts}回挑戦\\n            </div>\\n          </div>\\n        </div>\\n        \\n        <div class=\\"w-full bg-gray-200 rounded-full h-3 overflow-hidden\\">\\n          <div \\n            class=\\"bg-gradient-to-r {intervalInfo[interval.type]?.color || 'from-gray-400 to-gray-600'} h-3 transition-all duration-500\\"\\n            style=\\"width: {interval.mastery}%\\"\\n          />\\n        </div>\\n        \\n        {#if interval.accuracy !== undefined}\\n          <div class=\\"mt-2 text-xs text-gray-600\\">\\n            平均精度: {interval.accuracy.toFixed(1)}%\\n          </div>\\n        {/if}\\n      </div>\\n    {/each}\\n  </div>\\n  \\n  {#if intervalData.length === 0}\\n    <div class=\\"text-center py-8 text-gray-500\\">\\n      <div class=\\"text-4xl mb-2\\">🎵</div>\\n      <div>まだ音程データがありません</div>\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>\\n  .interval-card {\\n    border: 1px solid transparent;\\n  }\\n  \\n  .interval-card:hover {\\n    border-color: #e5e7eb;\\n    transform: translateY(-1px);\\n  }\\n</style>"],"names":[],"mappings":"AA6FE,4BAAe,CACb,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,WACpB,CAEA,4BAAc,MAAO,CACnB,YAAY,CAAE,OAAO,CACrB,SAAS,CAAE,WAAW,IAAI,CAC5B"}`
};
const IntervalProgressTracker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { intervalData = [] } = $$props;
  let { className = "" } = $$props;
  const intervalInfo = {
    "unison": {
      name: "ユニゾン",
      color: "from-gray-400 to-gray-600"
    },
    "minor_second": {
      name: "短2度",
      color: "from-purple-400 to-purple-600"
    },
    "major_second": {
      name: "長2度",
      color: "from-indigo-400 to-indigo-600"
    },
    "minor_third": {
      name: "短3度",
      color: "from-blue-400 to-blue-600"
    },
    "major_third": {
      name: "長3度",
      color: "from-cyan-400 to-cyan-600"
    },
    "perfect_fourth": {
      name: "完全4度",
      color: "from-teal-400 to-teal-600"
    },
    "tritone": {
      name: "トライトーン",
      color: "from-green-400 to-green-600"
    },
    "perfect_fifth": {
      name: "完全5度",
      color: "from-lime-400 to-lime-600"
    },
    "minor_sixth": {
      name: "短6度",
      color: "from-yellow-400 to-yellow-600"
    },
    "major_sixth": {
      name: "長6度",
      color: "from-amber-400 to-amber-600"
    },
    "minor_seventh": {
      name: "短7度",
      color: "from-orange-400 to-orange-600"
    },
    "major_seventh": {
      name: "長7度",
      color: "from-red-400 to-red-600"
    },
    "octave": {
      name: "オクターブ",
      color: "from-pink-400 to-pink-600"
    }
  };
  const getMasteryMessage = (mastery) => {
    if (mastery >= 90) return "マスター";
    if (mastery >= 70) return "習得中";
    if (mastery >= 50) return "練習中";
    if (mastery >= 30) return "初級";
    return "未習得";
  };
  const getMasteryIcon = (mastery) => {
    if (mastery >= 90) return "⭐";
    if (mastery >= 70) return "🌟";
    if (mastery >= 50) return "💪";
    if (mastery >= 30) return "🌱";
    return "🌰";
  };
  if ($$props.intervalData === void 0 && $$bindings.intervalData && intervalData !== void 0) $$bindings.intervalData(intervalData);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$4);
  return `<div class="${"interval-progress-tracker " + escape(className, true) + " bg-white rounded-xl shadow-lg p-6 svelte-bryd2a"}"><h3 class="text-lg font-semibold text-gray-800 mb-4" data-svelte-h="svelte-e86xsw">音程別習得状況</h3> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${each(intervalData, (interval) => {
    return `<div class="interval-card bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-200 svelte-bryd2a"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-2xl">${escape(getMasteryIcon(interval.mastery))}</span> <div><div class="font-medium text-gray-800">${escape(intervalInfo[interval.type]?.name || interval.type)}</div> <div class="text-xs text-gray-500">${escape(getMasteryMessage(interval.mastery))}</div> </div></div> <div class="text-right"><div class="font-bold text-lg text-gray-800">${escape(interval.mastery)}%</div> <div class="text-xs text-gray-500">${escape(interval.attempts)}回挑戦</div> </div></div> <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden"><div class="${"bg-gradient-to-r " + escape(intervalInfo[interval.type]?.color || "from-gray-400 to-gray-600", true) + " h-3 transition-all duration-500 svelte-bryd2a"}" style="${"width: " + escape(interval.mastery, true) + "%"}"></div></div> ${interval.accuracy !== void 0 ? `<div class="mt-2 text-xs text-gray-600">平均精度: ${escape(interval.accuracy.toFixed(1))}%
          </div>` : ``} </div>`;
  })}</div> ${intervalData.length === 0 ? `<div class="text-center py-8 text-gray-500" data-svelte-h="svelte-14r8c3z"><div class="text-4xl mb-2">🎵</div> <div>まだ音程データがありません</div></div>` : ``} </div>`;
});
const css$3 = {
  code: ".graph-container.svelte-uaryoh.svelte-uaryoh{position:relative}.grid-lines.svelte-uaryoh text.svelte-uaryoh{user-select:none}",
  map: `{"version":3,"file":"ConsistencyGraph.svelte","sources":["ConsistencyGraph.svelte"],"sourcesContent":["<script>\\n  export let consistencyData = [];\\n  export let className = '';\\n  export let height = 200;\\n  \\n  // グラフ表示用のデータを準備\\n  $: graphData = prepareGraphData(consistencyData);\\n  \\n  function prepareGraphData(data) {\\n    if (!data || data.length === 0) return { points: '', max: 100, min: 0 };\\n    \\n    const values = data.map(d => d.score);\\n    const max = Math.max(...values, 100);\\n    const min = Math.min(...values, 0);\\n    const range = max - min || 1;\\n    \\n    // SVGパス用の座標を計算\\n    const width = 400;\\n    const points = data.map((d, i) => {\\n      const x = (i / (data.length - 1)) * width;\\n      const y = height - ((d.score - min) / range) * height;\\n      return \`\${x},\${y}\`;\\n    }).join(' ');\\n    \\n    return { points, max, min, values };\\n  }\\n  \\n  // 一貫性スコアに応じた色を取得\\n  function getConsistencyColor(score) {\\n    if (score >= 80) return '#10b981'; // green\\n    if (score >= 60) return '#3b82f6'; // blue\\n    if (score >= 40) return '#f59e0b'; // yellow\\n    return '#ef4444'; // red\\n  }\\n  \\n  // 平均スコアを計算\\n  $: averageScore = consistencyData.length > 0\\n    ? consistencyData.reduce((sum, d) => sum + d.score, 0) / consistencyData.length\\n    : 0;\\n    \\n  // 最新のトレンドを計算\\n  $: trend = calculateTrend(consistencyData);\\n  \\n  function calculateTrend(data) {\\n    if (data.length < 2) return 'neutral';\\n    const recent = data.slice(-5); // 最新5件\\n    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));\\n    const secondHalf = recent.slice(Math.floor(recent.length / 2));\\n    \\n    const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;\\n    const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;\\n    \\n    if (secondAvg > firstAvg + 5) return 'improving';\\n    if (secondAvg < firstAvg - 5) return 'declining';\\n    return 'stable';\\n  }\\n<\/script>\\n\\n<div class=\\"consistency-graph {className} bg-white rounded-xl shadow-lg p-6\\">\\n  <div class=\\"flex items-center justify-between mb-4\\">\\n    <h3 class=\\"text-lg font-semibold text-gray-800\\">一貫性グラフ</h3>\\n    <div class=\\"flex items-center gap-4\\">\\n      <div class=\\"text-sm\\">\\n        <span class=\\"text-gray-500\\">平均:</span>\\n        <span class=\\"font-bold\\" style=\\"color: {getConsistencyColor(averageScore)}\\">\\n          {averageScore.toFixed(1)}%\\n        </span>\\n      </div>\\n      <div class=\\"flex items-center gap-1\\">\\n        {#if trend === 'improving'}\\n          <span class=\\"text-green-500\\">↑</span>\\n          <span class=\\"text-sm text-green-600\\">改善中</span>\\n        {:else if trend === 'declining'}\\n          <span class=\\"text-red-500\\">↓</span>\\n          <span class=\\"text-sm text-red-600\\">低下中</span>\\n        {:else}\\n          <span class=\\"text-gray-500\\">→</span>\\n          <span class=\\"text-sm text-gray-600\\">安定</span>\\n        {/if}\\n      </div>\\n    </div>\\n  </div>\\n  \\n  {#if consistencyData.length > 0}\\n    <div class=\\"graph-container\\">\\n      <svg viewBox=\\"0 0 400 {height}\\" class=\\"w-full\\" style=\\"height: {height}px\\">\\n        <!-- グリッド線 -->\\n        <g class=\\"grid-lines\\">\\n          {#each [0, 25, 50, 75, 100] as value}\\n            <line\\n              x1=\\"0\\"\\n              y1=\\"{height - (value / 100) * height}\\"\\n              x2=\\"400\\"\\n              y2=\\"{height - (value / 100) * height}\\"\\n              stroke=\\"#e5e7eb\\"\\n              stroke-width=\\"1\\"\\n              stroke-dasharray=\\"2,2\\"\\n            />\\n            <text\\n              x=\\"-5\\"\\n              y=\\"{height - (value / 100) * height + 5}\\"\\n              text-anchor=\\"end\\"\\n              fill=\\"#9ca3af\\"\\n              font-size=\\"12\\"\\n            >\\n              {value}%\\n            </text>\\n          {/each}\\n        </g>\\n        \\n        <!-- グラフ背景 -->\\n        <defs>\\n          <linearGradient id=\\"consistency-gradient\\" x1=\\"0\\" y1=\\"0\\" x2=\\"0\\" y2=\\"1\\">\\n            <stop offset=\\"0%\\" stop-color=\\"#3b82f6\\" stop-opacity=\\"0.2\\" />\\n            <stop offset=\\"100%\\" stop-color=\\"#3b82f6\\" stop-opacity=\\"0\\" />\\n          </linearGradient>\\n        </defs>\\n        \\n        <!-- グラフエリア -->\\n        {#if graphData.points}\\n          <polygon\\n            points=\\"0,{height} {graphData.points} 400,{height}\\"\\n            fill=\\"url(#consistency-gradient)\\"\\n          />\\n          \\n          <!-- グラフ線 -->\\n          <polyline\\n            points=\\"{graphData.points}\\"\\n            fill=\\"none\\"\\n            stroke=\\"#3b82f6\\"\\n            stroke-width=\\"2\\"\\n          />\\n          \\n          <!-- データポイント -->\\n          {#each consistencyData as point, i}\\n            <circle\\n              cx=\\"{(i / (consistencyData.length - 1)) * 400}\\"\\n              cy=\\"{height - ((point.score - graphData.min) / (graphData.max - graphData.min)) * height}\\"\\n              r=\\"4\\"\\n              fill=\\"{getConsistencyColor(point.score)}\\"\\n              stroke=\\"white\\"\\n              stroke-width=\\"2\\"\\n            />\\n          {/each}\\n        {/if}\\n      </svg>\\n    </div>\\n    \\n    <!-- 最近のデータポイント -->\\n    <div class=\\"mt-4 flex gap-2 overflow-x-auto\\">\\n      {#each consistencyData.slice(-10) as point, i}\\n        <div class=\\"flex-shrink-0 text-center\\">\\n          <div \\n            class=\\"w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm\\"\\n            style=\\"background-color: {getConsistencyColor(point.score)}\\"\\n          >\\n            {point.score}\\n          </div>\\n          <div class=\\"text-xs text-gray-500 mt-1\\">\\n            {i + 1}回前\\n          </div>\\n        </div>\\n      {/each}\\n    </div>\\n  {:else}\\n    <div class=\\"text-center py-12 text-gray-500\\">\\n      <div class=\\"text-4xl mb-2\\">📈</div>\\n      <div>一貫性データがまだありません</div>\\n      <div class=\\"text-sm mt-2\\">複数回チャレンジするとグラフが表示されます</div>\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>\\n  .graph-container {\\n    position: relative;\\n  }\\n  \\n  .grid-lines text {\\n    user-select: none;\\n  }\\n</style>"],"names":[],"mappings":"AA8KE,4CAAiB,CACf,QAAQ,CAAE,QACZ,CAEA,yBAAW,CAAC,kBAAK,CACf,WAAW,CAAE,IACf"}`
};
function getConsistencyColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
function calculateTrend(data) {
  if (data.length < 2) return "neutral";
  const recent = data.slice(-5);
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;
  if (secondAvg > firstAvg + 5) return "improving";
  if (secondAvg < firstAvg - 5) return "declining";
  return "stable";
}
const ConsistencyGraph = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let graphData;
  let averageScore;
  let trend;
  let { consistencyData = [] } = $$props;
  let { className = "" } = $$props;
  let { height = 200 } = $$props;
  function prepareGraphData(data) {
    if (!data || data.length === 0) return { points: "", max: 100, min: 0 };
    const values = data.map((d) => d.score);
    const max = Math.max(...values, 100);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const width = 400;
    const points = data.map((d, i) => {
      const x = i / (data.length - 1) * width;
      const y = height - (d.score - min) / range * height;
      return `${x},${y}`;
    }).join(" ");
    return { points, max, min, values };
  }
  if ($$props.consistencyData === void 0 && $$bindings.consistencyData && consistencyData !== void 0) $$bindings.consistencyData(consistencyData);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  $$result.css.add(css$3);
  graphData = prepareGraphData(consistencyData);
  averageScore = consistencyData.length > 0 ? consistencyData.reduce((sum, d) => sum + d.score, 0) / consistencyData.length : 0;
  trend = calculateTrend(consistencyData);
  return `<div class="${"consistency-graph " + escape(className, true) + " bg-white rounded-xl shadow-lg p-6 svelte-uaryoh"}"><div class="flex items-center justify-between mb-4"><h3 class="text-lg font-semibold text-gray-800" data-svelte-h="svelte-17em45">一貫性グラフ</h3> <div class="flex items-center gap-4"><div class="text-sm"><span class="text-gray-500" data-svelte-h="svelte-1mot1su">平均:</span> <span class="font-bold" style="${"color: " + escape(getConsistencyColor(averageScore), true)}">${escape(averageScore.toFixed(1))}%</span></div> <div class="flex items-center gap-1">${trend === "improving" ? `<span class="text-green-500" data-svelte-h="svelte-16offtj">↑</span> <span class="text-sm text-green-600" data-svelte-h="svelte-1rjrzhl">改善中</span>` : `${trend === "declining" ? `<span class="text-red-500" data-svelte-h="svelte-kdozxh">↓</span> <span class="text-sm text-red-600" data-svelte-h="svelte-1xifm37">低下中</span>` : `<span class="text-gray-500" data-svelte-h="svelte-1jbvjas">→</span> <span class="text-sm text-gray-600" data-svelte-h="svelte-121e93u">安定</span>`}`}</div></div></div> ${consistencyData.length > 0 ? `<div class="graph-container svelte-uaryoh"><svg viewBox="${"0 0 400 " + escape(height, true)}" class="w-full" style="${"height: " + escape(height, true) + "px"}"><g class="grid-lines svelte-uaryoh">${each([0, 25, 50, 75, 100], (value) => {
    return `<line x1="0"${add_attribute("y1", height - value / 100 * height, 0)} x2="400"${add_attribute("y2", height - value / 100 * height, 0)} stroke="#e5e7eb" stroke-width="1" stroke-dasharray="2,2"></line> <text x="-5"${add_attribute("y", height - value / 100 * height + 5, 0)} text-anchor="end" fill="#9ca3af" font-size="12" class="svelte-uaryoh">${escape(value)}%
            </text>`;
  })}</g><defs><linearGradient id="consistency-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"></stop><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"></stop></linearGradient></defs>${graphData.points ? `<polygon points="${"0," + escape(height, true) + " " + escape(graphData.points, true) + " 400," + escape(height, true)}" fill="url(#consistency-gradient)"></polygon>  <polyline${add_attribute("points", graphData.points, 0)} fill="none" stroke="#3b82f6" stroke-width="2"></polyline>  ${each(consistencyData, (point, i) => {
    return `<circle${add_attribute("cx", i / (consistencyData.length - 1) * 400, 0)}${add_attribute("cy", height - (point.score - graphData.min) / (graphData.max - graphData.min) * height, 0)} r="4"${add_attribute("fill", getConsistencyColor(point.score), 0)} stroke="white" stroke-width="2"></circle>`;
  })}` : ``}</svg></div>  <div class="mt-4 flex gap-2 overflow-x-auto">${each(consistencyData.slice(-10), (point, i) => {
    return `<div class="flex-shrink-0 text-center"><div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style="${"background-color: " + escape(getConsistencyColor(point.score), true)}">${escape(point.score)}</div> <div class="text-xs text-gray-500 mt-1">${escape(i + 1)}回前</div> </div>`;
  })}</div>` : `<div class="text-center py-12 text-gray-500" data-svelte-h="svelte-19ujcxo"><div class="text-4xl mb-2">📈</div> <div>一貫性データがまだありません</div> <div class="text-sm mt-2">複数回チャレンジするとグラフが表示されます</div></div>`} </div>`;
});
const css$2 = {
  code: ".feedback-display.svelte-k1ib06{transition:all 0.3s ease}.feedback-display.svelte-k1ib06:hover{transform:translateY(-2px);box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1)}.category-section.svelte-k1ib06{animation:svelte-k1ib06-fadeIn 0.5s ease}@keyframes svelte-k1ib06-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  map: `{"version":3,"file":"FeedbackDisplay.svelte","sources":["FeedbackDisplay.svelte"],"sourcesContent":["<script>\\n  export let feedback = {};\\n  export let className = '';\\n  \\n  // フィードバックタイプに応じたスタイル\\n  const feedbackStyles = {\\n    'excellent': {\\n      bg: 'bg-green-50',\\n      border: 'border-green-200',\\n      icon: '🎆',\\n      iconBg: 'bg-green-100',\\n      titleColor: 'text-green-800',\\n      contentColor: 'text-green-700'\\n    },\\n    'good': {\\n      bg: 'bg-blue-50',\\n      border: 'border-blue-200',\\n      icon: '👍',\\n      iconBg: 'bg-blue-100',\\n      titleColor: 'text-blue-800',\\n      contentColor: 'text-blue-700'\\n    },\\n    'improvement': {\\n      bg: 'bg-amber-50',\\n      border: 'border-amber-200',\\n      icon: '💡',\\n      iconBg: 'bg-amber-100',\\n      titleColor: 'text-amber-800',\\n      contentColor: 'text-amber-700'\\n    },\\n    'warning': {\\n      bg: 'bg-red-50',\\n      border: 'border-red-200',\\n      icon: '⚠️',\\n      iconBg: 'bg-red-100',\\n      titleColor: 'text-red-800',\\n      contentColor: 'text-red-700'\\n    },\\n    'info': {\\n      bg: 'bg-gray-50',\\n      border: 'border-gray-200',\\n      icon: 'ℹ️',\\n      iconBg: 'bg-gray-100',\\n      titleColor: 'text-gray-800',\\n      contentColor: 'text-gray-700'\\n    }\\n  };\\n  \\n  $: style = feedbackStyles[feedback.type] || feedbackStyles.info;\\n  \\n  // 詳細フィードバックをカテゴリ別に整理\\n  $: categorizedFeedback = categorizeFeedback(feedback.details || []);\\n  \\n  function categorizeFeedback(details) {\\n    const categories = {\\n      strengths: [],\\n      improvements: [],\\n      tips: [],\\n      practice: []\\n    };\\n    \\n    details.forEach(item => {\\n      if (item.category && categories[item.category]) {\\n        categories[item.category].push(item);\\n      }\\n    });\\n    \\n    return categories;\\n  }\\n  \\n  const categoryInfo = {\\n    strengths: { title: '優れている点', icon: '✨' },\\n    improvements: { title: '改善点', icon: '🎯' },\\n    tips: { title: 'アドバイス', icon: '📝' },\\n    practice: { title: '練習提案', icon: '🎹' }\\n  };\\n<\/script>\\n\\n<div class=\\"feedback-display {className} {style.bg} {style.border} border rounded-xl p-6\\">\\n  <!-- メインフィードバック -->\\n  <div class=\\"flex items-start gap-4 mb-4\\">\\n    <div class=\\"{style.iconBg} rounded-full p-3 flex-shrink-0\\">\\n      <span class=\\"text-2xl\\">{style.icon}</span>\\n    </div>\\n    <div class=\\"flex-1\\">\\n      <h3 class=\\"{style.titleColor} font-semibold text-lg mb-2\\">\\n        {feedback.primary || 'フィードバック'}\\n      </h3>\\n      {#if feedback.summary}\\n        <p class=\\"{style.contentColor}\\">\\n          {feedback.summary}\\n        </p>\\n      {/if}\\n    </div>\\n  </div>\\n  \\n  <!-- 詳細フィードバック -->\\n  {#if feedback.details && feedback.details.length > 0}\\n    <div class=\\"space-y-4 mt-6\\">\\n      {#each Object.entries(categorizedFeedback) as [category, items]}\\n        {#if items.length > 0}\\n          <div class=\\"category-section\\">\\n            <div class=\\"flex items-center gap-2 mb-2\\">\\n              <span class=\\"text-lg\\">{categoryInfo[category].icon}</span>\\n              <h4 class=\\"font-medium {style.titleColor}\\">\\n                {categoryInfo[category].title}\\n              </h4>\\n            </div>\\n            <ul class=\\"space-y-2 ml-7\\">\\n              {#each items as item}\\n                <li class=\\"flex items-start gap-2\\">\\n                  <span class=\\"{style.contentColor} mt-1\\">•</span>\\n                  <span class=\\"{style.contentColor} text-sm\\">\\n                    {item.text}\\n                  </span>\\n                </li>\\n              {/each}\\n            </ul>\\n          </div>\\n        {/if}\\n      {/each}\\n    </div>\\n  {/if}\\n  \\n  <!-- 次のステップ -->\\n  {#if feedback.nextSteps && feedback.nextSteps.length > 0}\\n    <div class=\\"mt-6 pt-4 border-t {style.border}\\">\\n      <h4 class=\\"font-medium {style.titleColor} mb-3\\">\\n        🚀 次のステップ\\n      </h4>\\n      <div class=\\"grid gap-2\\">\\n        {#each feedback.nextSteps as step, i}\\n          <div class=\\"flex items-center gap-3 bg-white bg-opacity-50 rounded-lg p-3\\">\\n            <div class=\\"w-6 h-6 rounded-full {style.iconBg} flex items-center justify-center flex-shrink-0\\">\\n              <span class=\\"text-xs font-bold {style.titleColor}\\">{i + 1}</span>\\n            </div>\\n            <span class=\\"text-sm {style.contentColor}\\">{step}</span>\\n          </div>\\n        {/each}\\n      </div>\\n    </div>\\n  {/if}\\n  \\n  <!-- モチベーションメッセージ -->\\n  {#if feedback.motivation}\\n    <div class=\\"mt-4 text-center\\">\\n      <div class=\\"inline-flex items-center gap-2 bg-white bg-opacity-50 rounded-full px-4 py-2\\">\\n        <span class=\\"text-xl\\">🌟</span>\\n        <span class=\\"font-medium {style.titleColor}\\">\\n          {feedback.motivation}\\n        </span>\\n      </div>\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>\\n  .feedback-display {\\n    transition: all 0.3s ease;\\n  }\\n  \\n  .feedback-display:hover {\\n    transform: translateY(-2px);\\n    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .category-section {\\n    animation: fadeIn 0.5s ease;\\n  }\\n  \\n  @keyframes fadeIn {\\n    from {\\n      opacity: 0;\\n      transform: translateY(10px);\\n    }\\n    to {\\n      opacity: 1;\\n      transform: translateY(0);\\n    }\\n  }\\n</style>"],"names":[],"mappings":"AA6JE,+BAAkB,CAChB,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,+BAAiB,MAAO,CACtB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC9C,CAEA,+BAAkB,CAChB,SAAS,CAAE,oBAAM,CAAC,IAAI,CAAC,IACzB,CAEA,WAAW,oBAAO,CAChB,IAAK,CACH,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,IAAI,CAC5B,CACA,EAAG,CACD,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,CAAC,CACzB,CACF"}`
};
function categorizeFeedback(details) {
  const categories = {
    strengths: [],
    improvements: [],
    tips: [],
    practice: []
  };
  details.forEach((item) => {
    if (item.category && categories[item.category]) {
      categories[item.category].push(item);
    }
  });
  return categories;
}
const FeedbackDisplay = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let style;
  let categorizedFeedback;
  let { feedback = {} } = $$props;
  let { className = "" } = $$props;
  const feedbackStyles = {
    "excellent": {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "🎆",
      iconBg: "bg-green-100",
      titleColor: "text-green-800",
      contentColor: "text-green-700"
    },
    "good": {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "👍",
      iconBg: "bg-blue-100",
      titleColor: "text-blue-800",
      contentColor: "text-blue-700"
    },
    "improvement": {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "💡",
      iconBg: "bg-amber-100",
      titleColor: "text-amber-800",
      contentColor: "text-amber-700"
    },
    "warning": {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "⚠️",
      iconBg: "bg-red-100",
      titleColor: "text-red-800",
      contentColor: "text-red-700"
    },
    "info": {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "ℹ️",
      iconBg: "bg-gray-100",
      titleColor: "text-gray-800",
      contentColor: "text-gray-700"
    }
  };
  const categoryInfo = {
    strengths: { title: "優れている点", icon: "✨" },
    improvements: { title: "改善点", icon: "🎯" },
    tips: { title: "アドバイス", icon: "📝" },
    practice: { title: "練習提案", icon: "🎹" }
  };
  if ($$props.feedback === void 0 && $$bindings.feedback && feedback !== void 0) $$bindings.feedback(feedback);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$2);
  style = feedbackStyles[feedback.type] || feedbackStyles.info;
  categorizedFeedback = categorizeFeedback(feedback.details || []);
  return `<div class="${"feedback-display " + escape(className, true) + " " + escape(style.bg, true) + " " + escape(style.border, true) + " border rounded-xl p-6 svelte-k1ib06"}"> <div class="flex items-start gap-4 mb-4"><div class="${escape(style.iconBg, true) + " rounded-full p-3 flex-shrink-0 svelte-k1ib06"}"><span class="text-2xl">${escape(style.icon)}</span></div> <div class="flex-1"><h3 class="${escape(style.titleColor, true) + " font-semibold text-lg mb-2 svelte-k1ib06"}">${escape(feedback.primary || "フィードバック")}</h3> ${feedback.summary ? `<p class="${escape(null_to_empty(style.contentColor), true) + " svelte-k1ib06"}">${escape(feedback.summary)}</p>` : ``}</div></div>  ${feedback.details && feedback.details.length > 0 ? `<div class="space-y-4 mt-6">${each(Object.entries(categorizedFeedback), ([category, items]) => {
    return `${items.length > 0 ? `<div class="category-section svelte-k1ib06"><div class="flex items-center gap-2 mb-2"><span class="text-lg">${escape(categoryInfo[category].icon)}</span> <h4 class="${"font-medium " + escape(style.titleColor, true) + " svelte-k1ib06"}">${escape(categoryInfo[category].title)} </h4></div> <ul class="space-y-2 ml-7">${each(items, (item) => {
      return `<li class="flex items-start gap-2"><span class="${escape(style.contentColor, true) + " mt-1 svelte-k1ib06"}">•</span> <span class="${escape(style.contentColor, true) + " text-sm svelte-k1ib06"}">${escape(item.text)}</span> </li>`;
    })}</ul> </div>` : ``}`;
  })}</div>` : ``}  ${feedback.nextSteps && feedback.nextSteps.length > 0 ? `<div class="${"mt-6 pt-4 border-t " + escape(style.border, true) + " svelte-k1ib06"}"><h4 class="${"font-medium " + escape(style.titleColor, true) + " mb-3 svelte-k1ib06"}">🚀 次のステップ</h4> <div class="grid gap-2">${each(feedback.nextSteps, (step, i) => {
    return `<div class="flex items-center gap-3 bg-white bg-opacity-50 rounded-lg p-3"><div class="${"w-6 h-6 rounded-full " + escape(style.iconBg, true) + " flex items-center justify-center flex-shrink-0 svelte-k1ib06"}"><span class="${"text-xs font-bold " + escape(style.titleColor, true) + " svelte-k1ib06"}">${escape(i + 1)}</span></div> <span class="${"text-sm " + escape(style.contentColor, true) + " svelte-k1ib06"}">${escape(step)}</span> </div>`;
  })}</div></div>` : ``}  ${feedback.motivation ? `<div class="mt-4 text-center"><div class="inline-flex items-center gap-2 bg-white bg-opacity-50 rounded-full px-4 py-2"><span class="text-xl" data-svelte-h="svelte-18gzvu2">🌟</span> <span class="${"font-medium " + escape(style.titleColor, true) + " svelte-k1ib06"}">${escape(feedback.motivation)}</span></div></div>` : ``} </div>`;
});
const css$1 = {
  code: ".stat-category.svelte-zmai3x{transition:all 0.2s ease}.stat-category.svelte-zmai3x:hover{transform:translateY(-2px);box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1)}.stat-item.svelte-zmai3x{padding:4px 0;border-bottom:1px solid #f3f4f6}.stat-item.svelte-zmai3x:last-child{border-bottom:none}.progress-summary.svelte-zmai3x{position:relative;overflow:hidden}.progress-summary.svelte-zmai3x::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);animation:svelte-zmai3x-shimmer 3s infinite}@keyframes svelte-zmai3x-shimmer{to{left:100%}}",
  map: `{"version":3,"file":"SessionStatistics.svelte","sources":["SessionStatistics.svelte"],"sourcesContent":["<script>\\n  export let statistics = {};\\n  export let className = '';\\n  \\n  // デフォルト値の設定\\n  const stats = {\\n    totalAttempts: statistics.totalAttempts || 0,\\n    successRate: statistics.successRate || 0,\\n    averageScore: statistics.averageScore || 0,\\n    bestScore: statistics.bestScore || 0,\\n    sessionDuration: statistics.sessionDuration || 0,\\n    streakCount: statistics.streakCount || 0,\\n    fatigueLevel: statistics.fatigueLevel || 'fresh',\\n    mostDifficultInterval: statistics.mostDifficultInterval || '-',\\n    mostSuccessfulInterval: statistics.mostSuccessfulInterval || '-',\\n    averageResponseTime: statistics.averageResponseTime || 0\\n  };\\n  \\n  // セッション時間をフォーマット\\n  function formatDuration(minutes) {\\n    if (minutes < 60) {\\n      return \`\${Math.floor(minutes)}分\`;\\n    }\\n    const hours = Math.floor(minutes / 60);\\n    const mins = Math.floor(minutes % 60);\\n    return \`\${hours}時間\${mins}分\`;\\n  }\\n  \\n  // 疲労レベルの表示\\n  const fatigueInfo = {\\n    'fresh': { label: 'フレッシュ', color: 'text-green-600', icon: '😊' },\\n    'normal': { label: '通常', color: 'text-blue-600', icon: '🙂' },\\n    'tired': { label: '疲れ気味', color: 'text-amber-600', icon: '😴' },\\n    'exhausted': { label: '疲労', color: 'text-red-600', icon: '😩' }\\n  };\\n  \\n  $: fatigue = fatigueInfo[stats.fatigueLevel] || fatigueInfo.normal;\\n  \\n  // 統計カテゴリ\\n  const statCategories = [\\n    {\\n      title: 'パフォーマンス',\\n      icon: '📊',\\n      stats: [\\n        { label: '総挑戦回数', value: \`\${stats.totalAttempts}回\`, highlight: stats.totalAttempts > 20 },\\n        { label: '成功率', value: \`\${stats.successRate.toFixed(1)}%\`, highlight: stats.successRate > 70 },\\n        { label: '平均スコア', value: \`\${stats.averageScore.toFixed(1)}点\`, highlight: stats.averageScore > 75 },\\n        { label: '最高スコア', value: \`\${stats.bestScore}点\`, highlight: stats.bestScore > 90 }\\n      ]\\n    },\\n    {\\n      title: 'セッション情報',\\n      icon: '⏱️',\\n      stats: [\\n        { label: '練習時間', value: formatDuration(stats.sessionDuration) },\\n        { label: '連続正解', value: \`\${stats.streakCount}回\`, highlight: stats.streakCount > 5 },\\n        { label: '平均応答時間', value: \`\${stats.averageResponseTime.toFixed(1)}秒\` },\\n        { \\n          label: '疲労度', \\n          value: fatigue.label, \\n          customClass: fatigue.color,\\n          icon: fatigue.icon\\n        }\\n      ]\\n    },\\n    {\\n      title: '音程分析',\\n      icon: '🎵',\\n      stats: [\\n        { \\n          label: '最も難しい音程', \\n          value: stats.mostDifficultInterval,\\n          customClass: 'text-red-600'\\n        },\\n        { \\n          label: '最も得意な音程', \\n          value: stats.mostSuccessfulInterval,\\n          customClass: 'text-green-600'\\n        }\\n      ]\\n    }\\n  ];\\n<\/script>\\n\\n<div class=\\"session-statistics {className} bg-white rounded-xl shadow-lg p-6\\">\\n  <h3 class=\\"text-xl font-semibold text-gray-800 mb-6\\">📊 セッション統計</h3>\\n  \\n  <div class=\\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\\">\\n    {#each statCategories as category}\\n      <div class=\\"stat-category bg-gray-50 rounded-lg p-4\\">\\n        <div class=\\"flex items-center gap-2 mb-3\\">\\n          <span class=\\"text-2xl\\">{category.icon}</span>\\n          <h4 class=\\"font-medium text-gray-700\\">{category.title}</h4>\\n        </div>\\n        \\n        <div class=\\"space-y-2\\">\\n          {#each category.stats as stat}\\n            <div class=\\"stat-item flex justify-between items-center\\">\\n              <span class=\\"text-sm text-gray-600\\">{stat.label}</span>\\n              <span class=\\"font-semibold {stat.customClass || (stat.highlight ? 'text-blue-600' : 'text-gray-800')}\\">\\n                {#if stat.icon}\\n                  <span class=\\"mr-1\\">{stat.icon}</span>\\n                {/if}\\n                {stat.value}\\n              </span>\\n            </div>\\n          {/each}\\n        </div>\\n      </div>\\n    {/each}\\n  </div>\\n  \\n  <!-- 進捗サマリー -->\\n  {#if stats.totalAttempts > 0}\\n    <div class=\\"mt-6 pt-6 border-t border-gray-200\\">\\n      <div class=\\"progress-summary bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4\\">\\n        <div class=\\"flex items-center justify-between flex-wrap gap-4\\">\\n          <div>\\n            <h4 class=\\"font-medium text-gray-700 mb-1\\">セッションサマリー</h4>\\n            <p class=\\"text-sm text-gray-600\\">\\n              {#if stats.averageScore >= 80}\\n                素晴らしいパフォーマンスです！相対音感が向上しています。\\n              {:else if stats.averageScore >= 60}\\n                良い進歩が見られます。継続することでさらなる向上が期待できます。\\n              {:else}\\n                練習を続けることが大切です。少しずつ確実に上達しています。\\n              {/if}\\n            </p>\\n          </div>\\n          \\n          {#if stats.streakCount > 0}\\n            <div class=\\"streak-display bg-white rounded-full px-4 py-2 shadow-sm\\">\\n              <span class=\\"text-2xl mr-2\\">🔥</span>\\n              <span class=\\"font-bold text-orange-600\\">{stats.streakCount}</span>\\n              <span class=\\"text-sm text-gray-600 ml-1\\">連続正解中</span>\\n            </div>\\n          {/if}\\n        </div>\\n      </div>\\n    </div>\\n  {/if}\\n</div>\\n\\n<style>\\n  .stat-category {\\n    transition: all 0.2s ease;\\n  }\\n  \\n  .stat-category:hover {\\n    transform: translateY(-2px);\\n    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .stat-item {\\n    padding: 4px 0;\\n    border-bottom: 1px solid #f3f4f6;\\n  }\\n  \\n  .stat-item:last-child {\\n    border-bottom: none;\\n  }\\n  \\n  .progress-summary {\\n    position: relative;\\n    overflow: hidden;\\n  }\\n  \\n  .progress-summary::before {\\n    content: '';\\n    position: absolute;\\n    top: 0;\\n    left: -100%;\\n    width: 100%;\\n    height: 100%;\\n    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);\\n    animation: shimmer 3s infinite;\\n  }\\n  \\n  @keyframes shimmer {\\n    to {\\n      left: 100%;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"AAgJE,4BAAe,CACb,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,4BAAc,MAAO,CACnB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC9C,CAEA,wBAAW,CACT,OAAO,CAAE,GAAG,CAAC,CAAC,CACd,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,OAC3B,CAEA,wBAAU,WAAY,CACpB,aAAa,CAAE,IACjB,CAEA,+BAAkB,CAChB,QAAQ,CAAE,QAAQ,CAClB,QAAQ,CAAE,MACZ,CAEA,+BAAiB,QAAS,CACxB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,gBAAgB,KAAK,CAAC,CAAC,WAAW,CAAC,CAAC,KAAK,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,CAAC,CAAC,WAAW,CAAC,CACnF,SAAS,CAAE,qBAAO,CAAC,EAAE,CAAC,QACxB,CAEA,WAAW,qBAAQ,CACjB,EAAG,CACD,IAAI,CAAE,IACR,CACF"}`
};
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${Math.floor(minutes)}分`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}時間${mins}分`;
}
const SessionStatistics = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fatigue;
  let { statistics = {} } = $$props;
  let { className = "" } = $$props;
  const stats = {
    totalAttempts: statistics.totalAttempts || 0,
    successRate: statistics.successRate || 0,
    averageScore: statistics.averageScore || 0,
    bestScore: statistics.bestScore || 0,
    sessionDuration: statistics.sessionDuration || 0,
    streakCount: statistics.streakCount || 0,
    fatigueLevel: statistics.fatigueLevel || "fresh",
    mostDifficultInterval: statistics.mostDifficultInterval || "-",
    mostSuccessfulInterval: statistics.mostSuccessfulInterval || "-",
    averageResponseTime: statistics.averageResponseTime || 0
  };
  const fatigueInfo = {
    "fresh": {
      label: "フレッシュ",
      color: "text-green-600",
      icon: "😊"
    },
    "normal": {
      label: "通常",
      color: "text-blue-600",
      icon: "🙂"
    },
    "tired": {
      label: "疲れ気味",
      color: "text-amber-600",
      icon: "😴"
    },
    "exhausted": {
      label: "疲労",
      color: "text-red-600",
      icon: "😩"
    }
  };
  const statCategories = [
    {
      title: "パフォーマンス",
      icon: "📊",
      stats: [
        {
          label: "総挑戦回数",
          value: `${stats.totalAttempts}回`,
          highlight: stats.totalAttempts > 20
        },
        {
          label: "成功率",
          value: `${stats.successRate.toFixed(1)}%`,
          highlight: stats.successRate > 70
        },
        {
          label: "平均スコア",
          value: `${stats.averageScore.toFixed(1)}点`,
          highlight: stats.averageScore > 75
        },
        {
          label: "最高スコア",
          value: `${stats.bestScore}点`,
          highlight: stats.bestScore > 90
        }
      ]
    },
    {
      title: "セッション情報",
      icon: "⏱️",
      stats: [
        {
          label: "練習時間",
          value: formatDuration(stats.sessionDuration)
        },
        {
          label: "連続正解",
          value: `${stats.streakCount}回`,
          highlight: stats.streakCount > 5
        },
        {
          label: "平均応答時間",
          value: `${stats.averageResponseTime.toFixed(1)}秒`
        },
        {
          label: "疲労度",
          value: fatigue.label,
          customClass: fatigue.color,
          icon: fatigue.icon
        }
      ]
    },
    {
      title: "音程分析",
      icon: "🎵",
      stats: [
        {
          label: "最も難しい音程",
          value: stats.mostDifficultInterval,
          customClass: "text-red-600"
        },
        {
          label: "最も得意な音程",
          value: stats.mostSuccessfulInterval,
          customClass: "text-green-600"
        }
      ]
    }
  ];
  if ($$props.statistics === void 0 && $$bindings.statistics && statistics !== void 0) $$bindings.statistics(statistics);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0) $$bindings.className(className);
  $$result.css.add(css$1);
  fatigue = fatigueInfo[stats.fatigueLevel] || fatigueInfo.normal;
  return `<div class="${"session-statistics " + escape(className, true) + " bg-white rounded-xl shadow-lg p-6 svelte-zmai3x"}"><h3 class="text-xl font-semibold text-gray-800 mb-6" data-svelte-h="svelte-1jvvszv">📊 セッション統計</h3> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${each(statCategories, (category) => {
    return `<div class="stat-category bg-gray-50 rounded-lg p-4 svelte-zmai3x"><div class="flex items-center gap-2 mb-3"><span class="text-2xl">${escape(category.icon)}</span> <h4 class="font-medium text-gray-700">${escape(category.title)}</h4></div> <div class="space-y-2">${each(category.stats, (stat) => {
      return `<div class="stat-item flex justify-between items-center svelte-zmai3x"><span class="text-sm text-gray-600">${escape(stat.label)}</span> <span class="${"font-semibold " + escape(stat.customClass || (stat.highlight ? "text-blue-600" : "text-gray-800"), true) + " svelte-zmai3x"}">${stat.icon ? `<span class="mr-1">${escape(stat.icon)}</span>` : ``} ${escape(stat.value)}</span> </div>`;
    })}</div> </div>`;
  })}</div>  ${stats.totalAttempts > 0 ? `<div class="mt-6 pt-6 border-t border-gray-200"><div class="progress-summary bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 svelte-zmai3x"><div class="flex items-center justify-between flex-wrap gap-4"><div><h4 class="font-medium text-gray-700 mb-1" data-svelte-h="svelte-wj7huc">セッションサマリー</h4> <p class="text-sm text-gray-600">${stats.averageScore >= 80 ? `素晴らしいパフォーマンスです！相対音感が向上しています。` : `${stats.averageScore >= 60 ? `良い進歩が見られます。継続することでさらなる向上が期待できます。` : `練習を続けることが大切です。少しずつ確実に上達しています。`}`}</p></div> ${stats.streakCount > 0 ? `<div class="streak-display bg-white rounded-full px-4 py-2 shadow-sm"><span class="text-2xl mr-2" data-svelte-h="svelte-1u2kb0v">🔥</span> <span class="font-bold text-orange-600">${escape(stats.streakCount)}</span> <span class="text-sm text-gray-600 ml-1" data-svelte-h="svelte-186fq2y">連続正解中</span></div>` : ``}</div></div></div>` : ``} </div>`;
});
const css = {
  code: ".component-section.svelte-178b5ai{transition:all 0.3s ease}.component-section.svelte-178b5ai:hover{transform:translateY(-2px)}body{background-color:#f9fafb}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  import { \\n    ScoreResultPanel,\\n    IntervalProgressTracker,\\n    ConsistencyGraph,\\n    FeedbackDisplay,\\n    SessionStatistics\\n  } from '$lib/components/scoring';\\n\\n  // サンプルデータ\\n  let sampleData = {\\n    // ScoreResultPanel用\\n    totalScore: 82,\\n    grade: 'A',\\n    componentScores: {\\n      pitchAccuracy: 85,\\n      recognitionSpeed: 78,\\n      intervalMastery: 83,\\n      directionAccuracy: 90,\\n      consistency: 75\\n    },\\n    \\n    // IntervalProgressTracker用\\n    intervalData: [\\n      { type: 'unison', mastery: 95, attempts: 20, accuracy: 98 },\\n      { type: 'major_second', mastery: 82, attempts: 35, accuracy: 85 },\\n      { type: 'major_third', mastery: 78, attempts: 28, accuracy: 80 },\\n      { type: 'perfect_fourth', mastery: 65, attempts: 22, accuracy: 68 },\\n      { type: 'perfect_fifth', mastery: 88, attempts: 30, accuracy: 90 },\\n      { type: 'octave', mastery: 92, attempts: 25, accuracy: 94 }\\n    ],\\n    \\n    // ConsistencyGraph用\\n    consistencyData: [\\n      { score: 65, timestamp: Date.now() - 600000 },\\n      { score: 72, timestamp: Date.now() - 540000 },\\n      { score: 68, timestamp: Date.now() - 480000 },\\n      { score: 75, timestamp: Date.now() - 420000 },\\n      { score: 78, timestamp: Date.now() - 360000 },\\n      { score: 82, timestamp: Date.now() - 300000 },\\n      { score: 80, timestamp: Date.now() - 240000 },\\n      { score: 85, timestamp: Date.now() - 180000 },\\n      { score: 83, timestamp: Date.now() - 120000 },\\n      { score: 88, timestamp: Date.now() - 60000 }\\n    ],\\n    \\n    // FeedbackDisplay用\\n    feedback: {\\n      type: 'good',\\n      primary: '素晴らしい進歩です！',\\n      summary: '音程の認識精度が向上しています。特に完全5度の習得度が高く、基本的な和音感覚が身についてきています。',\\n      details: [\\n        { category: 'strengths', text: '方向性の判断が非常に正確です（90%）' },\\n        { category: 'strengths', text: 'ユニゾンとオクターブの認識がほぼ完璧です' },\\n        { category: 'improvements', text: '完全4度の練習をもう少し増やしましょう' },\\n        { category: 'tips', text: '4度は「ソーファー」の音程です。日常的な音楽でよく聞かれます' },\\n        { category: 'practice', text: '完全4度を含む簡単な曲を歌ってみましょう' }\\n      ],\\n      nextSteps: [\\n        '完全4度の集中練習モードを試してみましょう',\\n        '連続チャレンジモードで実践的な練習を',\\n        '1日15分の継続的な練習を心がけましょう'\\n      ],\\n      motivation: '継続は力なり！あなたの相対音感は確実に向上しています！'\\n    },\\n    \\n    // SessionStatistics用\\n    statistics: {\\n      totalAttempts: 45,\\n      successRate: 73.3,\\n      averageScore: 82,\\n      bestScore: 95,\\n      sessionDuration: 32,\\n      streakCount: 8,\\n      fatigueLevel: 'normal',\\n      mostDifficultInterval: '完全4度',\\n      mostSuccessfulInterval: 'ユニゾン',\\n      averageResponseTime: 2.3\\n    }\\n  };\\n\\n  let showGrid = true;\\n<\/script>\\n\\n<div class=\\"container mx-auto p-6 max-w-7xl\\">\\n  <div class=\\"text-center mb-8\\">\\n    <h1 class=\\"text-3xl font-bold text-gray-800 mb-2\\">\\n      🎵 採点システムコンポーネント展示\\n    </h1>\\n    <p class=\\"text-gray-600\\">\\n      強化採点エンジンの表示コンポーネント\\n    </p>\\n  </div>\\n\\n  <div class=\\"mb-6 text-center\\">\\n    <button \\n      class=\\"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors\\"\\n      on:click={() => showGrid = !showGrid}\\n    >\\n      {showGrid ? 'スタック表示' : 'グリッド表示'}に切り替え\\n    </button>\\n  </div>\\n\\n  <div class={showGrid ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>\\n    <!-- ScoreResultPanel -->\\n    <div class=\\"component-section\\">\\n      <h2 class=\\"text-xl font-semibold text-gray-700 mb-3\\">ScoreResultPanel</h2>\\n      <ScoreResultPanel \\n        totalScore={sampleData.totalScore}\\n        grade={sampleData.grade}\\n        componentScores={sampleData.componentScores}\\n      />\\n    </div>\\n\\n    <!-- IntervalProgressTracker -->\\n    <div class=\\"component-section\\">\\n      <h2 class=\\"text-xl font-semibold text-gray-700 mb-3\\">IntervalProgressTracker</h2>\\n      <IntervalProgressTracker \\n        intervalData={sampleData.intervalData}\\n      />\\n    </div>\\n\\n    <!-- ConsistencyGraph -->\\n    <div class=\\"component-section\\">\\n      <h2 class=\\"text-xl font-semibold text-gray-700 mb-3\\">ConsistencyGraph</h2>\\n      <ConsistencyGraph \\n        consistencyData={sampleData.consistencyData}\\n      />\\n    </div>\\n\\n    <!-- FeedbackDisplay -->\\n    <div class=\\"component-section\\">\\n      <h2 class=\\"text-xl font-semibold text-gray-700 mb-3\\">FeedbackDisplay</h2>\\n      <FeedbackDisplay \\n        feedback={sampleData.feedback}\\n      />\\n    </div>\\n\\n    <!-- SessionStatistics -->\\n    <div class=\\"component-section lg:col-span-2\\">\\n      <h2 class=\\"text-xl font-semibold text-gray-700 mb-3\\">SessionStatistics</h2>\\n      <SessionStatistics \\n        statistics={sampleData.statistics}\\n      />\\n    </div>\\n  </div>\\n\\n  <!-- 統合レイアウトサンプル -->\\n  <div class=\\"mt-12\\">\\n    <h2 class=\\"text-2xl font-bold text-gray-800 mb-6 text-center\\">\\n      📱 統合レイアウトサンプル（モバイル対応）\\n    </h2>\\n    \\n    <div class=\\"bg-gray-100 p-4 rounded-xl\\">\\n      <div class=\\"max-w-4xl mx-auto space-y-6\\">\\n        <!-- メインスコア -->\\n        <ScoreResultPanel \\n          totalScore={sampleData.totalScore}\\n          grade={sampleData.grade}\\n          componentScores={sampleData.componentScores}\\n        />\\n        \\n        <!-- フィードバック -->\\n        <FeedbackDisplay \\n          feedback={sampleData.feedback}\\n        />\\n        \\n        <!-- 詳細統計（タブ形式の想定） -->\\n        <div class=\\"bg-white rounded-xl shadow-lg p-4\\">\\n          <div class=\\"flex gap-2 mb-4 overflow-x-auto\\">\\n            <button class=\\"px-4 py-2 bg-blue-500 text-white rounded-lg flex-shrink-0\\">\\n              音程別進捗\\n            </button>\\n            <button class=\\"px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0\\">\\n              一貫性グラフ\\n            </button>\\n            <button class=\\"px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0\\">\\n              セッション統計\\n            </button>\\n          </div>\\n          \\n          <IntervalProgressTracker \\n            intervalData={sampleData.intervalData}\\n          />\\n        </div>\\n      </div>\\n    </div>\\n  </div>\\n</div>\\n\\n<style>\\n  .component-section {\\n    transition: all 0.3s ease;\\n  }\\n  \\n  .component-section:hover {\\n    transform: translateY(-2px);\\n  }\\n\\n  :global(body) {\\n    background-color: #f9fafb;\\n  }\\n</style>"],"names":[],"mappings":"AAgME,iCAAmB,CACjB,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,iCAAkB,MAAO,CACvB,SAAS,CAAE,WAAW,IAAI,CAC5B,CAEQ,IAAM,CACZ,gBAAgB,CAAE,OACpB"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let sampleData = {
    // ScoreResultPanel用
    totalScore: 82,
    grade: "A",
    componentScores: {
      pitchAccuracy: 85,
      recognitionSpeed: 78,
      intervalMastery: 83,
      directionAccuracy: 90,
      consistency: 75
    },
    // IntervalProgressTracker用
    intervalData: [
      {
        type: "unison",
        mastery: 95,
        attempts: 20,
        accuracy: 98
      },
      {
        type: "major_second",
        mastery: 82,
        attempts: 35,
        accuracy: 85
      },
      {
        type: "major_third",
        mastery: 78,
        attempts: 28,
        accuracy: 80
      },
      {
        type: "perfect_fourth",
        mastery: 65,
        attempts: 22,
        accuracy: 68
      },
      {
        type: "perfect_fifth",
        mastery: 88,
        attempts: 30,
        accuracy: 90
      },
      {
        type: "octave",
        mastery: 92,
        attempts: 25,
        accuracy: 94
      }
    ],
    // ConsistencyGraph用
    consistencyData: [
      {
        score: 65,
        timestamp: Date.now() - 6e5
      },
      {
        score: 72,
        timestamp: Date.now() - 54e4
      },
      {
        score: 68,
        timestamp: Date.now() - 48e4
      },
      {
        score: 75,
        timestamp: Date.now() - 42e4
      },
      {
        score: 78,
        timestamp: Date.now() - 36e4
      },
      {
        score: 82,
        timestamp: Date.now() - 3e5
      },
      {
        score: 80,
        timestamp: Date.now() - 24e4
      },
      {
        score: 85,
        timestamp: Date.now() - 18e4
      },
      {
        score: 83,
        timestamp: Date.now() - 12e4
      },
      { score: 88, timestamp: Date.now() - 6e4 }
    ],
    // FeedbackDisplay用
    feedback: {
      type: "good",
      primary: "素晴らしい進歩です！",
      summary: "音程の認識精度が向上しています。特に完全5度の習得度が高く、基本的な和音感覚が身についてきています。",
      details: [
        {
          category: "strengths",
          text: "方向性の判断が非常に正確です（90%）"
        },
        {
          category: "strengths",
          text: "ユニゾンとオクターブの認識がほぼ完璧です"
        },
        {
          category: "improvements",
          text: "完全4度の練習をもう少し増やしましょう"
        },
        {
          category: "tips",
          text: "4度は「ソーファー」の音程です。日常的な音楽でよく聞かれます"
        },
        {
          category: "practice",
          text: "完全4度を含む簡単な曲を歌ってみましょう"
        }
      ],
      nextSteps: ["完全4度の集中練習モードを試してみましょう", "連続チャレンジモードで実践的な練習を", "1日15分の継続的な練習を心がけましょう"],
      motivation: "継続は力なり！あなたの相対音感は確実に向上しています！"
    },
    // SessionStatistics用
    statistics: {
      totalAttempts: 45,
      successRate: 73.3,
      averageScore: 82,
      bestScore: 95,
      sessionDuration: 32,
      streakCount: 8,
      fatigueLevel: "normal",
      mostDifficultInterval: "完全4度",
      mostSuccessfulInterval: "ユニゾン",
      averageResponseTime: 2.3
    }
  };
  $$result.css.add(css);
  return `<div class="container mx-auto p-6 max-w-7xl"><div class="text-center mb-8" data-svelte-h="svelte-t4mcaj"><h1 class="text-3xl font-bold text-gray-800 mb-2">🎵 採点システムコンポーネント展示</h1> <p class="text-gray-600">強化採点エンジンの表示コンポーネント</p></div> <div class="mb-6 text-center"><button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">${escape("スタック表示")}に切り替え</button></div> <div${add_attribute(
    "class",
    "grid grid-cols-1 lg:grid-cols-2 gap-6",
    0
  )}> <div class="component-section svelte-178b5ai"><h2 class="text-xl font-semibold text-gray-700 mb-3" data-svelte-h="svelte-1lusg2n">ScoreResultPanel</h2> ${validate_component(ScoreResultPanel, "ScoreResultPanel").$$render(
    $$result,
    {
      totalScore: sampleData.totalScore,
      grade: sampleData.grade,
      componentScores: sampleData.componentScores
    },
    {},
    {}
  )}</div>  <div class="component-section svelte-178b5ai"><h2 class="text-xl font-semibold text-gray-700 mb-3" data-svelte-h="svelte-1oguap4">IntervalProgressTracker</h2> ${validate_component(IntervalProgressTracker, "IntervalProgressTracker").$$render($$result, { intervalData: sampleData.intervalData }, {}, {})}</div>  <div class="component-section svelte-178b5ai"><h2 class="text-xl font-semibold text-gray-700 mb-3" data-svelte-h="svelte-ti65xy">ConsistencyGraph</h2> ${validate_component(ConsistencyGraph, "ConsistencyGraph").$$render(
    $$result,
    {
      consistencyData: sampleData.consistencyData
    },
    {},
    {}
  )}</div>  <div class="component-section svelte-178b5ai"><h2 class="text-xl font-semibold text-gray-700 mb-3" data-svelte-h="svelte-57qrn5">FeedbackDisplay</h2> ${validate_component(FeedbackDisplay, "FeedbackDisplay").$$render($$result, { feedback: sampleData.feedback }, {}, {})}</div>  <div class="component-section lg:col-span-2 svelte-178b5ai"><h2 class="text-xl font-semibold text-gray-700 mb-3" data-svelte-h="svelte-1xzk3bp">SessionStatistics</h2> ${validate_component(SessionStatistics, "SessionStatistics").$$render($$result, { statistics: sampleData.statistics }, {}, {})}</div></div>  <div class="mt-12"><h2 class="text-2xl font-bold text-gray-800 mb-6 text-center" data-svelte-h="svelte-1pvlaty">📱 統合レイアウトサンプル（モバイル対応）</h2> <div class="bg-gray-100 p-4 rounded-xl"><div class="max-w-4xl mx-auto space-y-6"> ${validate_component(ScoreResultPanel, "ScoreResultPanel").$$render(
    $$result,
    {
      totalScore: sampleData.totalScore,
      grade: sampleData.grade,
      componentScores: sampleData.componentScores
    },
    {},
    {}
  )}  ${validate_component(FeedbackDisplay, "FeedbackDisplay").$$render($$result, { feedback: sampleData.feedback }, {}, {})}  <div class="bg-white rounded-xl shadow-lg p-4"><div class="flex gap-2 mb-4 overflow-x-auto" data-svelte-h="svelte-hw64cp"><button class="px-4 py-2 bg-blue-500 text-white rounded-lg flex-shrink-0">音程別進捗</button> <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0">一貫性グラフ</button> <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0">セッション統計</button></div> ${validate_component(IntervalProgressTracker, "IntervalProgressTracker").$$render($$result, { intervalData: sampleData.intervalData }, {}, {})}</div></div></div></div> </div>`;
});
export {
  Page as default
};
