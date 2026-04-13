import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://taxuueemqtquihhzhgnr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY env var required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // 1. Count misclassified barbers
  const { count: totalMisclassified } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .ilike('name', '%barber%')
    .neq('business_type', 'barber')
    .eq('status', 'active');

  console.log(`Total misclassified barber businesses: ${totalMisclassified}`);

  if (!totalMisclassified || totalMisclassified === 0) {
    console.log('Nothing to fix.');
    return;
  }

  // 2. Update in batches of 500
  let updated = 0;
  while (updated < totalMisclassified) {
    const { data: batch, error: findErr } = await supabase
      .from('businesses')
      .select('id, name, business_type')
      .ilike('name', '%barber%')
      .neq('business_type', 'barber')
      .eq('status', 'active')
      .limit(500);

    if (findErr) {
      console.error('Query error:', findErr);
      process.exit(1);
    }

    if (!batch || batch.length === 0) break;

    const ids = batch.map((b) => b.id);
    const { error: updateErr } = await supabase
      .from('businesses')
      .update({ business_type: 'barber' })
      .in('id', ids);

    if (updateErr) {
      console.error('Update error:', updateErr);
      process.exit(1);
    }

    updated += batch.length;
    console.log(`  Updated batch of ${batch.length} (total: ${updated})`);
  }

  console.log(`\nDone. Updated ${updated} businesses to business_type = 'barber'`);

  // 3. Verify final counts
  const { count: barberCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('business_type', 'barber');

  const { count: salonCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('business_type', 'hair_salon');

  const { count: unisexCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('business_type', 'unisex');

  const { count: totalCount } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  console.log(`\nFinal breakdown:`);
  console.log(`  Barber:     ${barberCount}`);
  console.log(`  Hair Salon: ${salonCount}`);
  console.log(`  Unisex:     ${unisexCount}`);
  console.log(`  Total:      ${totalCount}`);
}

main().catch(console.error);
