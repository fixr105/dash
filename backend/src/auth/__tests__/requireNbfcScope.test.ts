import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireNbfcScope } from "../requireNbfcScope.js";

type MockResponse = Pick<Response, "status" | "json"> & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createMockResponse(): MockResponse {
  const response = {} as MockResponse;
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  return response;
}

describe("requireNbfcScope", () => {
  it("returns 401 with no user attached", () => {
    const req = {} as Request;
    const res = createMockResponse();
    const next = vi.fn<NextFunction>();

    requireNbfcScope(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for platform-only scope", () => {
    const req = {
      user: {
        id: "user-1",
        email: "admin@sevenfincorp.com",
        name: "Admin",
        memberships: [{ scope: "platform:dash", role: "admin" }],
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn<NextFunction>();

    requireNbfcScope(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "NBFC scope required. This endpoint is only accessible to NBFC users.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and attaches nbfcId for valid NBFC scope", () => {
    const req = {
      user: {
        id: "user-2",
        email: "underwriter@testnbfc.com",
        name: "Underwriter",
        memberships: [{ scope: "nbfc:abc123", role: "underwriter" }],
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn<NextFunction>();

    requireNbfcScope(req, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.nbfcId).toBe("abc123");
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 for malformed nbfc scope", () => {
    const req = {
      user: {
        id: "user-3",
        email: "underwriter@testnbfc.com",
        name: "Underwriter",
        memberships: [{ scope: "nbfc:", role: "underwriter" }],
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn<NextFunction>();

    requireNbfcScope(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Malformed NBFC scope." });
    expect(next).not.toHaveBeenCalled();
  });
});
