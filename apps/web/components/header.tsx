import Link from "next/link"
import { getUser } from "@/lib/session"
import { LogoutButton } from "@/components/logout-button"

export async function Header() {
  const user = await getUser()
  if (!user) return null

  return (
    <header className="bg-[oklch(0.36_0.03_255)] text-white">
      <div className="bg-[oklch(0.3_0.03_255)] py-1 text-[11px] font-semibold">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">An Official Website of Utah County Government</div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 sm:px-8">
        <Link href="/" className="font-heading text-2xl">
          DocStore
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-6 text-sm">
          {user.role === "admin" && (
            <Link href="/audit" className="hover:underline">
              Activity log
            </Link>
          )}
          <span className="text-white/70">{user.name}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
