import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireWorkspaceMember } from "../middleware/requireWorkspaceMember";
import { listMembers } from "../controllers/workspace.controller";

const router = Router({ mergeParams: true });

router.get(
  "/:workspaceId/members",
  requireAuth,
  requireWorkspaceMember,
  listMembers,
);

export default router;
