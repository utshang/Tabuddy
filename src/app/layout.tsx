import type { Metadata, Viewport } from "next"
import { Geist, Bevan } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const bevan = Bevan({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bevan",
})

export const metadata: Metadata = {
  title: "Tabuddy — Plan the trip, split the tab.",
  description: "Collaborative trip planning with built-in expense splitting.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tabuddy",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#349ce1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className={`${geist.variable} ${bevan.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
