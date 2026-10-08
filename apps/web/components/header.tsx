import Link from "next/link"
import { FileText } from "lucide-react"
import { getUser } from "@/lib/session"
import { LogoutButton } from "@/components/logout-button"

export async function Header() {
  const user = await getUser()
  if (!user) return null

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-3">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-medium">
          <FileText className="size-5" /> DocStore
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user.role === "admin" && (
            <Link href="/audit" className="text-muted-foreground hover:text-foreground">
              Audit log
            </Link>
          )}
          <span className="text-muted-foreground">
            {user.name} · {user.role}
          </span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
