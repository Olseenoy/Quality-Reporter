import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lookupsRouter from "./lookups";
import incidentsRouter from "./incidents";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(lookupsRouter);
router.use(incidentsRouter);
router.use(dashboardRouter);
router.use(usersRouter);

export default router;
