import { Request, Response, NextFunction } from "express";
import { MemberRole } from "@prisma/client";
import { withTenantContext } from "../db/withTenantContext";
import { UnauthorizedError } from "../utils/errors";

declare module "express-serve-static-core" {
  interface Request {
    workspaceId?: string;
    memberRole?: MemberRole;
  }
}

export async function requireWorkspaceMember(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const workspaceId = req.params.workspaceId;

  if (!workspaceId || typeof workspaceId !== "string") {
    return next(new UnauthorizedError("Workspace id is required"));
  }

  if (!req.userId) {
    return next(new UnauthorizedError("Authentication required"));
  }

  try {
    const membership = await withTenantContext(workspaceId, (tx) =>
      tx.workspaceMember.findFirst({
        where: { workspaceId, userId: req.userId },
      }),
    );

    if (!membership) {
      return next(
        new UnauthorizedError("You are not a member of this workspace"),
      );
    }

    req.workspaceId = workspaceId;
    req.memberRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}
