import { prisma } from "../config/prisma";
import {
  createUser,
  findUserByEmail,
  setPasswordResetToken,
  findUserByResetTokenHash,
  resetUserPassword,
} from "../repositories/user.repository";
import { storeRefreshToken } from "../repositories/refreshToken.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { normalizeEmail } from "../utils/email";
import { signAccessToken } from "../utils/jwt";
import { generateRefreshToken, hashRefreshToken } from "../utils/refreshToken";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  getPasswordResetExpiry,
} from "../utils/passwordReset";
import { ConflictError, UnauthorizedError, LockedOutError } from "../utils/errors";
import { SignupInput, LoginInput } from "../domain/schemas/auth.schema";
import { emailProvider } from "../config/emailProvider";
import {
  getLockoutRemainingSeconds,
  recordFailedAttempt,
  clearFailedAttempts,
} from "../utils/accountLockout";
import { env } from "../env";

async function issueTokens(userId: string) {
  const accessToken = signAccessToken(userId);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);

  await storeRefreshToken({ userId, tokenHash, expiresAt });

  return { accessToken, refreshToken: rawRefreshToken };
}

export async function signup(input: SignupInput) {
  const email = normalizeEmail(input.email);

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const { user, workspace } = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: input.workspaceName },
    });

    const user = await createUser(
      { email, passwordHash, name: input.name },
      tx,
    );

    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: "owner" },
    });

    return { user, workspace };
  });

  const tokens = await issueTokens(user.id);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
    workspace: { id: workspace.id, name: workspace.name },
  };
}

export async function login(input: LoginInput, ip: string) {
  const email = normalizeEmail(input.email);

  const lockoutRemaining = await getLockoutRemainingSeconds(email, ip);
  if (lockoutRemaining !== null) {
    throw new LockedOutError(lockoutRemaining);
  }

  const user = await findUserByEmail(email);
  if (!user || user.deletedAt) {
    await recordFailedAttempt(email, ip);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    await recordFailedAttempt(email, ip);
    throw new UnauthorizedError("Invalid email or password");
  }

  await clearFailedAttempts(email, ip);

  const tokens = await issueTokens(user.id);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user || user.deletedAt) {
    return;
  }

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = getPasswordResetExpiry();

  await setPasswordResetToken(user.id, tokenHash, expiresAt);

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  await emailProvider.sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    expiresInMinutes: 60,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashPasswordResetToken(token);
  const user = await findUserByResetTokenHash(tokenHash);

  if (
    !user ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt < new Date()
  ) {
    throw new UnauthorizedError("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);
  await resetUserPassword(user.id, passwordHash);
}
