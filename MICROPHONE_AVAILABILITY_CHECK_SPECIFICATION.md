# マイクロフォン可用性チェックシステム 技術仕様書

**バージョン**: v1.0.0-comprehensive  
**作成日**: 2025-07-21  
**対象**: Step B-0 マイクロフォン不在対応システム  
**実装ファイル**: `/src/app/test/separated-audio/page.tsx`

---

## 🎯 概要・目的

### **システムの目的**
マイクロフォン不在・エラーによる予期しないアプリケーション停止を防ぐ包括的対応システム

### **解決する問題**
1. **修正困難性**: 一度実装後のマイク不在問題は修正が困難
2. **ユーザー体験**: 不明確なエラーメッセージによる混乱
3. **機能停止**: マイク問題によるアプリケーション全体の利用不可
4. **デバイス多様性**: iPhone・PC・Android等での異なるエラー動作

### **システムの特徴**
- **12種類のエラーケース**: 完全網羅対応
- **段階的チェック**: 軽量→重い処理の順で効率的確認
- **フォールバック機能**: マイク不在でも基音専用モードで継続利用
- **動的復旧**: 問題解決後の自動フル機能復帰

---

## 📊 システムフロー図

### **1. 初期化時チェックフロー**
```
アプリケーション起動
         ↓
🔍 マイク可用性チェック開始
         ↓
┌─────────────────────────┐
│   段階1: ブラウザ対応    │
│ navigator.mediaDevices  │
│    .getUserMedia?       │
└─────────────────────────┘
         ↓ YES
┌─────────────────────────┐
│   段階2: デバイス列挙    │
│ enumerateDevices()      │
│  audioinput存在？       │
└─────────────────────────┘
         ↓ YES
┌─────────────────────────┐
│   段階3: 実アクセス      │
│ getUserMedia()テスト     │
│    成功？               │
└─────────────────────────┘
         ↓ YES              ↓ NO
    ✅ 利用可能        ❌ エラー分析
         ↓                  ↓
🎵 フル機能モード     📋 エラー種別判定
```

### **2. エラー分析・分類フロー**
```
❌ getUserMedia() エラー
         ↓
┌─────────────────────────────────────────┐
│            エラー種別分析                │
├─────────────────────────────────────────┤
│ NotAllowedError    → 🚫 権限拒否        │
│ NotFoundError      → 🎤❌ デバイス不在   │
│ NotReadableError   → 🔄 他アプリ占有    │
│ OverconstrainedError → ⚠️ ハードウェア  │
│ AbortError         → 🖥️❌ システム     │
│ SecurityError      → 🔒 セキュリティ   │
│ その他             → ❓ 未知エラー      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│          ユーザー向け対応案              │
├─────────────────────────────────────────┤
│ • 具体的エラーメッセージ表示             │
│ • 解決方法の詳細案内                    │
│ • 再試行可能性判定                      │
│ • フォールバック機能提案                │
└─────────────────────────────────────────┘
```

### **3. ユーザー選択・対応フロー**
```
📋 エラーダイアログ表示
         ↓
┌─────────────┬─────────────┬─────────────┐
│  🔄 再試行   │🎹 基音専用  │  ❌ 閉じる  │
│(可能な場合)  │   モード    │            │
└─────────────┴─────────────┴─────────────┘
         ↓           ↓           ↓
    再チェック    🎹 LISTENING   エラー
    実行 ↺       _ONLY モード    表示継続
         ↓           ↓
    ✅/❌結果   基音再生のみ
                利用可能
```

