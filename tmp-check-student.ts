import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('
');
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    process.env[key] = value;
  }
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const studentId = process.argv[2];
if (!studentId) {
  console.error('Usage: node tmp-check-student.ts <student_id>');
  process.exit(1);
}

const { data, error } = await supabase
  .from('students')
  .select('id, student_name, parent_email, survey_token, survey_token_expiry, survey_completed')
  .eq('id', studentId)
  .single();

if (error) {
  console.error('Error fetching student:', error);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
