'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, MessageCircle, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/journal', label: 'Coach', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto px-6 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition ${
                  isActive
                    ? 'text-amber-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function BottomNavSpacer() {
  return <div className="h-20" />
}