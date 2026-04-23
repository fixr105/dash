# Phase 1 Audit (Shared Identity)

Result: **There are mismatches/gaps** against the requested contract. Details below.

## 1) AUTH PROVIDER

- **Type detected:** self-hosted JWT.
- **Third-party auth detected:** none (no Clerk/Auth0/NextAuth/Supabase code found in auth implementation).

**Evidence**

`backend/src/auth/jwt.ts`
```ts
import jwt from "jsonwebtoken";
...
export function signToken(claims: Omit<DecodedClaims, "iat" | "exp">): string {
  return jwt.sign(claims, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: JWT_TTL_SECONDS,
  });
}
```

`backend/src/auth/login.ts`
```ts
import bcrypt from "bcrypt";
...
const token = signToken({
  sub: user.id,
  email: user.email,
  name: user.name ?? "",
  memberships,
});
```

## 2) JWT CLAIM SHAPE

- Signing code signs `{ sub, email, name, memberships }`.
- `iat` and `exp` are added by `jsonwebtoken` automatically.
- **Algorithm:** HS256.
- **TTL:** 8 hours (`8 * 60 * 60` seconds).

**Evidence (claim object + algorithm/TTL)**

`backend/src/auth/login.ts`
```ts
const token = signToken({
  sub: user.id,
  email: user.email,
  name: user.name ?? "",
  memberships,
});
```

`backend/src/auth/jwt.ts`
```ts
const JWT_TTL_SECONDS = 8 * 60 * 60;
...
return jwt.sign(claims, getJwtSecret(), {
  algorithm: "HS256",
  expiresIn: JWT_TTL_SECONDS,
});
```

**Decoded live token payload (runtime check)**
```json
{"sub":"cmobecxae0000orqonzhxlig1","email":"rahul@sevenfincorp.com","name":"Rahul Gonsalves","memberships":[{"scope":"platform:dash","role":"admin"}],"iat":1776947249,"exp":1776976049}
```

## 3) COOKIE CONFIGURATION

- **Cookie name:** `sf_token` ✅
- **httpOnly:** `true` ✅
- **sameSite:** `"lax"` ✅
- **secure in prod:** `process.env.NODE_ENV === "production"` ✅
- **maxAge:** `8 * 60 * 60 * 1000` (8 hours) ✅

**Evidence**

`backend/src/auth/login.ts`
```ts
res.cookie("sf_token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
});
```

## 4) LOGIN RESPONSE BODY

On success, endpoint returns both `token` and `user` with `{ id, email, name, memberships }` ✅

**Evidence**

`backend/src/auth/login.ts`
```ts
res.json({
  token,
  user: {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    memberships,
  },
});
```

## 5) ENDPOINTS IMPLEMENTED

Auth-related endpoints present:

- `POST /api/auth/login` (public)
- `POST /api/auth/logout` (public)
- `GET /api/auth/me` (protected)

**Evidence**

`backend/src/routes/index.ts`
```ts
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth/login", loginRouter);
apiRouter.use("/auth/logout", logoutRouter);

// Auth-by-default policy: anything not explicitly public is protected.
apiRouter.use(requireAuth);
apiRouter.use("/auth/me", meRouter);
```

Extra auth endpoints added:

- **None** (no signup, password reset, refresh token, magic link, or 2FA routes found).

## 6) MIDDLEWARE

`requireAuth` exists and:

- Reads `sf_token` cookie ✅
- Reads `Authorization: Bearer ...` ✅
- Attaches `req.user = { id, email, name, memberships }` ✅

**Evidence**

`backend/src/auth/middleware.ts`
```ts
function getTokenFromRequest(req: Request): string | null {
  const cookieToken = req.cookies?.sf_token;
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const bearerToken = authHeader.slice("Bearer ".length).trim();
  return bearerToken.length > 0 ? bearerToken : null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  ...
  req.user = {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    memberships: claims.memberships,
  };
  next();
}
```

`requireNbfcScope` middleware:

- **Missing**. No `requireNbfcScope` implementation found in `backend/src/auth/`.

## 7) FRONTEND WIRING

- Axios client has `withCredentials: true` ✅
- AuthContext calls `GET /auth/me` on mount to rehydrate ✅
- Login page calls `POST /auth/login` and navigates to `/` on success ✅
- RequireAuth redirects to `/login` when unauthenticated ✅

**Evidence**

`frontend/src/services/apiClient.ts`
```ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});
```

