import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireWorkspaceMember } from "../middleware/requireWorkspaceMember";
import { requireRole } from "../middleware/requireRole";
import { listMembers, removeMember } from "../controllers/workspace.controller";

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

export default router;