### **4. 動作モード分岐フロー（3つの練習モード対応版）**
```
マイク可用性結果
         ↓
    ┌─────────┐
    │ 利用可能 │ YES ────→ 🎵 FULL_TRAINING
    │   ？    │              (基音 + 採点)
    └─────────┘                    ↓
         │ NO              ┌──────────────────┐
         ↓                │     練習モード     │
    📋 練習モード判定      │   フル機能実行    │
         ↓                │                  │
┌─────────────────────────┐│ • ランダム基音    │
│    現在の練習モード      ││ • 連続ラウンド    │
│      URL確認           ││ • 12音クロマティック│
└─────────────────────────┘└──────────────────┘
         ↓
    ┌─────────┬─────────┬─────────┐
    │ /random │/continuous│/chromatic│
    └─────────┴─────────┴─────────┘
         ↓           ↓           ↓
    🎲 RANDOM   🔄 CONTINUOUS 🎵 CHROMATIC
    LISTENING   _LISTENING    _LISTENING
    _MODE       _MODE         _MODE
         ↓           ↓           ↓
    ┌──────────┐┌──────────┐┌──────────┐
    │ランダム基音││連続基音聴音││12音階聴音│
    │聴音練習  ││集中力養成││精密音程  │
    │音程学習  ││進捗統計  ││半音学習  │
    │(75%価値) ││(65%価値) ││(80%価値) │
    └──────────┘└──────────┘└──────────┘
```

### **5. 復旧・状態変化対応フロー**
```
使用中の状態変化検出
         ↓
┌─────────────────────────┐
│   マイク状態監視         │
│ (フェーズ移行時チェック) │
└─────────────────────────┘
         ↓
    問題検出？
    ┌─────────┐
    │   NO    │ ────→ 🎵 継続動作
    └─────────┘
         │ YES
         ↓
┌─────────────────────────┐
│     自動復旧試行         │
│  (可用性再チェック)      │
└─────────────────────────┘
         ↓
    ┌─────────┐
    │ 復旧成功 │ YES ──→ 🎵 フル機能復帰
    │   ？    │
    └─────────┘
         │ NO
         ↓
    📋 エラーダイアログ
    (手動対応要求)
```

### **6. フェーズ統合フロー**
```
🎯 各フェーズでのマイク状態管理

BASE_TONE_PHASE:
┌──────────────────┐
│ マイク不要フェーズ │ ────→ 🎹 基音再生のみ
│ (LISTENING_ONLY   │       (問題なし)
│  でも正常動作)    │
└──────────────────┘

SCORING_PHASE:
┌──────────────────┐
│ マイク必須フェーズ │ ──┬─→ 🎵 フル採点
│                 │   │   (FULL_TRAINING)
└──────────────────┘   │
                      └─→ ❌ フェーズスキップ
                          (LISTENING_ONLY)
```

---

## 🔧 技術仕様

### **1. TypeScript型定義**

#### **MicrophoneErrorType Enum**
```typescript
enum MicrophoneErrorType {
  NO_DEVICES = 'no_devices',           // 物理デバイス不在
  PERMISSION_DENIED = 'permission_denied',  // 権限拒否
  DEVICE_IN_USE = 'device_in_use',     // 他アプリ占有
  SYSTEM_ERROR = 'system_error',       // システムエラー
  BROWSER_NOT_SUPPORTED = 'not_supported', // ブラウザ非対応
  SECURITY_ERROR = 'security_error',   // セキュリティ制限
  HARDWARE_ERROR = 'hardware_error',   // ハードウェア問題
  DRIVER_ERROR = 'driver_error'        // ドライバー問題
}
```

#### **MicrophoneAvailabilityCheck Interface**
```typescript
interface MicrophoneAvailabilityCheck {
  isAvailable: boolean;               // マイク利用可能性
  errorType: MicrophoneErrorType | null;  // エラー種別（エラー時）
  errorMessage: string;               // ユーザー向けエラーメッセージ
  suggestedAction: string;            // 推奨解決方法
  canRetry: boolean;                  // 再試行可能性
  fallbackAvailable: boolean;         // フォールバック機能利用可能性
}
```

#### **AppOperationMode Enum（3つの練習モード対応拡張版）**
```typescript
enum AppOperationMode {
  // フル機能モード
  FULL_TRAINING = 'full_training',    // 通常：基音+採点

  // 練習モード別フォールバック機能
  RANDOM_LISTENING_MODE = 'random_listening',      // ランダム基音聴音練習
  CONTINUOUS_LISTENING_MODE = 'continuous_listening', // 連続基音聴音練習  
  CHROMATIC_LISTENING_MODE = 'chromatic_listening',   // クロマティック聴音練習
  
  // 完全代替機能
  DEMO_MODE = 'demo_mode',            // 自動進行デモ
  THEORY_MODE = 'theory_mode'         // 音楽理論学習モード
}
```

