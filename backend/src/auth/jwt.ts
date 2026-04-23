import jwt from "jsonwebtoken";

export interface MembershipClaim {
  scope: string;
  role: string;
}

export interface DecodedClaims {
  sub: string;
  email: string;
  name: string;
  memberships: MembershipClaim[];
  iat: number;
  exp: number;
}

const JWT_TTL_SECONDS = 8 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required for authentication.");
  }
  return secret;
}

export function signToken(claims: Omit<DecodedClaims, "iat" | "exp">): string {
  return jwt.sign(claims, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: JWT_TTL_SECONDS,
  });
}

export function verifyToken(token: string): DecodedClaims | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.name !== "string" ||
      !Array.isArray(decoded.memberships) ||
      typeof decoded.iat !== "number" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }

    const memberships = decoded.memberships.every(
      (membership) =>
        typeof membership === "object" &&
        membership !== null &&
        typeof membership.scope === "string" &&
        typeof membership.role === "string",
    );

    if (!memberships) {
      return null;
    }

    return decoded as DecodedClaims;
  } catch {
    return null;
  }
}
