import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { runScan } from "../lib/scanner";
import { TARGETS, type RankingEntry, type RankingSnapshot } from "../lib/ministries";

async function scanOne(target: (typeof TARGETS)[number]): Promise<RankingEntry> {
  try {
    const r = await runScan(target.url);
    return {
      name: target.name,
      url: target.url,
      group: target.group,
      grade: r.grade,
      totalScore: r.totalScore,
      totalMax: r.totalMax,
      categories: r.categories.map((c) => ({
        id: c.id,
        title: c.title,
        score: c.score,
        max: c.max,
      })),
    };
  } catch (err) {
    return {
      name: target.name,
      url: target.url,
      group: target.group,
      grade: "F",
      totalScore: 0,
      totalMax: 0,
      categories: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  const CONCURRENCY = 6;
  const queue = [...TARGETS];
  const results: RankingEntry[] = [];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const t = queue.shift();
      if (!t) break;
      process.stderr.write(`  scanning ${t.name} (${t.url})…\n`);
      const r = await scanOne(t);
      process.stderr.write(
        `    ${r.grade} ${r.totalScore}/${r.totalMax}${r.error ? " ERR:" + r.error.slice(0, 60) : ""}\n`,
      );
      results.push(r);
    }
  });
  await Promise.all(workers);

  results.sort((a, b) => b.totalScore - a.totalScore);

  const snapshot: RankingSnapshot = {
    generatedAt: new Date().toISOString(),
    entries: results,
  };
  const outDir = path.resolve("public/data");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "rankings.json");
  await writeFile(outFile, JSON.stringify(snapshot, null, 2) + "\n");
  process.stderr.write(`\nwrote ${outFile} (${results.length} targets)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
