import { Router } from "express";

export const logoutRouter = Router();

logoutRouter.post("/", (_req, res) => {
  res.clearCookie("sf_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  res.json({ ok: true });
});
