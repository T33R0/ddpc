'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SubmitIssueState = {
    success?: boolean
    error?: string
}

export async function submitIssueReport(
    prevState: SubmitIssueState | null,
    formData: FormData
): Promise<SubmitIssueState> {
    const supabase = await createClient()

    const description = formData.get('description') as string
    const url = formData.get('url') as string
    const email = formData.get('email') as string
    const screenshotUrl = formData.get('screenshotUrl') as string | null

    if (!description || !url) {
        return { error: 'Missing required fields' }
    }

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

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

        revalidatePath('/admin/issues')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error submitting issue report:', error)
        return { error: 'An unexpected error occurred' }
    }
}
