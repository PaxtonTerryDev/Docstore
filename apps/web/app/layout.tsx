import { Geist, Geist_Mono, Inter, EB_Garamond } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { cn } from "@workspace/ui/lib/utils";

const notoSerifHeading = EB_Garamond({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, notoSerifHeading.variable)}
    >
      <body className="flex h-svh flex-col">
        <ThemeProvider>
          <Header />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
