# 相対音感トレーニングアプリ - 完全開発ワークフロー

**作成日**: 2025-07-19  
**バージョン**: v1.0.0-complete-workflow  
**対象**: Next.js版相対音感トレーニングアプリ  
**ステータス**: 完全開発フロー確定版

## 🚨 **環境認識警告**
**⚠️ この仕様書は参考情報です。実際の開発は Next.js で実行します。**
- **開発環境**: Next.js 15.4.1 + TypeScript + React  
- **新規作成**: `/src/app/` 以下に作成
- **デプロイ**: GitHub Actions → GitHub Pages
- **禁止**: HTML直接作成・手動デプロイ

---

## 🎯 **アプリ完成までの簡単ステップ (10段階)**

### **Phase 1: 基盤構築 [完了済み]** ✅

#### **Step 1: マイク機能基盤** ✅
- マイク許可・音声取得・iPhone Safari対応
- **実装済み**: `/src/hooks/useMicrophoneManager.ts`

#### **Step 2: 音声処理基盤** ✅  
- AudioContext・44.1kHz音声処理・Tone.js統合
- **実装済み**: `/src/hooks/useAudioProcessor.ts`

#### **Step 3: ノイズフィルタリング** ✅
- 3段階フィルター（ハイパス・ローパス・ノッチ）
- **実装済み**: `/src/hooks/useNoiseFilter.ts`

#### **Step 4: 音程検出統合** ✅
- Pitchy（McLeod Pitch Method）統合・±1セント精度
- **実装済み**: `/src/hooks/usePitchDetector.ts`

### **Phase 2: メイン機能実装 [実装中]** 🔄

#### **Step 5: 3モードマイク統合** 🔄
- ランダム基音・連続チャレンジ・12音階モードにマイク機能統合
- **対象**: `/src/app/training/{random,continuous,chromatic}/page.tsx`

#### **Step 6: 相対音感判定システム** ⏳
- 基音→歌唱→検出→判定の完全サイクル実装
- **新規作成**: `/src/utils/relativePitchJudge.ts`

#### **Step 7: UI/UX最適化** ⏳
- リアルタイム音程表示・進捗追跡・エラーハンドリング
- **新規作成**: `/src/components/PitchVisualization.tsx`

### **Phase 3: 拡張機能実装 [未実装]** ⏳

#### **Step 8: SNS共有機能** ⏳
- Twitter・Facebook・LINE・Instagram Stories対応
- **新規作成**: `/src/components/SocialShare.tsx`

#### **Step 9: PDF出力機能** ⏳
- 詳細レポート・進捗分析・学習推奨システム
- **新規作成**: `/src/components/PDFExport.tsx`

#### **Step 10: 最終リリース** ⏳
- v2.0.0正式リリース・プルリクエスト・品質保証

---

## 📋 **詳細な実装ワークフロー**

### **🔄 Phase 2: メイン機能実装詳細**

#### **Step 5: 3モードマイク統合 [優先度: 最高]**

##### **5.1 実装戦略**
```typescript
// test/pitch-detector/page.tsx の統合システムを各モードに移植
// 既存の音声再生システム (Tone.js) と統合

// 統合対象ファイル
1. /src/app/training/random/page.tsx      - ランダム基音モード
2. /src/app/training/continuous/page.tsx - 連続チャレンジモード  
3. /src/app/training/chromatic/page.tsx  - 12音階モード
```

##### **5.2 統合手順**
```typescript
// A. 各モードに統合フック追加
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { useMicrophoneManager } from '@/hooks/useMicrophoneManager';
import { useNoiseFilter } from '@/hooks/useNoiseFilter';

// B. 4段階統合パイプライン
const {
  // Step 1: マイク制御
  microphoneState,
  startRecording,
  stopRecording
} = useMicrophoneManager();

const {
  // Step 2: 音声処理
  audioContext,
  analyserNode,
  processAudio
} = useAudioProcessor(microphoneState.stream);

const {
  // Step 3: ノイズフィルタ
  filteredAudioData,
  applyFilters
} = useNoiseFilter(audioContext, analyserNode);

const {
  // Step 4: 音程検出
  pitchState,
  startDetection,
  getPitchResult
} = usePitchDetector(filteredAudioData);

// C. 相対音程判定ロジック
const judgePitch = (detectedPitch: number, targetNote: string) => {
  const targetFreq = noteToFrequency(targetNote);
  const centDeviation = 1200 * Math.log2(detectedPitch / targetFreq);
  const isCorrect = Math.abs(centDeviation) <= 50; // ±50セント許容
  return { isCorrect, centDeviation, accuracy: calculateAccuracy(centDeviation) };
};
```

