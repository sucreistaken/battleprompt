#!/usr/bin/env node
/**
 * i18n parity check — Story 6.10.
 *
 * Walks i18n/dict.ts and confirms every key in the `tr` block is present in
 * the `en` block (and vice-versa). Exits non-zero with a clear missing-key
 * list on failure.
 *
 * The dict is parsed by regex (not imported) so this script runs as plain
 * Node without TS tooling. The dict's structure is flat (no nested objects
 * under tr/en), so a single-pass key extraction is sufficient.
 *
 * Wired to npm run i18n:check.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '..', 'i18n', 'dict.ts');

if (!fs.existsSync(dictPath)) {
  console.error(`x i18n/dict.ts not found at ${dictPath}`);
  process.exit(2);
}

const src = fs.readFileSync(dictPath, 'utf8');

function sliceBlock(blockName) {
  const startRe = new RegExp(`\\b${blockName}\\s*:\\s*\\{`, 'g');
  const startMatch = startRe.exec(src);
  if (!startMatch) return null;
  let depth = 1;
  let i = startMatch.index + startMatch[0].length;
  const blockStart = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(blockStart, i - 1);
}

function collectKeys(block) {
  if (!block) return new Set();
  const keys = new Set();
  // Match indented `keyName:` lines. Heuristic: 2+ spaces then identifier then colon.
  const re = /^[ \t]{2,}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm;
  let m;
  while ((m = re.exec(block)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

const trBlock = sliceBlock('tr');
const enBlock = sliceBlock('en');

if (!trBlock) {
  console.error('x Could not locate `tr:` block in dict.ts');
  process.exit(2);
}
if (!enBlock) {
  console.error('x Could not locate `en:` block in dict.ts');
  process.exit(2);
}

const tr = collectKeys(trBlock);
const en = collectKeys(enBlock);

const missingInEn = [...tr].filter((k) => !en.has(k)).sort();
const missingInTr = [...en].filter((k) => !tr.has(k)).sort();

if (missingInEn.length === 0 && missingInTr.length === 0) {
  console.log(
    `OK i18n parity — tr=${tr.size} keys, en=${en.size} keys, all matched.`
  );
  process.exit(0);
}

console.error('x i18n parity FAIL:');
if (missingInEn.length) {
  console.error(`  Missing in EN (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`    - ${k}`);
}
if (missingInTr.length) {
  console.error(`  Missing in TR (${missingInTr.length}):`);
  for (const k of missingInTr) console.error(`    - ${k}`);
}
process.exit(1);
