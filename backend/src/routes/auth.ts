import { Router } from "express";
import { adminLogin, candidateSignup, candidateLogin } from "../controllers/authController";

const router = Router();

router.post("/admin/login", async (req, res, next) => {
  try { await adminLogin(req, res); } catch (err) { next(err); }
});

router.post("/candidate/signup", async (req, res, next) => {
  try { await candidateSignup(req, res); } catch (err) { next(err); }
});

router.post("/candidate/login", async (req, res, next) => {
  try { await candidateLogin(req, res); } catch (err) { next(err); }
});

export default router;
