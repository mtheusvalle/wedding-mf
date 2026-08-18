import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_super_secret_wedding_key_1234567890"
);

const SESSION_DURATION = 24 * 60 * 60; // 1 day in seconds

export async function createSession(password: string): Promise<string | null> {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  if (password !== adminPassword) {
    return null;
  }

  // Create session token
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch (error) {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  if (!sessionToken) return false;
  return await verifySession(sessionToken);
}

