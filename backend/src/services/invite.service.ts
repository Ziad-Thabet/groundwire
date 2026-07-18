import { prisma } from "../config/prisma";
import { withTenantContext } from "../db/withTenantContext";
import {
  findPendingInvite,
  createInvite,
  regenerateInvite,
  findInviteByTokenHash,
  markInviteAccepted,
} from "../repositories/invite.repository";
import {
  findUserByEmail,
  findUserById,
  createUser,
} from "../repositories/user.repository";
import { hashPassword } from "../utils/password";
import { normalizeEmail } from "../utils/email";
import {
  generateInviteToken,
  hashInviteToken,
  getInviteExpiry,
} from "../utils/invite";
import { UnauthorizedError, ValidationError } from "../utils/errors";
import { emailProvider } from "../config/emailProvider";
import { issueTokens } from "./auth.service";
import { env } from "../env";
import { MemberRole } from "@prisma/client";

export async function createOrResendInvite(
  workspaceId: string,
  inviterUserId: string,
  email: string,
  role: MemberRole,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) {
    throw new UnauthorizedError("Workspace not found");
  }

  const inviter = await findUserById(inviterUserId);
  const inviterName = inviter?.name ?? "A workspace admin";

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = getInviteExpiry();

  const existing = await findPendingInvite(workspaceId, normalizedEmail);

  if (existing) {
    await regenerateInvite(existing.id, { tokenHash, expiresAt, role });
  } else {
    await createInvite({
      workspaceId,
      email: normalizedEmail,
      role,
      tokenHash,
      expiresAt,
    });
  }

  const acceptUrl = `${env.FRONTEND_URL}/invite/accept?token=${rawToken}`;

  await emailProvider.sendInviteEmail({
    to: normalizedEmail,
    acceptUrl,
    workspaceName: workspace.name,
    inviterName,
    expiresInDays: 7,
  });
}

export async function checkInviteStatus(token: string): Promise<{
  valid: boolean;
  workspaceName?: string;
  role?: MemberRole;
  hasExistingAccount?: boolean;
}> {
  const tokenHash = hashInviteToken(token);
  const invite = await findInviteByTokenHash(tokenHash);

  if (
    !invite ||
    invite.status !== "pending" ||
    invite.expiresAt < new Date()
  ) {
    return { valid: false };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
  });
  const existingUser = await findUserByEmail(invite.email);

  return {
    valid: true,
    workspaceName: workspace?.name,
    role: invite.role,
    hasExistingAccount: !!existingUser && !existingUser.deletedAt,
  };
}

export async function acceptInvite(
  token: string,
  name?: string,
  password?: string,
) {
  const tokenHash = hashInviteToken(token);
  const invite = await findInviteByTokenHash(tokenHash);

  if (
    !invite ||
    invite.status !== "pending" ||
    invite.expiresAt < new Date()
  ) {
    throw new UnauthorizedError("Invalid or expired invite");
  }

  let existingUser = await findUserByEmail(invite.email);

  if (existingUser && existingUser.deletedAt) {
    throw new UnauthorizedError("Invalid or expired invite");
  }

  if (!existingUser && (!name || !password)) {
    throw new ValidationError(
      "Name and password are required to accept this invite",
    );
  }

  const user = await withTenantContext(invite.workspaceId, async (tx) => {
    let user = existingUser;

    if (!user) {
      const passwordHash = await hashPassword(password!);
      user = await createUser(
        { email: invite.email, passwordHash, name: name! },
        tx,
      );
    }

    const alreadyMember = await tx.workspaceMember.findFirst({
      where: { workspaceId: invite.workspaceId, userId: user.id },
    });

    if (!alreadyMember) {
      await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      });
    }

    await markInviteAccepted(invite.id, tx);

    return user;
  });

  const tokens = await issueTokens(user.id);

  return {
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
    workspaceId: invite.workspaceId,
  };
}
