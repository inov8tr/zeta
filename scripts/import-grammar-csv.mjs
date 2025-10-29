#!/usr/bin/env node
// Import Grammar Level CSV into Supabase `questions`
// Usage (dry run by default):
//   dotenv -e .env.local -- node scripts/import-grammar-csv.mjs "Grammar Level 1.csv" --dry-run
// Commit to DB:
//   dotenv -e .env.local -- node scripts/import-grammar-csv.mjs "Grammar Level 1.csv" --commit

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const args = { files: [], dryRun: true, section: 'grammar', limit: null, skipExisting: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a) continue;
    if (!a.startsWith('--')) { args.files.push(a); continue; }
    if (a === '--commit' || a === '--no-dry-run') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--section=')) args.section = a.split('=')[1];
    else if (a.startsWith('--limit=')) args.limit = Number(a.split('=')[1]);
    else if (a === '--no-skip-existing') args.skipExisting = false;
  }
  return args;
}

function parseCSVRow(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.replace(/\r$/, ''));
}

function parseCSV(text) {
  const lines = text.split(/\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCSVRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
    rows.push(row);
  }
  return rows;
}

function asNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (s.length === 0) return null;
  if (s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a') return null;
  return s;
}

function normalizeBoolStr(s) {
  if (s == null) return null;
  const t = String(s).trim().toUpperCase();
  if (t === 'TRUE') return 'TRUE';
  if (t === 'FALSE') return 'FALSE';
  return s;
}

function computeOptions(row) {
  const qtype = String(row['question_type'] || '').trim().toLowerCase();
  if (qtype === 'true/false' || qtype === 'truefalse' || qtype === 'true-false') {
    return ['TRUE', 'FALSE'];
  }
  const c1 = row['choice_1'] ?? '';
  const c2 = row['choice_2'] ?? '';
  const c3 = row['choice_3'] ?? '';
  const c4 = row['choice_4'] ?? '';
  return [c1, c2, c3, c4]
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0 && x.toUpperCase() !== 'N/A');
}

function toQuestionInsert(row, targetSection = 'grammar') {
  const section = String(row['section'] || '').trim().toLowerCase();
  if (section !== targetSection) return { skip: true, reason: `section ${section} != ${targetSection}` };
  const stem = String(row['question_text'] || '').trim();
  const options = computeOptions(row);
  const qtype = String(row['question_type'] || '').trim().toLowerCase();
  let correct = row['correct_answer'];
  if (qtype.includes('true')) correct = normalizeBoolStr(correct);

  let answerIndex = options.findIndex((o) => o === correct);
  if (answerIndex === -1) {
    // try case-insensitive match
    answerIndex = options.findIndex((o) => String(o).toLowerCase() === String(correct).toLowerCase());
  }

  const level = Number(row['level'] ?? 1);
  const sublevelRaw = String(row['difficulty'] ?? '1').trim();
  const sublevel = sublevelRaw === '2' ? '2' : sublevelRaw === '3' ? '3' : '1';
  const typeTags = asNull(row['type']);
  const skill_tags = typeTags
    ? typeTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : null;
  const media_url = asNull(row['media_url']);
  const instructions = asNull(row['instructions']);

  const issues = [];
  if (!stem) issues.push('missing stem');
  if (options.length < 2) issues.push('not enough options');
  if (answerIndex === -1) issues.push(`correct answer not in options: ${correct}`);
  if (Number.isNaN(level) || level < 1) issues.push(`invalid level: ${row['level']}`);

  return {
    skip: false,
    issues,
    payload: {
      section: targetSection,
      level,
      sublevel,
      passage_id: null,
      stem,
      options,
      answer_index: answerIndex === -1 ? 0 : answerIndex,
      skill_tags,
      media_url,
      instructions,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.files.length) {
    console.error('Usage: node scripts/import-grammar-csv.mjs <file...> [--dry-run|--commit] [--limit=N] [--no-skip-existing]');
    process.exit(1);
  }

  let rows = [];
  for (const file of args.files) {
    const text = await readFile(file, 'utf8');
    const parsed = parseCSV(text);
    rows = rows.concat(parsed);
  }
  const selected = typeof args.limit === 'number' ? rows.slice(0, args.limit) : rows;

  const mapped = selected.map((r, idx) => ({ idx: idx + 2, id: r.id, result: toQuestionInsert(r, args.section) }));

  const errors = mapped.filter((m) => !m.result.skip && m.result.issues.length > 0);
  const skipped = mapped.filter((m) => m.result.skip);
  const ok = mapped.filter((m) => !m.result.skip && m.result.issues.length === 0);

  console.log(`Parsed rows: ${rows.length}`);
  if (skipped.length) console.log(`Skipped (section mismatch): ${skipped.length}`);
  console.log(`Valid: ${ok.length}`);
  console.log(`With issues: ${errors.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 10)) {
      console.log(` - line ${e.idx} id=${e.id}: ${e.result.issues.join('; ')}`);
    }
    if (!args.dryRun) {
      console.error('Refusing to commit while issues are present. Run in --dry-run and fix data first.');
      process.exit(2);
    }
  }

  if (args.dryRun) {
    console.log('\nDry run. First 2 payloads:');
    for (const ex of ok.slice(0, 2)) {
      console.dir(ex.result.payload, { depth: null });
    }
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. Use dotenv -e .env.local -- node ...');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Preflight: ensure schema exists (questions table)
  {
    const { error: pingError } = await supabase.from('questions').select('id').limit(1);
    if (pingError) {
      const msg = String(pingError.message || pingError.toString());
      console.error('Schema check failed: questions table not accessible.');
      console.error('Error:', msg);
      console.error('\nYour Supabase project is missing the adaptive test schema.');
      console.error('Apply the migrations before importing:');
      console.error(' - supabase/migrations/20251012112359_adaptive_test_engine.sql');
      console.error(' - supabase/migrations/20251012121500_test_section_passage.sql');
      console.error('\nQuick options:');
      console.error('  1) Supabase Dashboard → SQL Editor → paste contents of those files → Run');
      console.error('  2) supabase CLI: supabase link --project-ref <ref> && supabase db push');
      process.exit(1);
    }
  }

  let inserts = ok.map((m) => m.result.payload);

  if (args.skipExisting) {
    console.log('Checking for existing questions to skip duplicates...');
    const levels = Array.from(new Set(inserts.map((p) => p.level)));
    let existingSet = new Set();
    if (levels.length) {
      const { data, error } = await supabase
        .from('questions')
        .select('stem, level, sublevel')
        .eq('section', args.section)
        .in('level', levels);
      if (error) {
        console.error('Failed to fetch existing questions:', error.message);
        process.exit(1);
      }
      existingSet = new Set((data ?? []).map((d) => `${d.stem}||${d.level}||${d.sublevel}`));
    }
    const before = inserts.length;
    inserts = inserts.filter((p) => !existingSet.has(`${p.stem}||${p.level}||${p.sublevel}`));
    console.log(`Skipping ${before - inserts.length} existing; ${inserts.length} to insert.`);
  }

  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const chunk = inserts.slice(i, i + CHUNK);
    if (chunk.length === 0) continue;
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
