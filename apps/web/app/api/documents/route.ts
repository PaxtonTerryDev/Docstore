import { randomUUID } from "node:crypto"
import { db, documents } from "@workspace/db"
import { presignPut } from "@workspace/storage"
import { getDepartment } from "@/lib/departments"
import { getUser } from "@/lib/session"

export async function POST(req: Request) {
  const body = await req.json()
  const uploader = await getUser()
  if (!uploader) return Response.json({ error: "unauthorized" }, { status: 401 })
  if (uploader.role !== "admin") return Response.json({ error: "forbidden" }, { status: 403 })
  const dept = getDepartment(uploader.department)
  const id = randomUUID()
  const objectKey = `${id}/${body.filename}`

  await db.insert(documents).values({
    id,
    filename: body.filename,
    contentType: body.contentType || "application/octet-stream",
    sizeBytes: body.sizeBytes,
    objectKey,
    docType: body.docType,
    department: dept.id,
    metadata: Object.fromEntries(dept.fields.map((f) => [f.key, body.metadata?.[f.key] || null])),
    restricted: Boolean(body.restricted),
    uploadedBy: uploader.id,
  })

  const uploadUrl = await presignPut(objectKey, body.contentType)
  return Response.json({ id, uploadUrl })
}
