'use client';

import { useState, useRef, useCallback } from 'react';
import {
  NoiseFilterConfig,
  FilterResponse,
  DEFAULT_NOISE_FILTER_CONFIG,
  createFilterChain,
  calculateFilterResponse,
  calculateAudioQualityMetrics,
  detectPowerLineFrequency,
} from '../utils/audioFilters';

/**
 * ノイズフィルタリングフック - Step 3
 * 
 * 目的: 音程検出精度向上のための1段階ノイズフィルタリング
 * 機能: 3段階フィルター（ハイパス・ローパス・ノッチ）、音声品質改善
 * 対象: Step 2音声処理基盤の拡張
 */

// ノイズフィルター状態
interface NoiseFilterState {
  isFiltering: boolean;
  isInitialized: boolean;
  highpassFilter: BiquadFilterNode | null;
  lowpassFilter: BiquadFilterNode | null;
  notchFilter: BiquadFilterNode | null;
  gainNode: GainNode | null;
  filterChainOutput: AudioNode | null;
  config: NoiseFilterConfig;
  error: string | null;
}

// 音声品質メトリクス
interface AudioQualityMetrics {
  snrImprovement: number;
  thd: number;
  dynamicRange: number;
  rmsOriginal: number;
  rmsFiltered: number;
  lastUpdate: number;
}

// NoiseFilterフックインターフェース
interface NoiseFilterHook {
  filterState: NoiseFilterState;
  applyFilters: (audioContext: AudioContext, sourceNode: AudioNode) => AudioNode | null;
  updateFilterConfig: (config: Partial<NoiseFilterConfig>) => void;
  resetFilters: () => void;
  getFilterResponse: (filterType: 'highpass' | 'lowpass' | 'notch') => FilterResponse | null;
  getAudioQualityMetrics: () => AudioQualityMetrics | null;
  enableFiltering: (enabled: boolean) => void;
  detectOptimalSettings: () => NoiseFilterConfig;
  resetError: () => void;
}

