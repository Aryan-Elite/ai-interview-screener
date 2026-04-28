import { Router, Request, Response, NextFunction } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { listAssessments, getAssessment, toggleResultRelease, castVote } from "../controllers/adminController";

const router = Router();
router.use(requireAdmin);

router.get("/assessments", async (req: Request, res: Response, next: NextFunction) => {
  try { await listAssessments(req, res); } catch (err) { next(err); }
});

router.get("/assessments/:id", async (req: Request, res: Response, next: NextFunction) => {
  try { await getAssessment(req, res); } catch (err) { next(err); }
});

router.post("/assessments/:id/release", async (req: Request, res: Response, next: NextFunction) => {
  try { await toggleResultRelease(req, res); } catch (err) { next(err); }
});

router.post("/assessments/:id/vote", async (req: Request, res: Response, next: NextFunction) => {
  try { await castVote(req, res); } catch (err) { next(err); }
});

export default router;
