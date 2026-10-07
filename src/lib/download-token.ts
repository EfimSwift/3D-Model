import { SignJWT, jwtVerify } from "jose";

const DOWNLOAD_TTL = "5m";

export type DownloadPayload = {
  orderId: string;
  productId: string;
  grantId: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signDownloadToken(payload: DownloadPayload): Promise<string> {
  return new SignJWT({
    productId: payload.productId,
    grantId: payload.grantId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.orderId)
    .setIssuedAt()
    .setExpirationTime(DOWNLOAD_TTL)
    .sign(getSecret());
}

export async function verifyDownloadToken(
  token: string,
): Promise<DownloadPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const orderId = payload.sub;
    const productId = payload.productId;
    const grantId = payload.grantId;
    if (
      typeof orderId !== "string" ||
      typeof productId !== "string" ||
      typeof grantId !== "string"
    ) {
      return null;
    }
    return { orderId, productId, grantId };
  } catch {
    return null;
  }
}

export function downloadGrantExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}
