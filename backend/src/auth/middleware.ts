import type { NextFunction, Request, Response } from "express";

import { verifyToken, type MembershipClaim } from "./jwt.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  memberships: MembershipClaim[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getTokenFromRequest(req: Request): string | null {
  const cookieToken = req.cookies?.sf_token;
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const bearerToken = authHeader.slice("Bearer ".length).trim();
  return bearerToken.length > 0 ? bearerToken : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const claims = verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  req.user = {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    memberships: claims.memberships,
  };

  next();
}
