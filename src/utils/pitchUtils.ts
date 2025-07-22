/**
 * 音程処理ユーティリティ
 * Step 4: Pitchy音程検出統合
 */

// 音程検出結果インターフェース
export interface PitchDetectionResult {
  pitch: number;           // 検出された周波数 (Hz)
  note: string;           // 音名 (C4, D#3, etc.)
  cents: number;          // セント偏差
  octave: number;         // オクターブ
  clarity: number;        // 検出信頼度 (0-1)
  midiNote: number;       // MIDIノート番号
  timestamp: number;      // 検出時刻
}

// 音程検出設定
export interface PitchDetectionConfig {
  bufferSize: number;
  hopSize: number;
  sampleRate: number;
  clarityThreshold: number;
  smoothingFactor: number;
  minFrequency: number;
  maxFrequency: number;
}

// 音程検出統計
export interface PitchDetectionStats {
  totalDetections: number;
  successfulDetections: number;
  averageClarity: number;
  averagePitch: number;
  detectionRate: number;
  lastUpdate: number;
}

// デフォルト設定
export const DEFAULT_PITCH_DETECTION_CONFIG: PitchDetectionConfig = {
  bufferSize: 1024,               // 音程検出バッファサイズ
  hopSize: 512,                   // オーバーラップサイズ
  sampleRate: 44100,              // サンプリングレート
  clarityThreshold: 0.85,         // 信頼度閾値
  smoothingFactor: 0.3,           // 平滑化係数
  minFrequency: 80,               // 最低検出周波数 (Hz)
  maxFrequency: 2000,             // 最高検出周波数 (Hz)
};

// 音名配列
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 基準音A4の周波数
const A4_FREQUENCY = 440;
const A4_MIDI_NOTE = 69;

/**
 * 周波数からMIDIノート番号への変換
 */
export const frequencyToMidiNote = (frequency: number): number => {
  return 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NOTE;
};

/**
 * MIDIノート番号から周波数への変換
 */
export const midiNoteToFrequency = (midiNote: number): number => {
  return A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);
};

/**
 * MIDIノート番号から音名への変換
 */
export const midiNoteToNoteName = (midiNote: number): string => {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = Math.round(midiNote) % 12;
  return NOTE_NAMES[noteIndex] + octave;
};

/**
 * 音名からMIDIノート番号への変換
 */
