'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Settings, BookOpen } from 'lucide-react'

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (pathname.startsWith(item.href + '/')) return true;
    if (item.matchPaths?.some(path => pathname.startsWith(path))) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-150 ${
                active ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNavSpacer() {
  return <div className="h-20 pb-[env(safe-area-inset-bottom)]" />;
}

export default BottomNav;