<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { PitchDetector } from 'pitchy';
  import VolumeBar from './VolumeBar.svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let isActive = false;
  export let className = '';

  // 音程検出状態
  let audioContext = null;
  let mediaStream = null;
  let analyser = null;
  let rawAnalyser = null;
  let pitchDetector = null;
  let animationFrame = null;
  let isDetecting = false;

  // フィルター
  let highpassFilter = null;
  let lowpassFilter = null;
  let notchFilter = null;

  // 検出データ
  let currentVolume = 0;
  let rawVolume = 0;
  let currentFrequency = 0;
  let detectedNote = 'ーー';
  let pitchClarity = 0;
  
  // 安定化用バッファ
  let frequencyHistory = [];
  let volumeHistory = [];
  let stableFrequency = 0;
  let stableVolume = 0;
  
  // 倍音補正用
  let previousFrequency = 0;
  let harmonicHistory = [];

  // 初期化
  export async function initialize(stream) {
    try {
      mediaStream = stream;
      
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // 3段階ノイズリダクション実装
      const source = audioContext.createMediaStreamSource(mediaStream);
      
      // フィルター前の信号解析用（比較用）
      rawAnalyser = audioContext.createAnalyser();
      rawAnalyser.fftSize = 2048;
      rawAnalyser.smoothingTimeConstant = 0.8;
      rawAnalyser.minDecibels = -90;
      rawAnalyser.maxDecibels = -10;
      source.connect(rawAnalyser);
      
      // 1. ハイパスフィルター（低周波ノイズ除去: 80Hz以下カット）
      highpassFilter = audioContext.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(80, audioContext.currentTime);
      highpassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // 2. ローパスフィルター（高周波ノイズ除去: 800Hz以上カット）
      lowpassFilter = audioContext.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(800, audioContext.currentTime);
      lowpassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // 3. ノッチフィルター（電源ノイズ除去: 50Hz/60Hz）
      notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(10, audioContext.currentTime);
      
      // フィルター後の信号解析用（メイン）
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // フィルターチェーン接続: source → highpass → lowpass → notch → analyser
      source.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(notchFilter);
      notchFilter.connect(analyser);
      
      // PitchDetector初期化
      pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
      
      console.log('PitchDetectorコンポーネント初期化完了 - 3段階ノイズリダクション有効');
      
    } catch (error) {
      console.error('PitchDetector初期化エラー:', error);
      throw error;
    }
  }

  // 検出開始
  export function startDetection() {
    if (!analyser || !pitchDetector || !audioContext) {
      console.error('PitchDetector未初期化 - 必要なコンポーネント:', {
        analyser: !!analyser,
        pitchDetector: !!pitchDetector,
        audioContext: !!audioContext,
        mediaStream: !!mediaStream
      });
      return;
    }
    
    isDetecting = true;
    detectPitch();
    console.log('音程検出開始');
  }

  // 検出停止
  export function stopDetection() {
    isDetecting = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    console.log('音程検出停止');
  }

  // リアルタイム音程検出
  function detectPitch() {
    if (!isDetecting || !analyser || !rawAnalyser || !pitchDetector) return;
    
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    const rawBuffer = new Float32Array(rawAnalyser.fftSize);
    
    analyser.getFloatTimeDomainData(buffer);
    rawAnalyser.getFloatTimeDomainData(rawBuffer);
    
    // 音量計算（フィルター後）
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += Math.abs(buffer[i]);
    }
    const rms = Math.sqrt(sum / bufferLength);
    const logVolume = Math.log10(rms + 0.001) * 50 + 100;
    const rawCurrentVolume = Math.max(0, Math.min(100, logVolume));
    
    // 生音量計算（フィルター前）
    let rawSum = 0;
    for (let i = 0; i < rawBuffer.length; i++) {
      rawSum += Math.abs(rawBuffer[i]);
    }
    const rawRms = Math.sqrt(rawSum / rawBuffer.length);
    const rawLogVolume = Math.log10(rawRms + 0.001) * 50 + 100;
    rawVolume = Math.max(0, Math.min(100, rawLogVolume));
    
    // 音量の安定化（5フレーム移動平均）
    volumeHistory.push(rawCurrentVolume);
    if (volumeHistory.length > 5) {
      volumeHistory.shift();
    }
    stableVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;
    currentVolume = stableVolume;
    
    // 音程検出（PitchDetector使用）
    const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContext.sampleRate);
    
    // 人間音域フィルタリング（実用調整）
    // 実際の人間の声域に最適化:
    // - 低域: 65Hz以上（C2以上、男性最低音域考慮）  
    // - 高域: 1200Hz以下（実用的な歌唱範囲）
    // - 極低音域ノイズ（G-1等）は確実に除外
    const isValidVocalRange = pitch >= 65 && pitch <= 1200;
    
    if (pitch && clarity > 0.6 && currentVolume > 10 && isValidVocalRange) {
      // 倍音補正システム適用
      const correctedFreq = correctHarmonicFrequency(pitch, previousFrequency);
      
      // 基音安定化システム適用
      const stabilizedFreq = stabilizeFrequency(correctedFreq);
      
      // 周波数表示を更新
      currentFrequency = Math.round(stabilizedFreq);
      detectedNote = frequencyToNote(currentFrequency);
      pitchClarity = clarity;
      
      // 次回比較用に保存
      previousFrequency = currentFrequency;
      
      // デバッグログ（倍音補正効果確認）
      if (Math.abs(pitch - correctedFreq) > 10) {
        console.log('倍音補正:', {
          original: Math.round(pitch),
          corrected: Math.round(correctedFreq),
          stabilized: Math.round(stabilizedFreq),
          note: detectedNote
        });
      }
    } else {
      // 信号が弱い場合は倍音履歴をクリア
      if (harmonicHistory.length > 0) {
        harmonicHistory = [];
      }
      
      // 音程がない場合は前回周波数をリセット
      if (currentFrequency === 0) {
        previousFrequency = 0;
      }
      
      // 周波数表示をクリア
      currentFrequency = 0;
      detectedNote = 'ーー';
      pitchClarity = 0;
    }
    
    // 音程が検出されない場合はVolumeBarも0に（極低音域ノイズ対策）
    const displayVolume = currentFrequency > 0 ? rawVolume : 0;
    
    // デバッグログ（初回と大きな変化時のみ）
    if (!window.pitchDetectorLastLog || 
        Math.abs(window.pitchDetectorLastLog.rawVolume - rawVolume) > 5 ||
        Math.abs(window.pitchDetectorLastLog.frequency - currentFrequency) > 20 ||
        Math.abs(window.pitchDetectorLastLog.displayVolume - displayVolume) > 5) {
      console.log('PitchDetector:', {
        rawVolume: Math.round(rawVolume),
        displayVolume: Math.round(displayVolume),
        filteredVolume: Math.round(currentVolume), 
        frequency: currentFrequency,
        note: detectedNote,
        clarity: Math.round(clarity * 100),
        isValidRange: isValidVocalRange,
        rawPitch: pitch ? Math.round(pitch) : 0
      });
      window.pitchDetectorLastLog = { rawVolume, frequency: currentFrequency, displayVolume };
    }
    
    // 親コンポーネントにデータを送信
    
    dispatch('pitchUpdate', {
      frequency: currentFrequency,
      note: detectedNote,
      volume: currentVolume,
      rawVolume: displayVolume,
      clarity: pitchClarity
    });
    
    animationFrame = requestAnimationFrame(detectPitch);
  }

  // 音楽的妥当性評価
  function calculateMusicalScore(frequency) {
    const C4 = 261.63; // Middle C
    
    // 最も近い半音階音名への距離を計算
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
    
    // 半音階に近いほど高スコア（±50セント以内で最高点）
    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
  }

  // 倍音補正システム
  function correctHarmonicFrequency(detectedFreq, previousFreq) {
    // 基音候補生成（オクターブ違いを考慮）
    const fundamentalCandidates = [
      detectedFreq,          // そのまま（基音の可能性）
      detectedFreq / 2.0,    // 1オクターブ下（2倍音 → 基音）
      detectedFreq / 3.0,    // 3倍音 → 基音
      detectedFreq / 4.0,    // 4倍音 → 基音
      detectedFreq * 2.0,    // 1オクターブ上（低く歌った場合）
    ];
    
    // 人間音域範囲（C3-C6）
    const vocalRangeMin = 130.81;
    const vocalRangeMax = 1046.50;
    
    // 各候補の妥当性評価
    const evaluateFundamental = (freq) => {
      // 人間音域範囲内チェック（40%重み）
      const inVocalRange = freq >= vocalRangeMin && freq <= vocalRangeMax;
      const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
      
      // 前回検出との連続性評価（40%重み）
      const continuityScore = previousFreq > 0
        ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
        : 0.5;
      
      // 音楽的妥当性評価（20%重み）
      const musicalScore = calculateMusicalScore(freq);
      
      const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
      return { freq, score: totalScore };
    };
    
    // 最高スコア候補を基音として採用
    const evaluatedCandidates = fundamentalCandidates.map(evaluateFundamental);
    const bestCandidate = evaluatedCandidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestCandidate.freq;
  }

  // 基音安定化システム
  function stabilizeFrequency(currentFreq, stabilityThreshold = 0.1) {
    // 履歴バッファに追加（最大5フレーム保持）
    harmonicHistory.push(currentFreq);
    if (harmonicHistory.length > 5) harmonicHistory.shift();
    
    // 中央値ベースの安定化（外れ値除去）
    const sorted = [...harmonicHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // 急激な変化を抑制（段階的変化）
    const maxChange = median * stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange 
      ? median + Math.sign(currentFreq - median) * maxChange
      : currentFreq;
      
    return stabilized;
  }

  // 周波数から音程名に変換
  function frequencyToNote(frequency) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    
    if (frequency <= 0) return 'ーー';
    
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    return noteNames[noteIndex] + octave;
  }

  // クリーンアップ
  export function cleanup() {
    stopDetection();
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    analyser = null;
    rawAnalyser = null;
    pitchDetector = null;
    highpassFilter = null;
    lowpassFilter = null;
    notchFilter = null;
  }

  // isActiveの変更を監視
  $: if (isActive && analyser) {
    startDetection();
  } else if (!isActive) {
    stopDetection();
  }

  onDestroy(() => {
    cleanup();
  });
