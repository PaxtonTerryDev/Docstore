import { randomUUID } from "node:crypto"
import { db, documents } from "@workspace/db"
import { presignPut } from "@workspace/storage"
import { getUser } from "@/lib/session"

export async function POST(req: Request) {
  const body = await req.json()
  const uploader = await getUser()
  if (!uploader) return Response.json({ error: "unauthorized" }, { status: 401 })
  const id = randomUUID()
  const objectKey = `${id}/${body.filename}`

  await db.insert(documents).values({
    id,
    filename: body.filename,
    contentType: body.contentType || "application/octet-stream",
    sizeBytes: body.sizeBytes,
    objectKey,
    docType: body.docType,
    instrumentNumber: body.instrumentNumber,
    book: body.book || null,
    page: Number.parseInt(body.page) || null,
    recordedDate: body.recordedDate || null,
    uploadedBy: uploader.id,
  })

  const uploadUrl = await presignPut(objectKey, body.contentType)
  return Response.json({ id, uploadUrl })
}
