# マイクロフォン実装ベストプラクティス v1.0

## 📋 概要

### 目的
相対音感トレーニングアプリにおけるマイクロフォン実装の失敗を防ぐため、業界のベストプラクティスと注意点を整理し、慎重な実装指針を提供する。

### 調査結果サマリー
- **iPhone Safari の特殊な制約**: 音声出力が強制的にスピーカーに切り替わる問題
- **autoGainControl の罠**: デフォルトで有効化され、音程検出精度を大幅に低下させる
- **React Hooks での状態管理**: 適切なクリーンアップが必要
- **セキュリティコンテキスト**: HTTPS必須、localhost例外

---

## 🚨 主要な失敗パターンと対策

### 1. iPhone Safari の音声出力制御問題

#### **問題**
```
iOS Safari forces audio output to speakers when using getUserMedia()
```
- マイクロフォン許可と同時に音声出力がスピーカーに強制切り替え
- ユーザーの意図に関係なく、イヤホン・ヘッドホンが無効化される

#### **対策**
```typescript
// Web Audio API による手動音声ルーティング
const audioContext = new AudioContext();
const gainNode = audioContext.createGain();

// 音声出力先を手動制御
stream.connect(gainNode);
gainNode.connect(audioContext.destination);

// setSinkId() は WebKit 未サポートのため代替手段必要
if ('setSinkId' in audioElement) {
  await audioElement.setSinkId(preferredOutputDevice);
} else {
  // WebKit での代替処理
  console.warn('setSinkId not supported on this platform');
}
```

### 2. autoGainControl による音程検出精度低下

#### **問題**
```
autoGainControl: true (デフォルト) により音程検出が不正確になる
```
- 自動音量調整が音程検出アルゴリズムに悪影響
- 小さな音程変化が自動補正により消失

#### **対策**
```typescript
// 音程検出に最適化された制約設定
const constraints = {
  audio: {
    autoGainControl: false,      // 自動音量調整無効
    echoCancellation: false,     // エコーキャンセル無効
    noiseSuppression: false,     // ノイズ抑制無効
    sampleRate: 44100,           // 高品質サンプリング
    channelCount: 1,             // モノラル入力
    latency: 0.01,               // 低遅延設定
  }
};
```

### 3. デバイス列挙とランダムデバイスID問題

#### **問題**
```
Safari generates random deviceId's on each page load
```
- 毎回異なるデバイスIDが生成される
- デバイス選択の永続化が不可能

#### **対策**
```typescript
// デバイス列挙前にgetUserMedia()を呼び出す必要あり
const enumerateDevicesSafely = async () => {
  try {
    // 先にマイクロフォン許可を取得
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 許可取得後にデバイス列挙
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    // テスト用ストリームを即座停止
    stream.getTracks().forEach(track => track.stop());
    
    return audioInputs;
  } catch (error) {
    console.error('Device enumeration failed:', error);
    return [];
  }
};
```

### 4. 複数ストリーム取得による競合問題

#### **問題**
```
Multiple getUserMedia() requests cause previous streams to be muted
```
- 複数回getUserMedia()呼び出しで前のストリームがミュート状態になる
- プログラムによるミュート解除が不可能

#### **対策**
```typescript
// シングルストリーム管理パターン
class MicrophoneManager {
  private currentStream: MediaStream | null = null;
  
  async getStream(): Promise<MediaStream> {
    // 既存ストリームがある場合は再利用
    if (this.currentStream && this.currentStream.active) {
      return this.currentStream;
    }
    
    // 新規ストリーム取得
    this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.currentStream;
  }
  
  cleanup() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }
}
```

### 5. React Hooks での状態管理エラー

#### **問題**
```
Incorrect handling of React Hooks for microphone audio
```
- useEffect のクリーンアップが不適切
- 音声リソースのリークが発生

#### **対策**
```typescript
const useMicrophone = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        }
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);
  
  // 重要: コンポーネント アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return { stream, error, startRecording, stopRecording };
};
```

### 6. セキュリティコンテキストと許可管理

#### **問題**
```
getUserMedia() requires secure context (HTTPS)
```
- HTTP環境でnavigator.mediaDevicesがundefined
- 許可状態の適切な管理が困難

#### **対策**
```typescript
// セキュリティコンテキストの確認
const isSecureContext = () => {
  return window.isSecureContext || 
         location.protocol === 'https:' || 
         location.hostname === 'localhost' ||
         location.hostname === '127.0.0.1';
};

// 許可状態の確認
const checkMicrophonePermission = async (): Promise<PermissionState> => {
  try {
    // Modern browsers
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ 
        name: 'microphone' as PermissionName 
      });
      return permission.state;
    }
    
    // Safari fallback
    return 'prompt';
  } catch (error) {
    return 'prompt';
  }
};
```

