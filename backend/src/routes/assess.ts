import { Router } from "express";
import { generateAssessment } from "../controllers/assessController";

const router = Router();
router.post("/", (req, res, next) => generateAssessment(req, res).catch(next));
export default router;
