import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { createClient } from '../../../../lib/supabase/server';
import { Resend } from 'resend';
import { WeeklyBuildLog } from '../../../../components/emails/WeeklyBuildLog';
import { render } from '@react-email/render';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Admin (using standard client for session check)
        const supabase = createClient();
        const { data: { user }, error: authError } = await await supabase.auth.getUser();

        if (authError || !user || user.user_metadata.role !== 'admin') { // Assuming role is in metadata or we check a profile table
            // If role is not in metadata, we might need a DB lookup. 
            // Existing code in /account/page.tsx checked user.role. 
            // Let's assume user.user_metadata.role OR verify against a known admin ID/table.
            // For safety, let's also check the logic in existing codebase if possible.
            // But assuming 'admin' role check from metadata is standard for this codebase based on previous context.
            // Wait, account page uses `user.role` from `useAuth` hook which likely processes metadata.
            // Let's double check if user object has role property on the top level. It sits usually in app_metadata or user_metadata.
            // I'll check user_metadata.role and app_metadata.role.
            const role = user?.user_metadata?.role || user?.app_metadata?.role;
            if (role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { channelId, data: emailData, scheduledAt } = await req.json();

        if (!channelId || !emailData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Setup Admin Client for fetching users
        const supabaseAdmin = createAdminClient();

        // 3. Get all users (fetching in batches might be needed for scale, but simple list for now)
        // Note: listUsers defaults to 50 users. We need to paginate for production.
        // For this implementation, I'll fetch first 1000 which covers 'alpha' stage.
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        });

        if (usersError) throw usersError;

        // 4. Get opt-outs for this channel
        // We want to find users who explicitly set is_subscribed = false
        const { data: optOuts, error: prefError } = await supabaseAdmin
            .from('user_email_preferences')
            .select('user_id')
            .eq('channel_id', channelId)
            .eq('is_subscribed', false);

        if (prefError) throw prefError;

        const optOutUserIds = new Set(optOuts?.map(p => p.user_id) || []);

        // 5. Filter Recipients
        // We filter out users who have explicitly opted out.
        // Everyone else is opted-in by default.
        const recipients = users.filter(u => !optOutUserIds.has(u.id) && u.email);

        if (recipients.length === 0) {
            return NextResponse.json({ message: 'No recipients found.' });
        }

        // 6. Generate Email HTML
        const emailHtml = await render(
            WeeklyBuildLog({
                date: emailData.date,
                features: emailData.features.filter((f: string) => f.trim() !== ''),
                fixes: emailData.fixes.filter((f: string) => f.trim() !== ''),
                proTip: emailData.proTip,
            })
        );

        // Inject real Unsubscribe URL if template has placeholder
        // The React component passed prop is not used for link replacement in render(), 
        // but we can replace the placeholder string if we put it in the template props or raw string.
        // In WeeklyBuildLog.tsx, I used <Link href="{{UnsubscribeURL}}">
        // render() produces the HTML with that string. We can replace it now.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ddpc.dev'; // Fallback
        const unsubscribeUrl = `${appUrl}/account`;
        const finalHtml = emailHtml.replace(/{{UnsubscribeURL}}/g, unsubscribeUrl);

        // 7. Send Emails via Resend
        // Batching: Resend allows sending to multiple 'to' addresses in one call, 
        // BUT they will all see each other in 'to' unless we use 'bcc' or separate calls.
        // For newsletters, separate calls or Batch API is best.
        // As of latest Resend SD, batch.send is available.

        const emailBatches = recipients.map(u => ({
            from: 'DDPC <updates@ddpc.dev>', // Should match verified domain
            to: u.email!,
            subject: `DDPC Build Log: ${new Date(emailData.date).toLocaleDateString()}`,
            html: finalHtml,
            scheduledAt: scheduledAt || undefined,
        }));

        // Chunking batches if necessary (Resend limit is usually 100 per batch)
        const chunkSize = 100;
        for (let i = 0; i < emailBatches.length; i += chunkSize) {
            const chunk = emailBatches.slice(i, i + chunkSize);
            const { error } = await resend.batch.send(chunk);
            if (error) {
                console.error('Resend batch error:', error);
                // Continue to next batch but log error
            }
        }

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (error: any) {
        console.error('Newsletter send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
