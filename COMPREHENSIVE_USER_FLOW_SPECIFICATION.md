# 包括的ユーザーフロー仕様書

**作成日**: 2025-07-27  
**バージョン**: v1.0.0  
**対象**: SvelteKit相対音感トレーニングアプリ

## 📋 概要

この仕様書は、相対音感トレーニングアプリケーションの完全なユーザーフローを定義します。正常系・異常系の両方を網羅し、マイク制御を含む全ての状態遷移を詳細に記述します。

## 🎯 フロー構成要素

### **主要コンポーネント**
- **ホームページ** (`/`)
- **マイクテストページ** (`/microphone-test`)  
- **トレーニングページ** (`/training/{mode}`)
- **PitchDetectorコンポーネント**

### **状態管理レイヤー**
1. **ページレベル状態**: `trainingPhase`, `microphoneState`
2. **コンポーネントレベル状態**: `componentState`, `isActive` 
3. **健康監視レベル状態**: `microphoneHealthy`, `microphoneErrors`

## 🔄 完全ユーザーフロー図

```mermaid
flowchart TD
    Start([ユーザーアクセス]) --> HomePage{ホームページ}
    
    %% ホームページからの分岐
    HomePage --> |ランダム基音モード| MicTest1[マイクテスト?mode=random]
    HomePage --> |連続チャレンジモード| MicTest2[マイクテスト?mode=continuous]
    HomePage --> |12音階モード| MicTest3[マイクテスト?mode=chromatic]
    
    %% マイクテストフロー
    MicTest1 --> MicPermission{マイク許可要求}
    MicTest2 --> MicPermission
    MicTest3 --> MicPermission
    
    MicPermission --> |許可| VolumeTest[音量検出テスト]
    MicPermission --> |拒否| MicDenied[許可拒否画面]
    MicPermission --> |エラー| MicError[マイクエラー画面]
    
    VolumeTest --> |成功| FreqTest[音程検出テスト]
    VolumeTest --> |失敗| MicTestFail[テスト失敗]
    
    FreqTest --> |成功| MicTestComplete[マイクテスト完了]
    FreqTest --> |失敗| MicTestFail
    
    MicTestComplete --> |トレーニング開始| TrainingPage[トレーニングページ?from=microphone-test]
    
    %% トレーニングページフロー
    TrainingPage --> InitCheck{初期化チェック}
    InitCheck --> |from=microphone-test| QuickInit[クイック初期化]
    InitCheck --> |直接アクセス| FullInit[完全初期化]
    
    QuickInit --> |成功| TrainingSetup[トレーニング準備]
    QuickInit --> |失敗| FullInit
    
    FullInit --> MicCheck{マイク状態確認}
    MicCheck --> |許可済み| TrainingSetup
    MicCheck --> |未許可| DirectAccess[ダイレクトアクセス画面]
    
    DirectAccess --> |マイク許可| TrainingSetup
    DirectAccess --> |マイクテストへ| MicTest1
    
    %% トレーニング実行フロー
    TrainingSetup --> BaseTonePlay[基音再生]
    BaseTonePlay --> |再生完了| Listening[音程検出開始]
    Listening --> Waiting[発声待機]
    Waiting --> Guiding[ガイドアニメーション]
    Guiding --> |8音階完了| Results[結果表示]
    
    %% 結果からの分岐
    Results --> |同じ基音で再挑戦| RestartSame[状態リセット]
    Results --> |違う基音で開始| RestartDifferent[完全リセット]
    Results --> |マイクテストへ| MicTest1
    Results --> |ホームへ| HomePage
    
    RestartSame --> TrainingSetup
    RestartDifferent --> TrainingSetup
    
    %% エラーハンドリング
    MicDenied --> |再試行| MicPermission
    MicTestFail --> |再試行| MicPermission
    MicError --> |再試行| MicPermission
    
    %% マイク健康状態監視
    TrainingSetup --> |マイク異常検知| MicHealth{健康状態チェック}
    Listening --> |マイク異常検知| MicHealth
    Waiting --> |マイク異常検知| MicHealth
    Guiding --> |マイク異常検知| MicHealth
    
    MicHealth --> |軽微な問題| WarningDisplay[警告表示]
    MicHealth --> |重大な問題| TrainingStop[トレーニング停止]
    
    WarningDisplay --> TrainingSetup
    TrainingStop --> TrainingSetup
    
    %% ブラウザ操作
    HomePage --> |戻るボタン| BrowserBack[ブラウザ戻る処理]
    TrainingPage --> |戻るボタン| BrowserBack
    BrowserBack --> HomePage
    
    %% ページリフレッシュ
    TrainingPage --> |リフレッシュ| PageRefresh[ページ再読み込み]
    PageRefresh --> FullInit
```

