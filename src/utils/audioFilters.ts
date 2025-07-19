/**
 * 音声フィルター関数ユーティリティ
 * Step 3: 1段階ノイズフィルタリング
 */

// フィルター設定インターフェース
export interface FilterConfig {
  frequency: number;
  Q: number;
  gain: number;
}

// ノイズフィルター設定
export interface NoiseFilterConfig {
  highpass: FilterConfig;
  lowpass: FilterConfig;
  notch: FilterConfig;
}

// 周波数応答データ
export interface FilterResponse {
  frequency: number[];
  magnitude: number[];
  phase: number[];
}

// デフォルトフィルター設定
export const DEFAULT_NOISE_FILTER_CONFIG: NoiseFilterConfig = {
  // ハイパスフィルター: 60Hz以下の低周波ノイズ除去
  highpass: {
    frequency: 60,    // 60Hz カットオフ
    Q: 0.7,          // 自然な減衰
    gain: 0,         // 0dB ゲイン
  },
  
  // ローパスフィルター: 8kHz以上の高周波ノイズ除去
  lowpass: {
    frequency: 8000,  // 8kHz カットオフ
    Q: 0.7,          // 自然な減衰
    gain: 0,         // 0dB ゲイン
  },
  
  // ノッチフィルター: 60Hz電源ノイズ除去
  notch: {
    frequency: 60,    // 60Hz ノッチ
    Q: 10,           // 鋭いノッチ
    gain: -40,       // -40dB 大幅減衰
  },
};

// 地域別電源周波数設定
export const POWER_LINE_FREQUENCIES = {
  JAPAN: 50,      // 東日本50Hz, 西日本60Hz
  NORTH_AMERICA: 60,  // 北米60Hz
  EUROPE: 50,     // ヨーロッパ50Hz
  ASIA: 50,       // アジア多数50Hz
} as const;

/**
 * ハイパスフィルター作成
 * 低周波ノイズ（風音、振動等）を除去
 */
export const createHighpassFilter = (
  audioContext: AudioContext, 
  config: FilterConfig = DEFAULT_NOISE_FILTER_CONFIG.highpass
): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = config.frequency;
  filter.Q.value = config.Q;
  filter.gain.value = config.gain;
  
  console.log(`🔧 ハイパスフィルター作成: ${config.frequency}Hz, Q=${config.Q}`);
  return filter;
};

/**
 * ローパスフィルター作成
 * 高周波ノイズ（サンプリング、電子回路等）を除去
 */
export const createLowpassFilter = (
  audioContext: AudioContext, 
  config: FilterConfig = DEFAULT_NOISE_FILTER_CONFIG.lowpass
): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.frequency;
  filter.Q.value = config.Q;
  filter.gain.value = config.gain;
  
  console.log(`🔧 ローパスフィルター作成: ${config.frequency}Hz, Q=${config.Q}`);
  return filter;
};

/**
 * ノッチフィルター作成
 * 特定周波数（電源ノイズ等）を除去
 */
export const createNotchFilter = (
  audioContext: AudioContext, 
  config: FilterConfig = DEFAULT_NOISE_FILTER_CONFIG.notch
): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'notch';
  filter.frequency.value = config.frequency;
  filter.Q.value = config.Q;
  filter.gain.value = config.gain;
  
  console.log(`🔧 ノッチフィルター作成: ${config.frequency}Hz, Q=${config.Q}, Gain=${config.gain}dB`);
  return filter;
};

/**
 * ゲインノード作成
 * 全体音量調整
 */
export const createGainNode = (
  audioContext: AudioContext, 
  gainValue: number = 1.0
): GainNode => {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = gainValue;
  
  console.log(`🔧 ゲインノード作成: ${gainValue} (${20 * Math.log10(gainValue)}dB)`);
  return gainNode;
};

/**
 * フィルターチェーン作成
 * 3段階フィルタリング: ハイパス → ローパス → ノッチ → ゲイン
 */
export const createFilterChain = (
  audioContext: AudioContext,
  config: NoiseFilterConfig = DEFAULT_NOISE_FILTER_CONFIG
): {
  highpassFilter: BiquadFilterNode;
  lowpassFilter: BiquadFilterNode;
  notchFilter: BiquadFilterNode;
  gainNode: GainNode;
  connectChain: (sourceNode: AudioNode) => AudioNode;
} => {
  // 各フィルター作成
  const highpassFilter = createHighpassFilter(audioContext, config.highpass);
  const lowpassFilter = createLowpassFilter(audioContext, config.lowpass);
  const notchFilter = createNotchFilter(audioContext, config.notch);
  const gainNode = createGainNode(audioContext, 1.0);
  
  // フィルターチェーン接続関数
  const connectChain = (sourceNode: AudioNode): AudioNode => {
    console.log('🔗 フィルターチェーン接続開始');
    
    // MediaStreamSource → HighPass → LowPass → Notch → Gain
    sourceNode.connect(highpassFilter);
    highpassFilter.connect(lowpassFilter);
    lowpassFilter.connect(notchFilter);
    notchFilter.connect(gainNode);
    
    console.log('✅ フィルターチェーン接続完了');
    return gainNode;
  };
  
  return {
    highpassFilter,
    lowpassFilter,
    notchFilter,
    gainNode,
    connectChain,
  };
};

