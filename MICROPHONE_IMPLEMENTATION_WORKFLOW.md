# マイクロフォン実装作業フロー v1.0

## 📋 概要

### 目的
HYBRID許可システムの影響を完全に排除し、ベストプラクティスに基づいた安全で確実なマイクロフォン実装を段階的に構築する。

### 基本方針
- **完全新規作成**: 既存の問題のある実装を削除
- **段階的実装**: 最小限から始めて段階的に機能追加
- **徹底的検証**: 各段階でPC・iPhone Safari両環境テスト

---

## 🛠️ 5段階実装フロー

### Step 1: 基本マイクロフォン許可・音声取得 (1-2時間)

#### **1.1 セキュリティ・機能確認**
- [ ] セキュリティコンテキスト確認
- [ ] getUserMedia サポート確認
- [ ] 基本的な許可状態管理

#### **1.2 最小限のマイクロフォン制御**
```typescript
// 最小限の実装
interface BasicMicrophoneState {
  isRecording: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
}

const useMicrophoneManager = () => {
  // 基本的なON/OFF制御のみ
  const startRecording = async () => { /* 実装 */ };
  const stopRecording = () => { /* 実装 */ };
  
  return { microphoneState, startRecording, stopRecording };
};
```

#### **1.3 音程検出最適化制約**
```typescript
const constraints = {
  audio: {
    autoGainControl: false,      // 最重要
    echoCancellation: false,     // 最重要  
    noiseSuppression: false,     // 最重要
    sampleRate: 44100,
    channelCount: 1,
  }
};
```

#### **1.4 基本テスト**
- [ ] PC Chrome でのマイクロフォン許可
- [ ] iPhone Safari でのマイクロフォン許可
- [ ] 音声出力制御問題の確認

### Step 2: AudioContext・音声処理基盤 (1-2時間)

#### **2.1 AudioContext 安全初期化**
```typescript
const initializeAudioContext = async (): Promise<AudioContext> => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 44100,
    latencyHint: 'interactive'
  });
  
  // iPhone Safari のサスペンド状態対応
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  return audioContext;
};
```

#### **2.2 音声処理チェーン構築**
```typescript
// マイク → アナライザー (最小構成)
const setupAudioProcessing = (stream: MediaStream, audioContext: AudioContext) => {
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0.3;
  
  source.connect(analyser);
  
  return { source, analyser };
};
```

#### **2.3 音声データ取得**
```typescript
const getAudioData = (analyser: AnalyserNode): Float32Array => {
  const bufferLength = analyser.fftSize;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);
  return dataArray;
};
```

#### **2.4 基本テスト**
- [ ] AudioContext 初期化成功
- [ ] 音声データ取得成功
- [ ] iPhone Safari でのサスペンド状態対応

### Step 3: 1段階ノイズフィルタリング (1-2時間)

#### **3.1 ハイパスフィルター実装**
```typescript
const createHighPassFilter = (audioContext: AudioContext): BiquadFilterNode => {
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(80, audioContext.currentTime);  // 80Hz
  filter.Q.setValueAtTime(0.7, audioContext.currentTime);
  return filter;
};
```

#### **3.2 音声処理チェーン拡張**
```typescript
// マイク → ハイパスフィルター → アナライザー
const setupFilteredAudioProcessing = (stream: MediaStream, audioContext: AudioContext) => {
  const source = audioContext.createMediaStreamSource(stream);
  const highPassFilter = createHighPassFilter(audioContext);
  const analyser = audioContext.createAnalyser();
  
  source.connect(highPassFilter);
  highPassFilter.connect(analyser);
  
  return { source, highPassFilter, analyser };
};
```

#### **3.3 フィルタリング効果テスト**
- [ ] 低周波ノイズ除去効果確認
- [ ] 音声品質の改善確認
- [ ] パフォーマンス影響測定

### Step 4: Pitchy音程検出統合 (2-3時間)

#### **4.1 Pitchy ライブラリ統合**
```typescript
import { PitchDetector } from 'pitchy';

const usePitchDetection = (audioData: Float32Array) => {
  const detector = PitchDetector.forFloat32Array(audioData.length);
  const [pitch, clarity] = detector.findPitch(audioData, 44100);
  
  return {
    frequency: pitch,
    clarity: clarity,
    note: frequencyToNote(pitch),
    cents: frequencyToCents(pitch)
  };
};
```

