import {
  IEmailProvider,
  PasswordResetEmailParams,
  InviteEmailParams,
} from "../../domain/interfaces/IEmailProvider";

/**
 * Dev-mode email provider. Logs the email content to the console instead of
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

  async sendInviteEmail(params: InviteEmailParams): Promise<void> {
    console.log(
      `[ConsoleEmailProvider] Workspace invite for ${params.to}\n` +
        `  ${params.inviterName} invited you to join "${params.workspaceName}"\n` +
        `  Accept URL: ${params.acceptUrl}\n` +
        `  Expires in: ${params.expiresInDays} days`,
    );
  }
}
