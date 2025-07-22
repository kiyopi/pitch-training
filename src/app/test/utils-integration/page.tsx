'use client';

import React, { useState, useCallback } from 'react';
import { Play, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// 統合ユーティリティのテストインポート
import {
  // 定数
  NOTE_NAMES,
  A4_FREQUENCY,
  DIATONIC_SCALE_NAMES,
  
  // 音名・音程変換
  frequencyToNote,
  evaluateRelativePitchAccuracy,
  calculateRelativeInterval,
  getDiatonicNoteIndex,
  
  // 音声処理
  analyzeVolume,
  
  // 倍音補正
  correctHarmonicMisdetection,
  
  // バリデーション
  validateFrequency,
  validateBrowserSupport,
  
  // フォーマット
  formatFrequencyWithNote,
  formatAccuracy,
  formatInterval,
  formatScaleName,
  
  // 設定
  createDefaultAppConfig,
  detectDeviceCapabilities
} from '../../../utils';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: unknown;
}

export default function UtilsIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // テスト実行
  const runTests = useCallback(async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // 1. 基本定数テスト
    try {
      results.push({
        name: '基本定数読み込み',
        status: 'success',
        message: `音名配列: ${NOTE_NAMES.length}音, A4周波数: ${A4_FREQUENCY}Hz`,
        details: { noteNames: NOTE_NAMES, a4Freq: A4_FREQUENCY }
      });
    } catch (error) {
      results.push({
        name: '基本定数読み込み',
        status: 'error',
        message: `定数読み込みエラー: ${error}`,
      });
    }

    // 2. 音名変換テスト
    try {
      const testFreq = 440; // A4
      const noteInfo = frequencyToNote(testFreq);
      const isCorrect = noteInfo.note === 'A' && noteInfo.octave === 4;
      
      results.push({
        name: '音名変換 (440Hz → A4)',
        status: isCorrect ? 'success' : 'error',
        message: `${testFreq}Hz → ${noteInfo.fullNote} (${noteInfo.cents}¢)`,
        details: noteInfo
      });
    } catch (error) {
      results.push({
        name: '音名変換テスト',
        status: 'error',
        message: `音名変換エラー: ${error}`,
      });
    }

    // 3. 相対音程評価テスト
    try {
      const baseFreq = 261.63; // C4
      const userFreq = 293.66; // D4
      const targetFreq = 293.66; // D4 (完璧な一致)
      
      const evaluation = evaluateRelativePitchAccuracy(userFreq, targetFreq, baseFreq);
      
      results.push({
        name: '相対音程評価 (C4→D4)',
        status: evaluation.accuracy === 'perfect' ? 'success' : 'warning',
        message: `${evaluation.message} (${evaluation.score}点)`,
        details: evaluation
      });
    } catch (error) {
      results.push({
        name: '相対音程評価テスト',
        status: 'error',
        message: `相対音程評価エラー: ${error}`,
      });
    }

    // 4. 音程間隔計算テスト
    try {
      const baseFreq = 261.63; // C4
      const targetFreq = 329.63; // E4 (長3度)
      
      const interval = calculateRelativeInterval(baseFreq, targetFreq);
      const isCorrectInterval = Math.abs(interval.semitones - 4) <= 1; // 長3度は4半音
      
      results.push({
        name: '音程間隔計算 (C4→E4)',
        status: isCorrectInterval ? 'success' : 'warning',
        message: `${interval.semitones}半音 (${interval.intervalName})`,
        details: interval
      });
    } catch (error) {
      results.push({
        name: '音程間隔計算テスト',
        status: 'error',
        message: `音程間隔計算エラー: ${error}`,
      });
    }

    // 5. 音声データ解析テスト（モックデータ）
    try {
      const mockAudioData = new Float32Array(1024);
      // サイン波を生成（440Hz相当）
      for (let i = 0; i < mockAudioData.length; i++) {
        mockAudioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5;
      }
      
      const volumeAnalysis = analyzeVolume(mockAudioData);
      const hasValidRMS = volumeAnalysis.rms > 0;
      
      results.push({
        name: '音声データ解析 (モックデータ)',
        status: hasValidRMS ? 'success' : 'warning',
        message: `RMS: ${volumeAnalysis.rms.toFixed(4)}, Peak: ${volumeAnalysis.peak.toFixed(4)}`,
        details: volumeAnalysis
      });
    } catch (error) {
      results.push({
        name: '音声データ解析テスト',
        status: 'error',
        message: `音声データ解析エラー: ${error}`,
      });
    }

    // 6. 倍音補正テスト
    try {
      const detectedFreq = 880; // A5 (A4の2倍音)
      const targetFreq = 440;   // A4
      const confidence = 0.9;
      
      const correction = correctHarmonicMisdetection(detectedFreq, targetFreq, confidence);
      const wasCorrected = correction.correctionApplied && Math.abs(correction.correctedFrequency - targetFreq) < 10;
      
      results.push({
        name: '倍音補正 (880Hz→440Hz)',
        status: wasCorrected ? 'success' : 'warning',
        message: `${detectedFreq}Hz → ${correction.correctedFrequency.toFixed(2)}Hz (${correction.correctionType})`,
        details: correction
      });
    } catch (error) {
      results.push({
        name: '倍音補正テスト',
        status: 'error',
        message: `倍音補正エラー: ${error}`,
      });
    }

    // 7. バリデーションテスト
    try {
      const validationTests = [
        { freq: 440, expected: true, name: 'A4 (有効)' },
        { freq: 50, expected: false, name: '50Hz (範囲外)' },
        { freq: 2000, expected: false, name: '2kHz (範囲外)' }
      ];
      
      let passCount = 0;
      const validationDetails = validationTests.map(test => {
        const validation = validateFrequency(test.freq);
        const passed = validation.isMusicalRange === test.expected;
        if (passed) passCount++;
        
        return {
          ...test,
          result: validation.isMusicalRange,
          passed
        };
      });
      
      results.push({
        name: 'バリデーションテスト',
        status: passCount === validationTests.length ? 'success' : 'warning',
        message: `${passCount}/${validationTests.length} テストが成功`,
        details: validationDetails
      });
    } catch (error) {
      results.push({
        name: 'バリデーションテスト',
        status: 'error',
        message: `バリデーションエラー: ${error}`,
      });
    }

    // 8. フォーマット機能テスト
    try {
      const formatTests = [
        formatFrequencyWithNote(440, 'A4', true, 0),
        formatAccuracy('excellent', 90),
        formatInterval(4), // 長3度
        formatScaleName(2) // ミ
      ];
      
      const allFormatsValid = formatTests.every(result => typeof result === 'string' && result.length > 0);
      
      results.push({
        name: 'フォーマット機能テスト',
        status: allFormatsValid ? 'success' : 'error',
        message: 'フォーマット関数が正常動作',
        details: formatTests
      });
    } catch (error) {
      results.push({
        name: 'フォーマット機能テスト',
        status: 'error',
        message: `フォーマット機能エラー: ${error}`,
      });
    }

    // 9. 設定・環境テスト
    try {
      const config = createDefaultAppConfig();
      const capabilities = detectDeviceCapabilities();
      const browserSupport = validateBrowserSupport();
      
      const configValid = config && config.audio && config.ui;
      
      results.push({
        name: '設定・環境テスト',
        status: configValid && browserSupport.isValid ? 'success' : 'warning',
        message: `設定作成: ${configValid ? '成功' : '失敗'}, ブラウザサポート: ${browserSupport.isValid ? '対応' : '一部非対応'}`,
        details: { config: !!config, capabilities, browserSupport }
      });
    } catch (error) {
      results.push({
        name: '設定・環境テスト',
        status: 'error',
        message: `設定・環境テストエラー: ${error}`,
      });
    }

    // 10. ドレミ音階テスト
    try {
      const scaleTests = DIATONIC_SCALE_NAMES.map((name, index) => {
        const retrievedIndex = getDiatonicNoteIndex(name);
        return {
          name,
          expectedIndex: index,
          actualIndex: retrievedIndex,
          correct: retrievedIndex === index
        };
      });
      
      const correctCount = scaleTests.filter(t => t.correct).length;
      
      results.push({
        name: 'ドレミ音階インデックステスト',
        status: correctCount === DIATONIC_SCALE_NAMES.length ? 'success' : 'warning',
        message: `${correctCount}/${DIATONIC_SCALE_NAMES.length} 音階が正確`,
        details: scaleTests
      });
    } catch (error) {
      results.push({
        name: 'ドレミ音階テスト',
        status: 'error',
        message: `ドレミ音階テストエラー: ${error}`,
      });
    }

    setTestResults(results);
    setIsRunning(false);
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">
                ユーティリティ統合テスト
              </h1>
            </div>
            <p className="text-gray-600">
              Step 1-3B で作成した統合ユーティリティの動作確認
            </p>
          </div>

          {/* テスト実行ボタン */}
          <div className="text-center mb-8">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`inline-flex items-center px-6 py-3 rounded-xl text-white font-medium transition-colors ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Play className="h-5 w-5 mr-2" />
              {isRunning ? 'テスト実行中...' : 'テスト開始'}
            </button>
          </div>

          {/* テスト結果サマリー */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-green-700">成功</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-yellow-700">警告</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-red-700">エラー</div>
              </div>
            </div>
          )}

          {/* テスト結果一覧 */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                テスト結果詳細
              </h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">
                        {result.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="text-xs text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-700">
                            詳細データを表示
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* テスト対象機能一覧 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">テスト対象機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• 基本定数読み込み</div>
              <div>• 音名変換 (frequencyToNote)</div>
              <div>• 相対音程評価</div>
              <div>• 音程間隔計算</div>
              <div>• 音声データ解析</div>
              <div>• 倍音補正システム</div>
              <div>• バリデーション機能</div>
              <div>• フォーマット機能</div>
              <div>• 設定・環境検出</div>
              <div>• ドレミ音階インデックス</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}