import { Router, type IRouter } from "express";
import { sql, desc, eq, gte } from "drizzle-orm";
import { db, incidentsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable);
  const totalIncidents = Number(totalRow?.count ?? 0);

  const [openRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable)
    .where(eq(incidentsTable.status, "Open"));
  const openIncidents = Number(openRow?.count ?? 0);

  const [criticalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable)
    .where(eq(incidentsTable.severity, "Critical"));
  const criticalIncidents = Number(criticalRow?.count ?? 0);

  const [last30Row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(incidentsTable)
    .where(gte(incidentsTable.occurredAt, thirtyDaysAgo));
  const last30DaysIncidents = Number(last30Row?.count ?? 0);

  const byCategoryRows = await db
    .select({
      category: incidentsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(incidentsTable)
    .groupBy(incidentsTable.category);

  const byDepartmentRows = await db
    .select({
      department: incidentsTable.department,
      count: sql<number>`count(*)::int`,
    })
    .from(incidentsTable)
    .groupBy(incidentsTable.department);

  const bySeverityRows = await db
    .select({
      severity: incidentsTable.severity,
      count: sql<number>`count(*)::int`,
    })
    .from(incidentsTable)
    .groupBy(incidentsTable.severity);

  const byStatusRows = await db
    .select({
      status: incidentsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(incidentsTable)
    .groupBy(incidentsTable.status);

  const trendRows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${incidentsTable.occurredAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(incidentsTable)
    .where(gte(incidentsTable.occurredAt, thirtyDaysAgo))
    .groupBy(sql`date_trunc('day', ${incidentsTable.occurredAt})`)
    .orderBy(sql`date_trunc('day', ${incidentsTable.occurredAt})`);

  const recentRows = await db
    .select({ incident: incidentsTable, reporter: usersTable })
    .from(incidentsTable)
    .leftJoin(usersTable, eq(incidentsTable.reportedById, usersTable.id))
    .orderBy(desc(incidentsTable.occurredAt))
    .limit(10);

  const recent = recentRows.map((r) => ({
    id: r.incident.id,
    incidentCode: r.incident.incidentCode,
    occurredAt: r.incident.occurredAt,
    department: r.incident.department,
    line: r.incident.line,
    productType: r.incident.productType,
    category: r.incident.category,
    severity: r.incident.severity,
    description: r.incident.description,
    immediateAction: r.incident.immediateAction,
    status: r.incident.status,
    attachmentUrl: r.incident.attachmentUrl,
    rootCauseCategory: r.incident.rootCauseCategory,
    reportedById: r.incident.reportedById,
    reportedByName: r.reporter?.fullName ?? "Unknown",
    createdAt: r.incident.createdAt,
    updatedAt: r.incident.updatedAt,
  }));

  res.json({
    totalIncidents,
    openIncidents,
    criticalIncidents,
    last30DaysIncidents,
    byCategory: byCategoryRows.map((r) => ({
      category: r.category,
      count: Number(r.count),
    })),
    byDepartment: byDepartmentRows.map((r) => ({
      department: r.department,
      count: Number(r.count),
    })),
    bySeverity: bySeverityRows.map((r) => ({
      severity: r.severity,
      count: Number(r.count),
    })),
    byStatus: byStatusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    })),
    trend: trendRows.map((r) => ({ date: r.date, count: Number(r.count) })),
    recent,
  });
});

export default router;
