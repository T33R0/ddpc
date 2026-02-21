import { NextResponse } from 'next/server'
import { runUserReminders } from '@/features/steward/scheduler/user-reminders'

// Vercel cron: runs weekly on Monday at 9am UTC
// Configure in vercel.json: { "path": "/api/steward/cron/reminders", "schedule": "0 9 * * 1" }
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Security: validate cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runUserReminders()

    console.log(
      `[Cron/Reminders] Sent ${result.emailsSent} emails to ${result.usersNotified} users. Errors: ${result.errors.length}`
    )

    if (result.errors.length > 0) {
      console.error('[Cron/Reminders] Errors:', result.errors)
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Cron/Reminders] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