</script>

<div class="pitch-detector {className}">
  <div class="detection-display">
    <div class="detected-info">
      <span class="detected-label">検出中:</span>
      <div class="frequency-container">
        <span class="detected-frequency">{currentFrequency > 0 ? Math.round(currentFrequency) : '---'}</span>
        <span class="hz-suffix">Hz</span>
      </div>
      <div class="note-container">
        <span class="detected-note">({detectedNote})</span>
      </div>
      <span class="clarity">品質: {Math.round(pitchClarity * 100)}%</span>
    </div>
    
    <div class="volume-section">
      <div class="volume-label">音量レベル: {Math.round(currentFrequency > 0 ? rawVolume : 0)}%</div>
      <VolumeBar volume={currentFrequency > 0 ? rawVolume : 0} className="volume-bar" />
      
      {#if rawVolume > 0 && currentVolume > 0}
        <div class="noise-reduction-info">
          <span class="noise-label">フィルター後音量: {Math.round(currentVolume)}%</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pitch-detector {
    padding: 1rem;
  }

  .detection-display {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .detected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .detected-label {
    color: hsl(215.4 16.3% 46.9%);
  }
  
  .frequency-container {
    display: inline-flex;
    align-items: baseline;
    margin-right: 0.5rem;
  }

  .detected-frequency {
    font-weight: 700;
    font-size: 2rem;
    color: hsl(222.2 84% 4.9%);
    /* 等幅フォントで数字の幅を統一 */
    font-family: 'Courier New', Courier, monospace;
    /* 最小幅を設定（4桁分の幅を確保） */
    min-width: 4.5ch;
    /* テキストを右寄せ */
    text-align: right;
    /* インラインブロックで幅を保持 */
    display: inline-block;
  }

  .hz-suffix {
    font-weight: 700;
    font-size: 2rem;
    color: hsl(222.2 84% 4.9%);
    margin-left: 0.25rem;
  }

  .note-container {
    display: inline-flex;
    align-items: baseline;
    margin-right: 0.5rem;
  }
  
  .detected-note {
    font-weight: 700;
    font-size: 2rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  .clarity {
    color: hsl(142.1 76.2% 36.3%);
    font-weight: 500;
    font-size: 0.75rem;
  }
  
  .volume-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .volume-label {
    font-size: 0.875rem;
    color: hsl(215.4 16.3% 46.9%);
  }

  .noise-reduction-info {
    font-size: 0.75rem;
    color: hsl(142.1 76.2% 36.3%);
  }

  :global(.volume-bar) {
    border-radius: 4px !important;
  }
</style>