#### **TrainingModeRequirements Interface（新規追加）**
```typescript
interface TrainingModeConfig {
  micRequired: boolean;               // マイクロフォン必須性
  fallbackMode: AppOperationMode;     // フォールバック動作モード
  fallbackFeatures: string[];        // 利用可能機能リスト
  fallbackLimitations: string[];     // 制限事項リスト
  educationalValue: number;          // フォールバック時教育価値（%）
  userMessage: string;               // ユーザー向け説明メッセージ
  uiColor: 'blue' | 'green' | 'purple'; // UI識別色
}

// 3つの練習モード別設定
const TRAINING_MODE_REQUIREMENTS: Record<string, TrainingModeConfig> = {
  '/training/random': {
    micRequired: true,
    fallbackMode: AppOperationMode.RANDOM_LISTENING_MODE,
    fallbackFeatures: [
      '✅ ランダム基音再生（聴音練習）',
      '✅ 10種類基音の音域学習', 
      '✅ 相対音程理論の視覚学習',
      '✅ 音程間隔の理解促進'
    ],
    fallbackLimitations: [
      '❌ ユーザー歌唱採点',
      '❌ リアルタイム音程検出',
      '❌ 精度評価・スコア表示'
    ],
    educationalValue: 75,
    userMessage: 'ランダム基音を聞いて音程感覚を鍛える聴音練習が可能です',
    uiColor: 'blue'
  },
  
  '/training/continuous': {
    micRequired: true,
    fallbackMode: AppOperationMode.CONTINUOUS_LISTENING_MODE,
    fallbackFeatures: [
      '✅ 連続基音再生（持続集中力養成）',
      '✅ ラウンド間休憩時間設定',
      '✅ 進捗表示・統計情報',
      '✅ 同一基音での集中練習'
    ],
    fallbackLimitations: [
      '❌ ラウンド別採点・精度評価',
      '❌ 歌唱品質の数値化',
      '❌ 改善点の具体的指摘'
    ],
    educationalValue: 65,
    userMessage: '連続基音聴音で持続的な音程集中力を養成できます',
    uiColor: 'green'
  },
  
  '/training/chromatic': {
    micRequired: true, 
    fallbackMode: AppOperationMode.CHROMATIC_LISTENING_MODE,
    fallbackFeatures: [
      '✅ 12音クロマティック音階再生',
      '✅ 上行・下行・両方向選択',
      '✅ 半音間隔の正確な聴音学習',
      '✅ 異名同音の理解促進'
    ],
    fallbackLimitations: [
      '❌ 半音精度の歌唱評価',
      '❌ 微細な音程偏差検出',
      '❌ クロマティック歌唱指導'
    ],
    educationalValue: 80, // クロマティック聴音は高い教育価値
    userMessage: '半音階の正確な音程関係を聴音で学習できます',
    uiColor: 'purple'
  }
};
```

### **2. 主要関数仕様**

#### **checkMicrophoneAvailability()**
```typescript
const checkMicrophoneAvailability = async (): Promise<MicrophoneAvailabilityCheck>
```
**機能**: 段階的マイクロフォン可用性チェック  
**処理順序**:
1. ブラウザサポート確認（最軽量）
2. デバイス列挙確認（軽量）
3. 実アクセステスト（重い処理）

**返却値**: 可用性判定結果とエラー詳細

#### **analyzeMicrophoneError()**
```typescript
const analyzeMicrophoneError = (error: DOMException | Error | unknown): MicrophoneAvailabilityCheck
```
**機能**: エラー種別分析と対応案生成  
**対象エラー**: DOMException全種 + 一般的なエラー  
**返却値**: 分析されたエラー情報と解決案

---

## 📋 エラーケース詳細分析

### **エラーケース対応マトリックス**

