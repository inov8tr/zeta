#!/usr/bin/env node
// Import reading passages + linked questions into Supabase.
// Usage:
//   dotenv -e .env.local -- node scripts/import-reading-csv.mjs entrancetest/Reading/Reading_Passages_Level_1.csv entrancetest/Reading/Reading_Questions_Level_1.csv --dry-run
//   dotenv -e .env.local -- node scripts/import-reading-csv.mjs <passages.csv> <questions.csv> --commit

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const args = { passagesFile: null, questionsFile: null, dryRun: true, setSize: 4 };
  const files = [];
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a) continue;
    if (!a.startsWith('--')) { files.push(a); continue; }
    if (a === '--commit' || a === '--no-dry-run') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--set-size=')) args.setSize = Number(a.split('=')[1]) || 4;
  }
  if (files.length >= 2) {
    args.passagesFile = files[0];
    args.questionsFile = files[1];
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
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
    else { cur += ch; }
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

function parseLevelSublevel(seed) {
  const s = String(seed || '').trim();
  const [lvl, sub] = s.includes('.') ? s.split('.') : [s, '1'];
  const level = Number.parseInt(lvl, 10) || 1;
  const sublevel = sub === '2' ? '2' : sub === '3' ? '3' : '1';
  return { level, sublevel };
}

function optsFromRow(row) {
  const c1 = row['choice_1'] ?? '';
  const c2 = row['choice_2'] ?? '';
  const c3 = row['choice_3'] ?? '';
  const c4 = row['choice_4'] ?? '';
  return [c1, c2, c3, c4].filter((x) => String(x).trim().length > 0 && String(x).trim().toUpperCase() !== 'N/A');
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.passagesFile || !args.questionsFile) {
    console.error('Usage: node scripts/import-reading-csv.mjs <passages.csv> <questions.csv> [--dry-run|--commit] [--set-size=4]');
    process.exit(1);
  }

  const passagesText = await readFile(args.passagesFile, 'utf8');
  const questionsText = await readFile(args.questionsFile, 'utf8');
  const passagesRows = parseCSV(passagesText);
  const questionsRows = parseCSV(questionsText);

  // Build passage inserts
  const passageInserts = [];
  const passageCsvIdToObj = new Map();
  for (const p of passagesRows) {
    const csvId = String(p['passage_id']).trim();
    const { level, sublevel } = parseLevelSublevel(p['level']);
    const title = String(p['title'] || '').trim();
    const body = String(p['passage_text'] || '').trim();
    const media_url = String(p['media_url'] || '').trim();
    const issues = [];
    if (!title) issues.push('missing title');
    if (!body) issues.push('missing body');
    passageInserts.push({
      csvId,
      section: 'reading',
      level,
      sublevel,
      title,
      body,
      tags: null,
      media_url: media_url || null,
      issues,
    });
    passageCsvIdToObj.set(csvId, { level, sublevel, title });
  }

  // Build question inserts
  const questionInserts = [];
  const qIssues = [];
  for (const q of questionsRows) {
    const pid = String(q['passage_id']).trim();
    const passageInfo = passageCsvIdToObj.get(pid);
    if (!passageInfo) {
      qIssues.push(`question ${q['question_id']} references unknown passage_id ${pid}`);
      continue;
    }
    const options = optsFromRow(q);
    const correct = String(q['correct_answer'] ?? '').trim();
    let answer_index = options.findIndex((o) => o === correct);
    if (answer_index === -1) {
      answer_index = options.findIndex((o) => String(o).toLowerCase() === correct.toLowerCase());
    }
    const stem = String(q['question_text'] || '').trim();
    const question_type = String(q['question_type'] || '').trim();
    const issues = [];
    if (!stem) issues.push('missing stem');
    if (options.length < 2) issues.push('not enough options');
    if (answer_index === -1) issues.push('correct answer not in options');
    questionInserts.push({
      csvPassageId: pid,
      level: passageInfo.level,
      sublevel: passageInfo.sublevel,
      stem,
      options,
      answer_index: answer_index === -1 ? 0 : answer_index,
      skill_tags: question_type ? [question_type] : null,
    });
  }

  const passageIssues = passageInserts.filter((p) => p.issues.length);
  const questionIssues = qIssues.concat(questionInserts.filter((q) => q.options?.length < 2 || q.stem === '' || q.answer_index === -1).map((q) => `invalid question for passage ${q.csvPassageId}`));

  console.log(`Passages: ${passageInserts.length}, Questions: ${questionsRows.length}`);
  if (passageIssues.length) console.log(`Passage issues: ${passageIssues.length}`);
  if (questionIssues.length) console.log(`Question issues: ${questionIssues.length}`);
  if (args.dryRun) {
    console.log('Dry run. First passage insert:');
    console.dir(passageInserts[0], { depth: null });
    console.log('First question insert:');
    console.dir(questionInserts[0], { depth: null });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Insert passages if missing, capture ids
  const insertedMap = new Map();
  for (const p of passageInserts) {
    // Try to find an existing passage with same title+level+sublevel
    let id = null;
    {
      const { data, error } = await supabase
        .from('question_passages')
        .select('id')
        .eq('section', 'reading')
        .eq('level', p.level)
        .eq('sublevel', p.sublevel)
        .eq('title', p.title)
        .limit(1)
        .maybeSingle();
      if (!error && data && data.id) {
        id = data.id;
      }
    }
    if (!id) {
      const { data, error } = await supabase
        .from('question_passages')
        .insert({ section: 'reading', level: p.level, sublevel: p.sublevel, title: p.title, body: p.body })
        .select('id')
        .limit(1)
        .single();
      if (error) {
        console.error('Insert passage failed:', error.message);
        process.exit(1);
      }
      id = data.id;
    }
    insertedMap.set(p.csvId, id);
  }

  // Insert questions in chunks
  const CHUNK = 100;
  const toInsert = questionInserts.map((q) => ({
    section: 'reading',
    level: q.level,
    sublevel: q.sublevel,
    passage_id: insertedMap.get(q.csvPassageId),
    stem: q.stem,
    options: q.options,
    answer_index: q.answer_index,
    skill_tags: q.skill_tags,
  }));
  // Skip existing questions (same stem+passage_id)
  const passageIds = Array.from(new Set(toInsert.map((q) => q.passage_id)));
  let existingKey = new Set();
  if (passageIds.length) {
    const { data, error } = await supabase
      .from('questions')
      .select('stem, passage_id')
      .in('passage_id', passageIds);
    if (error) {
      console.error('Fetch existing questions failed:', error.message);
      process.exit(1);
    }
    existingKey = new Set((data ?? []).map((r) => `${r.stem}||${r.passage_id}`));
  }

  const filtered = toInsert.filter((q) => !existingKey.has(`${q.stem}||${q.passage_id}`));
  let inserted = 0;
  for (let i = 0; i < filtered.length; i += CHUNK) {
    const chunk = filtered.slice(i, i + CHUNK);
    if (chunk.length === 0) continue;
    const { error } = await supabase.from('questions').insert(chunk);
    if (error) {
      console.error('Insert questions failed:', error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${filtered.length} questions...`);
  }
  console.log('Done. Inserted passages (new or reused):', passageInserts.length, 'questions:', inserted);
}

main().catch((err) => { console.error(err); process.exit(1); });