export const noteNameToMidiNote = (noteName: string): number => {
  const noteMatch = noteName.match(/([A-G]#?)(\d+)/);
  if (!noteMatch) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  
  const [, note, octaveStr] = noteMatch;
  const octave = parseInt(octaveStr);
  const noteIndex = NOTE_NAMES.indexOf(note);
  
  if (noteIndex === -1) {
    throw new Error(`Invalid note: ${note}`);
  }
  
  return noteIndex + (octave + 1) * 12;
};

/**
 * セント偏差計算
 */
export const calculateCentsDeviation = (frequency: number, targetFrequency: number): number => {
  return 1200 * Math.log2(frequency / targetFrequency);
};

/**
 * 周波数から最も近い音名とセント偏差を計算
 */
export const frequencyToNoteAndCents = (frequency: number): { note: string; cents: number; midiNote: number } => {
  const exactMidiNote = frequencyToMidiNote(frequency);
  const roundedMidiNote = Math.round(exactMidiNote);
  const note = midiNoteToNoteName(roundedMidiNote);
  const targetFrequency = midiNoteToFrequency(roundedMidiNote);
  const cents = calculateCentsDeviation(frequency, targetFrequency);
  
  return { note, cents, midiNote: roundedMidiNote };
};

/**
 * 音程の平滑化
 */
export const smoothPitch = (
  currentPitch: number, 
  previousPitch: number | null, 
  smoothingFactor: number
): number => {
  if (previousPitch === null) {
    return currentPitch;
  }
  
  return previousPitch + smoothingFactor * (currentPitch - previousPitch);
};

/**
 * 音程検出結果の妥当性チェック
 */
export const validatePitchDetection = (
  pitch: number,
  clarity: number,
  config: PitchDetectionConfig
): boolean => {
  // 周波数範囲チェック
  if (pitch < config.minFrequency || pitch > config.maxFrequency) {
    return false;
  }
  
  // 信頼度チェック
  if (clarity < config.clarityThreshold) {
    return false;
  }
  
  // 音程の妥当性チェック（異常値除外）
  if (isNaN(pitch) || !isFinite(pitch)) {
    return false;
  }
  
  return true;
};

/**
 * 音程検出結果の作成
 */
export const createPitchDetectionResult = (
  pitch: number,
  clarity: number,
  previousPitch: number | null,
  config: PitchDetectionConfig
): PitchDetectionResult | null => {
  // 妥当性チェック
  if (!validatePitchDetection(pitch, clarity, config)) {
    return null;
  }
  
  // 平滑化処理
  const smoothedPitch = smoothPitch(pitch, previousPitch, config.smoothingFactor);
  
  // 音程情報計算
  const { note, cents, midiNote } = frequencyToNoteAndCents(smoothedPitch);
  const octave = Math.floor(midiNote / 12) - 1;
  
  return {
    pitch: smoothedPitch,
    note,
    cents,
    octave,
    clarity,
    midiNote,
    timestamp: Date.now(),
  };
};

// 相対音程計算は noteUtils.ts に統合済み（重複削除）

/**
 * 音程検出統計の更新
 */
export const updatePitchDetectionStats = (
  stats: PitchDetectionStats,
  result: PitchDetectionResult | null
): PitchDetectionStats => {
  const newStats = { ...stats };
  newStats.totalDetections++;
  
  if (result) {
    newStats.successfulDetections++;
    
    // 移動平均での統計更新
    const alpha = 0.1; // 平滑化係数
    newStats.averageClarity = newStats.averageClarity * (1 - alpha) + result.clarity * alpha;
    newStats.averagePitch = newStats.averagePitch * (1 - alpha) + result.pitch * alpha;
  }
  
  newStats.detectionRate = newStats.successfulDetections / newStats.totalDetections;
  newStats.lastUpdate = Date.now();
  
  return newStats;
};

/**
 * 音程検出品質評価
 */
export const evaluatePitchDetectionQuality = (stats: PitchDetectionStats): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  recommendations: string[];
} => {
  const { detectionRate, averageClarity } = stats;
  
  // 品質スコア計算 (0-100)
  const rateScore = detectionRate * 50;
  const clarityScore = averageClarity * 50;
  const totalScore = rateScore + clarityScore;
  
  // 品質判定
  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (totalScore >= 85) quality = 'excellent';
  else if (totalScore >= 70) quality = 'good';
  else if (totalScore >= 50) quality = 'fair';
  else quality = 'poor';
  
  // 推奨事項
  const recommendations: string[] = [];
  if (detectionRate < 0.8) {
    recommendations.push('マイクロフォンの位置を調整してください');
  }
  if (averageClarity < 0.8) {
    recommendations.push('周囲のノイズを減らしてください');
  }
  if (totalScore < 50) {
    recommendations.push('ノイズフィルタリングを有効にしてください');
  }
  
  return {
    quality,
    score: Math.round(totalScore),
    recommendations,
  };
};

/**
 * 音程検出デバッグ情報
 */
export const getPitchDetectionDebugInfo = (
  result: PitchDetectionResult | null,
  config: PitchDetectionConfig
): {
  isValid: boolean;
  frequency: number | null;
  clarity: number | null;
  withinRange: boolean;
  aboveThreshold: boolean;
  debugMessage: string;
} => {
  if (!result) {
    return {
      isValid: false,
      frequency: null,
      clarity: null,
      withinRange: false,
      aboveThreshold: false,
      debugMessage: 'No pitch detected',
    };
  }
  
  const withinRange = result.pitch >= config.minFrequency && result.pitch <= config.maxFrequency;
  const aboveThreshold = result.clarity >= config.clarityThreshold;
  const isValid = withinRange && aboveThreshold;
  
  let debugMessage = '';
  if (!withinRange) {
    debugMessage += `Frequency out of range (${config.minFrequency}-${config.maxFrequency}Hz). `;
  }
  if (!aboveThreshold) {
    debugMessage += `Clarity below threshold (${config.clarityThreshold}). `;
  }
  if (isValid) {
    debugMessage = `Valid detection: ${result.note} (${result.pitch.toFixed(2)}Hz, ${result.cents.toFixed(0)}¢)`;
  }
  
  return {
    isValid,
    frequency: result.pitch,
    clarity: result.clarity,
    withinRange,
    aboveThreshold,
    debugMessage,
  };
};

/**
 * 音程表示用フォーマット
 */
export const formatPitchDisplay = (result: PitchDetectionResult): {
  note: string;
  frequency: string;
  cents: string;
  octave: string;
  clarity: string;
} => {
  return {
    note: result.note,
    frequency: `${result.pitch.toFixed(2)} Hz`,
    cents: `${result.cents >= 0 ? '+' : ''}${result.cents.toFixed(0)}¢`,
    octave: `Oct ${result.octave}`,
    clarity: `${(result.clarity * 100).toFixed(1)}%`,
  };
};