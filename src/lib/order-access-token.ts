import { SignJWT, jwtVerify } from "jose";

const TTL = "30d";

export type OrderAccessPayload = {
  orderId: string;
  email: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signOrderAccessToken(payload: OrderAccessPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.orderId)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());
}

export async function verifyOrderAccessToken(
  token: string,
): Promise<OrderAccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const orderId = payload.sub;
    const email = payload.email;
    if (typeof orderId !== "string" || typeof email !== "string") return null;
    return { orderId, email };
  } catch {
    return null;
  }
}
