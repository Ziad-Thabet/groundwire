import crypto from "crypto";

export function generateInviteToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashInviteToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function getInviteExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}
