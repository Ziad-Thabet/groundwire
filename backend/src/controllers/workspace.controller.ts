import { Request, Response, NextFunction } from "express";
import { withTenantContext } from "../db/withTenantContext";

export async function listMembers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const members = await withTenantContext(req.workspaceId!, (tx) =>
      tx.workspaceMember.findMany({
        where: { workspaceId: req.workspaceId },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    );

    res.json({ members });
  } catch (err) {
    next(err);
  }
}