### 7. AudioContext の適切な管理

#### **問題**
```
AudioContext suspended due to autoplay policy
```
- ユーザー操作なしでAudioContextが作成されサスペンド状態
- 音声処理が開始されない

#### **対策**
```typescript
// AudioContext の適切な初期化
const initializeAudioContext = async (): Promise<AudioContext> => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 44100,
    latencyHint: 'interactive'
  });
  
  // サスペンド状態の場合は再開
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  return audioContext;
};

// ユーザー操作からの初期化
const handleUserInteraction = async () => {
  const audioContext = await initializeAudioContext();
  // 音声処理開始...
};
```

---

## 🛠️ 推奨実装パターン

### 1. 段階的初期化パターン

```typescript
class SafeMicrophoneManager {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  
  async initialize() {
    // Step 1: セキュリティコンテキスト確認
    if (!this.isSecureContext()) {
      throw new Error('Secure context required');
    }
    
    // Step 2: 機能サポート確認
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }
    
    // Step 3: 許可状態確認
    const permission = await this.checkPermission();
    if (permission === 'denied') {
      throw new Error('Microphone permission denied');
    }
    
    // Step 4: AudioContext初期化
    this.audioContext = await this.initializeAudioContext();
    
    // Step 5: ストリーム取得
    this.stream = await this.getAudioStream();
    
    // Step 6: 音声処理チェーン構築
    this.setupAudioProcessing();
  }
  
  private async getAudioStream(): Promise<MediaStream> {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 44100,
        channelCount: 1,
        latency: 0.01,
      }
    });
  }
  
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
```

### 2. エラーハンドリングパターン

```typescript
const handleMicrophoneError = (error: Error): string => {
  // 具体的なエラーメッセージの提供
  switch (error.name) {
    case 'NotAllowedError':
      return 'マイクロフォンへのアクセスが拒否されました。ブラウザの設定を確認してください。';
    case 'NotFoundError':
      return 'マイクロフォンが見つかりません。デバイスを確認してください。';
    case 'NotReadableError':
      return 'マイクロフォンが他のアプリケーションで使用中です。';
    case 'OverconstrainedError':
      return 'マイクロフォンの設定要求を満たせません。';
    case 'SecurityError':
      return 'セキュリティエラーが発生しました。HTTPSでアクセスしてください。';
    default:
      return `マイクロフォンエラー: ${error.message}`;
  }
};
```

---

## 🧪 テスト・検証項目

### 必須テスト項目
- [ ] **セキュリティコンテキスト**: HTTPS環境でのテスト
- [ ] **iPhone Safari**: 音声出力制御の確認
- [ ] **許可状態管理**: 拒否・許可・再許可の動作
- [ ] **リソース管理**: メモリリーク・CPU使用率
- [ ] **エラーハンドリング**: 全エラーケースの処理

### 音程検出特有のテスト
- [ ] **autoGainControl無効**: 音程検出精度の確認
- [ ] **サンプリングレート**: 44100Hzでの動作確認
- [ ] **レイテンシー**: 50ms以下の遅延確認
- [ ] **長時間動作**: 30分以上の安定動作

---

## 📚 参考資料

### 技術仕様
- [MediaDevices.getUserMedia() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Web Audio API Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Common getUserMedia() Errors](https://blog.addpipe.com/common-getusermedia-errors/)

### iPhone Safari 固有の問題
- [iOS Safari Forces Audio Output to Speakers](https://medium.com/@python-javascript-php-html-css/ios-safari-forces-audio-output-to-speakers-when-using-getusermedia-2615196be6fe)
- [Guide to WebRTC with Safari](https://webrtchacks.com/guide-to-safari-webrtc/)

### React実装パターン
- [React Hooks for Microphone Audio](https://stackoverflow.com/questions/57298567/correct-handling-of-react-hooks-for-microphone-audio)
- [Audio Visualisation with Web Audio API and React](https://www.twilio.com/en-us/blog/audio-visualisation-web-audio-api--react)

---

## 🎯 実装開始前チェックリスト

### 準備段階
- [ ] セキュリティコンテキスト（HTTPS）の確認
- [ ] ターゲットブラウザの制約事項理解
- [ ] 既存実装の失敗原因分析
- [ ] テスト環境の構築

### 実装段階
- [ ] 段階的初期化パターンの採用
- [ ] 適切なaudio constraintsの設定
- [ ] iPhone Safari対応の実装
- [ ] 包括的なエラーハンドリング

### 検証段階
- [ ] 全ターゲット環境でのテスト
- [ ] 音程検出精度の確認
- [ ] 長時間動作の安定性確認
- [ ] リソース使用量の監視

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: マイクロフォン実装失敗防止  
**重要度**: 最高レベル