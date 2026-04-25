import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(roles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const role = (req as Request & { userRole?: string }).userRole;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