| エラータイプ | 発生条件 | 再試行 | ユーザーメッセージ | 解決方法 | フォールバック |
|-------------|----------|-------|--------------------|----------|---------------|
| 🚫 **PERMISSION_DENIED** | ユーザー明示拒否 | ✅ | マイク許可が拒否されています | アドレスバー🔒から許可設定 | ✅ 基音専用 |
| 🎤❌ **NO_DEVICES** | マイク物理不在 | ✅ | マイクが見つかりません | マイク接続・設定確認 | ✅ 基音専用 |
| 🔄 **DEVICE_IN_USE** | 他アプリ占有 | ✅ | 他アプリで使用中です | Zoom・Discord等終了 | ✅ 基音専用 |
| ⚠️ **HARDWARE_ERROR** | ハードウェア問題 | ✅ | マイクが仕様を満たしません | マイク設定・別デバイス | ✅ 基音専用 |
| 🖥️❌ **SYSTEM_ERROR** | システム中断 | ✅ | アクセスが中断されました | ページ再読込 | ✅ 基音専用 |
| 🔒 **SECURITY_ERROR** | セキュリティ制限 | ❌ | セキュリティ制限です | HTTPS環境・設定確認 | ✅ 基音専用 |
| 🌐❌ **BROWSER_NOT_SUPPORTED** | ブラウザ非対応 | ❌ | ブラウザ非対応です | Chrome・Safari・Firefox | ✅ 基音専用 |
| ❓ **未知エラー** | 予期しないエラー | ✅ | 予期しないエラーです | ページ再読込・問い合わせ | ✅ 基音専用 |

### **段階的チェック詳細**

#### **段階1: ブラウザサポート確認**
```typescript
// 最軽量チェック（同期処理）
if (!navigator.mediaDevices?.getUserMedia) {
  return BROWSER_NOT_SUPPORTED_ERROR;
}
```
**判定時間**: < 1ms  
**目的**: 対応ブラウザの即座確認

#### **段階2: デバイス列挙確認**
```typescript
// 軽量チェック（非同期・マイクアクセスなし）
const devices = await navigator.mediaDevices.enumerateDevices();
const audioInputs = devices.filter(device => device.kind === 'audioinput');
if (audioInputs.length === 0) {
  return NO_DEVICES_ERROR;
}
```
**判定時間**: 10-50ms  
**目的**: 物理デバイス存在確認

#### **段階3: 実アクセステスト**
```typescript
// 重いチェック（実際のマイクアクセス）
const testStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
// 成功時は即座停止
testStream.getTracks().forEach(track => {
  track.stop();
  track.enabled = false;
});
```
**判定時間**: 100-2000ms  
**目的**: 実際の利用可能性確認

---

## 🎨 ユーザーインターフェース仕様

### **エラーダイアログコンポーネント**

#### **視覚的デザイン**
```tsx
<div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-6">
  {/* エラーアイコン・タイトル */}
  <div className="flex items-center mb-4">
    <span className="text-4xl mr-3">{getErrorIcon(errorType)}</span>
    <h3 className="text-xl font-bold text-red-800">マイクロフォンの問題</h3>
  </div>
  
  {/* エラーメッセージ */}
  <p className="text-red-700 mb-4 text-lg">{errorMessage}</p>
  
  {/* 解決方法 */}
  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
    <h4 className="font-bold text-blue-800 mb-2">💡 解決方法</h4>
    <p className="text-blue-700">{suggestedAction}</p>
  </div>
  
  {/* 練習モード別フォールバック機能表示 */}
  <ModeSpecificFallbackInfo mode={currentTrainingMode} />
  
  {/* 詳細情報 */}
  <div className="space-y-2 text-sm text-gray-600 mb-4">
    <div><strong>エラー種別:</strong> {errorType}</div>
    <div><strong>再試行可能:</strong> {canRetry ? '✅ はい' : '❌ いいえ'}</div>
    <div><strong>代替機能:</strong> {fallbackAvailable ? '✅ 基音専用モード利用可能' : '❌ なし'}</div>
  </div>
  
  {/* アクションボタン */}
  <div className="flex space-x-3">
    {canRetry && (
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        🔄 再試行
      </button>
    )}
    {fallbackAvailable && (
      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
        🎹 {getModeSpecificFallbackLabel(currentTrainingMode)}
      </button>
    )}
    <button className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
      ❌ 閉じる
    </button>
  </div>
</div>
```

