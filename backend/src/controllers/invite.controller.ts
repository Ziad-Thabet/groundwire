import { Request, Response, NextFunction } from "express";
import {
  createInviteSchema,
  acceptInviteSchema,
} from "../domain/schemas/invite.schema";
import * as inviteService from "../services/invite.service";
import { setRefreshCookie } from "./auth.controller";

export async function createInvite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createInviteSchema.parse(req.body);
    await inviteService.createOrResendInvite(
      req.workspaceId!,
      req.userId!,
      input.email,
      input.role,
    );
    res.status(200).json({ message: "Invite sent." });
  } catch (err) {
    next(err);
  }
}

export async function checkInviteStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.query.token;
    if (typeof token !== "string" || !token) {
      return res.status(200).json({ valid: false });
    }
    const result = await inviteService.checkInviteStatus(token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function acceptInvite(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = acceptInviteSchema.parse(req.body);
    const result = await inviteService.acceptInvite(
      input.token,
      input.name,
      input.password,
    );
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
      workspaceId: result.workspaceId,
    });
  } catch (err) {
    next(err);
  }
}
