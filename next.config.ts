import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

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
  
  // 実験的機能
  experimental: {
    // ESMライブラリ対応
    esmExternals: true,
  },
};

export default nextConfig;
