import { env } from "./env";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import workspaceRoutes from "./routes/workspace.routes";
import inviteRoutes from "./routes/invite.routes";
import { errorHandler } from "./middleware/errorHandler";
import "./jobs/processors/documentIngestion.processor";

const app = express();
app.set("trust proxy", 1);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/invites", inviteRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Groundwire backend listening on port ${env.PORT}`);
});
