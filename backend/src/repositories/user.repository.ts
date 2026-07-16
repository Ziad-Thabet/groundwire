import { Prisma, User } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export async function findUserByEmail(
  email: string,
  client: Client = prisma,
): Promise<User | null> {
  return client.user.findUnique({ where: { email } });
}

export async function findUserById(
  id: string,
  client: Client = prisma,
): Promise<User | null> {
  return client.user.findUnique({ where: { id } });
}

export async function createUser(
  data: { email: string; passwordHash: string; name: string },
  client: Client = prisma,
): Promise<User> {
  return client.user.create({ data });
}
