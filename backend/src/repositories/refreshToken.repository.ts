import { Prisma, RefreshToken } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export async function storeRefreshToken(
  data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceLabel?: string;
  },
  client: Client = prisma,
): Promise<RefreshToken> {
  return client.refreshToken.create({ data });
}

export async function findRefreshTokenByHash(
  tokenHash: string,
  client: Client = prisma,
): Promise<RefreshToken | null> {
  return client.refreshToken.findUnique({ where: { tokenHash } });
}

export async function revokeRefreshToken(
  id: string,
  client: Client = prisma,
): Promise<RefreshToken> {
  return client.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(
  userId: string,
  client: Client = prisma,
): Promise<Prisma.BatchPayload> {
  return client.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
