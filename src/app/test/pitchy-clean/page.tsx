'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { PitchDetector } from "pitchy";
import * as Tone from "tone";

export default function PitchyCleanPage() {
  // 基本状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseFrequency, setBaseFrequency] = useState<number>(261.63); // ド(C4)デフォルト
  // React stateを最小限に減らし、DOM直接操作でリアルタイム更新
  // const [volume, setVolume] = useState<number>(0);
  // const [frequency, setFrequency] = useState<number | null>(null);
  // const [clarity, setClarity] = useState<number>(0);
  // const [debugInfo, setDebugInfo] = useState<{raw: number, calculated: number, normalized: number}>({raw: 0, calculated: 0, normalized: 0});
  
  // DOM直接操作用のref
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeTextRef = useRef<HTMLDivElement>(null);
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const clarityDisplayRef = useRef<HTMLDivElement>(null);
  const debugInfoRef = useRef<HTMLDivElement>(null);
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  
  // ノイズリダクションフィルター refs
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // 音量スムージング用
  const previousVolumeRef = useRef<number>(0);
  
  // 周波数安定検出用
  const frequencyStabilityRef = useRef<{freq: number, count: number}>({freq: 0, count: 0});
  const noSoundCounterRef = useRef<number>(0);
  
  // 周波数スムージング用
  const frequencyHistoryRef = useRef<number[]>([]);
  const stableFrequencyRef = useRef<number | null>(null);
  const stabilityCounterRef = useRef<number>(0);
  
  // 動的オクターブ補正システム用
  const targetFrequenciesRef = useRef<number[]>([
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25 // ドレミファソラシド (C4-C5)
  ]);

  // 音量検出＋周波数検出統合ループ
  // DOM直接更新関数（React state不使用）
  const updateVolumeDisplay = (volume: number) => {
    if (volumeBarRef.current) {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      volumeBarRef.current.style.width = `${clampedVolume}%`;
      volumeBarRef.current.style.backgroundColor = 
        volume > 80 ? '#ef4444' : volume > 60 ? '#f59e0b' : '#10b981';
    }
    if (volumeTextRef.current) {
      volumeTextRef.current.textContent = `${volume.toFixed(1)}%`;
    }
  };
  
  const updateFrequencyDisplay = (freq: number | null, clarity: number) => {
    if (frequencyDisplayRef.current) {
      if (freq) {
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ${freq.toFixed(1)}
          </div>
          <div class="text-xl text-gray-600 font-semibold">Hz</div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-gray-400 text-lg">
            🎤 音声を検出中...
          </div>
        `;
      }
    }
    if (clarityDisplayRef.current) {
      clarityDisplayRef.current.textContent = `明瞭度: ${(clarity * 100).toFixed(1)}%`;
    }
  };
  
  const updateDebugInfo = (info: {raw: number, calculated: number, normalized: number}) => {
    if (debugInfoRef.current) {
      debugInfoRef.current.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div><span class="font-semibold">音量:</span><br/>${info.normalized.toFixed(1)}%</div>
          <div><span class="font-semibold">生音量:</span><br/>${info.raw.toFixed(1)}</div>
          <div><span class="font-semibold">計算値:</span><br/>${info.calculated.toFixed(1)}</div>
          <div><span class="font-semibold">正規化:</span><br/>${info.normalized.toFixed(1)}</div>
        </div>
      `;
    }
  };

  // 動的オクターブ補正関数
  const applyDynamicOctaveCorrection = (detectedFreq: number, targetFreqs: number[]): number => {
    const minTargetFreq = Math.min(...targetFreqs);
    const maxTargetFreq = Math.max(...targetFreqs);
    
    // 動的範囲計算: 80%-120%
    const correctedMin = minTargetFreq * 0.8;  // 209.3Hz
    const correctedMax = maxTargetFreq * 1.2;  // 627.9Hz
    
    // 補正トリガー闾値: 55%ポイント
    const correctionThreshold = maxTargetFreq * 0.55; // 287.8Hz
    
    // オクターブ誤認識の逆補正: 実際は高い音を低く表示していた問題を修正
    // 検出値が低すぎる場合、実際はその倍音の可能性
    if (detectedFreq >= correctionThreshold && detectedFreq <= correctedMax) {
      // 正常範囲内: 補正不要
      return detectedFreq;
    }
    
    // 低すぎる周波数の場合、2倍に補正
    if (detectedFreq < correctionThreshold) {
      const doubledFreq = detectedFreq * 2;
      if (doubledFreq >= correctedMin && doubledFreq <= correctedMax) {
        console.log(`🎵 2倍補正: ${detectedFreq.toFixed(1)}Hz → ${doubledFreq.toFixed(1)}Hz`);
        return doubledFreq;
      }
    }
    
    // 高すぎる周波数の場合、1/2に補正
    if (detectedFreq > correctedMax) {
      const halvedFreq = detectedFreq / 2;
      if (halvedFreq >= correctedMin && halvedFreq <= correctedMax) {
        console.log(`🎵 1/2補正: ${detectedFreq.toFixed(1)}Hz → ${halvedFreq.toFixed(1)}Hz`);
        return halvedFreq;
      }
    }
    
    // 4倍音補正チェック（極端な低周波数）
    if (detectedFreq < correctionThreshold / 2) {
      const quadrupledFreq = detectedFreq * 4;
      if (quadrupledFreq >= correctedMin && quadrupledFreq <= correctedMax) {
        console.log(`🎵 4倍音補正: ${detectedFreq.toFixed(1)}Hz → ${quadrupledFreq.toFixed(1)}Hz`);
        return quadrupledFreq;
      }
    }
    
    // 相対音程ベースの妥当性チェック
    const validateRelativePitch = (freq: number): boolean => {
      // 最も近い目標周波数を取得
      const closestTarget = targetFreqs.reduce((prev, curr) => 
        Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev
      );
      
      const relativePitch = freq / closestTarget;
      const octaveRatio = Math.log2(relativePitch);
      
      // 正常範囲: -0.5 < ratio < 1.5 (オクターブエラーではない)
      return octaveRatio >= -0.5 && octaveRatio <= 1.5;
    };
    
    // 相対音程チェックでNGの場合、オクターブ補正を再試行
    if (!validateRelativePitch(detectedFreq)) {
      const doubledFreq = detectedFreq * 2;
      if (validateRelativePitch(doubledFreq) && doubledFreq <= correctedMax) {
        console.log(`🎵 相対音程補正: ${detectedFreq.toFixed(1)}Hz → ${doubledFreq.toFixed(1)}Hz`);
        return doubledFreq;
      }
      
      const halvedFreq = detectedFreq / 2;
      if (validateRelativePitch(halvedFreq) && halvedFreq >= correctedMin) {
        console.log(`🎵 相対音程補正: ${detectedFreq.toFixed(1)}Hz → ${halvedFreq.toFixed(1)}Hz`);
        return halvedFreq;
      }
    }
    
    // 補正不要の場合、元の値を返す
    return detectedFreq;
  };

  const detectAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    
    // 🎵 周波数検出用：Float32配列取得
    const timeDomainData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    // 🔊 音量検出用：8bit配列取得
    const byteTimeDomainData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(byteTimeDomainData);
    
    // 🔊 音量計算（プロトタイプ準拠）
    let sum = 0;
    let maxAmplitude = 0;
    
    for (let i = 0; i < byteTimeDomainData.length; i++) {
      const sample = (byteTimeDomainData[i] - 128) / 128;
      sum += sample * sample;
      maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
    }
    
    const rms = Math.sqrt(sum / byteTimeDomainData.length);
    const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
    // 音量スケーリング調整: より高い値まで表示するため除数を調整
    const volumePercent = Math.min(Math.max(calculatedVolume / 12 * 100, 0), 100);
    
    // 音量スムージング（より反応を良く）
    const smoothingFactor = 0.2;
    const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
    previousVolumeRef.current = smoothedVolume;
    
    // 🎵 周波数検出（Pitchy）
    let detectedFreq: number | null = null;
    let detectedClarity = 0;
    
    try {
      // バランスの取れた音量閾値でノイズリダクション
      if (calculatedVolume > 3) {
        // PitchDetectorインスタンス初期化（初回のみ）
        if (!pitchDetectorRef.current) {
          pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
          pitchDetectorRef.current.clarityThreshold = 0.15; // 適度な明瞭度
          pitchDetectorRef.current.maxInputAmplitude = 1.0;
        }
        
        // Pitchy周波数検出
        const [freq, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);
        
        // 適度な有効範囲チェック（80-1200Hz、明瞭度0.15以上）
        if (clarity > 0.15 && freq > 80 && freq < 1200) {
          // 動的オクターブ補正適用
          const correctedFreq = applyDynamicOctaveCorrection(freq, targetFrequenciesRef.current);
          const roundedFreq = Math.round(correctedFreq * 10) / 10;
          
          // 周波数履歴に追加（最大10個まで保持）
          frequencyHistoryRef.current.push(roundedFreq);
          if (frequencyHistoryRef.current.length > 10) {
            frequencyHistoryRef.current.shift();
          }
          
          // 履歴が5個以上ある場合、高度な安定化処理
          if (frequencyHistoryRef.current.length >= 5) {
            // 移動平均計算
            const avgFreq = frequencyHistoryRef.current.slice(-5).reduce((sum, f) => sum + f, 0) / 5;
            
            // 急激な変化を抑制（±20%以内）
            if (stableFrequencyRef.current !== null && Math.abs(roundedFreq - avgFreq) / avgFreq > 0.2) {
              // 段階的に近づける
              detectedFreq = avgFreq + (roundedFreq - avgFreq) * 0.3;
              detectedFreq = Math.round(detectedFreq * 10) / 10;
              detectedClarity = clarity;
            } else {
              // オクターブジャンプ検出
              if (stableFrequencyRef.current !== null) {
                const octaveRatio = roundedFreq / stableFrequencyRef.current;
                if (octaveRatio > 1.8 || octaveRatio < 0.55) {
                  // オクターブジャンプを無視
                  detectedFreq = stableFrequencyRef.current;
                  detectedClarity = clarity;
                } else {
                  // 正常な変化
                  stableFrequencyRef.current = roundedFreq;
                  detectedFreq = roundedFreq;
                  detectedClarity = clarity;
                }
              } else {
                // 初回
                stableFrequencyRef.current = roundedFreq;
                detectedFreq = roundedFreq;
                detectedClarity = clarity;
              }
            }
          }
        }
        
        noSoundCounterRef.current = 0; // 音が検出されたのでカウンターリセット
      } else {
        // 無音状態のカウンター増加
        noSoundCounterRef.current++;
        
        // 15フレーム以上無音が続いた場合、周波数表示をクリア（少し長めに）
        if (noSoundCounterRef.current > 15) {
          frequencyStabilityRef.current = {freq: 0, count: 0};
          frequencyHistoryRef.current = [];
          stableFrequencyRef.current = null;
          stabilityCounterRef.current = 0;
        }
      }
    } catch (error) {
      console.warn('Pitchy detection error:', error);
    }
    
    // DOM直接操作でリアルタイム更新（React state不使用）
    updateVolumeDisplay(smoothedVolume);
    updateFrequencyDisplay(detectedFreq, detectedClarity);
    updateDebugInfo({
      raw: Math.max(rms * 200, maxAmplitude * 100),
      calculated: calculatedVolume,
      normalized: volumePercent
    });
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectAudio);
  }, [baseFrequency]); // 基音変更時にコールバック再作成

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // マイクロフォン許可取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      streamRef.current = stream;
      
      // MediaRecorder作成（react-audio-visualize用）
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // AudioContext作成
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const analyser = audioContext.createAnalyser();
      
      // AnalyserNode設定
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // ノイズリダクションフィルター作成
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime(40, audioContext.currentTime);
      highPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
      lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      const notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
      
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(1.2, audioContext.currentTime);
      
      // MediaStreamSource作成・接続
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(notchFilter);
      notchFilter.connect(gainNode);
      gainNode.connect(analyser);
      
      // Refs保存
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      highPassFilterRef.current = highPassFilter;
      lowPassFilterRef.current = lowPassFilter;
      notchFilterRef.current = notchFilter;
      gainNodeRef.current = gainNode;
      
      setIsRecording(true);
      console.log('✅ マイク開始完了、音量＋周波数検出開始');
      
      // 統合検出開始
      detectAudio();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
    }
  }, [detectAudio]);

  const stopRecording = useCallback(() => {
    try {
      // アニメーションフレーム停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // MediaRecorder停止
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
      
      // MediaStream停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // AudioContext閉じる
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Refs初期化
      analyserRef.current = null;
      highPassFilterRef.current = null;
      lowPassFilterRef.current = null;
      notchFilterRef.current = null;
      gainNodeRef.current = null;
      pitchDetectorRef.current = null;
      previousVolumeRef.current = 0;
      frequencyStabilityRef.current = {freq: 0, count: 0};
      noSoundCounterRef.current = 0;
      frequencyHistoryRef.current = [];
      stableFrequencyRef.current = null;
      stabilityCounterRef.current = 0;
      
      setIsRecording(false);
      // DOM直接リセット
      updateVolumeDisplay(0);
      updateFrequencyDisplay(null, 0);
      updateDebugInfo({raw: 0, calculated: 0, normalized: 0});
      
    } catch (err) {
      console.error('❌ 停止エラー:', err);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* 基音選択 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🎵 基音選択</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {targetFrequenciesRef.current.map((freq, index) => {
              const notes = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド(高)'];
              return (
                <button
                  key={freq}
                  onClick={async () => {
                    setBaseFrequency(freq);
                    // Tone.jsで基音再生
                    try {
                      await Tone.start();
                      const synth = new Tone.Synth({
                        oscillator: { type: "sine" },
                        envelope: {
                          attack: 0.01,
                          decay: 0.1,
                          sustain: 0.5,
                          release: 0.5
                        }
                      }).toDestination();
                      synth.triggerAttackRelease(freq, "2n");
                    } catch (e) {
                      console.error('基音再生エラー:', e);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    baseFrequency === freq
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="font-bold">{notes[index]}</div>
                  <div className="text-xs opacity-80">{freq.toFixed(1)}Hz</div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 p-6 bg-blue-100 rounded-xl shadow-lg">
            <div className="text-2xl text-blue-800 mb-2">現在の基音</div>
            <div className="text-6xl font-bold text-blue-900">
              {['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド(高)'][targetFrequenciesRef.current.indexOf(baseFrequency)]}
            </div>
            <div className="text-3xl text-blue-700 mt-2">{baseFrequency.toFixed(1)} Hz</div>
          </div>
        </div>
        
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            🎯 動的オクターブ補正 + 倍音制御システム
          </div>
        </div>

        {/* 音量＋周波数表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🎵 音量＋周波数検出</h3>
          
          <div className="space-y-8">
            {/* DOM直接操作音量バー可視化 */}
            {isRecording && (
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">📊 ライブ音量可視化</h4>
                <div className="flex justify-center">
                  <div className="bg-gray-200 rounded-full h-6 w-80 overflow-hidden">
                    <div 
                      ref={volumeBarRef}
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100 ease-out"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  音量: <span ref={volumeTextRef}>0.0%</span>
                </div>
              </div>
            )}
            
            {/* DOM直接操作周波数表示（固定高さ） */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">🎵 周波数検出</h4>
              <div className="h-32 flex flex-col justify-center">
                <div ref={frequencyDisplayRef} className="space-y-2">
                  <div className="text-gray-400 text-lg">
                    🎤 音声を検出中...
                  </div>
                </div>
                <div ref={clarityDisplayRef} className="text-sm text-gray-500 mt-2">
                  明瞭度: 0.0%
                </div>
              </div>
            </div>
            
            {/* DOM直接操作デバッグ情報 */}
            {isRecording && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-bold text-gray-700 mb-2">🔍 デバッグ情報</h4>
                <div ref={debugInfoRef}>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div><span className="font-semibold">音量:</span><br/>0.0%</div>
                    <div><span className="font-semibold">生音量:</span><br/>0.0</div>
                    <div><span className="font-semibold">計算値:</span><br/>0.0</div>
                    <div><span className="font-semibold">正規化:</span><br/>0.0</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <span className="font-bold text-red-800">エラー発生</span>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* 制御ボタン */}
        <div className="mb-12 space-y-6">
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <Mic className="w-8 h-8" />
                  <span>🎤 マイク開始</span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <MicOff className="w-8 h-8" />
                  <span>🛑 マイク停止</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 2: 動的オクターブ補正 + 倍音制御システム</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>マイクロフォン許可取得 + MediaRecorder作成</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>カスタム音量バー: リアルタイム音量レベル可視化</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>動的オクターブ補正: 倍音誤検出の自動回避システム</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>統合処理: 音量＋周波数＋明瞭度のリアルタイム更新</span>
            </div>
          </div>
          
          {/* 技術情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🔧 使用ライブラリ</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div>✅ カスタム音量バー: レスポンシブ音量レベル表示</div>
              <div>✅ 動的オクターブ補正: 55%闾値システムで倍音除去</div>
              <div>✅ Web Audio API: ノイズリダクション＋リアルタイム処理</div>
              <div>✅ TypeScript: 型安全な実装</div>
            </div>
          </div>
        </div>

        {/* 戻るボタン */}
        <Link 
          href="/test/accuracy-test-v2"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>accuracy-test-v2に戻る</span>
        </Link>
      </div>
    </div>
  );
}