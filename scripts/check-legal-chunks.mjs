#!/usr/bin/env node
import fs from "node:fs";
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/check-legal-chunks.mjs chunks.json");
const data = JSON.parse(fs.readFileSync(input, "utf8"));
const chunks = data.chunks;
const counts = new Map();
for (const chunk of chunks) counts.set(chunk.article_number, (counts.get(chunk.article_number) ?? 0) + 1);
const duplicateNumbers = [...counts.entries()].filter(([, count]) => count > 1).map(([number, count]) => ({ number, count }));
const empty = chunks.filter((chunk) => !chunk.content || chunk.content.length < 20).length;
const suspicious = chunks.filter((chunk) => /�|آآ|أآ|ﻣﺎدة/.test(chunk.content)).length;
const oversized = chunks.filter((chunk) => chunk.content.length > 12000).length;
console.log(JSON.stringify({
  chunk_count: chunks.length,
  extracted_chars: data.extracted_chars,
  duplicate_article_numbers: duplicateNumbers.slice(0, 20),
  duplicate_count: duplicateNumbers.length,
  empty_chunks: empty,
  suspicious_encoding_chunks: suspicious,
  oversized_chunks: oversized,
  ready_for_database: empty === 0 && oversized === 0,
  requires_human_text_review: suspicious > 0 || duplicateNumbers.length > 0,
}, null, 2));