## 📊 状態遷移表

### **trainingPhase状態遷移**

| 現在の状態 | トリガー | 次の状態 | 条件 |
|------------|----------|----------|------|
| setup | 基音再生ボタン押下 | listening | canStartTraining = true |
| listening | 再生完了 | waiting | 2秒経過 |
| waiting | ガイド開始 | guiding | 0.5秒経過 |
| guiding | 8音階完了 | results | 全ステップ完了 |
| results | 再挑戦ボタン | setup | ユーザー操作 |
| any | マイク異常 | setup | microphoneHealthy = false |

### **microphoneState状態遷移**

| 現在の状態 | トリガー | 次の状態 | 処理内容 |
|------------|----------|----------|----------|
| checking | 初期化開始 | checking | マイク状態確認中 |
| checking | 許可確認成功 | granted | PitchDetector初期化 |
| checking | 許可確認失敗 | denied | ダイレクトアクセス画面 |
| granted | マイク異常検知 | error | エラー処理開始 |
| denied | マイク許可取得 | granted | 状態復旧 |
| error | 復旧成功 | granted | 正常状態復帰 |

### **PitchDetector componentState遷移**

| 現在の状態 | トリガー | 次の状態 | 処理内容 |
|------------|----------|----------|----------|
| uninitialized | initialize() | initializing | MediaStream取得開始 |
| initializing | 初期化成功 | ready | AudioContext構築完了 |
| initializing | 初期化失敗 | error | エラー状態へ |
| ready | isActive=true | detecting | 音程検出開始 |
| detecting | isActive=false | ready | 音程検出停止 |
| error | 復旧処理 | initializing | 再初期化 |

## 🚨 異常系フロー詳細

### **A. マイク許可関連エラー**

```mermaid
flowchart TD
    PermissionRequest[マイク許可要求] --> UserAction{ユーザー操作}
    
    UserAction --> |許可| PermissionGranted[許可成功]
    UserAction --> |拒否| PermissionDenied[許可拒否]
    UserAction --> |無視/タイムアウト| PermissionTimeout[タイムアウト]
    
    PermissionDenied --> DeniedMessage[拒否メッセージ表示]
    PermissionTimeout --> TimeoutMessage[タイムアウトメッセージ表示]
    
    DeniedMessage --> RetryOption[再試行オプション]
    TimeoutMessage --> RetryOption
    
    RetryOption --> |再試行| PermissionRequest
    RetryOption --> |マイクテストへ| MicrophoneTest[マイクテストページ]
    
    PermissionGranted --> DeviceCheck{デバイス確認}
    DeviceCheck --> |デバイス利用可能| Success[成功]
    DeviceCheck --> |デバイス使用中| DeviceBusy[デバイス競合]
    DeviceCheck --> |デバイスなし| NoDevice[デバイスなし]
    
    DeviceBusy --> ConflictMessage[競合メッセージ]
    NoDevice --> NoDeviceMessage[デバイスなしメッセージ]
```

### **B. MediaStream異常処理**

```mermaid
flowchart TD
    StreamActive{MediaStream.active} --> |true| StreamOK[正常状態]
    StreamActive --> |false| StreamInactive[非アクティブ]
    
    StreamInactive --> TrackCheck{Track状態確認}
    TrackCheck --> |ended| TrackEnded[トラック終了]
    TrackCheck --> |live| TrackLive[トラック生存]
    
    TrackEnded --> |自動復旧| RestoreAttempt[復旧試行]
    TrackLive --> |手動復旧| ManualRestore[手動復旧]
    
    RestoreAttempt --> |成功| StreamOK
    RestoreAttempt --> |失敗| RestoreFailed[復旧失敗]
    
    ManualRestore --> |成功| StreamOK
    ManualRestore --> |失敗| RestoreFailed
    
    RestoreFailed --> UserNotification[ユーザー通知]
    UserNotification --> PageReload[ページ再読み込み推奨]
```

