import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <span className="font-heading text-2xl">UCG DocStore</span>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="hidden flex-col justify-end gap-2 bg-brand p-10 text-brand-foreground lg:flex">
        <p className="font-heading text-lg">Utah County</p>
        <p className="font-heading text-5xl font-semibold">Recorded Documents</p>
        <p className="text-sm font-semibold">An Official Website of Utah County Government</p>
      </div>
    </div>
  )
}
