import { Router } from "express";
import {
  checkInviteStatus,
  acceptInvite,
} from "../controllers/invite.controller";

const router = Router();

router.get("/status", checkInviteStatus);
router.post("/accept", acceptInvite);

export default router;
