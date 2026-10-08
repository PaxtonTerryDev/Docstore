import { headers } from "next/headers"
import { auditLog, db } from "@workspace/db"

export async function audit(
  userId: string,
  action: "upload" | "view" | "download" | "search",
  documentId?: string,
  detail?: string
) {
  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1"
  await db.insert(auditLog).values({ userId, action, documentId, ip, detail })
}
