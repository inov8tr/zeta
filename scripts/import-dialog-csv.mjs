#!/usr/bin/env node
// Import Dialog (speaking) CSV into Supabase `questions` (section = 'dialog').
// This flattens the dialog_text + question_text into the question stem so it renders without schema changes.
// Usage examples:
//   dotenv -e .env.local -- node scripts/import-dialog-csv.mjs entrancetest/Dialog/Speaking_Level_1.csv --dry-run
//   dotenv -e .env.local -- node scripts/import-dialog-csv.mjs entrancetest/Dialog/Speaking_Level_*.csv --commit

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const args = { files: [], dryRun: true, section: 'dialog', limit: null, skipExisting: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a) continue;
    if (!a.startsWith('--')) { args.files.push(a); continue; }
    if (a === '--commit' || a === '--no-dry-run') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--limit=')) args.limit = Number(a.split('=')[1]);
    else if (a === '--no-skip-existing') args.skipExisting = false;
  }
  return args;
}

// Robust CSV parser for multi-line quoted fields
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { row.push(field); field = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      row.push(field); field = '';
      if (row.length) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.replace(/\r$/, ''));
  const out = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    if (!r || (r.length === 1 && r[0].trim() === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').replace(/\r$/, ''); });
    out.push(obj);
  }
  return out;
}

function optsFromRow(row) {
  const c1 = row['choice_1'] ?? '';
  const c2 = row['choice_2'] ?? '';
  const c3 = row['choice_3'] ?? '';
  const c4 = row['choice_4'] ?? '';
  return [c1, c2, c3, c4]
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0 && x.toUpperCase() !== 'N/A');
}

function buildStem(dialogText, questionText) {
  const d = String(dialogText || '').trim();
  const q = String(questionText || '').trim();
  if (!d) return q;
  return `${d}\n\n${q}`;
}

function mapRowToInsert(row) {
  const level = Number(row['level'] ?? 1) || 1;
  const sublevelRaw = String(row['difficulty'] ?? '1').trim();
  const sublevel = sublevelRaw === '2' ? '2' : sublevelRaw === '3' ? '3' : '1';
  const dialogText = row['dialog_text'];
  const stem = buildStem(dialogText, row['question_text']);
  const options = optsFromRow(row);
  const correct = String(row['correct_answer'] ?? '').trim();
  let answer_index = options.findIndex((o) => o === correct);
  if (answer_index === -1) {
    answer_index = options.findIndex((o) => String(o).toLowerCase() === correct.toLowerCase());
  }
  const tags = [];
  const qt = String(row['question_type'] || '').trim();
  const gt = String(row['grammar_target'] || '').trim();
  if (qt) tags.push(qt);
  if (gt) tags.push(gt);
  const issues = [];
  if (!stem) issues.push('missing stem');
  if (options.length < 2) issues.push('not enough options');
  if (answer_index === -1) issues.push('correct answer not in options');
  return {
    issues,
    payload: {
      section: 'dialog',
      level,
      sublevel,
      passage_id: null,
      stem,
      options,
      answer_index: answer_index === -1 ? 0 : answer_index,
      skill_tags: tags.length ? tags : null,
      media_url: null,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.files.length) {
    console.error('Usage: node scripts/import-dialog-csv.mjs <file...> [--dry-run|--commit]');
    process.exit(1);
  }
  let rows = [];
  for (const f of args.files) {
    const txt = await readFile(f, 'utf8');
    rows = rows.concat(parseCSV(txt));
  }
  const selected = typeof args.limit === 'number' ? rows.slice(0, args.limit) : rows;
  const mapped = selected.map((r, i) => ({ idx: i + 2, id: r['question_id'], m: mapRowToInsert(r) }));
  const errors = mapped.filter((x) => x.m.issues.length);
  const ok = mapped.filter((x) => x.m.issues.length === 0);
  console.log(`Rows: ${rows.length}`);
  console.log(`Valid: ${ok.length}`);
  console.log(`With issues: ${errors.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 10)) {
      console.log(` - line ${e.idx} id=${e.id}: ${e.m.issues.join('; ')}`);
    }
    if (!args.dryRun) {
      console.error('Refusing to commit while issues are present. Fix data first or run dry-run.');
      process.exit(2);
    }
  }
  if (args.dryRun) {
    console.log('Sample payload:');
    console.dir(ok[0]?.m.payload, { depth: null });
    return;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Skip duplicates by (stem, level, sublevel, section)
  let inserts = ok.map((x) => x.m.payload);
  if (args.skipExisting) {
    const { data, error } = await supabase
      .from('questions')
      .select('stem, level, sublevel')
      .eq('section', 'dialog');
    if (error) {
      console.error('Failed to fetch existing:', error.message);
      process.exit(1);
    }
    const existing = new Set((data ?? []).map((r) => `${r.stem}||${r.level}||${r.sublevel}`));
    inserts = inserts.filter((p) => !existing.has(`${p.stem}||${p.level}||${p.sublevel}`));
  }

  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const chunk = inserts.slice(i, i + CHUNK);
    if (!chunk.length) continue;
    const { error } = await supabase.from('questions').insert(chunk);
    if (error) {
      console.error('Insert error:', error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${inserts.length}...`);
  }
  console.log('Done. Inserted:', inserted);
}

main().catch((err) => { console.error(err); process.exit(1); });
