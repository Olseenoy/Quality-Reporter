import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody, GetCurrentUserResponse } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/auth";

const router: IRouter = Router();

function toUserResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const role = parsed.data.role ?? "operator";

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      fullName: parsed.data.fullName.trim(),
      role,
    })
    .returning();

  req.session.userId = user.id;

  const userResponse = toUserResponse(user);
  res.json({
    user: GetCurrentUserResponse.parse(userResponse),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  const userResponse = toUserResponse(user);
  res.json({
    user: GetCurrentUserResponse.parse(userResponse),
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await new Promise<void>((resolve) => {
    req.session.destroy((err) => {
      if (err) req.log.warn({ err }, "Failed to destroy session");
      resolve();
    });
  });
  res.clearCookie("qirs.sid");
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  res.json(GetCurrentUserResponse.parse(toUserResponse(user)));
});

router.get("/users", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const [me] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!me || (me.role !== "admin" && me.role !== "supervisor")) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      role: usersTable.role,
    })
    .from(usersTable)
    .orderBy(usersTable.fullName);

  res.json(rows);
});

export default router;
