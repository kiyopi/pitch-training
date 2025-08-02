# ランダム基音トレーニング ユーザアクションフロー図

**作成日**: 2025-07-26  
**対象**: SvelteKit版ランダム基音トレーニング機能  
**目的**: ユーザ操作とシステム応答の可視化

---

## 🎯 正常フロー図

### **メインフロー: 初回セッション**

```mermaid
flowchart TD
    Start([ユーザがページアクセス]) --> CheckMic{マイク許可状態確認}
    
    CheckMic -->|未許可| ShowError[マイクテストページへ誘導]
    CheckMic -->|許可済み| InitSystem[システム初期化開始]
    
    InitSystem --> InitMic[マイク許可取得]
    InitMic --> InitAudio[音源読み込み]
    InitAudio --> InitPitch[PitchDetector初期化]
    InitPitch --> Ready[🎤 トレーニング開始可能]
    
    Ready --> UserClickPlay{ユーザが「ランダム基音再生」をクリック}
    UserClickPlay --> PlayBase[🎹 基音再生中...]
    PlayBase --> Wait[⏳ 0.5秒待機]
    Wait --> StartGuide[🎵 ガイドアニメーション開始]
    
    StartGuide --> GuideLoop[ド→レ→ミ→...→ド順次ハイライト]
    GuideLoop --> Detection[音程検出・評価蓄積]
    Detection --> GuideEnd{8音階完了?}
    
    GuideEnd -->|No| GuideLoop
    GuideEnd -->|Yes| StopDetection[音程検出停止]
    StopDetection --> CalcResults[採点結果計算]
    CalcResults --> ShowResults[🎉 結果表示]
    
    ShowResults --> UserAction{ユーザの次のアクション}
    UserAction -->|再挑戦| RestartFlow
    UserAction -->|SNS共有| ShareAction[SNS共有ダイアログ]
    UserAction -->|ホーム| GoHome[ホームページへ]
    
    RestartFlow[🔄 再挑戦処理] --> ResetSession[セッション状態リセット]
    ResetSession --> ValidateComponents[コンポーネント状態確認]
    ValidateComponents --> ComponentsOK{全コンポーネント正常?}
    
    ComponentsOK -->|Yes| Ready
    ComponentsOK -->|No| RepairComponents[コンポーネント修復]
    RepairComponents --> Ready
```

### **サブフロー: エラー回復**

```mermaid
flowchart TD
    Error([エラー検出]) --> ClassifyError{エラー種別判定}
    
    ClassifyError -->|マイク権限失効| RecoverMic[マイク再取得]
    ClassifyError -->|PitchDetector破棄| RecoverPitch[PitchDetector再初期化]
    ClassifyError -->|音源エラー| RecoverAudio[音源再読み込み]
    ClassifyError -->|その他| FullRecover[完全再初期化]
    
    RecoverMic --> TestMic{マイク復旧確認}
    RecoverPitch --> TestPitch{PitchDetector確認}
    RecoverAudio --> TestAudio{音源確認}
    FullRecover --> TestAll{全システム確認}
    
    TestMic -->|成功| RecoverySuccess[✅ 回復成功]
    TestPitch -->|成功| RecoverySuccess
    TestAudio -->|成功| RecoverySuccess
    TestAll -->|成功| RecoverySuccess
    
    TestMic -->|失敗| RecoveryFailed[❌ 回復失敗]
    TestPitch -->|失敗| RecoveryFailed
    TestAudio -->|失敗| RecoveryFailed
    TestAll -->|失敗| RecoveryFailed
    
    RecoverySuccess --> Ready[システム復旧]
    RecoveryFailed --> ShowErrorMsg[エラーメッセージ表示]
    ShowErrorMsg --> UserRetry{ユーザが再試行?}
    UserRetry -->|Yes| FullRecover
    UserRetry -->|No| GiveUp[諦める]
```

---

## 🔄 状態遷移図

### **システム状態とユーザアクション**