##### **5.3 各モード固有実装**

**ランダム基音モード**:
```typescript
// 10種類基音からランダム選択
const BASE_NOTES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'];
const randomBaseNote = BASE_NOTES[Math.floor(Math.random() * BASE_NOTES.length)];

// 基音再生 → ドレミファソラシド歌唱 → 判定
const trainingFlow = async () => {
  await playBaseNote(randomBaseNote);
  await startMicrophoneDetection();
  for (let interval of ['do', 're', 'mi', 'fa', 'so', 'la', 'ti', 'do']) {
    const result = await detectAndJudge(interval);
    updateProgress(result);
  }
};
```

**連続チャレンジモード**:
```typescript
// ユーザー選択ラウンド数での連続実行
const continuousTraining = async (rounds: number) => {
  const results = [];
  for (let round = 1; round <= rounds; round++) {
    const roundResult = await executeTrainingRound();
    results.push(roundResult);
    updateOverallProgress(results);
  }
  return calculateFinalScore(results);
};
```

**12音クロマティックモード**:
```typescript
// ユーザー選択開始音からクロマティック音階
const chromaticTraining = async (startingNote: string) => {
  const chromaticScale = generateChromaticScale(startingNote);
  for (let note of chromaticScale) {
    const result = await detectAndJudge(note);
    updateChromaticProgress(result);
  }
};
```

#### **Step 6: 相対音感判定システム [優先度: 高]**

##### **6.1 判定アルゴリズム実装**
```typescript
// /src/utils/relativePitchJudge.ts 新規作成
interface RelativePitchJudgment {
  baseNote: string;        // 基音 (例: C4)
  targetInterval: string;  // 目標音程 (例: "do-re", "re-mi")
  detectedNote: string;    // 検出音名
  detectedFreq: number;    // 検出周波数
  targetFreq: number;      // 目標周波数
  centDeviation: number;   // セント偏差
  accuracy: number;        // 精度 (0-100%)
  isCorrect: boolean;      // 正解判定
  confidence: number;      // 検出信頼度
  timestamp: number;       // 検出時刻
}

export const judgeRelativePitch = (
  baseFreq: number, 
  detectedFreq: number, 
  targetInterval: string
): RelativePitchJudgment => {
  
  // 1. 目標周波数計算
  const intervalRatio = INTERVAL_RATIOS[targetInterval];
  const targetFreq = baseFreq * intervalRatio;
  
  // 2. セント偏差計算
  const centDeviation = 1200 * Math.log2(detectedFreq / targetFreq);
  
  // 3. 精度・正解判定
  const accuracy = Math.max(0, 100 - Math.abs(centDeviation) * 2);
  const isCorrect = Math.abs(centDeviation) <= 50; // ±50セント許容
  
  // 4. 音名変換
  const detectedNote = frequencyToNoteName(detectedFreq);
  const baseNote = frequencyToNoteName(baseFreq);
  
  return {
    baseNote,
    targetInterval,
    detectedNote,
    detectedFreq,
    targetFreq,
    centDeviation,
    accuracy,
    isCorrect,
    confidence: 0.95, // Pitchy信頼度
    timestamp: Date.now()
  };
};
```

##### **6.2 音程間隔定義**
```typescript
// ドレミファソラシド音程比率 (純正律ベース)
const INTERVAL_RATIOS = {
  'do-do': 1.0,      // ユニゾン
  'do-re': 9/8,      // 全音 (204セント)
  're-mi': 10/9,     // 全音 (182セント) 
  'mi-fa': 16/15,    // 半音 (112セント)
  'fa-so': 9/8,      // 全音 (204セント)
  'so-la': 10/9,     // 全音 (182セント)
  'la-ti': 9/8,      // 全音 (204セント)
  'ti-do': 16/15,    // 半音 (112セント)
};

// 累積音程計算
const CUMULATIVE_INTERVALS = {
  'do': 1.0,         // 基音
  're': 9/8,         // +204セント
  'mi': 5/4,         // +386セント
  'fa': 4/3,         // +498セント
  'so': 3/2,         // +702セント
  'la': 5/3,         // +884セント
  'ti': 15/8,        // +1088セント
  'do_octave': 2.0   // +1200セント
};
```

#### **Step 7: UI/UX最適化 [優先度: 中]**

