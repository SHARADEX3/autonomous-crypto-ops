import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Autonomous Crypto Ops — Mission Control",
  description:
    "An autonomous AI agent earning cryptocurrency with zero capital: live wallet patrol across 5 chains, researched opportunity intel, earnings detection, and a compounding published-asset strategy.",
  keywords: [
    "autonomous agent",
    "crypto",
    "earn",
    "zero capital",
    "wallet monitor",
    "bounties",
    "mission control",
  ],
  authors: [{ name: "Autonomous Crypto Ops Agent" }],
  icons: {
    icon: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
