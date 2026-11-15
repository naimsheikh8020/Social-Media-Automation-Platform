import { Router } from "express";
import * as webhookController from "../controllers/webhook.controller.js";

export const webhookRouter = Router();
webhookRouter.post("/twitter", webhookController.handleTwitterWebhook);