import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function test() {
  const { data, error } = await supabase.from('documents').select('*').eq('collection_name', 'users').eq('data->>email', 'test@example.com');
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
