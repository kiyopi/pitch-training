'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Mic, VolumeX, Volume2, Music } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';

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
  const dataArrayRef = useRef<Float32Array | null>(null);
  const bufferLength = useRef<number>(0);
  
  // DOM直接操作用ref（音響特化アーキテクチャ）
  const frequencyDisplayRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);
  
  // 10種類の基音候補
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド4', 'D4': 'レ4', 'E4': 'ミ4', 'F4': 'ファ4', 'G4': 'ソ4',
    'A4': 'ラ4', 'B4': 'シ4', 'C5': 'ド5', 'D5': 'レ5', 'E5': 'ミ5'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

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
        // FFTサイズに合わせたFloat32Array用のDetectorを作成
        const fftSize = analyser.fftSize; // 2048
        bufferLength.current = analyser.frequencyBinCount; // fftSize/2 = 1024
        dataArrayRef.current = new Float32Array(fftSize); // 時間域データ用
        
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
    
    // 時間域データ取得（Pitchyは時間域データが必要）
    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    
    // Pitchy McLeod Pitch Method による基音検出
    const [rawPitch, clarity] = pitchDetectorRef.current.findPitch(
      dataArrayRef.current, 
      audioContextRef.current.sampleRate
    );
    
    // PITCHY_SPECS準拠: 検出条件チェック
    if (rawPitch > 0 && clarity > 0.1 && rawPitch >= 80 && rawPitch <= 1200) {
      
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
      
      // 高精度検出ログ（clarity > 0.9での精度表示）
      if (clarity > 0.9) {
        // リアルタイム検出ログ（1秒に1回）
        if (Date.now() % 1000 < 17) { // 約60FPSで1秒に1回
          addLog(`🔍 高精度検出: ${correctedPitch.toFixed(1)}Hz (clarity=${clarity.toFixed(3)})`);
        }
        
        // TODO: Step B2で周波数表示DOM更新を実装
        console.log(`Pitchy: ${correctedPitch.toFixed(1)} Hz, Clarity: ${clarity.toFixed(3)}`);
      }
      
    } else if (rawPitch > 0) {
      // 検出範囲外または低clarity の場合（デバッグ用）
      if (Date.now() % 2000 < 17) { // 2秒に1回
        if (rawPitch < 80 || rawPitch > 1200) {
          addLog(`⚠️ 検出範囲外: ${rawPitch.toFixed(1)}Hz (範囲: 80-1200Hz)`);
        } else if (clarity <= 0.1) {
          addLog(`⚠️ 低精度検出: clarity=${clarity.toFixed(3)} (最低: 0.1)`);
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

  const handleStart = async () => {
    // 再生中は新しい音を開始しない
    if (isPlaying) {
      addLog('⚠️ 既に再生中のため新しい音をスキップ');
      return;
    }
    
    // ランダムな基音を選択
    const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
    setCurrentBaseNote(randomNote);
    
    setIsPlaying(true);
    
    try {
      addLog(`🎲 ランダム基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]}`);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // 高品質ピアノ音源作成（C4単一音源 + 自動ピッチシフト）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6 // プロトタイプ準拠の音量設定（iPhone最適化）
      }).toDestination();
      
      // 音源読み込み待機
      addLog('ピアノ音源読み込み中...');
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生（C4から自動ピッチシフト）
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.8); // プロトタイプ準拠のvelocity設定
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
        setIsPlaying(false); // 再生状態をリセット
      }, 1700);
      
    } catch (error) {
      addLog(`❌ ピアノ音再生エラー: ${error}`);
      setIsPlaying(false); // エラー時も再生状態をリセット
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
            }}>🧪 Step 1-4 動作確認用</h4>
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
            <p style={{
              fontSize: '12px',
              color: '#92400e',
              margin: 0,
              textAlign: 'center'
            }}>
              ※ ブラウザのコンソールで周波数とクラリティを確認できます（F12キー）
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