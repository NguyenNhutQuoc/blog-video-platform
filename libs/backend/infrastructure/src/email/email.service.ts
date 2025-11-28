/**
 * Email Service Implementation
 *
 * Uses Nodemailer with:
 * - Ethereal for development (auto-generates test account)
 * - SendGrid/SMTP for production
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type {
  IEmailService,
  EmailOptions,
  SendEmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
  WelcomeEmailData,
} from '@blog/backend/core';

export interface EmailServiceConfig {
  /** SMTP host (e.g., smtp.sendgrid.net) */
  host?: string;
  /** SMTP port (default: 587) */
  port?: number;
  /** Use TLS (default: true) */
  secure?: boolean;
  /** SMTP username */
  user?: string;
  /** SMTP password or API key */
  password?: string;
  /** Sender email address */
  fromEmail: string;
  /** Sender name */
  fromName: string;
  /** App base URL for generating links */
  appUrl: string;
  /** Use Ethereal for development (auto-creates test account) */
  useEthereal?: boolean;
}

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private config: EmailServiceConfig;
  private etherealAccount: { user: string; pass: string } | null = null;

  constructor(config: EmailServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize the email transporter
   */
  async initialize(): Promise<void> {
    if (this.config.useEthereal) {
      // Create Ethereal test account for development
      const testAccount = await nodemailer.createTestAccount();
      this.etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass,
      };

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Email Service: Using Ethereal test account');
      console.log(`   User: ${testAccount.user}`);
    } else if (this.config.host && this.config.user && this.config.password) {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port || 587,
        secure: this.config.secure ?? false,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });

      console.log('📧 Email Service: Using SMTP configuration');
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    if (!this.transporter) {
      console.warn('⚠️ Email service not configured, skipping email send');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      // For Ethereal, log the preview URL
      if (this.config.useEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('📧 Email preview URL:', previewUrl);
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send email:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendVerificationEmail(
    data: VerificationEmailData
  ): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .content { background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #1d4ed8; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
    .warning { color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Blog Video Platform</div>
    </div>
    <div class="content">
      <h2>Welcome, ${data.username}! 👋</h2>
      <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
      </p>
      <p class="warning">This link will expire in ${data.expiresInHours} hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${data.verificationUrl}</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Welcome, ${data.username}!

Thank you for signing up! Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in ${data.expiresInHours} hours.

If you didn't create an account, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: data.to,
      subject: 'Verify Your Email Address - Blog Video Platform',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(
    data: PasswordResetEmailData
  ): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .content { background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; }
    .button { display: inline-block; background: #dc2626; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #b91c1c; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
    .warning { color: #dc2626; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Blog Video Platform</div>
    </div>
    <div class="content">
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${data.username},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </p>
      <p class="warning">⚠️ This link will expire in ${data.expiresInMinutes} minutes.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
    </div>
    <div class="footer">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${data.resetUrl}</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Password Reset Request

Hi ${data.username},

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in ${data.expiresInMinutes} minutes.

If you didn't request a password reset, please ignore this email.
    `;

    return this.sendEmail({
      to: data.to,
      subject: 'Reset Your Password - Blog Video Platform',
      html,
      text,
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
    .content { background: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
    .feature { display: flex; align-items: center; margin: 10px 0; }
    .feature-icon { margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Blog Video Platform</div>
    </div>
    <div class="content">
      <h2>Welcome to Blog Video Platform! 🎉</h2>
      <p>Hi ${data.username},</p>
      <p>Your email has been verified and your account is now active. Here's what you can do:</p>
      <ul>
        <li>📝 Create and publish blog posts</li>
        <li>🎬 Upload and share videos</li>
        <li>💬 Engage with the community</li>
        <li>📚 Bookmark your favorite content</li>
      </ul>
      <p style="text-align: center;">
        <a href="${this.config.appUrl}" class="button">Get Started</a>
      </p>
    </div>
    <div class="footer">
      <p>Need help? Contact our support team anytime.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Welcome to Blog Video Platform!

Hi ${data.username},

Your email has been verified and your account is now active. Here's what you can do:

- Create and publish blog posts
- Upload and share videos
- Engage with the community
- Bookmark your favorite content

Get started at: ${this.config.appUrl}

Need help? Contact our support team anytime.
    `;

    return this.sendEmail({
      to: data.to,
      subject: 'Welcome to Blog Video Platform! 🎉',
      html,
      text,
    });
  }
}

/**
 * Create and initialize email service
 */
export async function createEmailService(
  config: EmailServiceConfig
): Promise<EmailService> {
  const service = new EmailService(config);
  await service.initialize();
  return service;
}
