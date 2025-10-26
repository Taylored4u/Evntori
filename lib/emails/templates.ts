export interface BookingEmailData {
  renterName: string;
  lenderName: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingId: string;
}

export interface MessageEmailData {
  senderName: string;
  recipientName: string;
  listingTitle: string;
  messagePreview: string;
  conversationId: string;
}

export interface ReviewEmailData {
  reviewerName: string;
  listingTitle: string;
  rating: number;
  comment: string;
  listingId: string;
}

export function getBookingConfirmationEmail(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: serif;">Evntori</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px;">Booking Confirmed! 🎉</h2>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.renterName},
          </p>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
            Great news! Your booking for <strong>${data.listingTitle}</strong> has been confirmed.
          </p>

          <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666;">Rental Period:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 600;">
                  ${data.startDate} - ${data.endDate}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666;">Lender:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 600;">
                  ${data.lenderName}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; border-top: 1px solid #e0e0e0; padding-top: 15px;">Total:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 700; font-size: 20px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                  $${data.totalPrice.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://evntori.com'}/bookings/${data.bookingId}"
               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">
              View Booking Details
            </a>
          </div>

          <p style="color: #666666; line-height: 1.6; font-size: 14px; margin: 30px 0 0 0;">
            If you have any questions, feel free to message ${data.lenderName} directly through the platform.
          </p>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Evntori. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getNewBookingLenderEmail(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: serif;">Evntori</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px;">New Booking Received 🎊</h2>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.lenderName},
          </p>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
            You have a new booking request for <strong>${data.listingTitle}</strong>!
          </p>

          <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666;">Renter:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 600;">
                  ${data.renterName}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666;">Rental Period:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 600;">
                  ${data.startDate} - ${data.endDate}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; border-top: 1px solid #e0e0e0; padding-top: 15px;">Earnings:</td>
                <td style="padding: 8px 0; color: #000000; text-align: right; font-weight: 700; font-size: 20px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                  $${data.totalPrice.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://evntori.com'}/sell/bookings/${data.bookingId}"
               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">
              Manage Booking
            </a>
          </div>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Evntori. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getNewMessageEmail(data: MessageEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Message</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: serif;">Evntori</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px;">New Message 💬</h2>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${data.recipientName},
          </p>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
            ${data.senderName} sent you a message about <strong>${data.listingTitle}</strong>:
          </p>

          <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
            <p style="color: #333333; line-height: 1.6; margin: 0; font-style: italic;">
              "${data.messagePreview}"
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://evntori.com'}/messages?conversation=${data.conversationId}"
               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">
              Reply to Message
            </a>
          </div>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Evntori. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getNewReviewEmail(data: ReviewEmailData): string {
  const stars = '⭐'.repeat(data.rating);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Review</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: serif;">Evntori</h1>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px;">New Review Received ⭐</h2>

          <p style="color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
            ${data.reviewerName} left a review for <strong>${data.listingTitle}</strong>:
          </p>

          <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
            <div style="font-size: 24px; margin: 0 0 15px 0; text-align: center;">
              ${stars}
            </div>
            <p style="color: #333333; line-height: 1.6; margin: 0; font-style: italic; text-align: center;">
              "${data.comment}"
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://evntori.com'}/listing/${data.listingId}#reviews"
               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600;">
              View All Reviews
            </a>
          </div>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Evntori. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
