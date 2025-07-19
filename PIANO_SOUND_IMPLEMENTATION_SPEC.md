# ピアノ音再生機能実装仕様書 v1.0

## 🎯 実装目標

**スタートボタン押下でピアノ音を1回再生する最小機能を実装**

---

## 📋 機能要件

### 基本動作
1. **スタートボタン押下** → **ピアノ音再生** → **完了**
2. **対象音**: C4（ド、261.63Hz）固定
3. **再生時間**: 2秒間
4. **音源**: Tone.js + Salamander Grand Piano

---

## 🔧 技術実装詳細

### 1. 必要ライブラリ
```typescript
import * as Tone from "tone";
```

### 2. 実装手順

#### **Step 1: AudioContext初期化**
```typescript
// スタートボタン押下時に実行
if (Tone.getContext().state !== 'running') {
  await Tone.start();
}
```

#### **Step 2: ピアノ音源設定**
```typescript
const sampler = new Tone.Sampler({
  urls: {
    "C4": "C4.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

// 音源読み込み待機
await Tone.loaded();
```

#### **Step 3: 音声再生**
```typescript
// C4を2秒間再生
sampler.triggerAttackRelease("C4", "2n");
```

---

## 📝 実装コード例

### handleStart関数の修正
```typescript
const handleStart = async () => {
  try {
    console.log('🎵 ピアノ音再生開始');
    
    // AudioContext開始
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      console.log('AudioContext開始完了');
    }
    
    // ピアノ音源作成
    const sampler = new Tone.Sampler({
      urls: {
        "C4": "C4.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).toDestination();
    
    // 音源読み込み待機
    console.log('音源読み込み中...');
    await Tone.loaded();
    console.log('音源読み込み完了');
    
    // C4を2秒間再生
    console.log('ピアノ音再生中...');
    sampler.triggerAttackRelease("C4", "2n");
    
    console.log('✅ ピアノ音再生完了');
    
  } catch (error) {
    console.error('❌ ピアノ音再生エラー:', error);
  }
};
```

---

## 🎯 期待される動作

### 正常時の流れ
1. ユーザーがスタートボタンを押下
2. コンソールに「🎵 ピアノ音再生開始」
3. AudioContext初期化（初回のみ）
4. 音源ファイル読み込み（初回のみ）
5. C4（ド）の音が2秒間再生
6. コンソールに「✅ ピアノ音再生完了」

### コンソールログ例
```
🎵 ピアノ音再生開始
AudioContext開始完了
音源読み込み中...
音源読み込み完了
ピアノ音再生中...
✅ ピアノ音再生完了
```

---

## 🚨 エラー対応

### 想定されるエラー
1. **ネットワークエラー**: 音源ファイル読み込み失敗
2. **AudioContextエラー**: ブラウザ制限
3. **Tone.jsエラー**: ライブラリ初期化失敗

### エラーハンドリング
```typescript
catch (error) {
  console.error('❌ ピアノ音再生エラー:', error);
  // エラー時も処理続行（アプリが止まらない）
}
```

---

## 📊 テスト項目

### 基本動作テスト
- [ ] スタートボタンを押すとピアノ音が鳴る
- [ ] 音の長さが約2秒である
- [ ] コンソールログが正しく出力される
- [ ] エラーが発生しない

### ブラウザテスト
- [ ] Chrome: 動作確認
- [ ] Safari: 動作確認
- [ ] iPhone Safari: 動作確認

### ネットワークテスト
- [ ] 初回読み込み: 音源ダウンロード確認
- [ ] 2回目以降: キャッシュ動作確認

---

## 🔍 実装時の注意点

### 1. ユーザーインタラクション必須
- **AudioContext開始**: 必ずユーザーのクリック後
- **理由**: ブラウザのセキュリティ制限

### 2. 音源読み込み時間
- **初回**: 数秒かかる可能性
- **対策**: 読み込み中表示は今回は省略

### 3. エラー処理
- **音が鳴らない場合**: コンソールエラーで原因特定
- **アプリ停止回避**: try-catch で包む

---

## 📈 実装後の拡張予定

### Phase 2（今回は実装しない）
- ランダム基音選択（C4以外の音）
- 複数音源の組み合わせ
- 音量調整機能

### Phase 3（将来的に）
- 音程検出機能
- エラー表示UI
- 読み込み状態表示

---

## ✅ 実装承認確認

### 実装前確認事項
1. **この仕様で実装を開始してよろしいですか？**
2. **追加・変更したい項目はありますか？**
3. **テスト方法について問題ありませんか？**

### 実装完了条件
- スタートボタン押下でC4のピアノ音が2秒間再生される
- エラーが発生せずコンソールログが正常に出力される
- iPhone Safariでも動作する

---

**この仕様書に基づいて実装を進めてよろしいですか？**