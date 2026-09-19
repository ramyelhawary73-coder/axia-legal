#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const value = process.argv[i];
  if (value.startsWith("--")) args.set(value.slice(2), process.argv[i + 1]);
}
const input = args.get("input");
const output = args.get("output");
if (!input || !output) throw new Error("Usage: node scripts/parse-legal-text.mjs --input file.txt --output chunks.json");

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const normalizeDigits = (value) => value.replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
const normalize = (value) => value.normalize("NFKC").replace(/[\u061C\u200E\u200F\u202A-\u202E]/g, "");
const clean = (value) => value.replace(/\s+/g, " ").trim();

const raw = normalize(fs.readFileSync(input, "utf8"));
const lines = raw.split(/\r?\n/).map(clean).filter(Boolean);
const text = lines.join("\n");
const articlePattern = /(?:^|\n)\s*مادة\s*(?:\([^\n)]{1,20}\)\s*)?(?:[-–—:]\s*)?([0-9٠-٩]{1,4})\s*[.،؛:)\-–—]?/g;
const matches = [...text.matchAll(articlePattern)];
if (matches.length === 0) throw new Error("No article markers found after Unicode normalization");

const chunks = [];
for (let index = 0; index < matches.length; index += 1) {
  const match = matches[index];
  const start = match.index + match[0].indexOf("مادة");
  const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
  const section = text.slice(start, end).trim();
  const articleNumber = normalizeDigits(match[1]);
  const headingLines = lines.filter((line) => line.length > 3 && line.length < 140 && !/مادة\s*[0-9٠-٩]/.test(line));
  const heading = headingLines.length ? headingLines[Math.min(index, headingLines.length - 1)] : null;
  chunks.push({
    chunk_index: index,
    article_number: articleNumber,
    heading,
    content: section,
    metadata: {
      parser: "parse-legal-text-v1",
      source_file: path.basename(input),
      normalized_unicode: true,
      test_only: true,
    },
  });
}

const result = {
  parser: "parse-legal-text-v1",
  source_file: path.basename(input),
  source_sha256: process.env.SOURCE_SHA256 ?? null,
  extracted_chars: text.length,
  chunk_count: chunks.length,
  chunks,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ output, extracted_chars: result.extracted_chars, chunk_count: result.chunk_count, first: chunks[0]?.article_number, last: chunks.at(-1)?.article_number }, null, 2));
