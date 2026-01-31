
import { NextResponse } from 'next/server';
import { runDailyHealthCheck } from '@/features/ogma/scheduler/daily-health';
import { sendEmail } from '@/lib/email';

// Mark as dynamic to avoid static generation issues with headers
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Run Health Check
    const report = await runDailyHealthCheck();
    console.log('[Cron] Daily health check run:', report);

    // 3. Format Email
    const subject = `Ogma Daily Briefing: ${report.status}`;
    
    // Simple HTML formatting
    const alertItems = report.alerts.map(a => 
      `<li style="color: ${a.severity === 'critical' ? 'red' : 'orange'}">
        <strong>${a.title}</strong>: ${a.message}
       </li>`
    ).join('');

    const html = `
      <h1>The State of the Shop is <span style="color: ${report.status === 'Red' ? 'red' : report.status === 'Yellow' ? 'orange' : 'green'}">${report.status}</span></h1>
      
      <h2>Summary</h2>
      <p>
        <strong>Daily Spend:</strong> $${report.stats.spend24h.toFixed(2)}<br/>
        <strong>Error Rate:</strong> ${report.stats.errorRate24h.toFixed(1)}%<br/>
        <strong>Active Alerts:</strong> ${report.alerts.length}
      </p>

      ${alertItems ? `<h2>Alerts</h2><ul>${alertItems}</ul>` : '<p>No active alerts.</p>'}
      
      <p><em>- Ogma Shop Foreman</em></p>
    `;

    // 4. Send Email
    const recipients = ['teehanrh@gmail.com', 'myddpc@gmail.com'];
    const emailResult = await sendEmail({
      to: recipients,
      subject,
      html,
      text: report.summary
    });

    if (!emailResult.success) {
      console.error('[Cron] Failed to send email:', emailResult.error);
      // We still return 200 because the health check itself ran, but we log the error
    }

    return NextResponse.json({ 
      success: true, 
      report, 
      emailSent: emailResult.success 
    });

  } catch (error) {
    console.error('[Cron] Error running daily health check:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
