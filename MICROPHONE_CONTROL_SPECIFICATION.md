# マイクロフォン制御仕様書 v1.0

## 📋 概要

### 目的
相対音感トレーニングアプリにおけるマイクロフォンのON/OFF制御システムを定義し、ユーザーの歌唱入力を高精度でリアルタイム処理する。

### 基本原則
- **ユーザー主導**: 明示的な許可・制御
- **状態管理**: 確実な状態追跡
- **エラーハンドリング**: 安全な異常処理
- **iPhone Safari対応**: 制限事項への対応

---

## 🎯 マイクロフォン制御仕様

### 1. 制御状態定義

#### **基本状態**
```typescript
interface MicrophoneState {
  isRecording: boolean;      // 録音中フラグ
  isInitialized: boolean;    // 初期化完了フラグ
  error: string | null;      // エラーメッセージ
  audioLevel: number;        // 音量レベル (0-100)
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}
```

#### **状態遷移**
```
未初期化 → 許可要求 → 初期化完了 → 録音中 → 停止 → 初期化完了
   ↓           ↓           ↓
 エラー    拒否        エラー
```

### 2. 制御フロー

#### **2.1 マイクロフォンON (startRecording)**

**フロー**:
1. **許可状態確認**
   - 既存許可の確認
   - 必要に応じて再許可要求
   
2. **MediaStream取得**
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     audio: {
       echoCancellation: false,    // エコーキャンセル無効
       noiseSuppression: false,    // ノイズ抑制無効  
       autoGainControl: false,     // 自動ゲイン調整無効
       sampleRate: 44100,          // 高品質サンプリング
       channelCount: 1,            // モノラル入力
       latency: 0.01,              // 低遅延設定
     }
   });
   ```

3. **AudioContext初期化**
   ```typescript
   const audioContext = new AudioContext({
     sampleRate: 44100,
     latencyHint: 'interactive'    // 低遅延優先
   });
   ```

4. **音声処理チェーン構築**
   ```typescript
   // マイク → ノイズフィルター → アナライザー → 音程検出
   microphone.connect(noiseFilter);
   noiseFilter.connect(analyser);
   ```

5. **状態更新**
   ```typescript
   setMicrophoneState({
     isRecording: true,
     isInitialized: true,
     error: null,
     audioLevel: 0,
     permission: 'granted'
   });
   ```

#### **2.2 マイクロフォンOFF (stopRecording)**

**フロー**:
1. **音声処理停止**
   - AnimationFrame停止
   - リアルタイム処理停止

2. **MediaStream終了**
   ```typescript
   if (streamRef.current) {
     streamRef.current.getTracks().forEach(track => {
       track.stop();           // トラック停止
       track.enabled = false;  // トラック無効化
     });
     streamRef.current = null;
   }
   ```

3. **AudioContext終了**
   ```typescript
   if (audioContextRef.current) {
     await audioContextRef.current.close();
     audioContextRef.current = null;
   }
   ```

4. **リソース解放**
   ```typescript
   // 全参照をクリア
   analyserRef.current = null;
   microphoneRef.current = null;
   filterRef.current = null;
   dataArrayRef.current = null;
   ```

5. **状態リセット**
   ```typescript
   setMicrophoneState({
     isRecording: false,
     isInitialized: false,
     error: null,
     audioLevel: 0,
     permission: 'granted'  // 許可状態は保持
   });
   ```

### 3. 許可管理システム

#### **3.1 許可状態確認**
```typescript
const checkPermission = async (): Promise<PermissionState> => {
  try {
    const permission = await navigator.permissions.query({
      name: 'microphone' as PermissionName
    });
    return permission.state;
  } catch (error) {
    // iPhone Safari等での非対応時
    return 'unknown';
  }
};
```

#### **3.2 許可要求**
```typescript
const requestPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    
    // テスト用ストリーム即座停止
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      setMicrophoneState(prev => ({
        ...prev,
        permission: 'denied',
        error: 'マイクロフォンへのアクセスが拒否されました'
      }));
    }
    return false;
  }
};
```

### 4. iPhone Safari対応

#### **4.1 制限事項**
- **AudioContext起動**: ユーザー操作後のみ可能
- **許可API**: navigator.permissions未対応
- **自動再生**: 制限あり

#### **4.2 対応策**
```typescript
// AudioContext起動確認
const ensureAudioContext = async (audioContext: AudioContext) => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

