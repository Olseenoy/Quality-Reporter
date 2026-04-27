import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentCode: varchar("incident_code", { length: 32 }).notNull().unique(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  department: varchar("department", { length: 64 }).notNull(),
  line: varchar("line", { length: 128 }).notNull(),
  productType: varchar("product_type", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 32 }).notNull(),
  description: text("description").notNull(),
  immediateAction: text("immediate_action").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("Open"),
  attachmentUrl: text("attachment_url"),
  rootCauseCategory: varchar("root_cause_category", { length: 64 }),
  reportedById: integer("reported_by_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Incident = typeof incidentsTable.$inferSelect;
export type InsertIncident = typeof incidentsTable.$inferInsert;
