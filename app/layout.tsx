import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent-Ready Check — is your site ready for AI agents?",
  description:
    "AI 에이전트가 당신의 사이트를 읽고 이해할 수 있는지 스캔합니다. robots.txt, sitemap, llms.txt, MCP, 마크다운 협상을 한 번에 점검하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-mono">{children}</body>
    </html>
  );
}
