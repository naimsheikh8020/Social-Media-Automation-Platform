import { Router } from "express";
import { generateAuthUrl, syncAccounts } from "../controllers/socialAuth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const socialAuthRouter = Router();

// All routes require login
socialAuthRouter.use(requireAuth);

// 👇 Specific route MUST go first!
socialAuthRouter.get("/sync/accounts", syncAccounts);

// 👇 Wildcard route goes second
socialAuthRouter.get("/:platform/url", generateAuthUrl);