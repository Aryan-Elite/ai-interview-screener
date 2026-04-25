import { Router } from "express";
import { handleChat } from "../controllers/chatController";

const router = Router();
router.post("/", (req, res, next) => handleChat(req, res).catch(next));
export default router;