```mermaid
stateDiagram-v2
    [*] --> Initializing: ページアクセス
    
    Initializing --> Ready: 初期化完了
    Initializing --> Error: 初期化エラー
    
    Ready --> Listening: 「基音再生」クリック
    Listening --> Waiting: 基音再生完了(2秒)
    Waiting --> Guiding: 0.5秒待機完了
    
    Guiding --> Results: ガイドアニメーション完了(8音階)
    Results --> Ready: 「再挑戦」クリック
    Results --> Sharing: 「SNS共有」クリック
    Results --> [*]: 「ホーム」クリック
    
    Sharing --> Results: 共有完了/キャンセル
    
    Error --> Recovering: エラー回復開始
    Recovering --> Ready: 回復成功
    Recovering --> Error: 回復失敗
    
    Ready --> Error: 実行時エラー
    Listening --> Error: 音源エラー
    Guiding --> Error: 検出エラー
```

---

## 🎭 詳細ユーザインタラクション

### **1. 初期アクセス時**

| ユーザアクション | システム応答 | 表示内容 | 内部処理 |
|-----------------|-------------|----------|----------|
| ページアクセス | 初期化開始 | "🎵 音源読み込み中..." | `initializeSystem()` |
| - | マイク許可確認 | 許可ダイアログ | `checkMicrophonePermission()` |
| マイク許可 | 初期化完了 | "🎤 トレーニング開始可能" | `pitchDetectorState = 'ready'` |
| マイク拒否 | エラー画面 | マイクテストページ誘導 | `microphoneState = 'denied'` |

### **2. トレーニング実行時**

| ユーザアクション | システム応答 | 表示内容 | 内部処理 |
|-----------------|-------------|----------|----------|
| 「基音再生」クリック | 基音選択・再生 | "🎵 基音再生中..." | `playBaseNote()` |
| - | 2秒待機 | 基音情報表示 | `sampler.triggerAttackRelease()` |
| - | ガイド開始 | "🎙️ ガイドに合わせて..." | `startGuideAnimation()` |
| ドレミ発声 | リアルタイム検出 | 周波数・音程表示 | `evaluateScaleStep()` |
| 8音階完了 | 結果計算 | "🎉 採点結果" | `calculateFinalResults()` |

### **3. 結果画面時**

| ユーザアクション | システム応答 | 表示内容 | 内部処理 |
|-----------------|-------------|----------|----------|
| 結果確認 | データ表示 | スコア・詳細結果 | `getDisplayEvaluations()` |
| 「再挑戦」クリック | セッションリセット | "🔄 準備中..." | `restartSession()` |
| 「SNS共有」クリック | 共有ダイアログ | 共有オプション | `generateShareText()` |
| 「ホーム」クリック | ページ遷移 | - | `goHome()` |

---

## 🚨 エラーケース詳細フロー

### **Case 1: 3回目セッション失敗（現在の問題）**

```mermaid
flowchart TD
    Session3[3回目セッション開始] --> ClickRestart[「再挑戦」クリック]
    ClickRestart --> RestartSession[restartSession実行]
    RestartSession --> StopDetection[stopDetection呼び出し]
    
    StopDetection --> Problem[❌ 問題：再初期化なし]
    Problem --> TryStart[startGuideAnimation実行]
    TryStart --> CheckComponents[コンポーネント状態確認]
    
    CheckComponents --> ComponentsFailed{analyser: false<br/>pitchDetector: false<br/>audioContext: false}
    ComponentsFailed --> ErrorMsg[エラーメッセージ表示]
    ErrorMsg --> NoDetection[❌ 音程検出不可]
    
    style Problem fill:#ffcccc
    style ComponentsFailed fill:#ffcccc
    style NoDetection fill:#ffcccc
```

### **Case 2: 修正後の正常フロー**