// ユーザー操作検証
const isUserGestureRequired = () => {
  return /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent);
};
```

### 5. エラーハンドリング

#### **5.1 エラー分類**
```typescript
enum MicrophoneError {
  PERMISSION_DENIED = 'NotAllowedError',
  DEVICE_NOT_FOUND = 'NotFoundError', 
  CONSTRAINT_ERROR = 'ConstraintNotSatisfiedError',
  ABORT_ERROR = 'AbortError',
  UNKNOWN_ERROR = 'UnknownError'
}
```

#### **5.2 エラー処理**
```typescript
const handleMicrophoneError = (error: Error): string => {
  switch (error.name) {
    case MicrophoneError.PERMISSION_DENIED:
      return 'マイクロフォンへのアクセスが拒否されました。ブラウザの設定を確認してください。';
    case MicrophoneError.DEVICE_NOT_FOUND:
      return 'マイクロフォンが見つかりません。デバイスを確認してください。';
    case MicrophoneError.CONSTRAINT_ERROR:
      return 'マイクロフォンの設定に問題があります。';
    case MicrophoneError.ABORT_ERROR:
      return 'マイクロフォンの取得が中断されました。';
    default:
      return `マイクロフォンエラー: ${error.message}`;
  }
};
```

### 6. 音量レベル監視

#### **6.1 リアルタイム音量計算**
```typescript
const updateAudioLevel = useCallback(() => {
  if (!analyserRef.current || !dataArrayRef.current) return;
  
  analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
  
  // RMS (Root Mean Square) 計算
  let sum = 0;
  for (let i = 0; i < dataArrayRef.current.length; i++) {
    sum += dataArrayRef.current[i] * dataArrayRef.current[i];
  }
  const rms = Math.sqrt(sum / dataArrayRef.current.length);
  const audioLevel = Math.min(Math.max(rms * 100, 0), 100);
  
  setMicrophoneState(prev => ({
    ...prev,
    audioLevel
  }));
}, []);
```

#### **6.2 音量閾値制御**
```typescript
interface AudioLevelConfig {
  silenceThreshold: 5;      // 無音判定閾値
  normalThreshold: 30;      // 通常音量閾値
  loudThreshold: 80;        // 大音量閾値
  clipThreshold: 95;        // クリッピング閾値
}
```

### 7. UI制御仕様

#### **7.1 制御ボタン**
```typescript
interface MicrophoneControlProps {
  onMicrophoneOn: () => Promise<void>;
  onMicrophoneOff: () => void;
  isRecording: boolean;
  isInitialized: boolean;
  error: string | null;
  audioLevel: number;
}
```

#### **7.2 視覚的フィードバック**
- **録音中**: 赤色インジケーター + 音量バー
- **待機中**: グレーインジケーター
- **エラー**: 警告色 + エラーメッセージ
- **音量レベル**: リアルタイム音量バー

### 8. パフォーマンス最適化

#### **8.1 メモリ管理**
```typescript
const optimizeMemory = useCallback(() => {
  // 不要なバッファクリア
  if (dataArrayRef.current) {
    dataArrayRef.current.fill(0);
  }
  
  // ガベージコレクション促進
  if (window.gc) {
    window.gc();
  }
}, []);
```

#### **8.2 CPU最適化**
```typescript
const optimizeCPU = useCallback(() => {
  // 処理間隔調整
  const targetFPS = 60;
  const processingInterval = 1000 / targetFPS;
  
  // 適応的処理負荷調整
  if (performance.now() - lastProcessTime > processingInterval * 2) {
    // 処理負荷軽減
    analyser.smoothingTimeConstant = 0.8;
  }
}, []);
```

---

## 🧪 テスト仕様

### 機能テスト
- [ ] マイクロフォンON/OFF制御
- [ ] 許可状態管理
- [ ] エラーハンドリング
- [ ] 音量レベル監視
- [ ] リソース管理

### 互換性テスト
- [ ] iPhone Safari対応
- [ ] Chrome デスクトップ
- [ ] Firefox デスクトップ
- [ ] Android Chrome

### パフォーマンステスト
- [ ] メモリ使用量
- [ ] CPU使用率
- [ ] 音声遅延測定
- [ ] 長時間動作安定性

---

## 📚 参考資料

### Web Audio API
- [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)

### iPhone Safari制限
- [Safari Web Audio API Limitations](https://developer.apple.com/documentation/webkit/safari_web_extensions)
- [iOS Safari Audio Restrictions](https://webkit.org/blog/6784/new-video-policies-for-ios/)

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: 音程検出システム Phase 1 - マイクロフォン制御  
**バージョン**: 1.0