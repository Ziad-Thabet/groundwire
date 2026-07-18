export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface InviteEmailParams {
  to: string;
  acceptUrl: string;
  workspaceName: string;
  inviterName: string;
  expiresInDays: number;
}

export interface IEmailProvider {
  sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;
  sendInviteEmail(params: InviteEmailParams): Promise<void>;
}
