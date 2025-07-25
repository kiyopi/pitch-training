'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Mic, Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// === 型定義 ===
type MicrophoneState = 'checking' | 'granted' | 'denied' | 'prompt' | 'error';

// === メインコンポーネント ===
export default function RandomTrainingPage() {
  // === マイク状態管理 ===
  const [micState, setMicState] = useState<MicrophoneState>('checking');
  const [micError, setMicError] = useState<string | null>(null);

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

  // === レンダリング: マイク許可要求画面 ===
  const renderMicrophonePermissionRequired = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-red-600">⚠️ マイクアクセスが必要です</CardTitle>
        <CardDescription className="text-gray-600">
          このトレーニングには音声入力が必要です。<br />
          推奨: マイクテストページで音声確認後ご利用ください。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <Button asChild className="w-full max-w-md" size="lg">
          <Link href="/microphone-test">
            マイクテストページに移動
          </Link>
        </Button>
        <Button 
          variant="outline"
          className="w-full max-w-md" 
          size="lg"
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
        >
          直接マイク許可を取得
        </Button>
      </CardContent>
    </Card>
  );

  // === レンダリング: マイクエラー回復画面 ===
  const renderMicrophoneErrorRecovery = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-red-600">🔇 マイクアクセスに問題があります</CardTitle>
        <CardDescription className="text-gray-600">
          考えられる原因:<br />
          • マイク許可が取り消された<br />
          • マイクデバイスが利用できない<br />
          • ブラウザの設定変更<br />
          {micError && <><br />エラー詳細: {micError}</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <Button asChild className="w-full max-w-md" size="lg">
          <Link href="/microphone-test">
            マイクテストページで確認
          </Link>
        </Button>
        <Button 
          variant="outline"
          className="w-full max-w-md" 
          size="lg"
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
        >
          再度マイク許可を取得
        </Button>
      </CardContent>
    </Card>
  );

  // === レンダリング: ローディング画面 ===
  const renderLoadingState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6 text-center">
        <CardTitle className="text-gray-900">🔍 マイク状態を確認中...</CardTitle>
      </CardContent>
    </Card>
  );

  // === レンダリング: メイントレーニング画面 ===
  const renderTrainingInterface = () => (
    <div className="space-y-6">
      {/* マイク準備完了状態表示 */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="mb-5 p-3 rounded-lg text-center font-semibold bg-green-50 text-green-800 border border-green-200">
            🎤 マイク準備完了
          </div>
        </CardContent>
      </Card>

      {/* 基音再生セクション */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>🎲 ランダム基音再生</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button 
            size="lg"
            className="w-full max-w-md"
            onClick={() => {
              // Phase 2で実装予定
              console.log('基音再生機能は Phase 2 で実装予定');
            }}
          >
            <Play className="w-5 h-5 mr-2" />
            🎲 ランダム基音再生
          </Button>
        </CardContent>
      </Card>

      {/* ドレミファソラシドガイドセクション */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>🎵 ドレミファソラシド ガイド</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="grid grid-cols-8 gap-3 w-full max-w-full">
              {['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'].map((note, index) => (
                <div
                  key={note}
                  className="w-14 h-14 flex items-center justify-center text-lg font-bold rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-500 transform scale-100 transition-all duration-300 ease-in-out"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 相対音程表示セクション */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-base font-semibold text-center leading-6">
            🎵 音程を検出中...
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // === メインレンダリング: 状態別分岐 ===
  const renderContent = () => {
    switch (micState) {
      case 'granted':
        return renderTrainingInterface();
      case 'denied':
      case 'prompt':
        return renderMicrophonePermissionRequired();
      case 'error':
        return renderMicrophoneErrorRecovery();
      case 'checking':
        return renderLoadingState();
      default:
        return renderLoadingState();
    }
  };

  return (
    <div className="w-full m-0 p-0 min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6 justify-start">
            <Link href="/" className="flex items-center text-gray-600 no-underline transition-colors duration-300 font-medium hover:text-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              ホーム
            </Link>
            <h1 className="text-xl font-bold text-gray-900 m-0">
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-gray-600 text-center">
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
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