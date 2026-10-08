import Link from "next/link"
import { FileText } from "lucide-react"
import { getUser } from "@/lib/session"
import { LogoutButton } from "@/components/logout-button"

export async function Header() {
  const user = await getUser()
  if (!user) return null

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 font-heading text-2xl font-semibold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-6" aria-hidden />
          </span>
          DocStore
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-4 text-base">
          {user.role === "admin" && (
            <Link href="/audit" className="rounded-lg px-3 py-2 font-medium hover:bg-muted">
              Activity log
            </Link>
          )}
          <span className="text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