```mermaid
flowchart TD
    Session3[3回目セッション開始] --> ClickRestart[「再挑戦」クリック]
    ClickRestart --> NewRestartSession[改善版restartSession実行]
    
    NewRestartSession --> SafeStop[安全な検出停止]
    SafeStop --> StateReset[状態リセット]
    StateReset --> ComponentCheck[コンポーネント状態確認]
    
    ComponentCheck --> ComponentsStatus{コンポーネント確認}
    ComponentsStatus -->|正常| ReadyToStart[✅ 開始準備完了]
    ComponentsStatus -->|異常| RepairComponents[コンポーネント修復]
    
    RepairComponents --> EnsureComponents[ensureComponentsReady実行]
    EnsureComponents --> MediaStreamCheck{MediaStream確認}
    MediaStreamCheck -->|NG| ReinitMic[マイク再初期化]
    MediaStreamCheck -->|OK| PitchDetectorCheck{PitchDetector確認}
    
    ReinitMic --> PitchDetectorCheck
    PitchDetectorCheck -->|NG| ReinitPitch[PitchDetector再初期化]
    PitchDetectorCheck -->|OK| AudioCheck{音源確認}
    
    ReinitPitch --> AudioCheck
    AudioCheck -->|NG| ReinitAudio[音源再初期化]
    AudioCheck -->|OK| ReadyToStart
    ReinitAudio --> ReadyToStart
    
    ReadyToStart --> NormalFlow[通常フロー継続]
    
    style ReadyToStart fill:#ccffcc
    style NormalFlow fill:#ccffcc
```

---

## 🔍 コンポーネント間通信フロー

### **PitchDetectorコンポーネントとの連携**

```mermaid
sequenceDiagram
    participant User as ユーザ
    participant Main as メインページ
    participant Pitch as PitchDetector
    participant Audio as AudioEngine
    
    User->>Main: ページアクセス
    Main->>Audio: initializeSampler()
    Main->>Pitch: initialize(mediaStream)
    Pitch-->>Main: 初期化完了イベント
    
    User->>Main: 「基音再生」クリック
    Main->>Audio: playBaseNote()
    Audio-->>Main: 再生完了
    
    Main->>Pitch: startDetection()
    Main->>Main: startGuideAnimation()
    
    loop ガイドアニメーション中
        Pitch-->>Main: pitchUpdate イベント
        Main->>Main: evaluateScaleStep()
    end
    
    Main->>Pitch: stopDetection()
    Main->>Main: calculateFinalResults()
    
    User->>Main: 「再挑戦」クリック
    Main->>Main: restartSession()
    Main->>Main: ensureComponentsReady()
    
    alt コンポーネント正常
        Main->>Main: 通常フロー継続
    else コンポーネント異常
        Main->>Pitch: cleanup()
        Main->>Pitch: reinitialize(mediaStream)
        Pitch-->>Main: 再初期化完了
    end
```

---

## 📊 ユーザビリティ観点の改善点

### **現在の問題点**

| 問題 | ユーザ体験への影響 | 改善案 |
|------|------------------|--------|
| 3回目以降失敗 | 「アプリが壊れた」印象 | 自動回復機能 |
| エラー原因不明 | 何をすべきか分からない | 明確なエラーメッセージ |
| 再初期化なし | 手動リロードが必要 | 自動修復機能 |
| 状態不一致 | 予期しない動作 | 状態一貫性チェック |

### **改善後のユーザ体験**

```mermaid
journey
    title ユーザの理想的な体験フロー
    section 初回利用
      ページアクセス: 5: ユーザ
      マイク許可: 4: ユーザ
      トレーニング実行: 5: ユーザ
      結果確認: 5: ユーザ
    section 2回目利用
      再挑戦クリック: 5: ユーザ
      即座に開始: 5: ユーザ
      スムーズな実行: 5: ユーザ
    section 3回目以降
      再挑戦クリック: 5: ユーザ
      自動回復(透明): 5: システム
      正常実行: 5: ユーザ
      継続的な利用: 5: ユーザ
```

---

## ✅ フロー図による検証項目

### **正常フロー検証**
- [ ] 初回アクセスから結果表示まで
- [ ] 2回目再挑戦の動作
- [ ] 3回目以降の安定動作
- [ ] SNS共有機能の動作

### **エラーフロー検証**
- [ ] マイク権限拒否時の誘導
- [ ] 音源読み込み失敗時の回復
- [ ] PitchDetector破棄時の自動修復
- [ ] 完全再初期化の動作

### **ユーザビリティ検証**
- [ ] 各状態での適切な表示
- [ ] ローディング状態の明確性
- [ ] エラーメッセージの分かりやすさ
- [ ] 回復処理の透明性

---

**このフロー図により、ユーザの操作とシステムの応答を可視化し、問題点と改善点を明確にしました。**