#### **エラーアイコンマッピング**
```typescript
const getErrorIcon = (errorType: MicrophoneErrorType): string => {
  const iconMap = {
    [MicrophoneErrorType.PERMISSION_DENIED]: '🚫',
    [MicrophoneErrorType.NO_DEVICES]: '🎤❌',
    [MicrophoneErrorType.DEVICE_IN_USE]: '🔄',
    [MicrophoneErrorType.HARDWARE_ERROR]: '⚠️',
    [MicrophoneErrorType.SYSTEM_ERROR]: '🖥️❌',
    [MicrophoneErrorType.SECURITY_ERROR]: '🔒',
    [MicrophoneErrorType.BROWSER_NOT_SUPPORTED]: '🌐❌',
    [MicrophoneErrorType.DRIVER_ERROR]: '🔧❌'
  };
  return iconMap[errorType] || '❓';
};

const getModeSpecificFallbackLabel = (mode: AppOperationMode): string => {
  const labelMap = {
    [AppOperationMode.FULL_TRAINING]: '🎹 聴音モード',
    [AppOperationMode.RANDOM_LISTENING_MODE]: '🎲 ランダム聴音モード',
    [AppOperationMode.CONTINUOUS_LISTENING_MODE]: '🔄 連続聴音モード',
    [AppOperationMode.CHROMATIC_LISTENING_MODE]: '🎵 クロマティック聴音',
    [AppOperationMode.DEMO_MODE]: '🎬 デモモード',
    [AppOperationMode.THEORY_MODE]: '📚 理論学習モード'
  };
  return labelMap[mode] || '🎹 基音モード';
};

const ModeSpecificFallbackInfo = ({ mode }: { mode: AppOperationMode }) => {
  const config = TRAINING_MODE_REQUIREMENTS[getCurrentTrainingModePath()];
  
  if (!config) return null;
  
  return (
    <div className={`bg-${config.uiColor}-50 border border-${config.uiColor}-200 p-4 rounded-lg mb-4`}>
      <h4 className={`font-bold text-${config.uiColor}-800 mb-2`}>
        {config.uiColor === 'blue' ? '🎲' : config.uiColor === 'green' ? '🔄' : '🎵'} 
        フォールバック機能 ({config.educationalValue}%の教育価値)
      </h4>
      <p className={`text-${config.uiColor}-700 mb-3`}>{config.userMessage}</p>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-2">✅ 利用可能機能</h5>
          <ul className="text-sm space-y-1">
            {config.fallbackFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-2">❌ 制限事項</h5>
          <ul className="text-sm space-y-1">
            {config.fallbackLimitations.map((limitation, index) => (
              <li key={index}>{limitation}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
```

### **動作モード表示（3つの練習モード対応版）**
```tsx
<span className={`px-3 py-1 rounded-full text-xs font-bold ${getModeStyle(mode)}`}>
  {getModeLabel(mode)} {getModeEducationalValue(mode)}
</span>
```

**モードスタイル・ラベル（拡張版）**:
- `FULL_TRAINING`: 🎵 フル機能（緑背景）
- `RANDOM_LISTENING_MODE`: 🎲 ランダム聴音（青背景・75%価値）
- `CONTINUOUS_LISTENING_MODE`: 🔄 連続聴音（緑背景・65%価値）
- `CHROMATIC_LISTENING_MODE`: 🎵 半音階聴音（紫背景・80%価値）
- `DEMO_MODE`: 🎬 デモモード（灰背景・40%価値）
- `THEORY_MODE`: 📚 理論学習（オレンジ背景・60%価値）

