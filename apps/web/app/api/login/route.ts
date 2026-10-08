import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { db, eq, sessions, users, verifyPassword } from "@workspace/db"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const id = randomUUID()
  await db.insert(sessions).values({ id, userId: user.id })
  ;(await cookies()).set("sid", id, { httpOnly: true, path: "/" })
  return Response.json({ ok: true })
}
