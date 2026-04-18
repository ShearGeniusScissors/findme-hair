import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';

const BUCKET = 'business-photos';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const supabase = supabaseServiceRole();

  // Verify auth via Supabase anon client header forwarding
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const businessId = form.get('businessId') as string | null;
  const mediaType = (form.get('mediaType') as string | null) ?? 'gallery';

  if (!file || !businessId) {
    return NextResponse.json({ error: 'Missing file or businessId' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 400 });
  }

  // Verify the user owns this business
  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('claimed_by', user.id)
    .maybeSingle();

  if (!biz) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${businessId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Get next sort order
  const { data: existing } = await supabase
    .from('business_media')
    .select('sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextSort = ((existing?.[0]?.sort_order as number | undefined) ?? 0) + 1;

  const { data: media, error: dbErr } = await supabase
    .from('business_media')
    .insert({
      business_id: businessId,
      storage_path: storagePath,
      media_type: mediaType,
      sort_order: nextSort,
    })
    .select()
    .single();

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ media, publicUrl });
}

export async function DELETE(req: NextRequest) {
  const supabase = supabaseServiceRole();

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mediaId } = await req.json();
  if (!mediaId) return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });

  // Fetch media row + verify ownership via business
  const { data: media } = await supabase
    .from('business_media')
    .select('id, storage_path, business_id, businesses!inner(claimed_by)')
    .eq('id', mediaId)
    .maybeSingle();

  const claimed = (media?.businesses as unknown as { claimed_by: string } | null)?.claimed_by;
  if (!media || claimed !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabase.storage.from(BUCKET).remove([media.storage_path]);
  await supabase.from('business_media').delete().eq('id', mediaId);

  return NextResponse.json({ ok: true });
}
