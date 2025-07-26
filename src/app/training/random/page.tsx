'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// === 型定義 ===
type MicrophoneState = 'checking' | 'granted' | 'denied' | 'prompt' | 'error';

export default function RandomTrainingPage() {
  // === マイク状態管理 ===
  const [micState, setMicState] = useState<MicrophoneState>('checking');
  const [micError, setMicError] = useState<string | null>(null);
  
  // === 基音再生状態 ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 利用可能な基音候補（ローカル音源ファイルに基づく）
  const baseNotes = ['B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'Ab4', 'Bb3'];
  const baseNoteNames = {
    'B3': 'シ（低）', 'C4': 'ド（中）', 'Db4': 'レ♭（中）', 'D4': 'レ（中）', 'Eb4': 'ミ♭（中）',
    'E4': 'ミ（中）', 'F4': 'ファ（中）', 'Gb4': 'ソ♭（中）', 'Ab4': 'ラ♭（中）', 'Bb3': 'シ♭（低）'
  };
  
  // === マイク許可チェック関数 ===
  const checkMicrophonePermission = useCallback(async (): Promise<MicrophoneState> => {
    try {
      // Navigator permissions API で状態確認
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return permissionStatus.state as MicrophoneState;
      }
      
      // Fallback: 実際にマイクアクセスを試行
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('マイク許可確認エラー:', errorMessage);
      
      if (errorMessage.includes('Permission denied')) {
        return 'denied';
      } else if (errorMessage.includes('NotFoundError')) {
        return 'error';
      } else {
        return 'prompt';
      }
    }
  }, []);

  // === 初期化: マイク状態検出 ===
  useEffect(() => {
    const initializeMicrophoneState = async () => {
      try {
        const state = await checkMicrophonePermission();
        setMicState(state);
        setMicError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMicState('error');
        setMicError(errorMessage);
      }
    };

    initializeMicrophoneState();
  }, [checkMicrophonePermission]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  // === ピアノ音源初期化 ===
  const initializeSampler = useCallback(async () => {
    if (sampler) return sampler;

    try {
      addLog('🎵 ピアノ音源初期化開始');
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // ピアノ音源作成（ローカルファイル使用）
      const newSampler = new Tone.Sampler({
        urls: {
          "B3": "B3.mp3",
          "C4": "C4.mp3",
          "Db4": "Db4.mp3", 
          "D4": "D4.mp3",
          "Eb4": "Eb4.mp3",
          "E4": "E4.mp3",
          "F4": "F4.mp3",
          "Gb4": "Gb4.mp3",
          "Ab4": "Ab4.mp3",
          "Bb3": "Bb3.mp3"
        },
        baseUrl: "/pitch-training/audio/piano/",
        release: 1.5
      }).toDestination();
      
      // 音源読み込み待機
      addLog('音源読み込み中...');
      await Tone.loaded();
      addLog('✅ ピアノ音源初期化完了');
      
      setSampler(newSampler);
      return newSampler;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ピアノ音源初期化エラー: ${errorMessage}`);
      throw error;
    }
  }, [sampler]);

  // === ランダム基音再生ハンドラー ===
  const handleRandomBasePlay = async () => {
    if (isPlaying || isLoading) return;

    try {
      setIsLoading(true);
      setIsPlaying(true);
      
      addLog('🎲 ランダム基音再生開始');
      
      // サンプラー初期化
      const samplerInstance = await initializeSampler();
      
      // ランダム基音選択
      const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      setCurrentBaseNote(randomNote);
      
      addLog(`選択された基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]} (${randomNote})`);
      
      // 音声再生（2秒間）
      samplerInstance.triggerAttackRelease(randomNote, "2n");
      addLog('🎵 ピアノ音再生中...');
      
      // 2.5秒後に完了
      setTimeout(() => {
        setIsPlaying(false);
        addLog('✅ ランダム基音再生完了');
      }, 2500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ランダム基音再生エラー: ${errorMessage}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  // === レンダリング関数 ===
  const renderMicrophonePermissionRequired = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          ⚠️ マイクアクセスが必要です
        </CardTitle>
        <CardDescription className="text-base">
          このトレーニングには音声入力が必要です。<br />
          マイクテストページで音量・周波数を事前確認し、<br />
          ご自身の声の特性を把握してからトレーニングにお進みください。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 items-center">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/microphone-test">
            マイクテストページに移動
          </Link>
        </Button>
        
        <Button 
          variant="outline"
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          直接マイク許可を取得
        </Button>
      </CardContent>
    </Card>
  );

  const renderMicrophoneError = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          🔇 マイクアクセスに問題があります
        </CardTitle>
        <CardDescription className="text-base">
          考えられる原因:<br />
          • マイク許可が取り消された<br />
          • マイクデバイスが利用できない<br />
          • ブラウザの設定変更<br />
          {micError && <><br />エラー詳細: {micError}</>}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 items-center">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/microphone-test">
            マイクテストページで確認
          </Link>
        </Button>
        
        <Button 
          variant="outline"
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          再度マイク許可を取得
        </Button>
      </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 text-center">
        <div className="text-2xl font-bold text-gray-800">
          🔍 マイク状態を確認中...
        </div>
      </CardContent>
    </Card>
  );

  // マイク状態に応じた表示分岐
  if (micState === 'checking') {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors font-medium">
                <ArrowLeft className="w-5 h-5 mr-2" />
                ホーム
              </Link>
              <h1 className="text-xl font-bold text-gray-800">
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-4">
            {renderLoadingState()}
          </div>
        </main>
      </div>
    );
  }

  if (micState === 'denied' || micState === 'prompt') {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors font-medium">
                <ArrowLeft className="w-5 h-5 mr-2" />
                ホーム
              </Link>
              <h1 className="text-xl font-bold text-gray-800">
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-4">
            {renderMicrophonePermissionRequired()}
          </div>
        </main>
      </div>
    );
  }

  if (micState === 'error') {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-200 py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors font-medium">
                <ArrowLeft className="w-5 h-5 mr-2" />
                ホーム
              </Link>
              <h1 className="text-xl font-bold text-gray-800">
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-4">
            {renderMicrophoneError()}
          </div>
        </main>
      </div>
    );
  }

  // マイク許可済み: メイントレーニング画面
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" />
              ホーム
            </Link>
            <h1 className="text-xl font-bold text-gray-800">
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* マイク準備完了表示 */}
          <Card className="bg-emerald-50 border-emerald-200 mb-6">
            <CardContent className="p-3 text-center">
              <span className="text-emerald-700 font-semibold">
                🎤 マイク準備完了
              </span>
            </CardContent>
          </Card>

          {/* ヘッダー */}
          <div className="mb-12 text-center">
            <div className="inline-block mb-6">
              <span className="text-8xl">🎲</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ランダム基音トレーニング
            </h2>
            <p className="text-base text-gray-500">
              10種類の基音からランダムに選択してトレーニング
            </p>
          </div>

          {/* 基音再生セクション - PC/Mobile レスポンシブ対応 */}
          <div className="flex flex-col items-center mb-8">
            <Button 
              onClick={handleRandomBasePlay}
              disabled={isPlaying || isLoading}
              size="lg"
              className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-lg font-bold py-6 mb-6 shadow-lg"
            >
              {isLoading ? '🔄 初期化中...' : isPlaying ? '🎵 再生中...' : '🎲 ランダム基音再生'}
            </Button>
            
            {/* 現在の基音表示 */}
            {currentBaseNote && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 text-center">
                  <span className="text-emerald-700 font-semibold">
                    🎵 現在の基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}
                  </span>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ドレミファソラシドガイドセクション - アニメーション表示エリア */}
          <Card className="mb-8 min-h-[140px]">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                🎵 ガイドアニメーション
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* レスポンシブ対応: PC横並び / Mobile縦並び */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 justify-center max-w-sm md:max-w-2xl mx-auto">
                {['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'].map((note, index) => (
                  <div
                    key={`${note}-${index}`}
                    className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-sm md:text-base font-bold rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-500 transform scale-100 transition-all duration-300 ease-in-out"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 音程検出・採点表示エリア - 固定高さ */}
          <Card className="min-h-[120px]">
            <CardContent className="flex flex-col justify-center items-center p-6">
              <div className="text-base font-semibold text-gray-800">
                🎵 音程を検出中...
              </div>
              
              {/* 採点結果表示エリア（非表示状態） */}
              <div className="hidden mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-lg font-bold text-emerald-700 mb-2">
                  🎯 採点結果
                </div>
                <div className="text-sm text-emerald-600">
                  精度: 95% • 音程: ド → レ
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-gray-500 text-center">
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Version 3.0</span>
              <span>•</span>
              <span>Powered by Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}