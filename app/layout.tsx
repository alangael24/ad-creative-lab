import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/Navigation"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { GuideChat } from "@/components/guide/GuideChat"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ad Creative Lab",
  description: "Sistema de Gestion de Conocimiento Creativo para Anuncios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ad Lab",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <GuideChat />
      </body>
    </html>
  )
}
