'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Mic, VolumeX, Volume2, Music } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';
import { UnifiedAudioProcessor } from '@/utils/audioProcessing';
import { AudioDOMController } from '@/utils/audioDOMHelpers';

export default function RandomTrainingPage() {
  // React状態管理（UIレイアウト制御）
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Pitchy統合基盤（音響処理の核心）
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  
  // AudioContext・AnalyserNode基盤（Web Audio API）
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // マイクストリーム管理（MediaStream制御）
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // 音程検出用（React非依存の直接操作）
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const bufferLength = useRef<number>(0);
  
  // 統一音響処理モジュール
  const audioProcessorRef = useRef<UnifiedAudioProcessor | null>(null);
  
  // 相対音程計算状態管理
  const [currentBaseFrequency, setCurrentBaseFrequency] = useState<number | null>(null);
  const [relativePitchInfo, setRelativePitchInfo] = useState<{
    semitones: number;
    scaleDegree: number;
    noteName: string;
    isCorrect: boolean;
  } | null>(null);
  
  // DOM直接操作用ref（音響特化アーキテクチャ）
  const frequencyDisplayRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);
  const relativePitchDisplayRef = useRef<HTMLDivElement | null>(null);
  
  // 10種類の基音候補（PITCHY_SPECS準拠 + ランダムトレーニング最適化）
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  
  // 音程表記統一（ド4形式）+ 周波数情報
  const baseNoteNames = {
    'C4': 'ド4', 'D4': 'レ4', 'E4': 'ミ4', 'F4': 'ファ4', 'G4': 'ソ4',
    'A4': 'ラ4', 'B4': 'シ4', 'C5': 'ド5', 'D5': 'レ5', 'E5': 'ミ5'
  };
  
  // PITCHY_SPECS準拠の基音周波数（参考値）
  const baseNoteFrequencies = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  // Step B-2: ドレミファソラシド判定システム（8音階正誤判定）
  const calculateRelativePitch = useCallback((detectedFreq: number, baseFreq: number) => {
    // セミトーン差計算（12平均律）
    const semitones = Math.round(12 * Math.log2(detectedFreq / baseFreq));
    
    // オクターブ内の音程番号（0-11）
    const scaleDegree = ((semitones % 12) + 12) % 12;
    
    // ドレミファソラシド判定（8音階システム）
    const scaleNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
    const scaleMapping = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
    
    let noteName = '不明';
    let accuracyLevel = 'unknown'; // Step B-2: 精度レベル詳細化
    let isCorrect = false;
    let isClose = false;
    
    // 8音階内での最近接音程を検索
    let minDistance = 12;
    let closestIndex = -1;
    
    for (let i = 0; i < scaleMapping.length; i++) {
      const distance = Math.abs(scaleDegree - scaleMapping[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    // Step B-2: 段階的正誤判定システム
    if (closestIndex !== -1) {
      noteName = scaleNames[closestIndex];
      
      if (minDistance <= 0.3) {
        // ±30セント以内: 正解
        isCorrect = true;
        accuracyLevel = 'correct';
      } else if (minDistance <= 0.5) {
        // ±31-50セント: 近接
        isClose = true;
        accuracyLevel = 'close';
      } else if (minDistance <= 1.0) {
        // ±51-100セント: 要練習
        accuracyLevel = 'needs_practice';
      } else {
        // ±100セント超: 不正確
        accuracyLevel = 'inaccurate';
        noteName = '不明';
      }
    }
    
    return {
      semitones,
      scaleDegree,
      noteName,
      isCorrect,
      isClose,
      accuracyLevel,
      distance: minDistance,
      centsError: Math.round(minDistance * 100) // セント単位の誤差
    };
  }, []);

  // Step B-2: 拡張された相対音程表示更新
  const updateRelativePitchDisplay = useCallback((relativePitch: {
    semitones: number;
    scaleDegree: number;
    noteName: string;
    isCorrect: boolean;
    isClose: boolean;
    accuracyLevel: string;
    distance: number;
    centsError: number;
  } | null) => {
    if (!relativePitchDisplayRef.current) return;
    
    if (relativePitch) {
      const { semitones, noteName, accuracyLevel, distance, centsError } = relativePitch;
      
      // Step B-2: 詳細化された色分けとメッセージ
      let statusColor = '#6b7280';
      let statusText = '分析中';
      let statusIcon = '🎵';
      
      switch (accuracyLevel) {
        case 'correct':
          statusColor = '#10b981'; // 緑色
          statusText = '正解！';
          statusIcon = '✅';
          break;
        case 'close':
          statusColor = '#f59e0b'; // オレンジ色
          statusText = '近い';
          statusIcon = '🟡';
          break;
        case 'needs_practice':
          statusColor = '#ef4444'; // 赤色
          statusText = '要練習';
          statusIcon = '❌';
          break;
        case 'inaccurate':
          statusColor = '#9ca3af'; // グレー色
          statusText = '不正確';
          statusIcon = '❓';
          break;
      }
      
      relativePitchDisplayRef.current.innerHTML = `
        <div style="text-align: center; padding: 8px;">
          <div style="font-size: 18px; font-weight: bold; color: ${statusColor}; margin-bottom: 4px;">
            ${statusIcon} ${noteName} (${semitones >= 0 ? '+' : ''}${semitones})
          </div>
          <div style="font-size: 12px; color: ${statusColor}; margin-bottom: 2px;">
            ${statusText} (誤差: ${centsError}セント)
          </div>
          <div style="font-size: 10px; color: #9ca3af;">
            精度: ${distance.toFixed(2)}セミトーン
          </div>
        </div>
      `;
    } else {
      relativePitchDisplayRef.current.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 8px;">
          <div style="font-size: 14px;">🎵 音程分析待機中...</div>
        </div>
      `;
    }
  }, []);

  // 周波数から音名を取得する関数（Step A6で追加）
  const getNoteNameFromFrequency = (frequency: number): string => {
    const noteFrequencies = [
      { note: 'ド4', freq: 261.63 }, { note: 'ド#4', freq: 277.18 }, { note: 'レ4', freq: 293.66 },
      { note: 'レ#4', freq: 311.13 }, { note: 'ミ4', freq: 329.63 }, { note: 'ファ4', freq: 349.23 },
      { note: 'ファ#4', freq: 369.99 }, { note: 'ソ4', freq: 392.00 }, { note: 'ソ#4', freq: 415.30 },
      { note: 'ラ4', freq: 440.00 }, { note: 'ラ#4', freq: 466.16 }, { note: 'シ4', freq: 493.88 },
      { note: 'ド5', freq: 523.25 }, { note: 'ド#5', freq: 554.37 }, { note: 'レ5', freq: 587.33 },
      { note: 'レ#5', freq: 622.25 }, { note: 'ミ5', freq: 659.25 }
    ];
    
    let closestNote = noteFrequencies[0];
    let minDiff = Math.abs(frequency - closestNote.freq);
    
    for (const note of noteFrequencies) {
      const diff = Math.abs(frequency - note.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }
    
    return closestNote.note;
  };

  // DOM直接操作: 周波数表示更新（音響特化アーキテクチャ）
  const updateFrequencyDisplay = useCallback((frequency: number, clarity: number, noteName?: string) => {
    if (!frequencyDisplayRef.current) return;
    
    // Step A6修正: 高さ固定レイアウト（3行固定で表示変化を防止）
    if (frequency > 0 && clarity > 0.1 && noteName) {
      const displayContent = `
        <div style="text-align: center; color: #1f2937; font-weight: 600; height: 60px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">${noteName}</div>
          <div style="font-size: 14px; color: #6b7280;">${frequency.toFixed(1)} Hz</div>
          <div style="font-size: 12px; color: #9ca3af;">Clarity: ${clarity.toFixed(3)}</div>
        </div>
      `;
      frequencyDisplayRef.current.innerHTML = displayContent;
    } else {
      // Step A6修正: 待機中表示も同じ高さで固定
      frequencyDisplayRef.current.innerHTML = `
        <div style="text-align: center; color: #6b7280; height: 60px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 14px;">待機中...</div>
          <div style="font-size: 12px; opacity: 0;">　</div>
          <div style="font-size: 10px; opacity: 0;">　</div>
        </div>
      `;
    }
  }, []);

  // DOM直接操作: 音量表示更新（統一モジュール使用）
  const updateVolumeDisplay = useCallback((volume: number) => {
    if (volumeBarRef.current) {
      AudioDOMController.updateVolumeDisplay(volumeBarRef.current, volume);
    }
  }, []);

  // DOM初期化システム（iPhone Safari WebKit制約対応）
  useEffect(() => {
    // Step A6修正: 周波数表示の初期化（高さ固定）
    if (frequencyDisplayRef.current) {
      frequencyDisplayRef.current.innerHTML = `
        <div style="text-align: center; color: #6b7280; height: 60px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 14px;">🎤 音程検出準備完了</div>
          <div style="font-size: 12px; opacity: 0;">　</div>
          <div style="font-size: 10px; opacity: 0;">　</div>
        </div>
      `;
    }
    
    // 音量バーの初期化（統一モジュール使用）
    if (volumeBarRef.current) {
      AudioDOMController.initializeVolumeBar(volumeBarRef.current);
    }
    
    // 相対音程表示の初期化
    if (relativePitchDisplayRef.current) {
      updateRelativePitchDisplay(null);
    }
    
    // 統一音響処理モジュール初期化
    if (!audioProcessorRef.current) {
      audioProcessorRef.current = new UnifiedAudioProcessor();
      addLog('🔧 統一音響処理モジュール初期化完了');
    }
    
    addLog('🖥️ DOM直接操作基盤初期化完了');
  }, []);

  // マイクロフォン初期化システム（マイクテストページから移植）
  const initializeMicrophone = async () => {
    try {
      addLog('🎤 マイク初期化を開始...');
      
      // Web Audio API サポートチェック
      if (!window.AudioContext && !(window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext) {
        throw new Error('Web Audio APIがサポートされていません');
      }
      
      // getUserMedia サポートチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('マイクアクセスAPIがサポートされていません');
      }
      
      // マイクアクセス要求（iPhone/PC対応設定）
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      micStreamRef.current = stream;
      addLog('✅ マイクストリーム取得成功');
      
      // AudioContext セットアップ
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog('🔊 AudioContext resumed');
      }
      
      // 音声分析ノード作成
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8; // 安定化重視
      analyserRef.current = analyser;
      
      // 🚨 iPhone AudioContext競合対策: プラットフォーム適応型フィルター
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const source = audioContext.createMediaStreamSource(stream);
      
      if (isIOS) {
        // iPhone: 軽量化フィルター（AudioContext競合回避）
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(60, audioContext.currentTime);
        highPassFilter.Q.setValueAtTime(0.5, audioContext.currentTime);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.5, audioContext.currentTime); // iPhone音量補強
        
        // 軽量接続: source → highpass → gain → analyser
        source.connect(highPassFilter);
        highPassFilter.connect(gainNode);
        gainNode.connect(analyser);
        
        addLog('🍎 iPhone軽量化フィルター適用');
        
      } else {
        // PC: 標準3段階フィルター
        const highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(80, audioContext.currentTime);
        highPassFilter.Q.setValueAtTime(1.0, audioContext.currentTime);
        
        const lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
        lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
        
        const notchFilter = audioContext.createBiquadFilter();
        notchFilter.type = 'notch';
        notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
        notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        
        // PC標準接続: source → 3段階フィルター → analyser
        source.connect(highPassFilter);
        highPassFilter.connect(lowPassFilter);
        lowPassFilter.connect(notchFilter);
        notchFilter.connect(gainNode);
        gainNode.connect(analyser);
        
        addLog('💻 PC標準3段階フィルター適用');
      }
      
      // Pitchy McLeod Pitch Method 初期化（PITCHY_SPECS準拠）
      if (!pitchDetectorRef.current) {
        // FFTサイズに合わせたUint8Array用のDetectorを作成（統一仕様）
        const fftSize = analyser.fftSize; // 2048
        bufferLength.current = analyser.frequencyBinCount; // fftSize/2 = 1024
        dataArrayRef.current = new Uint8Array(fftSize); // Pitchy用は fftSize (2048) が必要
        
        // PITCHY_SPECS: forFloat32Array(fftSize) で初期化
        pitchDetectorRef.current = PitchDetector.forFloat32Array(fftSize);
        
        addLog(`🎵 Pitchy McLeod Pitch Method 初期化完了`);
        addLog(`📊 FFTサイズ: ${fftSize}, バッファ長: ${bufferLength.current}`);
        addLog(`🎯 検出範囲: 80-1200Hz, 最低clarity: 0.1`);
        addLog(`🔧 動的オクターブ補正: C4-C5範囲対応`);
      }
      
      addLog('🎤 マイクロフォン初期化システム完了');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ マイク初期化エラー: ${errorMessage}`);
      return false;
    }
  };
  
  // PITCHY_SPECS準拠の音程検出システム（React非依存の直接操作）
  const detectPitch = () => {
    if (!analyserRef.current || !dataArrayRef.current || !pitchDetectorRef.current || !audioContextRef.current) {
      return;
    }
    
    // バイト時間域データ取得（統一仕様）
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    
    // 統一音響処理モジュールによる音量計算
    const volumeResult = audioProcessorRef.current!.calculateVolume(dataArrayRef.current);
    let adjustedVolume = audioProcessorRef.current!.getFinalDisplayVolume(volumeResult.finalVolume);
    
    // ランダムページ専用: 音量感度調整（過敏さ軽減）
    adjustedVolume = adjustedVolume * 0.7; // 70%に調整
    const finalVolume = Math.min(100, Math.max(0, adjustedVolume));
    
    // Float32Array変換（Pitchy用）
    const floatArray = new Float32Array(dataArrayRef.current.length);
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      floatArray[i] = (dataArrayRef.current[i] - 128) / 128; // -1 to 1 正規化
    }
    
    // Pitchy McLeod Pitch Method による基音検出（Float32Array使用）
    const [rawPitch, clarity] = pitchDetectorRef.current.findPitch(
      floatArray, 
      audioContextRef.current.sampleRate
    );
    
    // PITCHY_SPECS準拠: 検出条件チェック
    if (rawPitch > 0 && clarity > 0.6 && rawPitch >= 80 && rawPitch <= 1200) {
      // 統一仕様: 周波数検出時のみ音量バー表示
      if (audioProcessorRef.current!.shouldDisplayVolume(rawPitch, clarity)) {
        updateVolumeDisplay(finalVolume);
      }
      
      // 動的オクターブ補正システム（PITCHY_SPECS準拠）
      let correctedPitch = rawPitch;
      
      // 現在の目標周波数範囲（ドレミファソラシド: C4-C5）
      const minTargetFreq = 261.63; // C4 (PITCHY_SPECS準拠)
      const maxTargetFreq = 523.25; // C5 (PITCHY_SPECS準拠)
      
      // 補正しきい値：最高目標周波数の55%（PITCHY_SPECS準拠）
      const correctionThreshold = maxTargetFreq * 0.55; // ≈ 287.8 Hz
      
      // 補正後の範囲：最低目標の80%〜最高目標の120%
      const correctedMin = minTargetFreq * 0.8;  // ≈ 209.3 Hz
      const correctedMax = maxTargetFreq * 1.2;  // ≈ 627.9 Hz
      
      // 倍音誤検出の自動回避システム
      if (rawPitch < correctionThreshold && 
          rawPitch * 2 >= correctedMin && 
          rawPitch * 2 <= correctedMax) {
        correctedPitch = rawPitch * 2; // オクターブ補正
        
        // デバッグログ（60FPSで1秒に1回）
        if (Date.now() % 1000 < 17) { // 約60FPSで1秒に1回
          addLog(`🔧 動的オクターブ補正: ${rawPitch.toFixed(1)}Hz → ${correctedPitch.toFixed(1)}Hz`);
        }
      }
      
      // Step A6修正: 高精度検出時のDOM更新（clarity > 0.6で更新）
      const noteName = getNoteNameFromFrequency(correctedPitch);
      updateFrequencyDisplay(correctedPitch, clarity, noteName);
      
      // Step B-1: 相対音程計算実行
      if (currentBaseFrequency && correctedPitch > 0) {
        const relativePitch = calculateRelativePitch(correctedPitch, currentBaseFrequency);
        setRelativePitchInfo(relativePitch);
        updateRelativePitchDisplay(relativePitch);
        
        // Step B-2: 拡張された相対音程ログ（1秒に1回）
        if (Date.now() % 1000 < 17) {
          const { noteName, semitones, accuracyLevel, centsError } = relativePitch;
          let statusEmoji = '🎵';
          
          switch (accuracyLevel) {
            case 'correct': statusEmoji = '✅'; break;
            case 'close': statusEmoji = '🟡'; break;
            case 'needs_practice': statusEmoji = '❌'; break;
            case 'inaccurate': statusEmoji = '❓'; break;
          }
          
          addLog(`🎵 相対音程: ${noteName} (${semitones >= 0 ? '+' : ''}${semitones}) ${statusEmoji} 誤差: ${centsError}セント`);
        }
      } else {
        // デバッグ: 相対音程計算が実行されない理由をログ出力（10秒に1回）
        if (Date.now() % 10000 < 17) {
          addLog(`🔍 相対音程計算スキップ: 基音=${currentBaseFrequency ? `${currentBaseFrequency.toFixed(1)}Hz` : 'null'}, 検出=${correctedPitch.toFixed(1)}Hz`);
        }
      }
      
      // リアルタイム検出ログ（1秒に1回）
      if (Date.now() % 1000 < 17) { // 約60FPSで1秒に1回
        addLog(`🔍 検出: ${correctedPitch.toFixed(1)}Hz - ${noteName} (clarity=${clarity.toFixed(3)})`);
      }
      
      console.log(`Pitchy: ${correctedPitch.toFixed(1)} Hz, Clarity: ${clarity.toFixed(3)}`);
      
    } else {
      // 統一仕様: 音程未検出時は音量バーも0%
      updateVolumeDisplay(0);
      updateFrequencyDisplay(0, 0, undefined);
      
      // Step B-1: 音程未検出時は相対音程もリセット
      setRelativePitchInfo(null);
      updateRelativePitchDisplay(null);
      
      // デバッグログ（低頻度）
      if (rawPitch > 0 && Date.now() % 2000 < 17) { // 2秒に1回
        if (rawPitch < 80 || rawPitch > 1200) {
          addLog(`⚠️ 検出範囲外: ${rawPitch.toFixed(1)}Hz`);
        } else if (clarity <= 0.6) {
          addLog(`⚠️ 低精度: clarity=${clarity.toFixed(3)}`);
        }
      }
    }
    
    // 次フレームの予約（60FPS継続）
    animationFrameRef.current = requestAnimationFrame(detectPitch);
  };
  
  // テスト用: 音程検出開始
  const startPitchDetection = async () => {
    if (isDetecting) return;
    
    addLog('🎤 音程検出を開始します...');
    
    // マイク初期化
    const success = await initializeMicrophone();
    if (!success) {
      addLog('❌ マイク初期化に失敗しました');
      return;
    }
    
    setIsDetecting(true);
    addLog('✅ 音程検出開始！コンソールを確認してください');
    
    // 検出ループ開始
    detectPitch();
  };
  
  // テスト用: 音程検出停止
  const stopPitchDetection = () => {
    if (!isDetecting) return;
    
    // アニメーションフレーム停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // マイクストリーム停止
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    setIsDetecting(false);
    addLog('⏹️ 音程検出を停止しました');
  };

  // 基音再生システム（Tone.Sampler + Salamander Grand Piano統合）
  const handleStart = async () => {
    // 重複再生防止（厳格チェック）
    if (isPlaying) {
      addLog('⚠️ 既に再生中のため新しい音をスキップ');
      return;
    }
    
    // 10種類基音からランダム選択（統計的均等性確保）
    const randomIndex = Math.floor(Math.random() * baseNotes.length);
    const randomNote = baseNotes[randomIndex];
    const noteDisplayName = baseNoteNames[randomNote as keyof typeof baseNoteNames];
    
    setCurrentBaseNote(randomNote);
    setIsPlaying(true);
    
    // Step B-1: 基音周波数を設定（相対音程計算用）
    const noteFrequency = baseNoteFrequencies[randomNote as keyof typeof baseNoteFrequencies];
    setCurrentBaseFrequency(noteFrequency);
    
    try {
      const noteFrequency = baseNoteFrequencies[randomNote as keyof typeof baseNoteFrequencies];
      addLog(`🎲 ランダム基音選択: ${noteDisplayName} (${randomNote})`);
      addLog(`📊 選択詳細: ${randomIndex}/${baseNotes.length - 1}, ${noteFrequency}Hz`);
      
      // Tone.js AudioContext 確実初期化
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('🔊 Tone.js AudioContext 開始完了');
      }
      
      // 🎹 CLAUDE.md必須仕様: Tone.Sampler + Salamander Grand Piano
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3" // C4単一音源（自動ピッチシフト対応）
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,  // プロトタイプ準拠のリリース時間
        volume: 6      // iPhone最適化音量（プロトタイプ準拠）
      }).toDestination();
      
      addLog('🎹 Salamander Grand Piano音源作成完了');
      
      // 音源読み込み完全待機（エラー回避）
      addLog('📦 ピアノ音源読み込み中...');
      await Tone.loaded();
      addLog('✅ 音源読み込み完了');
      
      // 基音再生実行（1.7秒間・プロトタイプ準拠）
      addLog(`♪ 再生開始: ${noteDisplayName} (${randomNote})`);
      
      // triggerAttack: velocity 0.8（プロトタイプ準拠）
      sampler.triggerAttack(randomNote, undefined, 0.8);
      
      // 1.7秒後の確実な停止処理
      const releaseTimer = setTimeout(() => {
        try {
          sampler.triggerRelease(randomNote);
          addLog(`🔇 再生終了: ${noteDisplayName} (1.7sec)`);
          
          // 音源リソース解放（メモリリーク防止）
          sampler.dispose();
          addLog('🗑️ 音源リソース解放完了');
          
          // Step B-2: 基音再生完了後に自動的に音程検出開始
          setTimeout(async () => {
            addLog('🎤 基音再生完了 → 音程検出を自動開始');
            await startPitchDetection();
          }, 300); // 0.3秒待機してから音程検出開始
          
        } catch (releaseError) {
          addLog(`⚠️ 再生停止エラー: ${releaseError}`);
        } finally {
          setIsPlaying(false); // 確実な状態リセット
        }
      }, 1700); // プロトタイプ準拠の1.7秒
      
      // タイマーIDをログ（デバッグ用）
      addLog(`⏱️ リリースタイマー設定: ${releaseTimer}ms後に停止`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ ピアノ音源エラー: ${errorMessage}`);
      setIsPlaying(false); // エラー時も確実に状態リセット
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Header - トップページ統一デザイン */}
        <header style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease-in-out'
              }}>
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                戻る
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music style={{ width: '24px', height: '24px', color: '#059669' }} />
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  margin: 0
                }}>ランダム基音トレーニング</h1>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Version 3.0 - Updated: {new Date().toLocaleString('ja-JP')}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ padding: '32px 0' }}>
          {/* Hero Section - トップページ統一スタイル */}
          <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '24px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#d1fae5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <Music style={{ width: '40px', height: '40px', color: '#059669' }} />
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              ランダム基音モード
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', maxWidth: '600px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
              10種類の基音からランダムに選択してドレミファソラシドを発声
            </p>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#d1fae5',
              color: '#059669',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              初心者向け
            </div>
          </div>

          {/* Main Card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {/* 現在の基音表示 */}
            {currentBaseNote && (
              <div style={{
                padding: '24px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Music style={{ width: '24px', height: '24px', color: '#1e40af' }} />
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1e40af'
                  }}>
                    現在の基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#2563eb',
                  margin: 0
                }}>
                  この音を基準にドレミファソラシドを歌ってください
                </p>
              </div>
            )}

            {/* ランダム基音再生ボタン */}
            <button
              onClick={handleStart}
              disabled={isPlaying}
              style={{
                backgroundColor: isPlaying ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '500',
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                margin: '0 auto'
              }}
            >
              <Play style={{ width: '20px', height: '20px' }} />
              <span>{isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}</span>
            </button>
          </div>

          {/* 使い方説明 */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '48px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 8px 0'
              }}>使い方</h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.5',
                margin: 0
              }}>
                3つのステップで相対音感を効果的にトレーニング
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {[
                { step: 1, title: "基音を聞く", desc: "ランダムに選択された基音を確認" },
                { step: 2, title: "発声する", desc: "ドレミファソラシドを順番に歌う" },
                { step: 3, title: "繰り返し練習", desc: "様々な基音で相対音感を鍛える" }
              ].map((item) => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  }}>
                    {item.step}
                  </div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: '0 0 8px 0'
                  }}>{item.title}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                    margin: 0
                  }}>{item.desc}</p>
                </div>
              ))}
            </div>
            
            {/* 基音一覧 */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#374151',
                margin: '0 0 12px 0'
              }}>🎵 基音候補（10種類）</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {Object.entries(baseNoteNames).map(([note, name]) => (
                  <div key={note} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace' }}>{note}</span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* テスト用: 音程検出ボタン */}
          <div style={{
            marginBottom: '32px',
            padding: '16px',
            backgroundColor: '#fefce8',
            border: '2px solid #fde047',
            borderRadius: '12px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#92400e',
              margin: '0 0 12px 0'
            }}>🧪 Step 1-5 動作確認用</h4>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <button
                onClick={startPitchDetection}
                disabled={isDetecting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: isDetecting ? 'not-allowed' : 'pointer',
                  backgroundColor: isDetecting ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  transition: 'background-color 0.2s ease-in-out'
                }}
              >
                🎤 音程検出開始
              </button>
              <button
                onClick={stopPitchDetection}
                disabled={!isDetecting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: !isDetecting ? 'not-allowed' : 'pointer',
                  backgroundColor: !isDetecting ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  transition: 'background-color 0.2s ease-in-out'
                }}
              >
                ⏹️ 検出停止
              </button>
            </div>
            
            {/* Step A5: DOM直接操作対象要素 */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <h5 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                margin: '0 0 12px 0'
              }}>🎵 リアルタイム音響情報</h5>
              
              {/* 周波数表示（DOM直接操作対象） */}
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>検出周波数・音名・クラリティ:</div>
                <div 
                  ref={frequencyDisplayRef}
                  style={{
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#1f2937',
                    fontWeight: 'bold'
                  }}
                >
                  待機中...
                </div>
              </div>
              
              {/* 音量バー（DOM直接操作対象） */}
              <div style={{
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>音量レベル:</div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div 
                    ref={volumeBarRef}
                    className="transition-all duration-100"
                  >
                    {/* iPhone Safari WebKit対応: style属性なし */}
                  </div>
                </div>
              </div>
              
              {/* Step B-1: 相対音程表示（DOM直接操作対象） */}
              <div style={{
                marginBottom: '8px',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#0369a1',
                  marginBottom: '4px',
                  fontWeight: 'bold'
                }}>🎵 相対音程分析:</div>
                <div 
                  ref={relativePitchDisplayRef}
                  style={{
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                >
                  分析待機中...
                </div>
              </div>
            </div>
            
            <p style={{
              fontSize: '12px',
              color: '#92400e',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              ※ 上記の情報はDOM直接操作で更新されます（React非依存）
            </p>
          </div>

          {/* デバッグログ表示 */}
          {debugLog.length > 0 && (
            <div style={{
              marginBottom: '32px',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>📝 デバッグログ:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {debugLog.map((log, index) => (
                  <div key={index} style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>{log}</div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* フッター */}
        <footer style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '48px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <span>Version 3.0</span>
              <span>•</span>
              <span>Powered by Next.js</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}