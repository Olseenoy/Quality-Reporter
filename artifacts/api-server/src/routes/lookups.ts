import { Router, type IRouter } from "express";
import { GetLookupsResponse } from "@workspace/api-zod";
import {
  DEPARTMENTS,
  CATEGORIES,
  SEVERITIES,
  STATUSES,
  ROLES,
  LINES,
  PRODUCT_TYPES,
} from "../lib/lookups";

const router: IRouter = Router();

router.get("/lookups", async (_req, res): Promise<void> => {
  const payload = {
    departments: [...DEPARTMENTS],
    categories: [...CATEGORIES],
    severities: [...SEVERITIES],
    statuses: [...STATUSES],
    lines: [...LINES],
    productTypes: [...PRODUCT_TYPES],
    roles: [...ROLES],
  };
  res.json(GetLookupsResponse.parse(payload));
});

export default router;
