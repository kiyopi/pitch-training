'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CompatibilityResult {
  webAudio: boolean;
  mediaDevices: boolean;
  es6Modules: boolean;
  localStorage: boolean;
  touchSupport: boolean;
  mobileDevice: boolean;
}

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  isMobile: boolean;
}

interface BrowserCompatibilityCheckProps {
  children: React.ReactNode;
  minRequirements?: {
    webAudio?: boolean;
    mediaDevices?: boolean;
    localStorage?: boolean;
  };
  showDetails?: boolean;
}

/**
 * ブラウザ互換性チェック用フック
 */
const useBrowserCompatibility = () => {
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCompatibility = async (): Promise<void> => {
      try {
        // ブラウザ情報の取得
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        
        // 簡易ブラウザ判定
        let browserName = 'Unknown';
        let browserVersion = '';
        
        if (userAgent.indexOf('Chrome') > -1) {
          browserName = 'Chrome';
          browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || '';
        } else if (userAgent.indexOf('Safari') > -1) {
          browserName = 'Safari';
          browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || '';
        } else if (userAgent.indexOf('Firefox') > -1) {
          browserName = 'Firefox';
          browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || '';
        }

        // OS判定
        let os = 'Unknown';
        if (userAgent.indexOf('Windows') > -1) os = 'Windows';
        else if (userAgent.indexOf('Mac') > -1) os = 'macOS';
        else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
        else if (userAgent.indexOf('Android') > -1) os = 'Android';
        else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

        setBrowserInfo({
          name: browserName,
          version: browserVersion,
          os,
          isMobile
        });

        // 機能互換性チェック
        const webAudioSupport = !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
        const mediaDevicesSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const es6ModulesSupport = typeof Promise !== 'undefined' && typeof Symbol !== 'undefined';
        const localStorageSupport = (() => {
          try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
          } catch {
            return false;
          }
        })();
        const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        setCompatibility({
          webAudio: webAudioSupport,
          mediaDevices: mediaDevicesSupport,
          es6Modules: es6ModulesSupport,
          localStorage: localStorageSupport,
          touchSupport,
          mobileDevice: isMobile
        });

      } catch (error) {
        console.error('Browser compatibility check failed:', error);
        // エラー時はすべて false に設定
        setCompatibility({
          webAudio: false,
          mediaDevices: false,
          es6Modules: false,
          localStorage: false,
          touchSupport: false,
          mobileDevice: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkCompatibility();
  }, []);

  return { compatibility, browserInfo, isLoading };
};

/**
 * ブラウザ互換性チェックコンポーネント
 * 
 * 必要な機能がサポートされていない場合に
 * 適切なフォールバックUIを表示
 */
export function BrowserCompatibilityCheck({
  children,
  minRequirements = {
    webAudio: true,
    mediaDevices: true,
    localStorage: false
  },
  showDetails = false
}: BrowserCompatibilityCheckProps) {
  const { compatibility, browserInfo, isLoading } = useBrowserCompatibility();

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">ブラウザ互換性をチェック中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 互換性チェック失敗
  if (!compatibility) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-200">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-800">互換性チェックに失敗</CardTitle>
            <CardDescription>
              ブラウザの互換性を確認できませんでした。
              ブラウザを更新するか、別のブラウザでお試しください。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 必要な機能のチェック
  const missingFeatures: string[] = [];
  if (minRequirements.webAudio && !compatibility.webAudio) {
    missingFeatures.push('Web Audio API');
  }
  if (minRequirements.mediaDevices && !compatibility.mediaDevices) {
    missingFeatures.push('マイクアクセス (MediaDevices API)');
  }
  if (minRequirements.localStorage && !compatibility.localStorage) {
    missingFeatures.push('ローカルストレージ');
  }

  // 必要機能が不足している場合
  if (missingFeatures.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-yellow-300">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <CardTitle className="text-yellow-800">ブラウザサポートが不十分です</CardTitle>
            <CardDescription>
              このアプリケーションを使用するために必要な機能がサポートされていません。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 不足している機能 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 text-sm mb-2">不足している機能:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {missingFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {/* 推奨ブラウザ */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">推奨ブラウザ:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div>• Google Chrome (最新版)</div>
                <div>• Mozilla Firefox (最新版)</div>
                <div>• Safari (iOS 14+)</div>
                <div>• Microsoft Edge (最新版)</div>
              </div>
            </div>

            {/* ブラウザ情報（詳細表示時） */}
            {showDetails && browserInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">現在のブラウザ情報:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>ブラウザ: {browserInfo.name} {browserInfo.version}</div>
                  <div>OS: {browserInfo.os}</div>
                  <div>デバイス: {browserInfo.isMobile ? 'モバイル' : 'デスクトップ'}</div>
                </div>
              </div>
            )}

            {/* 制限機能での利用案内 */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                一部機能が制限されますが、利用可能な機能のみでアプリを使用することもできます。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
              >
                制限機能で続行
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 互換性に問題がない場合は子コンポーネントを表示
  return <>{children}</>;
}

/**
 * 互換性情報表示コンポーネント
 */
export function CompatibilityInfo() {
  const { compatibility, browserInfo } = useBrowserCompatibility();

  if (!compatibility || !browserInfo) return null;

  const features = [
    { name: 'Web Audio API', supported: compatibility.webAudio, required: true },
    { name: 'MediaDevices API', supported: compatibility.mediaDevices, required: true },
    { name: 'ES6 Modules', supported: compatibility.es6Modules, required: false },
    { name: 'Local Storage', supported: compatibility.localStorage, required: false },
    { name: 'Touch Support', supported: compatibility.touchSupport, required: false }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          ブラウザ互換性情報
        </CardTitle>
        <CardDescription>
          現在のブラウザのサポート状況
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ブラウザ情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">ブラウザ:</span>
            <br />
            {browserInfo.name} {browserInfo.version}
          </div>
          <div>
            <span className="font-semibold">OS:</span>
            <br />
            {browserInfo.os}
          </div>
          <div>
            <span className="font-semibold">デバイス:</span>
            <br />
            {browserInfo.isMobile ? 'モバイル' : 'デスクトップ'}
          </div>
          <div>
            <span className="font-semibold">タッチ:</span>
            <br />
            {compatibility.touchSupport ? '対応' : '非対応'}
          </div>
        </div>

        {/* 機能サポート状況 */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">機能サポート状況:</h4>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {feature.supported ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">{feature.name}</span>
                  {feature.required && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">必須</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  feature.supported ? 'text-green-700' : 'text-red-700'
                }`}>
                  {feature.supported ? '対応' : '非対応'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}