import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireWorkspaceMember } from "../middleware/requireWorkspaceMember";
import { requireRole } from "../middleware/requireRole";
import {
  listMembers,
  removeMember,
} from "../controllers/workspace.controller";
import { createInvite } from "../controllers/invite.controller";
import { uploadDocument } from "../controllers/document.controller";
import { upload } from "../middleware/upload";

const router = Router({ mergeParams: true });

router.get(
  "/:workspaceId/members",
  requireAuth,
  requireWorkspaceMember,
  listMembers,
);

router.delete(
  "/:workspaceId/members/:userId",
  requireAuth,
  requireWorkspaceMember,
  requireRole("owner", "admin"),
  removeMember,
);

router.post(
  "/:workspaceId/invites",
  requireAuth,
  requireWorkspaceMember,
  requireRole("owner", "admin"),
  createInvite,
);

router.post(
  "/:workspaceId/documents",
  requireAuth,
  requireWorkspaceMember,
  upload.single("file"),
  uploadDocument,
);

export default router;
