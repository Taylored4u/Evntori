import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  type?: 'booking' | 'message' | 'review' | 'payment'
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing Resend API key');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('Email send error:', result.error);
      return { success: false, error: result.error.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send exception:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