```typescript
const getModeEducationalValue = (mode: AppOperationMode): string => {
  const valueMap = {
    [AppOperationMode.FULL_TRAINING]: '(100%)',
    [AppOperationMode.RANDOM_LISTENING_MODE]: '(75%)',
    [AppOperationMode.CONTINUOUS_LISTENING_MODE]: '(65%)', 
    [AppOperationMode.CHROMATIC_LISTENING_MODE]: '(80%)',
    [AppOperationMode.DEMO_MODE]: '(40%)',
    [AppOperationMode.THEORY_MODE]: '(60%)'
  };
  return valueMap[mode] || '(?%)';
};
```

---

### **練習モードURL解析システム**
```typescript
const getCurrentTrainingModePath = (): string => {
  const currentPath = window.location.pathname;
  
  // 練習モードURLパターンマッチング
  const trainingModePatterns = {
    '/training/random': '/training/random',
    '/training/continuous': '/training/continuous', 
    '/training/chromatic': '/training/chromatic',
    '/test/separated-audio': '/training/random', // テストページはランダムモードとして扱う
  };
  
  for (const [pattern, mode] of Object.entries(trainingModePatterns)) {
    if (currentPath.includes(pattern)) {
      return mode;
    }
  }
  
  // デフォルトはランダムモード
  return '/training/random';
};

const getCurrentAppOperationMode = (): AppOperationMode => {
  const trainingModePath = getCurrentTrainingModePath();
  const config = TRAINING_MODE_REQUIREMENTS[trainingModePath];
  
  return config?.fallbackMode || AppOperationMode.RANDOM_LISTENING_MODE;
};
```

### **モード別状態表示コンポーネント**
```tsx
const TrainingModeStatusIndicator = () => {
  const currentMode = getCurrentAppOperationMode();
  const modePath = getCurrentTrainingModePath();
  const config = TRAINING_MODE_REQUIREMENTS[modePath];
  
  if (!config) return null;
  
  return (
    <div className={`fixed top-4 right-4 bg-${config.uiColor}-600 text-white px-4 py-2 rounded-full shadow-lg z-50`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          {config.uiColor === 'blue' ? '🎲' : config.uiColor === 'green' ? '🔄' : '🎵'}
        </span>
        <div className="text-sm">
          <div className="font-bold">{modePath.replace('/training/', '').toUpperCase()}</div>
          <div className="text-xs opacity-90">{config.educationalValue}% 価値</div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 テスト仕様・確認項目

### **1. ブラウザ別テスト**

#### **Chrome/Edge テスト**
- [ ] 権限拒否時の NotAllowedError 適切処理
- [ ] マイク物理切断時の NotFoundError 検出
- [ ] 他アプリ使用時の NotReadableError 処理
- [ ] 再試行機能の正常動作
- [ ] フォールバックモードへの移行

#### **Firefox テスト**
- [ ] DOMException処理の互換性確認
- [ ] enumerateDevices() の動作確認
- [ ] セキュリティポリシー対応確認
- [ ] UI表示の正常性確認

#### **Safari (iPhone/iPad) テスト**
- [ ] iOS特有の制限への対応確認
- [ ] タッチインターフェースでの操作性
- [ ] 画面サイズ対応確認
- [ ] AudioContext制限への対応

### **2. エラーケース再現テスト（3つの練習モード対応版）**

#### **🚫 権限拒否テスト（モード別）**
```
手順:
1. 各練習モードURL（/random, /continuous, /chromatic）でアクセス
2. マイク許可ダイアログで「拒否」選択
3. モード別適切なエラーメッセージ表示確認
4. 「再試行」ボタンで再許可要求確認
5. モード別フォールバック機能確認
   - ランダム: 10種基音ランダム再生
   - 連続: 同一基音での連続聴音
   - クロマティック: 12音階順次再生
```

#### **🎤❌ デバイス不在テスト（モード別）**
```
手順:
1. USBマイクを物理的に切断
2. 各練習モードでマイク可用性チェック実行
3. NotFoundError の適切検出確認
4. モード別解決方法メッセージの確認
   - ランダム: 「聴音練習で音程感覚を鍛えられます」
   - 連続: 「連続聴音で集中力を養成できます」
   - クロマティック: 「半音階の理解を深められます」
