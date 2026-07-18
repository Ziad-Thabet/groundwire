import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireWorkspaceMember } from "../middleware/requireWorkspaceMember";
import { requireRole } from "../middleware/requireRole";
import {
  listMembers,
  removeMember,
} from "../controllers/workspace.controller";
import { createInvite } from "../controllers/invite.controller";

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

export default router;
