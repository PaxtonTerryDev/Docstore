import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db, eq, sessions, users } from "@workspace/db"

export async function getUser() {
  const sid = (await cookies()).get("sid")?.value
  if (!sid) return null
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, department: users.department })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sid))
  return row ?? null
}

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}