/**
 * 周波数応答計算
 * フィルターの効果を可視化するためのデータ計算
 */
export const calculateFilterResponse = (
  filter: BiquadFilterNode,
  frequencies: number[] = generateFrequencyRange(20, 20000, 100)
): FilterResponse => {
  const magnitude = new Float32Array(frequencies.length);
  const phase = new Float32Array(frequencies.length);
  
  // 周波数応答計算
  filter.getFrequencyResponse(
    new Float32Array(frequencies),
    magnitude,
    phase
  );
  
  return {
    frequency: frequencies,
    magnitude: Array.from(magnitude),
    phase: Array.from(phase),
  };
};

/**
 * 周波数範囲生成
 * ログスケールで周波数配列を生成
 */
export const generateFrequencyRange = (
  minFreq: number,
  maxFreq: number,
  numPoints: number
): number[] => {
  const frequencies: number[] = [];
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  const logStep = (logMax - logMin) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    const logFreq = logMin + i * logStep;
    frequencies.push(Math.pow(10, logFreq));
  }
  
  return frequencies;
};

/**
 * 音声品質メトリクス計算
 * フィルター適用前後の品質比較
 */
export const calculateAudioQualityMetrics = (
  originalData: Float32Array,
  filteredData: Float32Array
): {
  snrImprovement: number;
  thd: number;
  dynamicRange: number;
  rmsOriginal: number;
  rmsFiltered: number;
} => {
  // RMS計算
  const rmsOriginal = calculateRMS(originalData);
  const rmsFiltered = calculateRMS(filteredData);
  
  // ノイズフロア推定（下位10%の平均）
  const noiseFloorOriginal = calculateNoiseFloor(originalData);
  const noiseFloorFiltered = calculateNoiseFloor(filteredData);
  
  // SNR改善計算
  const snrOriginal = 20 * Math.log10(rmsOriginal / noiseFloorOriginal);
  const snrFiltered = 20 * Math.log10(rmsFiltered / noiseFloorFiltered);
  const snrImprovement = snrFiltered - snrOriginal;
  
  // THD計算（簡易版）
  const thd = calculateTHD(filteredData);
  
  // ダイナミックレンジ計算
  const dynamicRange = calculateDynamicRange(filteredData);
  
  return {
    snrImprovement,
    thd,
    dynamicRange,
    rmsOriginal,
    rmsFiltered,
  };
};

/**
 * RMS計算
 */
const calculateRMS = (data: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
};

/**
 * ノイズフロア推定
 */
const calculateNoiseFloor = (data: Float32Array): number => {
  const sorted = Array.from(data).map(Math.abs).sort((a, b) => a - b);
  const bottom10Percent = sorted.slice(0, Math.floor(sorted.length * 0.1));
  return bottom10Percent.reduce((sum, val) => sum + val, 0) / bottom10Percent.length;
};

/**
 * THD計算（簡易版）
 */
const calculateTHD = (data: Float32Array): number => {
  // 簡易THD計算（実装簡略化）
  const rms = calculateRMS(data);
  const peak = Math.max(...Array.from(data).map(Math.abs));
  return (rms / peak) * 100;
};

/**
 * ダイナミックレンジ計算
 */
const calculateDynamicRange = (data: Float32Array): number => {
  const absData = Array.from(data).map(Math.abs);
  const max = Math.max(...absData);
  const min = Math.min(...absData.filter(x => x > 0));
  return 20 * Math.log10(max / min);
};

/**
 * 地域別電源周波数自動検出
 */
export const detectPowerLineFrequency = (): number => {
  // 簡易的な地域判定（実際の実装ではより詳細な判定が必要）
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  if (timezone.includes('America') || timezone.includes('Canada')) {
    return POWER_LINE_FREQUENCIES.NORTH_AMERICA;
  } else if (timezone.includes('Europe')) {
    return POWER_LINE_FREQUENCIES.EUROPE;
  } else if (timezone.includes('Asia/Tokyo')) {
    return 50; // 東日本は50Hz、西日本は60Hz（簡略化）
  } else {
    return POWER_LINE_FREQUENCIES.JAPAN; // デフォルト
  }
};