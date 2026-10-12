import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { checkRateLimit, clientIpFromRequest } from "@/lib/security/rate-limit";
import { COOKIE_NAME, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = await checkRateLimit(`login:${ip}`, 15, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток входа" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 900) } },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    user.role !== "ADMIN" ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
