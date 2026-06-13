import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoJp = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-jp" });
const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-noto-serif",
});

export const metadata: Metadata = {
  title: "Nリーグ",
  description: "Nリーグの成績・スケジュール管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoJp.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 py-8 sm:py-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
