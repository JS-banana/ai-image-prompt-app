import { cookies } from "next/headers";

export const ADMIN_WRITE_COOKIE_NAME = "ai_admin_write";

export function isAdminWriteEnabled() {
  return !!process.env.ADMIN_WRITE_KEY;
}

export async function hasAdminWriteAccess() {
  const secret = process.env.ADMIN_WRITE_KEY;
  if (!secret) return true;

  const token = (await cookies()).get(ADMIN_WRITE_COOKIE_NAME)?.value;
  return token === secret;
}

export async function assertAdminWriteAccess() {
  if (await hasAdminWriteAccess()) return;
  throw new Error("需要管理员口令才能写入（请先授权管理员口令）");
}
