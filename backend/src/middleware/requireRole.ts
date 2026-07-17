import { Request, Response, NextFunction } from "express";
import { MemberRole } from "@prisma/client";
import { ForbiddenError } from "../utils/errors";

export function requireRole(...allowedRoles: MemberRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.memberRole || !allowedRoles.includes(req.memberRole)) {
      return next(
        new ForbiddenError("Insufficient permissions for this action"),
      );
    }
    next();
  };
}
