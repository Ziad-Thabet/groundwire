import {
  IEmailProvider,
  PasswordResetEmailParams,
} from "../../domain/interfaces/IEmailProvider";

/**
 * Dev-mode email provider. Logs the reset link to the console instead of
 * sending a real email. Swap for a real IEmailProvider implementation
 * (SendGrid, Resend, SES, etc.) before production use.
 */
export class ConsoleEmailProvider implements IEmailProvider {
  async sendPasswordResetEmail(
    params: PasswordResetEmailParams,
  ): Promise<void> {
    console.log(
      `[ConsoleEmailProvider] Password reset requested for ${params.to}\n` +
        `  Reset URL: ${params.resetUrl}\n` +
        `  Expires in: ${params.expiresInMinutes} minutes`,
    );
  }
}
