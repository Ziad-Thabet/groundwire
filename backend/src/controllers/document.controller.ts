import { Request, Response, NextFunction } from "express";
import * as documentService from "../services/document.service";
import { ValidationError } from "../utils/errors";

export async function uploadDocument(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      throw new ValidationError("No file was uploaded.");
    }

    const confirmDuplicate = req.body?.confirmDuplicate === "true";

    const document = await documentService.uploadDocument(
      req.workspaceId!,
      req.userId!,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
      { confirmDuplicate },
    );

    res.status(201).json({
      id: document.id,
      filename: document.filename,
      status: document.status,
      createdAt: document.createdAt,
    });
  } catch (err) {
    next(err);
  }
}
