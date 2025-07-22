# マイクテストページ実装仕様書

**作成日**: 2025-07-22  
**バージョン**: v3.0.0-microphone-test-flow  
**対象**: `/src/app/microphone-test/page.tsx`  
**ステータス**: 新規実装仕様

## 🎯 設置目的

### **主目的: マイクロフォンの信頼性確保**
相対音感トレーニングアプリにおいて、マイクロフォンの動作は成功の鍵となる。ユーザーがトレーニング中に「マイクが反応しない」「音程が正しく検出されない」といった技術的問題に直面すると、音感練習への集中が阻害される。

### **解決すべき課題**
1. **技術的不安の解消**: マイク許可・動作確認を事前完了
2. **パフォーマンス最適化**: マイク初期化とトレーニングロジックの分離
3. **ユーザー体験向上**: 自分の発声特性を事前把握
4. **実装の単純化**: 各ページの責任明確化

## 🏗️ アーキテクチャ設計

### **フロー構成**
```
📱 ホームページ (/src/app/page.tsx)
    ↓ [URLパラメータ付きリンク]
    
🎤 マイクテストページ (/src/app/microphone-test/page.tsx)
    ↓ [ユーザー手動操作]
    
🎵 各トレーニングページ
    ├─ ランダム基音モード (/src/app/training/random/page.tsx)
    ├─ 連続チャレンジモード (/src/app/training/continuous/page.tsx)  
    └─ 12音階モード (/src/app/training/chromatic/page.tsx)
```

### **URLパラメータ仕様**
```typescript
// ホームページからの遷移URL
/microphone-test?mode=random      // ランダム基音モード
/microphone-test?mode=continuous  // 連続チャレンジモード  
/microphone-test?mode=chromatic   // 12音階モード

// 遷移先決定ロジック
const modeMapping = {
  'random': '/training/random',
  'continuous': '/training/continuous', 
  'chromatic': '/training/chromatic'
};
```

## 🔧 技術実装仕様

### **型定義**
```typescript
interface MicTestState {
  micPermission: 'pending' | 'granted' | 'denied';
  volumeDetected: boolean;
  frequencyDetected: boolean;
  startButtonEnabled: boolean;
}

interface FrequencyInfo {
  hz: number;           // 261.6
  note: string;         // "C4"
  noteName: string;     // "ド"
  octave: string;       // "低" | "中" | "高"
  displayName: string;  // "ド（低）"
  volume: number;       // 0-100%
}
```

### **コンポーネント構成**
```
📁 /src/app/microphone-test/
├── page.tsx                     (メインコンポーネント)
├── components/
│   ├── MicrophonePermission.tsx (マイク許可処理UI)
│   ├── FrequencyDisplay.tsx     (周波数・音名表示)
│   ├── VolumeLevel.tsx          (音量レベルバー)
│   ├── VoiceInstructions.tsx    (ド発声指示UI)
│   └── TrainingModeCard.tsx     (選択モード確認カード)
└── hooks/
    ├── useMicrophoneSetup.ts    (マイク初期化)
    └── useFrequencyDetection.ts (リアルタイム音程検出)
```

## 📋 UI/UX実装仕様

### **段階的UI制御**
1. **初期状態**: 
   - レッスンスタートボタン非アクティブ（グレーアウト）
   - 「マイクロフォンの許可が必要です」表示

2. **マイク許可後**:
   - リアルタイム表示開始（周波数・音量）
   - 「ドを発声してください」ガイダンス表示

3. **音量反応検出**:
   - 音量バーが反応開始
   - 周波数表示が更新開始

4. **ド発声確認**:
   - C3-C6範囲の音程検出でボタンアクティブ化
   - 「マイクが正常に動作しています」表示

5. **ユーザー操作可能**:
   - レッスンスタートボタンが青色でアクティブ
   - クリックで選択されたトレーニングモードへ遷移

### **表示情報詳細**

#### **リアルタイム周波数表示**
```typescript
// 表示フォーマット例
周波数: 261.6 Hz
音名: C4
読み方: ド（低）
音量: ████████░░ 80%
```

#### **音名変換ルール**
```typescript
const noteConversion = {
  'C3': 'ド（低）', 'C4': 'ド（中）', 'C5': 'ド（高）',
  'D3': 'レ（低）', 'D4': 'レ（中）', 'D5': 'レ（高）',
  'E3': 'ミ（低）', 'E4': 'ミ（中）', 'E5': 'ミ（高）',
  // ...以下同様
};
```

#### **音量表示バー**
- **範囲**: 0-100%
- **色**: 緑（良好）→ 黄（適正）→ 赤（過大）
- **反応閾値**: 10%以上で検出判定
- **視覚フィードバック**: リアルタイム更新

## 🎵 音響技術仕様

### **周波数検出**
- **ライブラリ**: Pitchy (McLeod Pitch Method)
- **サンプリングレート**: 44.1kHz
- **FFTサイズ**: 2048
- **検出範囲**: C3-C6 (130.81-1046.50Hz)
- **精度**: ±5セント以内

### **音量検出**
- **計算方式**: RMS + 最大振幅の組み合わせ
- **更新頻度**: 60FPS
- **反応閾値**: volume > 1 (内部単位)
- **正規化**: 0-1範囲に正規化後、0-100%表示

### **Web Audio API設定**
```typescript
const audioConfig = {
  autoGainControl: false,
  echoCancellation: false,
  noiseSuppression: false,
  sampleRate: 44100,
  channelCount: 1
};
```

## 🚦 エラーハンドリング仕様

### **マイク許可エラー**
- **NotAllowedError**: 「マイクへのアクセスが拒否されました」
- **NotFoundError**: 「マイクが見つかりません」
- **OverconstrainedError**: 「マイクの設定に問題があります」

### **復旧手順**
1. エラーメッセージ表示
2. 再試行ボタン表示
3. ブラウザ設定案内リンク
4. 別デバイス推奨表示

## 📱 デバイス対応

### **対応環境**
- **PC**: Chrome, Firefox, Safari, Edge
- **iPhone**: Safari (iOS 12+)
- **Android**: Chrome (Android 7+)

### **iPhone Safari特化**
- **タップアクティベーション**: ユーザー操作でAudioContext開始
- **音声処理最適化**: 44.1kHz固定設定
- **メモリ管理**: 適切なクリーンアップ実装

## 🔄 データフロー

### **状態管理**
```typescript
const [micState, setMicState] = useState<MicTestState>({
  micPermission: 'pending',
  volumeDetected: false,
  frequencyDetected: false,
  startButtonEnabled: false
});
```

### **イベントフロー**
1. **ページロード** → URLパラメータ解析
2. **マイク許可要求** → Web Audio API初期化
3. **リアルタイム検出** → 60FPS更新
4. **ユーザー発声** → 音量・周波数検出
5. **ボタンアクティブ化** → 遷移可能状態
6. **スタートクリック** → トレーニングページへ遷移

## ✅ 実装チェックリスト

### **Phase 1: 基本実装**
- [ ] URLパラメータ解析
- [ ] マイク許可UI
- [ ] Web Audio API初期化
- [ ] リアルタイム音量表示

### **Phase 2: 音程検出**
- [ ] Pitchy統合
- [ ] 周波数→音名変換
- [ ] ド発声判定ロジック
- [ ] UI状態制御

### **Phase 3: 完成・最適化**
- [ ] エラーハンドリング
- [ ] デバイス最適化
- [ ] アクセシビリティ対応
- [ ] パフォーマンス最適化

---

**この仕様書は相対音感トレーニングアプリv3.0.0の核心機能であるマイクテストページの完全な実装ガイドです。**