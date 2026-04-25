import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lookupsRouter from "./lookups";
import incidentsRouter from "./incidents";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(lookupsRouter);
router.use(incidentsRouter);
router.use(dashboardRouter);

export default router;
