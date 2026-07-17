import crypto from "crypto";

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashPasswordResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}
