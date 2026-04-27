import { Router, type IRouter } from "express";
import { aliasedTable } from "drizzle-orm";
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

const reporterAlias = aliasedTable(usersTable, "reporter_user");
const assigneeAlias = aliasedTable(usersTable, "assignee_user");

type IncidentRow = typeof incidentsTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;

function toIncidentDto(
  row: IncidentRow,
  reporter: UserRow | null,
  assignee: UserRow | null,
) {
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
    assignedToId: row.assignedToId,
    assignedToName: assignee?.fullName ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function coerceListQuery(query: unknown): unknown {
  if (!query || typeof query !== "object") return query;
  const out: Record<string, unknown> = { ...(query as Record<string, unknown>) };
  for (const key of ["startDate", "endDate"]) {
    const v = out[key];
    if (typeof v === "string" && v.length > 0) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) out[key] = d;
    }
  }
  for (const key of ["reportedById", "assignedToId"]) {
    if (typeof out[key] === "string" && (out[key] as string).length > 0) {
      const n = Number(out[key]);
      if (!Number.isNaN(n)) out[key] = n;
    }
  }
  return out;
}

async function generateIncidentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable);
  const seq = String(Number(count) + 1).padStart(5, "0");
  return `INC-${year}-${seq}`;
}

function buildListConditions(q: ReturnType<typeof ListIncidentsQueryParams.parse>) {
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
  if (q.reportedById !== undefined)
    conditions.push(eq(incidentsTable.reportedById, q.reportedById));
  if (q.assignedToId !== undefined)
    conditions.push(eq(incidentsTable.assignedToId, q.assignedToId));
  return conditions;
}

router.get("/incidents", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const parsedQuery = ListIncidentsQueryParams.safeParse(coerceListQuery(req.query));
  if (!parsedQuery.success) {
    res.status(400).json({ message: parsedQuery.error.message });
    return;
  }

  const conditions = buildListConditions(parsedQuery.data);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      incident: incidentsTable,
      reporter: reporterAlias,
      assignee: assigneeAlias,
    })
    .from(incidentsTable)
    .leftJoin(reporterAlias, eq(incidentsTable.reportedById, reporterAlias.id))
    .leftJoin(assigneeAlias, eq(incidentsTable.assignedToId, assigneeAlias.id))
    .where(where)
    .orderBy(desc(incidentsTable.occurredAt));

  res.json(rows.map((r) => toIncidentDto(r.incident, r.reporter, r.assignee)));
});

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get("/incidents/export.csv", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const parsedQuery = ListIncidentsQueryParams.safeParse(coerceListQuery(req.query));
  if (!parsedQuery.success) {
    res.status(400).json({ message: parsedQuery.error.message });
    return;
  }

  const conditions = buildListConditions(parsedQuery.data);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      incident: incidentsTable,
      reporter: reporterAlias,
      assignee: assigneeAlias,
    })
    .from(incidentsTable)
    .leftJoin(reporterAlias, eq(incidentsTable.reportedById, reporterAlias.id))
    .leftJoin(assigneeAlias, eq(incidentsTable.assignedToId, assigneeAlias.id))
    .where(where)
    .orderBy(desc(incidentsTable.occurredAt));

  const headers = [
    "Incident Code",
    "Occurred At",
    "Department",
    "Line",
    "Product Type",
    "Category",
    "Severity",
    "Status",
    "Root Cause",
    "Description",
    "Immediate Action",
    "Reported By",
    "Assigned To",
    "Created At",
  ];

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.incident.incidentCode,
        r.incident.occurredAt,
        r.incident.department,
        r.incident.line,
        r.incident.productType,
        r.incident.category,
        r.incident.severity,
        r.incident.status,
        r.incident.rootCauseCategory ?? "",
        r.incident.description,
        r.incident.immediateAction,
        r.reporter?.fullName ?? "Unknown",
        r.assignee?.fullName ?? "",
        r.incident.createdAt,
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }

  const csv = lines.join("\r\n") + "\r\n";
  const filename = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
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

  res.json(toIncidentDto(row, reporter ?? null, null));
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
    .select({
      incident: incidentsTable,
      reporter: reporterAlias,
      assignee: assigneeAlias,
    })
    .from(incidentsTable)
    .leftJoin(reporterAlias, eq(incidentsTable.reportedById, reporterAlias.id))
    .leftJoin(assigneeAlias, eq(incidentsTable.assignedToId, assigneeAlias.id))
    .where(eq(incidentsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ message: "Incident not found" });
    return;
  }
  res.json(toIncidentDto(result.incident, result.reporter, result.assignee));
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

  if (parsed.data.assignedToId !== undefined) {
    const [me] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));
    if (!me || (me.role !== "admin" && me.role !== "supervisor")) {
      res.status(403).json({ message: "Only admins and supervisors can change the assignee" });
      return;
    }
    updates.assignedToId = parsed.data.assignedToId;
  }

  if (Object.keys(updates).length === 0) {
    const [result] = await db
      .select({
        incident: incidentsTable,
        reporter: reporterAlias,
        assignee: assigneeAlias,
      })
      .from(incidentsTable)
      .leftJoin(reporterAlias, eq(incidentsTable.reportedById, reporterAlias.id))
      .leftJoin(assigneeAlias, eq(incidentsTable.assignedToId, assigneeAlias.id))
      .where(eq(incidentsTable.id, params.data.id));
    if (!result) {
      res.status(404).json({ message: "Incident not found" });
      return;
    }
    res.json(toIncidentDto(result.incident, result.reporter, result.assignee));
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

  let assignee: UserRow | null = null;
  if (row.assignedToId !== null) {
    const [a] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, row.assignedToId));
    assignee = a ?? null;
  }

  res.json(toIncidentDto(row, reporter ?? null, assignee));
});

export default router;
