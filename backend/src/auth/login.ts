import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { signToken } from "./jwt.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginRouter = Router();

loginRouter.post("/", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body.",
      details: parsed.error.flatten(),
    });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    include: {
      memberships: {
        select: {
          scope: true,
          role: true,
        },
      },
    },
  });

  if (!user?.passwordHash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const isPasswordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const memberships = user.memberships.map((membership: { scope: string; role: string }) => ({
    scope: membership.scope,
    role: membership.role,
  }));

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name ?? "",
    memberships,
  });

  res.cookie("sf_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      memberships,
    },
  });
});
