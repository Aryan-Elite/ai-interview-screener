import { Router, Request, Response, NextFunction } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { getTemplates, upsertTemplate, toggleTemplate } from "../controllers/templateController";

const router = Router();
router.use(requireAdmin);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try { await getTemplates(req, res); } catch (err) { next(err); }
});

router.post("/:range", async (req: Request, res: Response, next: NextFunction) => {
  try { await upsertTemplate(req, res); } catch (err) { next(err); }
});

router.post("/:range/toggle", async (req: Request, res: Response, next: NextFunction) => {
  try { await toggleTemplate(req, res); } catch (err) { next(err); }
});

export default router;
