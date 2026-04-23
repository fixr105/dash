import type { NextFunction, Request, Response } from "express";

export interface RequestContext {
  userId: string | null;
  roles: string[];
}

declare module "express-serve-static-core" {
  interface Request {
    context: RequestContext;
  }
}

export function attachRequestContext(request: Request, _response: Response, next: NextFunction): void {
  request.context = {
    userId: null,
    roles: [],
  };
  next();
}
