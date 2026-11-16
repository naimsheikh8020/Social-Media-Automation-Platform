// routes/account.route.ts
import { Router } from "express";
import { getAccounts, addAccount, disconnectAccount } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const accountRouter = Router();

accountRouter.use(requireAuth);

accountRouter.get("/", getAccounts);
accountRouter.post("/", addAccount);
accountRouter.delete("/:id", disconnectAccount);