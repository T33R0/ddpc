'use server'

import { createClient } from '@/lib/supabase/server';
import { scanStructureData } from '@/lib/structure-scanner';

export async function refreshStructureAction() {
  const supabase = await createClient();

  // 1. Authorization Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  try {
    // 2. Scan Current Structure
    // In production (Vercel), process.cwd() is usually the root of the function.
    // However, source files might not be present. The user has confirmed they understand this limitation/requirement.
    const foundItems = await scanStructureData();

    if (foundItems.length === 0) {
        return { success: false, message: 'No structure items found. Ensure source code is available in this environment.' };
    }

    const foundIds = new Set(foundItems.map(item => item.id));

    // 3. Fetch Existing DB Records to determine archiving
    const { data: existingRecords, error: fetchError } = await supabase
      .from('app_structure')
      .select('id, status');

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingRecords?.map(r => r.id));

    // 4. Perform Updates (Upsert)
    // We process in batches if necessary, but for <500 items a loop is fine or bulk upsert.
    // Supabase .upsert() is efficient.

    const upsertData = foundItems.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      path: item.path,
      metadata: item.metadata, // Note: This might overwrite metadata edits. The user said "doesn't overwrite existing notes/images".
                               // Notes/Images are likely stored in SEPARATE columns or tables linked by ID?
                               // Or are they in metadata?
                               // The prompt says "imperative that running this script doesn't overwrite existing notes/images".
                               // If notes are in 'metadata', we should merge or NOT update metadata if it exists.
                               // The script was 'TRUNCATE', which wiped everything.
                               // The user wants to avoid wiping.
                               // So, we should only update 'last_updated' and 'status'.
                               // We should NOT overwrite 'metadata' if it exists.
                               // Wait, if we don't update metadata, how do we get new default props?
                               // Compromise: We fetch existing metadata and merge, OR we simply don't include metadata in the upsert if the record exists.
                               // But Supabase upsert replaces the row.
                               // We need to use ON CONFLICT DO UPDATE.
                               // Supabase client supports this.
    }));

    // We can't easily do "merge metadata" in a single bulk upsert without complex SQL.
    // A safer approach given the requirement:
    // Iterate and check.

    let updatedCount = 0;
    let insertedCount = 0;

    for (const item of foundItems) {
      if (existingIds.has(item.id)) {
        // Update: touch last_updated, set status active. preserve metadata.
        const { error } = await supabase
          .from('app_structure')
          .update({
            last_updated: new Date().toISOString(),
            status: 'active'
            // Do NOT update metadata, name, path, type (unless we want to fix them, but name/path usually stay same for same ID)
            // Actually, if path changed but ID stayed same (hash of name+type), path update is good.
            // But ID is hash of path for pages. So path won't change for same ID.
          })
          .eq('id', item.id);
        if (error) console.error('Error updating item:', item.id, error);
        else updatedCount++;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_structure')
          .insert({
            id: item.id,
            name: item.name,
            type: item.type,
            path: item.path,
            metadata: item.metadata,
            last_updated: new Date().toISOString(),
            status: 'active'
          });
        if (error) console.error('Error inserting item:', item.id, error);
        else insertedCount++;
      }
    }

    // 5. Handle Archiving
    const toArchive = existingRecords?.filter(r => !foundIds.has(r.id) && r.status !== 'archived') || [];
    if (toArchive.length > 0) {
      const idsToArchive = toArchive.map(r => r.id);
      await supabase
        .from('app_structure')
        .update({ status: 'archived', last_updated: new Date().toISOString() })
        .in('id', idsToArchive);
    }

    return {
      success: true,
      message: `Sync complete. Inserted: ${insertedCount}, Updated: ${updatedCount}, Archived: ${toArchive.length}`
    };

  } catch (error: any) {
    console.error('Structure sync failed:', error);
    return { success: false, message: error.message };
  }
}
