import { Router } from "express";
import { createInterview } from "../controllers/interviewController";

const router = Router();
router.post("/", (req, res, next) => createInterview(req, res).catch(next));
export default router;
