import { and, documents, eq } from "@workspace/db"

type Viewer = { role: "admin" | "user"; department: string }

export const visibleTo = (user: Viewer) =>
  and(eq(documents.department, user.department), user.role === "admin" ? undefined : eq(documents.restricted, false))

export const canView = (user: Viewer, doc: { restricted: boolean; department: string }) =>
  doc.department === user.department && (user.role === "admin" || !doc.restricted)
