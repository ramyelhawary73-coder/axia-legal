#!/usr/bin/env node
import fs from "node:fs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) args.set(process.argv[i].slice(2), process.argv[i + 1]);
}
const input = args.get("input");
const output = args.get("output");
const reportPath = args.get("report");
if (!input || !output || !reportPath) throw new Error("Usage: node scripts/clean-legal-chunks.mjs --input chunks.json --output clean.json --report report.json");

// Explicit, deterministic OCR corrections observed in this corpus. Do not generalize these substitutions to other corpora without review.
const replacements = [
  ["المحاآم", "المحاكم"], ["أآتوبر", "أكتوبر"], ["آقانون", "كقانون"],
  ["أآثرها", "أكثرها"], ["أآثره", "أكثره"], ["أآثر", "أكثر"], ["الأآثر", "الأكثر"],
  ["بأآثر", "بأكثر"], ["لأآثر", "لأكثر"], ["أآبر", "أكبر"], ["الأآبر", "الأكبر"],
  ["أآان", "كان"], ["آانت", "كانت"], ["أآانت", "كانت"], ["آان", "كان"],
  ["آما", "كما"], ["،آما", "،كما"], ["آله", "كله"], ["آلها", "كلها"],
  ["،وآل", "،وكل"], [".آل", ".كل"], ["آل", "كل"],
  ["أآره", "أكره"], ["أآد", "أكد"], ["أآمله", "بأكمله"], ["بأآمله", "بأكمله"],
  ["أآمل", "أكمل"], ["آالأآشاك", "كالأكشاك"], ["مأآل", "مأكل"],
];

const data = JSON.parse(fs.readFileSync(input, "utf8"));
const report = [];
for (const chunk of data.chunks) {
  let content = chunk.content;
  const applied = [];
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      const before = content;
      content = content.split(from).join(to);
      if (before !== content) applied.push({ from, to });
    }
  }
  if (applied.length) report.push({ chunk_index: chunk.chunk_index, article_number: chunk.article_number, replacements: applied });
  chunk.content = content;
  chunk.metadata = { ...chunk.metadata, cleaning: "explicit-ocr-map-v1", cleaning_review_required: true };
}
const remaining = data.chunks.filter((chunk) => /�|آآ|أآ/.test(chunk.content)).map((chunk) => ({ chunk_index: chunk.chunk_index, article_number: chunk.article_number }));
data.cleaning = { map_version: "explicit-ocr-map-v1", changed_chunks: report.length, remaining_suspicious_chunks: remaining.length, human_review_required: true };
fs.writeFileSync(output, JSON.stringify(data, null, 2));
fs.writeFileSync(reportPath, JSON.stringify({ map_version: "explicit-ocr-map-v1", changes: report, remaining_suspicious_chunks: remaining }, null, 2));
console.log(JSON.stringify({ output, report: reportPath, changed_chunks: report.length, remaining_suspicious_chunks: remaining.length }, null, 2));
