// routes/account.route.ts
import { Router } from "express";
import { getAccounts, addAccount, disconnectAccount } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { addAccountSchema } from "../utils/validators.js";

export const accountRouter = Router();

accountRouter.use(requireAuth);

accountRouter.get("/", getAccounts);

// 👇 Apply the validation middleware here
accountRouter.post("/", validate(addAccountSchema), addAccount);

accountRouter.delete("/:id", disconnectAccount);