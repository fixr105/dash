import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { pathToFileURL } from "node:url";

import { apiRouter } from "./routes/index.js";

dotenv.config();

function ensureJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "replace-with-your-64-char-hex-secret") {
    throw new Error("JWT_SECRET must be set to a non-placeholder value.");
  }
}

export function createApp() {
  ensureJwtSecret();
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.use("/api", apiRouter);

  return app;
}

export function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    console.log(`Dash backend running on http://localhost:${port}`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  startServer();
}