### **C. AudioContext問題処理**

```mermaid
flowchart TD
    ContextState{AudioContext.state} --> |running| ContextOK[正常動作]
    ContextState --> |suspended| ContextSuspended[サスペンド]
    ContextState --> |closed| ContextClosed[クローズ]
    
    ContextSuspended --> |ユーザー操作あり| ResumeAttempt[復旧試行]
    ContextSuspended --> |ユーザー操作なし| WaitForInteraction[操作待ち]
    
    ResumeAttempt --> |成功| ContextOK
    ResumeAttempt --> |失敗| ResumeFailed[復旧失敗]
    
    ContextClosed --> RecreateContext[コンテキスト再作成]
    RecreateContext --> |成功| ContextOK
    RecreateContext --> |失敗| ContextError[コンテキストエラー]
    
    WaitForInteraction --> |操作発生| ResumeAttempt
    ResumeFailed --> UserAction[ユーザー操作要求]
    ContextError --> UserAction
```

## 🔄 復旧戦略

### **自動復旧対象**
- MediaStream一時的切断
- AudioContext suspend
- 軽微なデバイス競合
- ネットワーク一時的問題

### **手動復旧対象**  
- マイク許可取り消し
- デバイス物理的切断
- 他アプリによる占有
- ブラウザ権限変更

### **復旧不可対象**
- ハードウェア故障
- ドライバー問題
- 古いブラウザ非対応
- セキュリティポリシー制限

## 📱 特殊なケース処理

### **複数タブ処理**
```mermaid
flowchart TD
    NewTab[新しいタブ] --> ExistingCheck{既存タブ確認}
    ExistingCheck --> |アクティブタブあり| TabConflict[タブ競合]
    ExistingCheck --> |アクティブタブなし| NormalFlow[通常フロー]
    
    TabConflict --> ConflictWarning[競合警告表示]
    ConflictWarning --> |続行| ForceTakeover[強制引き継ぎ]
    ConflictWarning --> |キャンセル| CloseTab[タブクローズ]
    
    ForceTakeover --> PrevTabCleanup[前タブクリーンアップ]
    PrevTabCleanup --> NormalFlow
```

### **バックグラウンド処理**
```mermaid
flowchart TD
    PageVisible{ページ可視性} --> |visible| ActiveMode[アクティブモード]
    PageVisible --> |hidden| BackgroundMode[バックグラウンドモード]
    
    BackgroundMode --> SuspendDetection[検出停止]
    SuspendDetection --> AudioContextSuspend[AudioContext停止]
    
    ActiveMode --> ResumeDetection[検出再開]
    ResumeDetection --> AudioContextResume[AudioContext再開]
    AudioContextResume --> StateRestore[状態復旧]
```

## 📋 フロー検証チェックリスト

### **正常系検証**
- [ ] ホームページからマイクテストへの遷移
- [ ] マイクテストからトレーニングページへの遷移
- [ ] 基音再生から結果表示までの完全フロー
- [ ] 再挑戦ボタンでの状態リセット
- [ ] マイクテスト経由での状態引き継ぎ

### **異常系検証**
- [ ] マイク許可拒否時の適切な誘導
- [ ] MediaStream突然切断時の復旧
- [ ] AudioContext suspend時の再開
- [ ] デバイス競合時の適切なエラー表示
- [ ] ネットワーク問題時の処理

### **境界値検証**
- [ ] 長時間放置後の状態保持
- [ ] 複数タブでの同時アクセス
- [ ] バックグラウンドタブからの復帰
- [ ] ページリフレッシュ時の状態復旧
- [ ] ブラウザ戻るボタンでの適切な処理

## 🚀 今後の拡張ポイント

### **Phase 1: 基本安定性向上**
- AudioContext自動suspend対応
- ブラウザ戻るボタン完全対応
- 権限リアルタイム監視

### **Phase 2: ユーザー体験向上**
- 詳細なエラーガイダンス
- 自動復旧機能強化
- オフライン対応

### **Phase 3: 高度な機能**
- マルチデバイス対応
- セッション永続化
- パフォーマンス最適化

---

**この仕様書により、開発者は全てのユーザーフローとエラーケースを理解し、堅牢なアプリケーションの構築が可能になります。**