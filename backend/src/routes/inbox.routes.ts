import { Router } from "express";

import { requireAuth, requireNbfcScope } from "../auth/index.js";
import { prisma } from "../lib/prisma.js";

export const inboxRouter = Router();

inboxRouter.get("/", requireAuth, requireNbfcScope, async (req, res) => {
  const parsedLimit = Number(req.query.limit ?? 20);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;
  const cursor = typeof req.query.cursor === "string" && req.query.cursor.length > 0 ? req.query.cursor : null;

  const applications = await prisma.loanApplication.findMany({
    where: { assignedNbfcId: req.nbfcId },
    orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      externalRef: true,
      productModuleKey: true,
      status: true,
      amount: true,
      assignedAt: true,
      applicantUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const hasMore = applications.length > limit;
  const page = hasMore ? applications.slice(0, limit) : applications;

  res.json({
    items: page.map((application) => ({
      id: application.id,
      externalRef: application.externalRef,
      productModuleKey: application.productModuleKey,
      status: application.status,
      amount: application.amount.toString(),
      assignedAt: application.assignedAt,
      metadata: {
        clientName: application.applicantUser.name ?? null,
        borrowerName: application.applicantUser.name ?? null,
      },
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
});

inboxRouter.get("/:id", requireAuth, requireNbfcScope, async (req, res) => {
  const application = await prisma.loanApplication.findFirst({
    where: {
      id: req.params.id,
      assignedNbfcId: req.nbfcId,
    },
    include: {
      applicantUser: {
        select: {
          name: true,
          email: true,
        },
      },
      statusHistory: {
        orderBy: {
          changedAt: "desc",
        },
      },
    },
  });

  if (!application) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  res.json({
    application: {
      id: application.id,
      externalRef: application.externalRef,
      productModuleKey: application.productModuleKey,
      status: application.status,
      stage: application.stage,
      amount: application.amount.toString(),
      currency: application.currency,
      assignedAt: application.assignedAt,
      createdAt: application.createdAt,
      metadata: {
        clientName: application.applicantUser.name ?? null,
        borrowerName: application.applicantUser.name ?? null,
        notes: null,
        documents: [],
      },
    },
    statusHistory: application.statusHistory.map((history) => ({
      id: history.id,
      fromStage: history.fromStage,
      toStage: history.toStage,
      note: history.note,
      changedAt: history.changedAt,
    })),
  });
});
