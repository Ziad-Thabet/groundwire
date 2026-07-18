import { Invite, MemberRole, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export async function findPendingInvite(
  workspaceId: string,
  email: string,
  client: Client = prisma,
): Promise<Invite | null> {
  return client.invite.findFirst({
    where: { workspaceId, email, status: "pending" },
  });
}

export async function createInvite(
  data: {
    workspaceId: string;
    email: string;
    role: MemberRole;
    tokenHash: string;
    expiresAt: Date;
  },
  client: Client = prisma,
): Promise<Invite> {
  return client.invite.create({
    data: {
      workspaceId: data.workspaceId,
      email: data.email,
      role: data.role,
      token: data.tokenHash,
      expiresAt: data.expiresAt,
    },
  });
}

export async function regenerateInvite(
  id: string,
  data: { tokenHash: string; expiresAt: Date; role: MemberRole },
  client: Client = prisma,
): Promise<Invite> {
  return client.invite.update({
    where: { id },
    data: {
      token: data.tokenHash,
      expiresAt: data.expiresAt,
      role: data.role,
    },
  });
}

export async function findInviteByTokenHash(
  tokenHash: string,
  client: Client = prisma,
): Promise<Invite | null> {
  return client.invite.findUnique({ where: { token: tokenHash } });
}

export async function markInviteAccepted(
  id: string,
  client: Client = prisma,
): Promise<Invite> {
  return client.invite.update({
    where: { id },
    data: { status: "accepted" },
  });
}
