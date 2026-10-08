import { getUser } from "@/lib/session"
import { db, documents, eq } from "@workspace/db"

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (user?.role !== "admin") return Response.json({ error: "forbidden" }, { status: 403 })
  const { id } = await ctx.params
  const { restricted } = await req.json()
  const [doc] = await db.update(documents).set({ restricted: Boolean(restricted) }).where(eq(documents.id, id)).returning({ id: documents.id })
  if (!doc) return Response.json({ error: "not found" }, { status: 404 })
  return Response.json({ id, restricted: Boolean(restricted) })
}
