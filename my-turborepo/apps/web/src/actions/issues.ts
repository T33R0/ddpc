'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SubmitIssueState = {
    success?: boolean
    error?: string
}

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

export async function submitIssueReport(
    prevState: SubmitIssueState | null,
    formData: FormData
): Promise<SubmitIssueState> {
    const supabase = await createClient()

    const description = formData.get('description') as string
    const url = formData.get('url') as string
    const email = formData.get('email') as string
    const screenshot = formData.get('screenshot') as File | null

    if (!description || !url) {
        return { error: 'Missing required fields' }
    }

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        let screenshotUrl = null

        if (screenshot && screenshot.size > 0) {
            // Validate file type
            if (!screenshot.type.startsWith('image/')) {
                return { error: 'File must be an image' }
            }

            // Validate file size (max 4MB)
            if (screenshot.size > 4 * 1024 * 1024) {
                return { error: 'File size must be less than 4MB' }
            }

            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (!serviceRoleKey) {
                console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
                return { error: 'Server configuration error' }
            }

            const serviceClient = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            )

            const fileExt = screenshot.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const arrayBuffer = await screenshot.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const { error: uploadError } = await serviceClient.storage
                .from('issue-attachments')
                .upload(filePath, buffer, {
                    contentType: screenshot.type,
                    upsert: false
                })

            if (uploadError) {
                console.error('Failed to upload screenshot:', uploadError)
                return { error: 'Failed to upload screenshot' }
            }

            const { data: { publicUrl } } = serviceClient.storage
                .from('issue-attachments')
                .getPublicUrl(filePath)

            screenshotUrl = publicUrl
        }

        const { error } = await supabase.from('issue_reports').insert({
            user_email: email || (user?.email ?? 'anonymous'),
            page_url: url,
            description,
            screenshot_url: screenshotUrl,
            resolved: false,
        })

        if (error) {
            console.error('Error submitting issue report:', error)
            return { error: 'Failed to submit report' }
        }

        // --- NEW ISSUE NOTIFICATION ---
        try {
            // Find admins to notify
            const { data: admins } = await supabase
                .from('user_profile')
                .select('user_id')
                .eq('role', 'admin')
                .eq('notify_on_issue_report', true);

            if (admins && admins.length > 0) {
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                if (serviceRoleKey) {
                    const adminClient = createServiceClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        serviceRoleKey,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    );

                    const adminIds = admins.map(a => a.user_id);
                    const { data: { users: allUsers }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

                    if (!listError && allUsers) {
                        const adminEmails = allUsers
                            .filter(u => adminIds.includes(u.id) && u.email)
                            .map(u => u.email as string);

                        if (adminEmails.length > 0) {
                            await sendEmail({
                                to: adminEmails,
                                subject: 'New Issue Reported - DDPC',
                                html: `
                                    <h2>New Issue Reported</h2>
                                    <p><strong>User:</strong> ${email || 'Anonymous'}</p>
                                    <p><strong>Page:</strong> ${url}</p>
                                    <p><strong>Description:</strong> ${description}</p>
                                    ${screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">View Screenshot</a></p>` : ''}
                                `
                            });
                        }
                    }
                }
            }
        } catch (notifyError) {
            console.error('Failed to send issue notification:', notifyError);
        }
        // --- END NOTIFICATION ---

        revalidatePath('/admin/issues')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error submitting issue report:', error)
        return { error: 'An unexpected error occurred' }
    }
}
