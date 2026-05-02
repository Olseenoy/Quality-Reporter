import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!me || (me.role !== "admin" && me.role !== "supervisor")) {
    res.status(403).json({ message: "Access denied" });
    return;
  }
  const users = await db.select({
    id: usersTable.id,
    fullName: usersTable.fullName,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.fullName);
  res.json(users);
});

router.patch("/users/:id/role", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!me || me.role !== "admin") {
    res.status(403).json({ message: "Only admins can change roles" });
    return;
  }
  const targetId = Number(req.params.id);
  if (isNaN(targetId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  if (targetId === req.session.userId) {
    res.status(400).json({ message: "You cannot change your own role" });
    return;
  }
  const { role } = req.body;
  if (!["operator", "supervisor", "admin"].includes(role)) {
    res.status(400).json({ message: "Invalid role" });
    return;
  }
  const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, targetId)).returning();
  if (!updated) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "Role updated", user: { id: updated.id, fullName: updated.fullName, role: updated.role } });
});

export default router;
