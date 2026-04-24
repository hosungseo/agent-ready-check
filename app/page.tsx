import type { Metadata } from "next";
import Scanner from "@/components/Scanner";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://agent-ready-check.vercel.app";

type SP = Promise<{ url?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SP;
}): Promise<Metadata> {
  const sp = await searchParams;
  const target = sp?.url;
  const baseTitle = "Agent-Ready Check";
  const baseDesc =
    "AI 에이전트가 당신의 사이트를 읽고 이해할 수 있는지 23가지 표준(153점 만점)을 점검하고, 실패 항목마다 고치는 법까지 보여줍니다.";

  if (!target) {
    return {
      title: `${baseTitle} — is your site ready for AI agents?`,
      description: baseDesc,
      openGraph: {
        title: baseTitle,
        description: baseDesc,
        url: SITE_URL,
        images: [{ url: `${SITE_URL}/og?url=${encodeURIComponent(SITE_URL)}` }],
      },
      twitter: { card: "summary_large_image" },
    };
  }

  const ogImage = `${SITE_URL}/og?url=${encodeURIComponent(target)}`;
  const display = target.replace(/^https?:\/\//, "");
  return {
    title: `${display} — Agent-Ready Check`,
    description: `${display}의 AI 에이전트 준비도 스캔 결과. ${baseDesc}`,
    openGraph: {
      title: `${display} — Agent-Ready Check`,
      description: `${display}의 AI 에이전트 준비도 스캔 결과`,
      url: `${SITE_URL}/?url=${encodeURIComponent(target)}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [ogImage] },
  };
}

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Scanner initialUrl={sp?.url} />
    </main>
  );
}