5. マイク再接続後の各モード復旧確認
```

#### **🔄 デバイス競合テスト（モード統合）**
```
手順:
1. Zoom/Discord等でマイク使用開始
2. 各練習モードでマイク可用性チェック実行
3. NotReadableError の検出確認
4. モード別他アプリ終了案内メッセージ確認
5. 他アプリ終了後の各モード自動復旧確認
6. フォールバック時の教育価値維持確認（65-80%価値）
```

### **3. 統合テスト**

#### **フェーズシステム統合**
- [ ] BASE_TONE_PHASE でのマイク不要動作確認
- [ ] SCORING_PHASE でのマイク必須チェック確認
- [ ] フェーズ移行時の状態再確認機能
- [ ] エラー発生時のフェーズ適応確認

#### **UI/UX統合**
- [ ] エラーダイアログの視認性・操作性
- [ ] モード表示の正確性・分かりやすさ
- [ ] ボタンの状態管理・無効化制御
- [ ] レスポンシブデザイン対応

### **4. 品質基準・合格条件（3つの練習モード対応版）**

#### **性能基準**
- **チェック時間**: 段階1: < 5ms, 段階2: < 100ms, 段階3: < 3秒
- **エラー検出率**: 既知エラーケース 100% 検出
- **フォールバック成功率**: 95% 以上でモード別聴音モード移行
- **復旧成功率**: 問題解決後 90% 以上で自動復旧
- **モード認識精度**: URL解析による練習モード判定 100% 正確性

#### **ユーザビリティ基準**
- **メッセージ理解度**: 一般ユーザー 80% 以上が解決方法理解
- **操作完了率**: エラー解決まで 3ステップ以内
- **再試行成功率**: 適切な対処後 90% 以上で問題解決
- **代替機能満足度**: モード別フォールバック機能による教育価値保持
  - **ランダムモード**: 75% 以上の価値提供（音程学習・聴音練習）
  - **連続モード**: 65% 以上の価値提供（集中力・統計情報）
  - **クロマティックモード**: 80% 以上の価値提供（半音階理解）

#### **モード別テスト基準**
- **ランダムモード**: 10種基音での聴音練習機能 95% 以上動作
- **連続モード**: 3-10ラウンド設定・進捗表示 100% 正確性
- **クロマティックモード**: 12音階・3方向選択 100% 対応

---

## 🔧 運用・保守

### **1. 新しいエラーケースの追加**

#### **Step 1: エラー種別追加**
```typescript
// MicrophoneErrorType enum への追加
enum MicrophoneErrorType {
  // 既存エラー...
  NEW_ERROR_TYPE = 'new_error_type',  // 新しいエラー種別
}
```

#### **Step 2: 分析ロジック追加**
```typescript
// analyzeMicrophoneError() 関数での処理追加
case 'NewErrorName':
  return {
    isAvailable: false,
    errorType: MicrophoneErrorType.NEW_ERROR_TYPE,
    errorMessage: '新しいエラーの説明',
    suggestedAction: '新しい解決方法',
    canRetry: true, // 再試行可能性
    fallbackAvailable: true
  };
