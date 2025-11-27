import { Router } from "express";
import {
  addTeam,
  getTeams,
  deleteTeam,
  getTeamsByQuiz,
  //addPoints,
  //reducePoints,
} from "../controller/teamController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/teams", authMiddleware(["admin"]), addTeam); // add team
router.get("/teams", authMiddleware(["admin"]), getTeams); // fetch teams for this admin
router.get("/teams/:quizId", authMiddleware(["admin"]), getTeamsByQuiz); // fetch teams for this admin
router.delete("/teams/:id", authMiddleware(["admin"]), deleteTeam); // delete team
//router.patch("/teams/:id/add", authMiddleware(["admin"]), addPoints);
//router.patch("/teams/:id/reduce", authMiddleware(["admin"]), reducePoints);

export default router;
