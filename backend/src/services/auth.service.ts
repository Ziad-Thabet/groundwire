import { prisma } from "../config/prisma";
import { createUser, findUserByEmail } from "../repositories/user.repository";
import { storeRefreshToken } from "../repositories/refreshToken.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { normalizeEmail } from "../utils/email";
import { signAccessToken } from "../utils/jwt";
import { generateRefreshToken, hashRefreshToken } from "../utils/refreshToken";
import { ConflictError, UnauthorizedError } from "../utils/errors";
import { SignupInput, LoginInput } from "../domain/schemas/auth.schema";
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

export async function login(input: LoginInput) {
  const email = normalizeEmail(input.email);

  const user = await findUserByEmail(email);
  if (!user || user.deletedAt) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await issueTokens(user.id);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
