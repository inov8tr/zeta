#!/usr/bin/env node
// Purge all "reading" passages and linked questions from Supabase.
// - Dry run by default (prints counts only)
// - Use --commit to actually delete (cascades will remove linked questions and responses)
// Usage:
//   dotenv -e .env.local -- node scripts/clear-reading.mjs --dry-run
//   dotenv -e .env.local -- node scripts/clear-reading.mjs --commit

import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const args = { dryRun: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a) continue;
    if (a === '--commit' || a === '--no-dry-run') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function countRows(supabase) {
  const [{ count: passages, error: pErr }, { count: questions, error: qErr }, { count: responses, error: rErr }] = await Promise.all([
    supabase.from('question_passages').select('*', { count: 'exact', head: true }).eq('section', 'reading'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('section', 'reading'),
    supabase.from('responses').select('*', { count: 'exact', head: true }).eq('section', 'reading'),
  ]);
  if (pErr) throw new Error(`Count passages failed: ${pErr.message}`);
  if (qErr) throw new Error(`Count questions failed: ${qErr.message}`);
  if (rErr) throw new Error(`Count responses failed: ${rErr.message}`);
  return { passages: passages ?? 0, questions: questions ?? 0, responses: responses ?? 0 };
}

async function main() {
  const args = parseArgs(process.argv);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const before = await countRows(supabase);
  console.log(`Reading data present -> passages: ${before.passages}, questions: ${before.questions}, responses: ${before.responses}`);

  if (args.dryRun) {
    console.log('Dry run. No changes made. Re-run with --commit to delete.');
    return;
  }

  console.log('Deleting reading passages (will cascade delete linked questions and responses)...');
  {
    const { error } = await supabase
      .from('question_passages')
      .delete()
      .eq('section', 'reading');
    if (error) {
      console.error('Delete passages failed:', error.message);
      process.exit(1);
    }
  }

  // Safety: ensure any stray questions with section='reading' are removed (in case of schema drift)
  {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('section', 'reading');
    if (error) {
      console.error('Cleanup delete questions failed:', error.message);
      process.exit(1);
    }
  }

  const after = await countRows(supabase);
  console.log(`Done. Remaining -> passages: ${after.passages}, questions: ${after.questions}, responses: ${after.responses}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