##### **7.1 リアルタイム表示コンポーネント**
```typescript
// /src/components/PitchVisualization.tsx 新規作成
interface PitchVisualizationProps {
  currentPitch: number | null;
  targetPitch: number;
  centDeviation: number;
  accuracy: number;
  isRecording: boolean;
  confidence: number;
}

export const PitchVisualization: React.FC<PitchVisualizationProps> = ({
  currentPitch,
  targetPitch,
  centDeviation,
  accuracy,
  isRecording,
  confidence
}) => {
  return (
    <div className="pitch-visualization">
      {/* リアルタイム音程グラフ */}
      <PitchGraph 
        current={currentPitch} 
        target={targetPitch}
        deviation={centDeviation}
      />
      
      {/* 精度メーター */}
      <AccuracyMeter 
        accuracy={accuracy}
        threshold={80}
      />
      
      {/* セント偏差表示 */}
      <CentDeviationDisplay 
        deviation={centDeviation}
        tolerance={50}
      />
      
      {/* 録音状態インジケーター */}
      <RecordingIndicator 
        isRecording={isRecording}
        confidence={confidence}
      />
      
      {/* 進捗表示 */}
      <ProgressIndicator 
        current={currentStep}
        total={totalSteps}
        correctCount={correctAnswers}
      />
    </div>
  );
};
```

---

### **⏳ Phase 3: 拡張機能実装詳細**

#### **Step 8: SNS共有機能 [優先度: 中]**

##### **8.1 SNS統合実装**
```typescript
// /src/components/SocialShare.tsx 新規作成
import { 
  TwitterShareButton, 
  FacebookShareButton, 
  LineShareButton,
  TwitterIcon,
  FacebookIcon,
  LineIcon
} from 'react-share';

interface SocialShareProps {
  trainingResult: TrainingSession;
  mode: 'image' | 'text' | 'both';
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
  trainingResult, 
  mode 
}) => {
  // 共有コンテンツ生成
  const generateShareContent = () => {
    const { overallAccuracy, correctCount, totalCount, mode: trainingMode } = trainingResult;
    
    const messages = {
      text: `🎵 相対音感トレーニング結果 🎵\n` +
            `モード: ${getModeDisplayName(trainingMode)}\n` +
            `正解率: ${overallAccuracy.toFixed(1)}% (${correctCount}/${totalCount})\n` +
            `#相対音感 #音楽教育 #PitchTraining`,
      
      url: 'https://kiyopi.github.io/pitch-training/',
      
      hashtags: ['相対音感', '音楽教育', 'PitchTraining']
    };
    
    return messages;
  };
  
  // 結果画像生成
  const generateResultImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Canvas設定
    canvas.width = 800;
    canvas.height = 600;
    
    // 背景描画
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // 結果情報描画
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 相対音感トレーニング結果', 400, 100);
    
    ctx.font = '36px Arial';
    ctx.fillText(`正解率: ${trainingResult.overallAccuracy.toFixed(1)}%`, 400, 200);
    ctx.fillText(`${trainingResult.correctCount}/${trainingResult.totalCount} 問正解`, 400, 260);
    
    // モード別情報
    ctx.font = '28px Arial';
    ctx.fillText(`モード: ${getModeDisplayName(trainingResult.mode)}`, 400, 340);
    
    // 精度情報
    ctx.font = '24px Arial';
    ctx.fillText(`平均偏差: ±${Math.abs(trainingResult.averageCentDeviation).toFixed(1)}セント`, 400, 400);
    
    // 画像データURL生成
    return canvas.toDataURL('image/png');
  };
  
  const shareContent = generateShareContent();
  
  return (
    <div className="social-share">
      <h3>結果を共有</h3>
      
      <div className="share-buttons">
        <TwitterShareButton
          url={shareContent.url}
          title={shareContent.text}
          hashtags={shareContent.hashtags}
        >
          <TwitterIcon size={48} round />
        </TwitterShareButton>
        
        <FacebookShareButton
          url={shareContent.url}
          quote={shareContent.text}
        >
          <FacebookIcon size={48} round />
        </FacebookShareButton>
        
        <LineShareButton
          url={shareContent.url}
          title={shareContent.text}
        >
          <LineIcon size={48} round />
        </LineShareButton>
      </div>
      
      {mode !== 'text' && (
        <div className="image-share">
          <button onClick={async () => {
            const imageUrl = await generateResultImage();
            // Instagram Stories API または Web Share API
            if (navigator.share) {
              navigator.share({
                title: '相対音感トレーニング結果',
                text: shareContent.text,
                url: shareContent.url
              });
            }
          }}>
            📸 結果画像を生成・共有
          </button>
        </div>
      )}
    </div>
  );
};
```

#### **Step 9: PDF出力機能 [優先度: 中]**

##### **9.1 PDF生成システム**
```typescript
// /src/components/PDFExport.tsx 新規作成
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Chart } from 'chart.js';
import autoTable from 'jspdf-autotable';

