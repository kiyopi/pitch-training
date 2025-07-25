import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundaryProvider } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🎵 相対音感トレーニング v3.0",
  description: "3つのトレーニングモードで相対音感を効果的に鍛えるWebアプリケーション",
  keywords: ["相対音感", "音感訓練", "音楽", "トレーニング", "音程", "ドレミファソラシド"],
  authors: [{ name: "Pitch Training Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "🎵 相対音感トレーニング v3.0",
    description: "3つのトレーニングモードで相対音感を効果的に鍛える",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundaryProvider showDetails={process.env.NODE_ENV === 'development'}>
          {children}
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
