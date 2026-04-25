import { Router, type IRouter } from "express";
import { and, eq, gte, lte, or, ilike, desc, sql } from "drizzle-orm";
import { db, incidentsTable, usersTable } from "@workspace/db";
import {
  CreateIncidentBody,
  UpdateIncidentBody,
  GetIncidentParams,
  UpdateIncidentParams,
  ListIncidentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

type IncidentRow = typeof incidentsTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;

function toIncidentDto(row: IncidentRow, reporter: UserRow | null) {
  return {
    id: row.id,
    incidentCode: row.incidentCode,
    occurredAt: row.occurredAt,
    department: row.department,
    line: row.line,
    productType: row.productType,
    category: row.category,
    severity: row.severity,
    description: row.description,
    immediateAction: row.immediateAction,
    status: row.status,
    attachmentUrl: row.attachmentUrl,
    rootCauseCategory: row.rootCauseCategory,
    reportedById: row.reportedById,
    reportedByName: reporter?.fullName ?? "Unknown",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function generateIncidentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable);
  const seq = String(Number(count) + 1).padStart(5, "0");
  return `INC-${year}-${seq}`;
}

router.get("/incidents", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const parsedQuery = ListIncidentsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ message: parsedQuery.error.message });
    return;
  }

  const q = parsedQuery.data;
  const conditions = [];
  if (q.search) {
    const term = `%${q.search}%`;
    conditions.push(
      or(
        ilike(incidentsTable.incidentCode, term),
        ilike(incidentsTable.description, term),
        ilike(incidentsTable.line, term),
        ilike(incidentsTable.productType, term),
      ),
    );
  }
  if (q.department) conditions.push(eq(incidentsTable.department, q.department));
  if (q.category) conditions.push(eq(incidentsTable.category, q.category));
  if (q.severity) conditions.push(eq(incidentsTable.severity, q.severity));
  if (q.status) conditions.push(eq(incidentsTable.status, q.status));
  if (q.startDate) conditions.push(gte(incidentsTable.occurredAt, q.startDate));
  if (q.endDate) conditions.push(lte(incidentsTable.occurredAt, q.endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({ incident: incidentsTable, reporter: usersTable })
    .from(incidentsTable)
    .leftJoin(usersTable, eq(incidentsTable.reportedById, usersTable.id))
    .where(where)
    .orderBy(desc(incidentsTable.occurredAt));

  res.json(rows.map((r) => toIncidentDto(r.incident, r.reporter)));
});

router.post("/incidents", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const code = await generateIncidentCode();

  const [row] = await db
    .insert(incidentsTable)
    .values({
      incidentCode: code,
      department: parsed.data.department,
      line: parsed.data.line,
      productType: parsed.data.productType,
      category: parsed.data.category,
      severity: parsed.data.severity,
      description: parsed.data.description,
      immediateAction: parsed.data.immediateAction,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      rootCauseCategory: parsed.data.rootCauseCategory ?? null,
      reportedById: req.session.userId,
    })
    .returning();

  const [reporter] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, row.reportedById));

  res.json(toIncidentDto(row, reporter ?? null));
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const params = GetIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ message: params.error.message });
    return;
  }
  const [result] = await db
    .select({ incident: incidentsTable, reporter: usersTable })
    .from(incidentsTable)
    .leftJoin(usersTable, eq(incidentsTable.reportedById, usersTable.id))
    .where(eq(incidentsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ message: "Incident not found" });
    return;
  }
  res.json(toIncidentDto(result.incident, result.reporter));
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const params = UpdateIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ message: params.error.message });
    return;
  }
  const parsed = UpdateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const updates: Partial<typeof incidentsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.immediateAction !== undefined)
    updates.immediateAction = parsed.data.immediateAction;
  if (parsed.data.rootCauseCategory !== undefined)
    updates.rootCauseCategory = parsed.data.rootCauseCategory;

  if (Object.keys(updates).length === 0) {
    const [result] = await db
      .select({ incident: incidentsTable, reporter: usersTable })
      .from(incidentsTable)
      .leftJoin(usersTable, eq(incidentsTable.reportedById, usersTable.id))
      .where(eq(incidentsTable.id, params.data.id));
    if (!result) {
      res.status(404).json({ message: "Incident not found" });
      return;
    }
    res.json(toIncidentDto(result.incident, result.reporter));
    return;
  }

  const [row] = await db
    .update(incidentsTable)
    .set(updates)
    .where(eq(incidentsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ message: "Incident not found" });
    return;
  }

  const [reporter] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, row.reportedById));

  res.json(toIncidentDto(row, reporter ?? null));
});

export default router;