#### **4.2 リアルタイム音程検出**
```typescript
const startPitchDetection = (analyser: AnalyserNode) => {
  const detectPitch = () => {
    const audioData = getAudioData(analyser);
    const pitchData = usePitchDetection(audioData);
    
    if (pitchData.clarity > 0.9) {
      // 高信頼度の音程データのみ使用
      onPitchDetected(pitchData);
    }
    
    requestAnimationFrame(detectPitch);
  };
  
  detectPitch();
};
```

#### **4.3 音程検出テスト**
- [ ] ピアノ音程検出精度テスト
- [ ] 人声音程検出精度テスト
- [ ] リアルタイム性能測定

### Step 5: 完全統合・テスト (1-2時間)

#### **5.1 統合テストページ作成**
```typescript
// /src/app/test/microphone/page.tsx
export default function MicrophoneTestPage() {
  const { microphoneState, startRecording, stopRecording } = useMicrophoneManager();
  
  return (
    <div>
      <h1>マイクロフォン・音程検出テスト</h1>
      <button onClick={startRecording}>開始</button>
      <button onClick={stopRecording}>停止</button>
      <div>検出音程: {pitchData.note}</div>
      <div>周波数: {pitchData.frequency}Hz</div>
      <div>信頼度: {pitchData.clarity}</div>
    </div>
  );
}
```

#### **5.2 包括的テスト**
- [ ] **基本機能**: マイクロフォンON/OFF
- [ ] **音程検出**: 精度・リアルタイム性
- [ ] **iPhone Safari**: 全機能動作確認
- [ ] **パフォーマンス**: CPU・メモリ使用量
- [ ] **長時間動作**: 30分間の安定性

#### **5.3 エラーハンドリング完成**
```typescript
const handleMicrophoneError = (error: Error): string => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'マイクロフォンへのアクセスが拒否されました。';
    case 'NotFoundError':
      return 'マイクロフォンが見つかりません。';
    case 'NotReadableError':
      return 'マイクロフォンが他のアプリで使用中です。';
    default:
      return `マイクロフォンエラー: ${error.message}`;
  }
};
```

---

## 🧪 各段階での検証項目

### Step 1 検証
- [ ] セキュリティコンテキスト確認
- [ ] 基本的な許可取得
- [ ] iPhone Safari での許可動作

### Step 2 検証  
- [ ] AudioContext 初期化成功
- [ ] 音声データ取得成功
- [ ] iPhone Safari サスペンド対応

### Step 3 検証
- [ ] ノイズフィルタリング効果
- [ ] 音声品質改善
- [ ] パフォーマンス影響

### Step 4 検証
- [ ] 音程検出精度 (±1セント)
- [ ] リアルタイム性能 (< 50ms)
- [ ] 信頼度閾値調整

### Step 5 検証
- [ ] 全機能統合動作
- [ ] iPhone Safari 完全対応
- [ ] 長時間安定性

---

## 🚨 失敗回避のための注意点

### 実装時の厳守事項
1. **段階的実装**: 一度に複数機能を追加しない
2. **即座テスト**: 各段階で必ずテスト実行
3. **iPhone Safari確認**: 毎回iPhone実機で確認
4. **リソース管理**: 適切なクリーンアップ実装
5. **エラーハンドリング**: 全エラーケースに対応

### 危険な実装パターン
- ❌ autoGainControl: true (デフォルト)
- ❌ 複数MediaStream同時取得
- ❌ AudioContext の不適切な管理
- ❌ iPhone Safari制約の無視
- ❌ 段階的テストの省略

---

## 📚 参考資料

### 技術仕様
- `MICROPHONE_IMPLEMENTATION_BEST_PRACTICES.md`
- `MICROPHONE_CONTROL_SPECIFICATION.md`
- `PITCH_DETECTION_PHASE1_SPECIFICATION.md`

### 外部リソース
- [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Pitchy Documentation](https://github.com/ianprime0509/pitchy)
- [getUserMedia Best Practices](https://blog.addpipe.com/common-getusermedia-errors/)

---

## 🎯 作業開始前チェックリスト

### 環境準備
- [ ] HTTPS環境での動作確認
- [ ] iPhone Safari テスト環境準備
- [ ] 既存のHYBRID許可システム完全除去確認
- [ ] 必要なライブラリ(pitchy)の確認

### 実装準備
- [ ] ベストプラクティス文書の理解
- [ ] 段階的実装計画の確認
- [ ] テスト項目の準備
- [ ] エラーハンドリング戦略の理解

**準備完了後、Step 1から慎重に実装開始**

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: 安全なマイクロフォン実装  
**予想総作業時間**: 6-11時間