import { Router } from "express";

import { loginRouter } from "../auth/login.js";
import { logoutRouter } from "../auth/logout.js";
import { meRouter } from "../auth/me.js";
import { requireAuth } from "../auth/middleware.js";
import { healthRouter } from "./health.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth/login", loginRouter);
apiRouter.use("/auth/logout", logoutRouter);

// Auth-by-default policy: anything not explicitly public is protected.
apiRouter.use(requireAuth);
apiRouter.use("/auth/me", meRouter);
