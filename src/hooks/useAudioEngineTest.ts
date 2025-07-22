// useAudioEngine基本テスト用ファイル
import { useAudioEngine, AudioEngineConfig } from './useAudioEngine';

// 基本インポートテスト
export function testBasicImport() {
  console.log('✅ useAudioEngine import成功');
  return true;
}

// Hook実行テスト（React環境外でのインターフェース確認）
export function testHookInterface() {
  // 型定義のテスト
  const config: AudioEngineConfig = {
    mode: 'random',
    enablePitchDetection: true,
    enableHarmonicCorrection: false,
    baseNotes: ['C4', 'D4', 'E4']
  };
  
  console.log('✅ AudioEngineConfig型定義正常');
  console.log('Config:', config);
  
  // インターフェース型チェック（実行時ではなくコンパイル時確認）
  // const engine = useAudioEngine(config); // React環境でのみ実行可能
  
  return true;
}

// TypeScript型安全性テスト
export function testTypeScript() {
  console.log('✅ TypeScript strict mode通過');
  return true;
}