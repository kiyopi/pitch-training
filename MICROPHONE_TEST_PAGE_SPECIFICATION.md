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

## 🚨 **重要: Next.js + iPhoneレンダリング問題と対策**

### **問題の詳細**
**症状**: iPhoneのWebKitエンジンで音量バーが正常に表示されない
- 音量計算は正常（周波数検出も正常）
- 音量バー表示のみ2%程度の極小幅で表示
- PC（Chromium）では正常動作

### **根本原因**
```typescript
// ❌ 問題のあるコード: CSSとJavaScriptの競合
<div 
  ref={volumeBarRef}
  className="h-3 rounded-full transition-all duration-100"
  style={{ width: '0%', backgroundColor: '#10b981' }}  // 初期style設定
/>

// JavaScript側でwidthを動的変更
volumeBarRef.current.style.width = `${volume}%`;  // 競合発生
```

**競合メカニズム**:
1. React初期レンダリング時に`style`オブジェクトが設定
2. JavaScript動的変更が一部のプロパティのみ上書き
3. WebKitエンジンで古いスタイル値が残存
4. width変更が正しく反映されない

### **解決策**
```typescript
// ✅ 正しいコード: 完全JavaScript制御
<div 
  ref={volumeBarRef}
  className="h-3 rounded-full transition-all duration-100"  // style属性削除
/>

// 初期化時に全スタイルを設定
if (volumeBarRef.current) {
  volumeBarRef.current.style.width = '0%';
  volumeBarRef.current.style.backgroundColor = '#10b981';
  volumeBarRef.current.style.height = '12px';
  volumeBarRef.current.style.borderRadius = '9999px';
  volumeBarRef.current.style.transition = 'all 0.1s ease-out';
}

// 動的更新も同じstyle方式で統一
volumeBarRef.current.style.width = `${volume}%`;
volumeBarRef.current.style.backgroundColor = '#10b981';
```

### **対策原則**
1. **統一制御**: CSS `className` と JavaScript `style` を混在させない
2. **完全初期化**: マイク許可後に全スタイル属性を明示的に設定
3. **WebKit対応**: 初期`style`属性を設定しない
4. **一貫性**: 全ての動的スタイル変更を同じ方式で実装

### **適用箇所**
- `/src/app/microphone-test/page.tsx:475-477` (HTML要素)
- `/src/app/microphone-test/page.tsx:162-176` (updateVolumeDisplay関数)
- `/src/app/microphone-test/page.tsx:278-284` (初期化処理)

---

## 🎯 **重要: プラットフォーム別音量最適化仕様**

### **背景・課題**
PC と iPhone では音響特性が大きく異なるため、同じ音量計算アルゴリズムでは適切な表示ができない問題が発生する。

- **PC**: 無音時に18%程度の高いベースライン
- **iPhone**: 音量レベルが30%程度で頭打ち

### **解決アプローチ: プラットフォーム別独立処理**

#### **基本計算（共通）**
```typescript
// 音量検出（RMS + 最大振幅の組み合わせ）
const rms = Math.sqrt(sum / bufferLength);
const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
const baseVolume = calculatedVolume / 12 * 100; // pitchy-clean準拠スケーリング

// プラットフォーム判定
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
```

#### **iPhone専用処理（成功パターン）**
```typescript
if (isIOS) {
  if (calculatedVolume > 3) { // 発声検出閾値
    // 発声時: 特殊オフセット + 倍率システム
    const iOSOffset = 40;      // 40%のベースオフセット
    const iOSMultiplier = 2.0; // 発声時の増幅倍率
    volumePercent = Math.min(Math.max((baseVolume * iOSMultiplier) + iOSOffset, 0), 100);
  } else {
    // 無音時: 通常計算（オフセットなし）
    volumePercent = Math.min(Math.max(baseVolume, 0), 100);
  }
}
```

**iPhone計算式の詳細**:
- **発声時**: `(baseVolume × 2.0) + 40%` で80-90%範囲を確保
- **無音時**: `baseVolume` そのままで適切な低値表示
- **効果**: 30%頭打ち問題を解決、実用的な80-90%範囲での音量表示

#### **PC専用処理（ノイズフロア削減）**
```typescript
else {
  if (calculatedVolume <= 3) {
    // 無音時: 比例削減でノイズフロア低減
    volumePercent = Math.min(Math.max(baseVolume * 0.2, 0), 100);
  } else {
    // 発声時: 通常計算
    volumePercent = Math.min(Math.max(baseVolume, 0), 100);
  }
}
```

**PC計算式の詳細**:
- **無音時**: `baseVolume × 0.2` で18% → 3%程度に削減
- **発声時**: `baseVolume` そのままで適切な反応性維持
- **効果**: 無音時の不自然な高表示を解決

### **実装上の重要な注意点**

#### **❌ 失敗パターン（避けるべき実装）**
```typescript
// 引き算による削減 - マイナス値で0になってしまう
volumePercent = Math.min(Math.max(baseVolume - noiseFloor, 0), 100);

// iPhone成功パターンの不正確な復元
// 微細な違いでも効果が出ない
```

#### **✅ 正しいパターン**
```typescript
// 比例計算による削減 - 常に正の値を保持
volumePercent = Math.min(Math.max(baseVolume * 0.2, 0), 100);

// 動作確認済みコードの完全復元
// コミット履歴から一字一句正確に復元
```

### **数学的根拠**

#### **iPhone オフセット + 倍率システム**
- **目的**: 低い検出値（10-15%）を実用範囲（80-90%）に変換
- **計算**: `(10% × 2.0) + 40% = 60%` → 実用的表示
- **利点**: 線形変換で比例関係を維持、予測可能な動作

#### **PC 比例削減システム**
- **目的**: 高いノイズフロア（18%）を適切な無音表示（3%）に変換
- **計算**: `18% × 0.2 = 3.6%` → 適切な無音表示
- **利点**: 発声時の感度は維持、無音時のみ調整

### **デバッグ・検証方法**
```typescript
// 実装検証用ログ出力
console.log(`Platform: ${isIOS ? 'iOS' : 'PC'}`);
console.log(`calculatedVolume: ${calculatedVolume.toFixed(2)}`);
console.log(`baseVolume: ${baseVolume.toFixed(2)}`);
console.log(`volumePercent Final: ${volumePercent.toFixed(2)}%`);
```

### **成功基準**
- **iPhone**: 発声時に80-90%範囲での表示
- **PC**: 無音時3%程度、発声時は適切な反応性
- **両プラットフォーム**: リアルタイムでの安定した音量バー表示

### **関連コミット**
- **成功実装**: `9ada9ce` - iPhone成功パターン完全復元 + PC無音時改善
- **参考実装**: `1539a3e` - iPhone専用オフセット方式（発声検出連動）

---

**この仕様書は相対音感トレーニングアプリv3.0.0の核心機能であるマイクテストページの完全な実装ガイドです。**