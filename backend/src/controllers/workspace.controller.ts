import { Request, Response, NextFunction } from "express";
import { withTenantContext } from "../db/withTenantContext";
import { NotFoundError, ForbiddenError } from "../utils/errors";

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

export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const targetUserId = req.params.userId;
    const workspaceId = req.workspaceId!;

    if (typeof targetUserId !== "string") {
      throw new NotFoundError("That user is not a member of this workspace");
    }

    await withTenantContext(workspaceId, async (tx) => {
      const target = await tx.workspaceMember.findFirst({
        where: { workspaceId, userId: targetUserId },
      });

      if (!target) {
        throw new NotFoundError("That user is not a member of this workspace");
      }

      if (target.role === "owner" && req.memberRole !== "owner") {
        throw new ForbiddenError("Only an owner can remove another owner");
      }

      if (target.role === "owner") {
        const ownerCount = await tx.workspaceMember.count({
          where: { workspaceId, role: "owner" },
        });
        if (ownerCount <= 1) {
          throw new ForbiddenError(
            "Cannot remove the last owner of a workspace",
          );
        }
      }

      await tx.workspaceMember.delete({ where: { id: target.id } });
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
