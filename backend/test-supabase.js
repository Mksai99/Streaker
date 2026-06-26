import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function test() {
  console.log('Testing insert...');
  const testId = 'test_' + Date.now();
  const { error: insertError } = await supabase.from('documents').upsert({
    id: testId,
    collection_name: 'users',
    data: { email: 'findme@example.com', name: 'John' }
  });
  if (insertError) {
    console.error('Insert failed:', insertError);
    return;
  }
  console.log('Inserted successfully!');

  console.log('Testing select without filter...');
  const { data: allData, error: allErr } = await supabase.from('documents').select('*').eq('collection_name', 'users');
  console.log('All data count:', allData?.length);

  console.log('Testing select with ->> filter...');
  const { data: filteredData, error: filterErr } = await supabase.from('documents').select('*').eq('collection_name', 'users').eq('data->>email', 'findme@example.com');
  if (filterErr) console.error('Filter error:', filterErr);
  console.log('Filtered data:', filteredData);

  // Clean up
  await supabase.from('documents').delete().eq('id', testId);
}
test();
