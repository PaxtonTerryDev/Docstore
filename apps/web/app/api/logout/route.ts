import { cookies } from "next/headers"
import { db, eq, sessions } from "@workspace/db"

export async function POST() {
  const store = await cookies()
  const sid = store.get("sid")?.value
  if (sid) await db.delete(sessions).where(eq(sessions.id, sid))
  store.delete("sid")
  return Response.json({ ok: true })
}
