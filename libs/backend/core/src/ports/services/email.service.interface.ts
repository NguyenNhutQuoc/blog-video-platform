/**
 * Email Service Interface
 *
 * Port interface for sending emails (verification, password reset, etc.)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerificationEmailData {
  to: string;
  username: string;
  verificationUrl: string;
  expiresInHours: number;
}

export interface PasswordResetEmailData {
  to: string;
  username: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface WelcomeEmailData {
  to: string;
  username: string;
}

/**
 * Email Service Port
 *
 * Defines the contract for sending various types of emails.
 */
export interface IEmailService {
  /**
   * Send a raw email
   */
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;

  /**
   * Send email verification email
   */
  sendVerificationEmail(data: VerificationEmailData): Promise<SendEmailResult>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(
    data: PasswordResetEmailData
  ): Promise<SendEmailResult>;

  /**
   * Send welcome email after successful registration
   */
  sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult>;

  /**
   * Check if email service is configured and ready
   */
  isConfigured(): boolean;
}
