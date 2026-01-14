import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        // 1. Verify Admin
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role check - assuming consistent metadata location
        const role = user.user_metadata?.role || user.app_metadata?.role;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const channelId = searchParams.get('channelId');

        if (!channelId) {
            return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
        }

        // 2. Setup Admin Client
        const supabaseAdmin = createAdminClient();

        // 3. Get all users (limit to 1000 for now, same as send logic)
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        });

        if (usersError) throw usersError;

        // 4. Get opt-outs
        const { data: optOuts, error: prefError } = await supabaseAdmin
            .from('user_email_preferences')
            .select('user_id')
            .eq('channel_id', channelId)
            .eq('is_subscribed', false);

        if (prefError) throw prefError;

        const optOutUserIds = new Set(optOuts?.map(p => p.user_id) || []);

        // 5. Filter & Map Recipients
        const recipients = users
            .filter(u => !optOutUserIds.has(u.id) && u.email)
            .map(u => ({
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at
            }));

        return NextResponse.json({ recipients });

    } catch (error: any) {
        console.error('Fetch recipients error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
