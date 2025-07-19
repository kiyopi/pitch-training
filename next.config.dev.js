/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;