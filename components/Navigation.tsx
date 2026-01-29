"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Kanban, BookOpen, Plus, Sparkles, Swords, Users, Eye, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/board', label: 'Tablero', icon: Kanban },
  { href: '/library', label: 'Libreria', icon: BookOpen },
  { href: '/versus', label: 'Versus', icon: Swords },
  { href: '/avatars', label: 'Avatares', icon: UserCircle },
  { href: '/research', label: 'Research', icon: Users },
  { href: '/competitors', label: 'Competidores', icon: Eye },
  { href: '/reports', label: 'Reportes IA', icon: Sparkles },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg">
              Ad Creative Lab
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <Link
            href="/ads/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ad
          </Link>
        </div>
      </div>
    </nav>
  )
}
