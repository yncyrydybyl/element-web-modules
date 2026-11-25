#!/usr/bin/env node
// Merge tests/reports/matrix/*.json into tests/reports/matrix/SUMMARY.md.
//   node tests/harness/matrix-summary.mjs [--only run1,run2]
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib.mjs';
import { REPORT_DIR, summaryMarkdown } from './matrixlib.mjs';

const a = parseArgs(process.argv.slice(2));
const only = a.only ? String(a.only).split(',') : null;
const reports = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith('.json') && f !== 'catalogue.json')
  .map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), 'utf8')))
  .filter((r) => r.results && (!only || only.includes(r.run)))
  .sort((x, y) => x.run.localeCompare(y.run));
// a report with "supersedes": <run> replaces that run's results for the same (case, theme, viewport)
for (const r of reports.filter((x) => x.supersedes)) {
  const baseRep = reports.find((x) => x.run === r.supersedes);
  if (!baseRep) continue;
  const key = (x) => `${x.case}|${x.theme}|${x.viewport || ''}`;
  const newer = new Set(r.results.map(key));
  const before = baseRep.results.length;
  baseRep.results = baseRep.results.filter((x) => !newer.has(key(x)));
  baseRep.superseded = (baseRep.superseded || 0) + before - baseRep.results.length;
}
const out = path.join(REPORT_DIR, 'SUMMARY.md');
fs.writeFileSync(out, summaryMarkdown(reports));
console.log(`${reports.length} reports → ${out}`);
