import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export async function withTenantContext<T>(
  workspaceId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
    return fn(tx);
  });
}
