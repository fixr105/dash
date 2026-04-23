import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "./middleware.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      memberships: {
        select: {
          scope: true,
          role: true,
        },
      },
    },
  });

  if (!user) {
    res.status(401).json({ error: "User no longer exists." });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      memberships: user.memberships,
    },
  });
});
