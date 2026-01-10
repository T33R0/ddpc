import { Resend } from 'resend';

// Helper to get Resend instance safely
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined');
    return null;
  }
  return new Resend(apiKey);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.error('[Email] Failed to initialize Resend: API key missing');
    return { success: false, error: 'Resend API key missing' };
  }

  // Debug logging for email attempt
  console.log('[Email] Attempting to send email:', {
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    from: 'monitor@myddpc.com',
    hasText: !!text
  });

  try {
    const data = await resend.emails.send({
      from: 'monitor@myddpc.com',
      to,
      subject,
      html,
      text,
    });

    if (data.error) {
      console.error('[Email] Resend API returned error:', JSON.stringify(data.error, null, 2));
      return { success: false, error: data.error };
    }

    console.log('[Email] Email sent successfully:', data.data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Unexpected exception during send:', error);
    if (error instanceof Error) {
       console.error('[Email] Error details:', error.message, error.stack);
    }
    return { success: false, error: 'Unexpected error sending email' };
  }
}
