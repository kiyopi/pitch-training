import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';
const isAnalyze = process.env.ANALYZE === 'true';

const nextConfig: NextConfig = isDevelopment ? {
  // 開発専用設定：GitHub Pages設定を完全に無効化
  output: undefined,
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  
  // 画像最適化は開発でも無効
  images: {
    unoptimized: true,
  },
  
  // パフォーマンス最適化
  webpack: (config, { isServer }) => {
    // バンドル分析 (開発環境のみ)
    if (isAnalyze && !isServer && isDevelopment) {
      try {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins = config.plugins || [];
        config.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'server' }));
      } catch (e) {
        console.log('Bundle analyzer not available in development');
      }
    }
    
    // バンドル最適化
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Tone.js専用チャンク
            tone: {
              test: /[\\/]node_modules[\\/]tone[\\/]/,
              name: 'tone',
              chunks: 'all',
              priority: 30,
            },
            // Pitchy専用チャンク
            pitchy: {
              test: /[\\/]node_modules[\\/]pitchy[\\/]/,
              name: 'pitchy', 
              chunks: 'all',
              priority: 30,
            },
            // UIライブラリチャンク
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20,
            }
          }
        }
      };
    }
    return config;
  },
  
  // 実験的機能
  experimental: {
    esmExternals: true,
  },
} : {
  // 本番専用設定：GitHub Pages対応
  output: 'export',
  
  // 画像最適化無効化（GitHub Pages制限）
  images: {
    unoptimized: true,
  },
  
  // ベースパス設定（GitHub Pages用）
  basePath: '/pitch-training',
  
  // アセットプレフィックス
  assetPrefix: '/pitch-training',
  
  // トレイリングスラッシュ
  trailingSlash: true,
  
  // パフォーマンス最適化
  webpack: (config, { isServer }) => {
    // バンドル最適化
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Tone.js専用チャンク
            tone: {
              test: /[\\/]node_modules[\\/]tone[\\/]/,
              name: 'tone',
              chunks: 'all',
              priority: 30,
            },
            // Pitchy専用チャンク
            pitchy: {
              test: /[\\/]node_modules[\\/]pitchy[\\/]/,
              name: 'pitchy', 
              chunks: 'all',
              priority: 30,
            },
            // UIライブラリチャンク
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20,
            }
          }
        }
      };
    }
    return config;
  },
  
  // 実験的機能
  experimental: {
    // ESMライブラリ対応
    esmExternals: true,
  },
};

export default nextConfig;