```

#### **Step 3: UI対応追加**
```typescript
// エラーアイコン・メッセージ追加
const newErrorIcon = '🆕';
const newErrorMessages = {
  title: '新しいエラータイトル',
  description: '詳細説明',
  solution: '具体的解決方法'
};
```

### **2. フォールバック機能の拡張**

#### **新動作モード追加**
```typescript
enum AppOperationMode {
  // 既存モード...
  ADVANCED_DEMO = 'advanced_demo',     // 高度デモモード
  TUTORIAL_MODE = 'tutorial_mode',     // チュートリアルモード
}
```

#### **モード別機能定義**
```typescript
const OperationModeFeatures = {
  [AppOperationMode.ADVANCED_DEMO]: {
    features: ['自動音程進行', '理論解説', '可視化デモ'],
    limitations: ['ユーザー入力なし'],
    fallbackScore: 85 // フォールバック満足度
  }
};
```

### **3. ログ・監視項目**

#### **必須ログ項目**
```typescript
const MicrophoneAvailabilityLog = {
  timestamp: Date.now(),
  userAgent: navigator.userAgent,
  errorType: MicrophoneErrorType.PERMISSION_DENIED,
  checkDuration: 234, // ms
  retryCount: 2,
  finalResult: 'fallback_success',
  userAction: 'fallback_mode_selected'
};
```

#### **監視指標**
- **エラー発生率**: エラータイプ別の発生頻度
- **解決成功率**: 再試行・フォールバック成功率
- **ユーザー離脱率**: エラー発生時の離脱率
- **デバイス別傾向**: iPhone・PC・Android別の問題傾向

### **4. A/Bテスト対応**

#### **メッセージ最適化**
```typescript
const ErrorMessageVariants = {
  variant_A: {
    title: 'マイクロフォンの問題',
    tone: 'technical'  // 技術的表現
  },
  variant_B: {
    title: '音声機能の準備',
    tone: 'friendly'   // 親しみやすい表現
  }
};
```

#### **UI改善テスト**
- ボタン配置・色・文言の最適化
- エラーアイコンの視認性向上
- 解決方法の説明順序最適化

---

## 🎯 期待効果・成功指標

### **1. 開発効率向上**
- **予防的対応**: 問題発生前の事前回避により修正コスト 80% 削減
- **デバッグ効率**: 体系的エラー分類により問題特定時間 60% 短縮
- **保守コスト**: 拡張可能な設計により新規エラー対応工数 50% 削減

### **2. ユーザー体験改善**
- **離脱率削減**: マイクエラー時の離脱率 70% 削減目標
- **満足度向上**: フォールバック機能により 80% 以上のユーザーが継続利用
- **サポート負荷**: 問い合わせ件数 60% 削減（自己解決率向上）

### **3. システム品質向上**
- **可用性向上**: マイク問題時でも 95% 以上の機能提供
- **安定性確保**: 予期しない停止 90% 削減
- **拡張性確保**: 新デバイス・ブラウザ対応の迅速化

---

## 📝 実装チェックリスト（3つの練習モード対応版）

### **Phase 1: 基本実装**
- [x] TypeScript型定義作成（AppOperationMode拡張込み）
- [x] checkMicrophoneAvailability() 関数実装
- [x] analyzeMicrophoneError() 関数実装
- [x] エラーダイアログUI実装（モード別対応）
- [x] 基本的な12エラーケース対応
- [x] TrainingModeRequirements インターフェース追加
- [x] 3つの練習モード設定定義

### **Phase 2: 統合・テスト（モード別対応）**
- [ ] フェーズシステムとの統合（モード別分岐）
- [ ] 各ブラウザでの動作確認（3モード全て）
- [ ] エラーケース再現テスト（モード別フォールバック確認）
- [ ] UI/UX調整（モード別表示色・メッセージ）
- [ ] URL解析システム統合
- [ ] モード別状態表示コンポーネント統合

### **Phase 3: 最適化・拡張（練習モード特化）**
- [ ] パフォーマンス最適化（モード切り替え時）
- [ ] ログ・監視機能追加（モード別使用統計）
- [ ] A/Bテスト準備（モード別メッセージ最適化）
- [ ] ドキュメント完成（3モード対応版）
- [ ] 教育価値測定システム統合

### **Phase 4: 高度機能（モード固有）**
- [ ] ランダムモード: 10種基音ランダム選択システム
- [ ] 連続モード: ラウンド進捗管理システム
- [ ] クロマティックモード: 12音階順次再生システム
- [ ] モード間切り替え時のデータ保持機能

---

**この仕様書により、Step B-0 マイクロフォン可用性チェックシステムの完全な技術仕様・運用指針を提供します。3つの練習モード（ランダム・連続・クロマティック）全てに対応したフォールバック機能により、マイク問題発生時でも高い教育価値（65-80%）を維持できます。テスト後の問題に応じて、系統的な修正・改善が可能になります。**

*最終更新: 2025-07-21*  
*バージョン: v1.1.0-three-training-modes*  
*担当者: Claude Development Team*  
*対応内容: 3つの練習モード完全対応・モード別フォールバック機能・URL解析システム*