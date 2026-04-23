import { describe, expect, it } from "vitest";

import { createApp } from "../server.js";

describe("server env guard", () => {
  it("throws when JWT_SECRET is missing", () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => createApp()).toThrow("JWT_SECRET must be set to a non-placeholder value.");

    process.env.JWT_SECRET = original;
  });

  it("throws when JWT_SECRET is placeholder", () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "replace-with-your-64-char-hex-secret";

    expect(() => createApp()).toThrow("JWT_SECRET must be set to a non-placeholder value.");

    process.env.JWT_SECRET = original;
  });
});