`frontend/src/auth/AuthContext.tsx`
```ts
const loadCurrentUser = useCallback(async () => {
  try {
    const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
    setUser(response.data.user);
  } catch {
    setUser(null);
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  void loadCurrentUser();
}, [loadCurrentUser]);
```

`frontend/src/auth/LoginPage.tsx`
```ts
await login(email, password);
navigate("/", { replace: true });
```

`frontend/src/auth/RequireAuth.tsx`
```ts
if (!isAuthenticated) {
  return <Navigate replace to="/login" state={{ from: location }} />;
}
```

## 8) SEED DATA + TEST

### DB check

Requested SQL was `SELECT email FROM shared."User";`. Current Prisma schema is **not** using `shared` schema (uses `model User` in default schema). So SQL path is mismatched with requested Phase 0 contract.

Used Prisma read as verification:

```json
[{"email":"underwriter@testnbfc.com"},{"email":"rahul@sevenfincorp.com"}]
```

Rahul exists:

```json
{"id":"cmobecxae0000orqonzhxlig1","email":"rahul@sevenfincorp.com"}
```

### Live login call (full response body)

Command run:
```bash
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"rahul@sevenfincorp.com","password":"changeme123"}'
```

Response body:
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW9iZWN4YWUwMDAwb3Jxb256aHhsaWcxIiwiZW1haWwiOiJyYWh1bEBzZXZlbmZpbmNvcnAuY29tIiwibmFtZSI6IlJhaHVsIEdvbnNhbHZlcyIsIm1lbWJlcnNoaXBzIjpbeyJzY29wZSI6InBsYXRmb3JtOmRhc2giLCJyb2xlIjoiYWRtaW4ifV0sImlhdCI6MTc3Njk0NzI0OSwiZXhwIjoxNzc2OTc2MDQ5fQ.fs94Yn8zU0D2Qg9oR1htWxSSuoOGY8zKzjaUqXyL8M4","user":{"id":"cmobecxae0000orqonzhxlig1","email":"rahul@sevenfincorp.com","name":"Rahul Gonsalves","memberships":[{"scope":"platform:dash","role":"admin"}]}}
```

### Live `/me` call

Command run:
```bash
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"
```

Response body:
```json
{"user":{"id":"cmobecxae0000orqonzhxlig1","email":"rahul@sevenfincorp.com","name":"Rahul Gonsalves","memberships":[{"scope":"platform:dash","role":"admin"}]}}
```

### Token shape confirmation

Decoded token payload (middle segment) contains:
- `sub`, `email`, `name`, `memberships`, `iat`, `exp` ✅

```json
{"sub":"cmobecxae0000orqonzhxlig1","email":"rahul@sevenfincorp.com","name":"Rahul Gonsalves","memberships":[{"scope":"platform:dash","role":"admin"}],"iat":1776947249,"exp":1776976049}
```

## 9) ENV VARIABLES

- `backend/.env` has both `JWT_SECRET` and `DATABASE_URL` ✅
- `JWT_SECRET` is a 64-character hex string ✅
- Secret appears non-placeholder ✅
- Actual secret value intentionally not printed.

Validation output:
```json
{"hasJWT":true,"hasDatabaseURL":true,"jwtLength":64,"is64Hex":true,"isPlaceholderLike":false}
```

## 10) WHAT WAS PROTECTED

Current routing behavior:

- Public:
  - `GET /api/health`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- Protected:
  - `GET /api/auth/me`
  - Any route registered after `apiRouter.use(requireAuth)` in `backend/src/routes/index.ts`

**Evidence**

`backend/src/routes/index.ts`
```ts
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth/login", loginRouter);
apiRouter.use("/auth/logout", logoutRouter);

// Auth-by-default policy: anything not explicitly public is protected.
apiRouter.use(requireAuth);
apiRouter.use("/auth/me", meRouter);
```

Other unexpected public routes:

- **None found** in the current route file.

---

## Fixes needed

1. **Missing `requireNbfcScope` middleware**
   - Requested in audit checklist as optional-if-present; currently absent.
   - If needed for NBFC-scoped authorization, add middleware that checks `req.user.memberships` for scope matching `/^nbfc:/`.

2. **Schema contract mismatch vs requested `shared."User"` path**
   - Current `backend/prisma/schema.prisma` is single-schema/default and uses `cuid()` IDs.
   - Requested contract references multi-schema (`shared`, `origination`, `lending`) and `shared."User"`.
   - Auth works with current schema, but it does not match the requested shared-schema contract exactly.
