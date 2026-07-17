import { Request, Response, NextFunction } from "express";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../domain/schemas/auth.schema";
import * as authService from "../services/auth.service";
import { env } from "../env";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);

    setRefreshCookie(res, result.refreshToken);

    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
      workspace: result.workspace,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    setRefreshCookie(res, result.refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(input.email);
    res.status(200).json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input.token, input.password);
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (err) {
    next(err);
  }
}
