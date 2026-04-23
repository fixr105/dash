import type { NextFunction, Request, Response } from "express";

// Extends Express Request with nbfcId after requireNbfcScope runs
declare module "express-serve-static-core" {
  interface Request {
    nbfcId?: string;
  }
}

export function requireNbfcScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const nbfcMembership = req.user.memberships.find((membership) => membership.scope.startsWith("nbfc:"));
  if (!nbfcMembership) {
    res.status(403).json({ error: "NBFC scope required. This endpoint is only accessible to NBFC users." });
    return;
  }

  const nbfcId = nbfcMembership.scope.slice("nbfc:".length);
  if (!nbfcId) {
    res.status(403).json({ error: "Malformed NBFC scope." });
    return;
  }

  req.nbfcId = nbfcId;
  next();
}
