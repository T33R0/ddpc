import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export interface ReminderResult {
  usersNotified: number
  emailsSent: number
  errors: string[]
}

interface ServiceInterval {
  id: string
  name: string
  due_date: string | null
  due_miles: number | null
  interval_miles: number | null
  interval_months: number | null
  user_vehicle_id: string
}

interface VehicleInfo {
  id: string
  nickname: string | null
  year: number | null
  make: string | null
  model: string | null
  odometer: number | null
  owner_id: string
}

interface UserReminder {
  vehicleDisplayName: string
  serviceName: string
  dueMessage: string
  urgency: 'overdue' | 'due-soon' | 'approaching'
}

/**
 * Scan all users' service intervals and send personalized reminder emails.
 * Uses admin client (service role) to query across all users.
 *
 * Logic:
 * - Overdue: due_date < now OR due_miles < current odometer
 * - Due soon: due_date within 14 days OR due_miles within 500 miles
 * - Approaching: due_date within 30 days OR due_miles within 1000 miles
 */
export async function runUserReminders(): Promise<ReminderResult> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let usersNotified = 0
  let emailsSent = 0

  try {
    // 1. Fetch all active service intervals with vehicle + owner info
    const { data: intervals, error: intervalsError } = await supabase
      .from('service_intervals')
      .select('id, name, due_date, due_miles, interval_miles, interval_months, user_vehicle_id')

    if (intervalsError) {
      errors.push(`Failed to fetch intervals: ${intervalsError.message}`)
      return { usersNotified: 0, emailsSent: 0, errors }
    }

    if (!intervals || intervals.length === 0) {
      return { usersNotified: 0, emailsSent: 0, errors }
    }

    // 2. Get all referenced vehicles
    const vehicleIds = [...new Set(intervals.map((i: ServiceInterval) => i.user_vehicle_id))]
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('user_vehicle')
      .select('id, nickname, year, make, model, odometer, owner_id')
      .in('id', vehicleIds)

    if (vehiclesError || !vehicles) {
      errors.push(`Failed to fetch vehicles: ${vehiclesError?.message}`)
      return { usersNotified: 0, emailsSent: 0, errors }
    }

    const vehicleMap = new Map<string, VehicleInfo>()
    vehicles.forEach((v: VehicleInfo) => vehicleMap.set(v.id, v))

    // 3. Get all user emails via auth.users (admin only)
    const ownerIds = [...new Set(vehicles.map((v: VehicleInfo) => v.owner_id))]
    const userEmails = new Map<string, string>()

    // Batch fetch users from auth
    for (const ownerId of ownerIds) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId)
      if (!userError && userData?.user?.email) {
        userEmails.set(ownerId, userData.user.email)
      }
    }

    // 4. Check email preferences — respect unsubscribes
    // Find the "service-reminders" channel (we'll create it in migration)
    const { data: reminderChannel } = await supabase
      .from('email_channels')
      .select('id')
      .eq('slug', 'service-reminders')
      .maybeSingle()

    const unsubscribedUsers = new Set<string>()
    if (reminderChannel) {
      const { data: prefs } = await supabase
        .from('user_email_preferences')
        .select('user_id')
        .eq('channel_id', reminderChannel.id)
        .eq('is_subscribed', false)

      prefs?.forEach((p: { user_id: string }) => unsubscribedUsers.add(p.user_id))
    }

    // 5. Evaluate each interval and group reminders by user
    const now = new Date()
    const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const userReminders = new Map<string, UserReminder[]>()

    for (const interval of intervals as ServiceInterval[]) {
      const vehicle = vehicleMap.get(interval.user_vehicle_id)
      if (!vehicle) continue

      const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      const odometer = vehicle.odometer || 0
      let urgency: UserReminder['urgency'] | null = null
      let dueMessage = ''

      // Check date-based
      if (interval.due_date) {
        const dueDate = new Date(interval.due_date)
        if (dueDate < now) {
          urgency = 'overdue'
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
          dueMessage = `${daysOverdue} days overdue`
        } else if (dueDate <= fourteenDays) {
          urgency = 'due-soon'
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          dueMessage = `due in ${daysLeft} days`
        } else if (dueDate <= thirtyDays) {
          urgency = 'approaching'
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          dueMessage = `due in ${daysLeft} days`
        }
      }

      // Check mileage-based (overrides date if more urgent)
      if (interval.due_miles && odometer > 0) {
        const milesLeft = interval.due_miles - odometer
        if (milesLeft <= 0) {
          urgency = 'overdue'
          dueMessage = dueMessage
            ? `${dueMessage} and ${Math.abs(milesLeft)} miles overdue`
            : `${Math.abs(milesLeft)} miles overdue`
        } else if (milesLeft <= 500 && urgency !== 'overdue') {
          urgency = 'due-soon'
          dueMessage = dueMessage
            ? `${dueMessage} (${milesLeft} miles remaining)`
            : `${milesLeft} miles remaining`
        } else if (milesLeft <= 1000 && !urgency) {
          urgency = 'approaching'
          dueMessage = dueMessage
            ? `${dueMessage} (${milesLeft} miles remaining)`
            : `${milesLeft} miles remaining`
        }
      }

      if (!urgency) continue

      const ownerId = vehicle.owner_id
      if (!userReminders.has(ownerId)) {
        userReminders.set(ownerId, [])
      }
      userReminders.get(ownerId)!.push({
        vehicleDisplayName: vehicleName,
        serviceName: interval.name,
        dueMessage,
        urgency,
      })
    }

    // 6. Send emails per user
    for (const [userId, reminders] of userReminders) {
      // Skip unsubscribed users
      if (unsubscribedUsers.has(userId)) continue

      const email = userEmails.get(userId)
      if (!email) {
        errors.push(`No email for user ${userId}`)
        continue
      }

      // Sort: overdue first, then due-soon, then approaching
      const priority = { overdue: 0, 'due-soon': 1, approaching: 2 }
      reminders.sort((a, b) => priority[a.urgency] - priority[b.urgency])

      const overdueCount = reminders.filter(r => r.urgency === 'overdue').length
      const dueSoonCount = reminders.filter(r => r.urgency === 'due-soon').length

      // Build subject line
      let subject = 'ddpc service reminder'
      if (overdueCount > 0) {
        subject = `⚠️ ${overdueCount} overdue service${overdueCount > 1 ? 's' : ''} — ddpc`
      } else if (dueSoonCount > 0) {
        subject = `🔧 Service coming up — ddpc`
      }

      // Build email HTML
      const html = buildReminderEmail(reminders)

      const result = await sendEmail({ to: email, subject, html })
      if (result.success) {
        emailsSent++
        usersNotified++
      } else {
        errors.push(`Failed to send to ${email}: ${result.error}`)
      }
    }

    return { usersNotified, emailsSent, errors }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Unexpected error: ${msg}`)
    return { usersNotified, emailsSent, errors }
  }
}

function buildReminderEmail(reminders: UserReminder[]): string {
  const urgencyStyles = {
    overdue: { bg: '#fef2f2', border: '#ef4444', label: 'OVERDUE', color: '#dc2626' },
    'due-soon': { bg: '#fffbeb', border: '#f59e0b', label: 'DUE SOON', color: '#d97706' },
    approaching: { bg: '#f0fdf4', border: '#22c55e', label: 'UPCOMING', color: '#16a34a' },
  }

  const reminderRows = reminders
    .map((r) => {
      const style = urgencyStyles[r.urgency]
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${style.bg}; color: ${style.color}; border: 1px solid ${style.border}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em;">
                ${style.label}
              </span>
            </div>
            <div style="margin-top: 6px;">
              <strong style="color: #111827;">${r.serviceName}</strong>
              <span style="color: #6b7280;"> — ${r.vehicleDisplayName}</span>
            </div>
            <div style="color: #6b7280; font-size: 13px; margin-top: 2px;">
              ${r.dueMessage}
            </div>
          </td>
        </tr>`
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
      <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.02em; text-transform: lowercase;">
            ddpc service reminder
          </h1>
        </div>

        <div style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            ${reminderRows}
          </table>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://myddpc.com/garage"
             style="display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: lowercase;">
            open your garage
          </a>
        </div>

        <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
          <p>you're getting this because you set up service reminders on ddpc.</p>
          <p><a href="https://myddpc.com/account" style="color: #6b7280;">manage preferences</a></p>
        </div>
      </div>
    </body>
    </html>`
}
