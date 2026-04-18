import { AdminRole, Department } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "nextus_admin_session";
export const INTRANET_SESSION_COOKIE = "nextus_intranet_session";

type SessionPayloadBase = {
  userId: string;
  username: string;
  displayName: string;
};

export type AdminSessionPayload = SessionPayloadBase & {
  kind: "admin";
  role: AdminRole;
};

export type IntranetSessionPayload = SessionPayloadBase & {
  kind: "intranet";
  department: Department;
  canApproveFinance: boolean;
  employeeId: string;
  contact: string;
};

type SessionPayload = AdminSessionPayload | IntranetSessionPayload;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 未配置，请先在 .env.local 配置 JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

async function signSessionToken(payload: SessionPayload, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(jwtSecret());
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(rawPassword: string) {
  return hash(rawPassword, 12);
}

export async function verifyPassword(rawPassword: string, passwordHash: string) {
  return compare(rawPassword, passwordHash);
}

export async function createAdminSessionToken(payload: Omit<AdminSessionPayload, "kind">) {
  return signSessionToken({ kind: "admin", ...payload }, "12h");
}

export async function createIntranetSessionToken(payload: Omit<IntranetSessionPayload, "kind">) {
  return signSessionToken({ kind: "intranet", ...payload }, "12h");
}

export function applyAdminCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function applyIntranetCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: INTRANET_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export function clearIntranetCookie(response: NextResponse) {
  response.cookies.set({
    name: INTRANET_SESSION_COOKIE,
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") return null;
  return payload;
}

export async function getIntranetSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "intranet") return null;
  return payload;
}

export async function getAdminSessionFromCookies() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") return null;
  return payload;
}

export async function getIntranetSessionFromCookies() {
  const token = cookies().get(INTRANET_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "intranet") return null;
  return payload;
}
