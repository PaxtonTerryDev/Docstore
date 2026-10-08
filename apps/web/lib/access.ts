import { documents, eq } from "@workspace/db"

type Viewer = { role: "admin" | "user" }

export const visibleTo = (user: Viewer) => (user.role === "admin" ? undefined : eq(documents.restricted, false))

export const canView = (user: Viewer, doc: { restricted: boolean }) => user.role === "admin" || !doc.restricted
