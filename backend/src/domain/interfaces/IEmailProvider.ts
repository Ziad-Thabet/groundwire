export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface IEmailProvider {
  sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;
}
