import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Use Gmail SMTP for testing - in production you'd use a proper email service
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendWithdrawalRequestEmail(userEmail: string, userName: string, amount: string, withdrawalId: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
          .content { line-height: 1.6; color: #333; }
          .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
          .amount { font-size: 24px; font-weight: bold; color: #2196F3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎰 Withdrawal Request Received</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We've received your withdrawal request and our team is reviewing it.</p>
            
            <div class="highlight">
              <strong>Withdrawal Details:</strong><br>
              Amount: <span class="amount">$${amount}</span><br>
              Request ID: ${withdrawalId}<br>
              Status: Pending Review
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our admin team will review your request within 24 hours</li>
              <li>You'll receive an email once your request is approved or if we need more information</li>
              <li>Once approved, funds will be transferred to your specified account</li>
            </ul>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>
            The Lottery Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Withdrawal Request Received - $${amount}`,
      html: htmlContent,
    });
  }

  async sendWithdrawalStatusEmail(
    userEmail: string, 
    userName: string, 
    amount: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ) {
    const isApproved = status === 'approved';
    const statusColor = isApproved ? '#4CAF50' : '#f44336';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'Approved' : 'Rejected';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
          .content { line-height: 1.6; color: #333; }
          .status-box { background-color: ${statusColor}20; border: 2px solid ${statusColor}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status-text { color: ${statusColor}; font-size: 24px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎰 Withdrawal Request ${statusText}</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <div class="status-box">
              <div class="status-text">${statusIcon} ${statusText}</div>
              <p>Amount: $${amount}</p>
            </div>
            
            ${isApproved 
              ? '<p><strong>Great news!</strong> Your withdrawal request has been approved and is being processed. You should receive your funds within 3-5 business days.</p>'
              : '<p>Unfortunately, your withdrawal request has been rejected. Please see the details below.'
            }
            
            ${adminNotes ? `<p><strong>Admin Notes:</strong><br>${adminNotes}</p>` : ''}
            
            ${!isApproved ? '<p>If you have questions about this decision, please contact our support team.</p>' : ''}
            
            <p>Best regards,<br>
            The Lottery Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Withdrawal Request ${statusText} - $${amount}`,
      html: htmlContent,
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('📧 Email service not configured, email would be sent:', options.subject);
        return;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`📧 Email sent successfully to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Don't throw error to avoid breaking the withdrawal process
    }
  }
}

export const emailService = new EmailService();