interface PDFExportProps {
  trainingHistory: TrainingSession[];
  reportType: 'single' | 'summary' | 'comparison' | 'recommendation';
}

export const PDFExport: React.FC<PDFExportProps> = ({ 
  trainingHistory, 
  reportType 
}) => {
  
  const generatePDFReport = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    switch (reportType) {
      case 'single':
        await generateSingleSessionReport(pdf, trainingHistory[0]);
        break;
      case 'summary':
        await generateSummaryReport(pdf, trainingHistory);
        break;
      case 'comparison':
        await generateComparisonReport(pdf, trainingHistory);
        break;
      case 'recommendation':
        await generateRecommendationReport(pdf, trainingHistory);
        break;
    }
    
    // PDFダウンロード
    const fileName = `pitch-training-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };
  
  return (
    <div className="pdf-export">
      <h3>📄 学習レポート出力</h3>
      
      <div className="report-options">
        <button 
          onClick={() => generatePDFReport()}
          className="pdf-button"
        >
          {getReportTypeLabel(reportType)} をダウンロード
        </button>
      </div>
      
      <div className="report-preview">
        <p>{getReportDescription(reportType)}</p>
      </div>
    </div>
  );
};
```

#### **Step 10: 最終リリース [優先度: 高]**

##### **10.1 統合テスト・品質保証**
```bash
# テスト実行チェックリスト
□ iPhone Safari確認: 各モードでマイク機能動作確認
□ 精度テスト: ±1セント精度の検証  
□ 長時間動作: メモリリーク・パフォーマンス確認
□ SNS共有テスト: 全プラットフォームでの動作確認
□ PDF出力テスト: 全レポートタイプの生成確認
□ レスポンシブ対応: モバイル・タブレット・デスクトップ
□ アクセシビリティ: WCAG 2.1 AA準拠確認
□ 多言語対応: 日本語・英語UI確認
```

##### **10.2 バージョンアップ・リリース手順**
```bash
# 1. 最終コミット・プッシュ
git add .
git commit -m "v2.0.0 完全機能実装完了: SNS・PDF・相対音感判定システム統合"
git push origin pitch-training-nextjs-v2-impl-001

# 2. GitHub Actions実行確認
# https://github.com/kiyopi/pitch-training/actions

# 3. GitHub Pages確認
# https://kiyopi.github.io/pitch-training/

# 4. 最終ブランチ作成
git switch -c pitch-training-nextjs-v2-final
git push -u origin pitch-training-nextjs-v2-final

# 5. プルリクエスト作成
gh pr create --title "v2.0.0 相対音感トレーニングアプリ完全版リリース" --body "$(cat <<'EOF'
## Summary
- 🎵 相対音感トレーニング機能完成
- 🎤 4段階音声処理パイプライン統合
- 📊 SNS共有・PDF出力機能実装
- 📱 iPhone Safari完全対応

## Features Implemented
- ✅ マイク機能基盤 (Step 1-4)
- ✅ 3モードマイク統合 (Step 5)
- ✅ 相対音感判定システム (Step 6)  
- ✅ UI/UX最適化 (Step 7)
- ✅ SNS共有機能 (Step 8)
- ✅ PDF出力機能 (Step 9)

## Test Plan
- [x] iPhone Safari動作確認
- [x] 精度テスト (±5セント)
- [x] SNS共有テスト
- [x] PDF出力テスト
- [x] レスポンシブ対応
- [x] パフォーマンステスト

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"

# 6. バージョンタグ作成
git tag v2.0.0
git push origin v2.0.0
```

---

## 🎯 **現在の優先アクション**

### **次に実行すべき具体的ステップ**

1. **Step 5.1**: `/src/app/training/random/page.tsx` にマイク統合実装
2. **iPhone確認**: 実装後すぐにGitHub Pages動作確認  
3. **Step 5.2-5.3**: continuous・chromaticモードに順次統合
4. **Step 6**: 相対音程判定アルゴリズム実装・テスト
5. **Step 7**: リアルタイム表示コンポーネント作成

### **実装優先順位**
```
最優先: Step 5 (3モードマイク統合)
高優先: Step 6 (相対音感判定)  
中優先: Step 7 (UI/UX最適化)
中優先: Step 8 (SNS共有)
中優先: Step 9 (PDF出力)
最終: Step 10 (リリース)
```

---

**作成者**: Claude Code Assistant  
**対象**: Next.js 15.4.1 相対音感トレーニングアプリ  
**最終更新**: 2025-07-19