export const useNoiseFilter = (): NoiseFilterHook => {
  const [filterState, setFilterState] = useState<NoiseFilterState>({
    isFiltering: false,
    isInitialized: false,
    highpassFilter: null,
    lowpassFilter: null,
    notchFilter: null,
    gainNode: null,
    filterChainOutput: null,
    config: DEFAULT_NOISE_FILTER_CONFIG,
    error: null,
  });

  // フィルターチェーン関連のRef
  const filterChainRef = useRef<{
    highpassFilter: BiquadFilterNode;
    lowpassFilter: BiquadFilterNode;
    notchFilter: BiquadFilterNode;
    gainNode: GainNode;
    connectChain: (sourceNode: AudioNode) => AudioNode;
  } | null>(null);

  // 音声品質メトリクス
  const audioQualityRef = useRef<AudioQualityMetrics | null>(null);
  const originalDataRef = useRef<Float32Array | null>(null);
  const filteredDataRef = useRef<Float32Array | null>(null);

  /**
   * ノイズフィルターエラーハンドリング
   */
  const handleFilterError = (error: Error): string => {
    console.error('NoiseFilter error:', error);
    
    switch (error.name) {
      case 'InvalidStateError':
        return 'フィルターの状態が無効です。';
      case 'NotSupportedError':
        return 'このブラウザではBiquadFilterがサポートされていません。';
      case 'InvalidAccessError':
        return 'フィルターへのアクセスが拒否されました。';
      default:
        return `ノイズフィルターエラー: ${error.message}`;
    }
  };

  /**
   * フィルターチェーン適用
   */
  const applyFilters = useCallback((
    audioContext: AudioContext,
    sourceNode: AudioNode
  ): AudioNode | null => {
    try {
      if (!audioContext || !sourceNode) {
        throw new Error('AudioContextまたはSourceNodeが無効です');
      }

      console.log('🔧 Step 3: ノイズフィルタリング開始');

      // 電源周波数自動検出
      const powerLineFreq = detectPowerLineFrequency();
      const optimizedConfig = {
        ...filterState.config,
        notch: {
          ...filterState.config.notch,
          frequency: powerLineFreq,
        },
      };

      // フィルターチェーン作成
      const filterChain = createFilterChain(audioContext, optimizedConfig);
      filterChainRef.current = filterChain;

      // フィルターチェーン接続
      const outputNode = filterChain.connectChain(sourceNode);

      // 状態更新
      setFilterState(prev => ({
        ...prev,
        isFiltering: true,
        isInitialized: true,
        highpassFilter: filterChain.highpassFilter,
        lowpassFilter: filterChain.lowpassFilter,
        notchFilter: filterChain.notchFilter,
        gainNode: filterChain.gainNode,
        filterChainOutput: outputNode,
        config: optimizedConfig,
        error: null,
      }));

      console.log('✅ Step 3: ノイズフィルタリング適用完了');
      console.log('🔧 使用電源周波数:', powerLineFreq, 'Hz');
      console.log('🔧 フィルター設定:', optimizedConfig);

      return outputNode;

    } catch (error) {
      const errorMessage = handleFilterError(error as Error);
      setFilterState(prev => ({
        ...prev,
        error: errorMessage,
        isFiltering: false,
      }));
      console.error('❌ Step 3: ノイズフィルタリング失敗:', error);
      return null;
    }
  }, [filterState.config]);

  /**
   * フィルター設定更新
   */
  const updateFilterConfig = useCallback((config: Partial<NoiseFilterConfig>) => {
    setFilterState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...config,
      },
    }));

    // 既存フィルターの設定を動的更新
    if (filterChainRef.current) {
      const { highpassFilter, lowpassFilter, notchFilter } = filterChainRef.current;
      
      if (config.highpass) {
        highpassFilter.frequency.value = config.highpass.frequency;
        highpassFilter.Q.value = config.highpass.Q;
        highpassFilter.gain.value = config.highpass.gain;
      }
      
      if (config.lowpass) {
        lowpassFilter.frequency.value = config.lowpass.frequency;
        lowpassFilter.Q.value = config.lowpass.Q;
        lowpassFilter.gain.value = config.lowpass.gain;
      }
      
      if (config.notch) {
        notchFilter.frequency.value = config.notch.frequency;
        notchFilter.Q.value = config.notch.Q;
        notchFilter.gain.value = config.notch.gain;
      }
      
      console.log('🔧 フィルター設定更新完了');
    }
  }, []);

  /**
   * フィルターリセット
   */
  const resetFilters = useCallback(() => {
    try {
      console.log('🔄 Step 3: フィルターリセット開始');

      // フィルターチェーン切断
      if (filterChainRef.current) {
        const { highpassFilter, lowpassFilter, notchFilter, gainNode } = filterChainRef.current;
        
        // 各フィルターの切断
        try {
          highpassFilter.disconnect();
          lowpassFilter.disconnect();
          notchFilter.disconnect();
          gainNode.disconnect();
        } catch (error) {
          console.warn('フィルター切断時の警告:', error);
        }
        
        filterChainRef.current = null;
      }

      // 状態リセット
      setFilterState(prev => ({
        ...prev,
        isFiltering: false,
        isInitialized: false,
        highpassFilter: null,
        lowpassFilter: null,
        notchFilter: null,
        gainNode: null,
        filterChainOutput: null,
        error: null,
      }));

      // メトリクスリセット
      audioQualityRef.current = null;
      originalDataRef.current = null;
      filteredDataRef.current = null;

      console.log('✅ Step 3: フィルターリセット完了');

    } catch (error) {
      console.error('❌ Step 3: フィルターリセット失敗:', error);
      setFilterState(prev => ({
        ...prev,
        error: 'フィルターリセット中にエラーが発生しました。',
      }));
    }
  }, []);

  /**
   * フィルター周波数応答取得
   */
  const getFilterResponse = useCallback((
    filterType: 'highpass' | 'lowpass' | 'notch'
  ): FilterResponse | null => {
    if (!filterChainRef.current) return null;

    const { highpassFilter, lowpassFilter, notchFilter } = filterChainRef.current;
    
    let filter: BiquadFilterNode;
    switch (filterType) {
      case 'highpass':
        filter = highpassFilter;
        break;
      case 'lowpass':
        filter = lowpassFilter;
        break;
      case 'notch':
        filter = notchFilter;
        break;
      default:
        return null;
    }

    return calculateFilterResponse(filter);
  }, []);

  /**
   * 音声品質メトリクス取得
   */
  const getAudioQualityMetrics = useCallback((): AudioQualityMetrics | null => {
    if (!originalDataRef.current || !filteredDataRef.current) {
      return null;
    }

    try {
      const metrics = calculateAudioQualityMetrics(
        originalDataRef.current,
        filteredDataRef.current
      );

      audioQualityRef.current = {
        ...metrics,
        lastUpdate: Date.now(),
      };

      return audioQualityRef.current;
    } catch (error) {
      console.error('音声品質メトリクス計算エラー:', error);
      return null;
    }
  }, []);

  /**
   * フィルタリング有効/無効切り替え
   */
  const enableFiltering = useCallback((enabled: boolean) => {
    if (!filterChainRef.current) return;

    const { gainNode } = filterChainRef.current;
    
    // フィルタリングの有効/無効を音量で制御
    // 実際の実装では、フィルターをバイパスする仕組みが必要
    gainNode.gain.value = enabled ? 1.0 : 0.0;
    
    setFilterState(prev => ({
      ...prev,
      isFiltering: enabled,
    }));

    console.log(`🔧 フィルタリング${enabled ? '有効' : '無効'}化`);
  }, []);

  /**
   * 最適設定自動検出
   */
  const detectOptimalSettings = useCallback((): NoiseFilterConfig => {
    const powerLineFreq = detectPowerLineFrequency();
    
    // 環境に応じた最適設定
    const optimizedConfig: NoiseFilterConfig = {
      highpass: {
        frequency: 80,  // 人間の音声帯域に最適化
        Q: 0.7,
        gain: 0,
      },
      lowpass: {
        frequency: 4000, // 人間の音声帯域に最適化
        Q: 0.7,
        gain: 0,
      },
      notch: {
        frequency: powerLineFreq,
        Q: 15,  // より鋭いノッチ
        gain: -50, // より強い減衰
      },
    };

    console.log('🔧 最適設定検出:', optimizedConfig);
    return optimizedConfig;
  }, []);

  /**
   * エラーリセット
   */
  const resetError = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    filterState,
    applyFilters,
    updateFilterConfig,
    resetFilters,
    getFilterResponse,
    getAudioQualityMetrics,
    enableFiltering,
    detectOptimalSettings,
    resetError,
  };
};