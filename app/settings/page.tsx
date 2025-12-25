'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { useSelectedDog } from '../hooks/useSelectedDog'
import { BottomNav, BottomNavSpacer } from '../components/layout/BottomNav'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { 
  MessageSquare, 
  Mail, 
  LogOut, 
  FileText, 
  Shield, 
  HelpCircle, 
  Instagram,
  ChevronRight,
  Dog
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { dog, loading } = useSelectedDog()

  const handleLogout = async () => {
    localStorage.removeItem('selectedDogId')
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title="Settings" />
      
      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Account Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Account
            </h2>
            <Card variant="elevated" padding="none">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Dog className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{dog?.name}&apos;s Human</p>
                    <p className="text-sm text-gray-500">Managing {dog?.name}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-medium">Log Out</span>
              </button>
            </Card>
          </div>

          {/* Notifications Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Notifications
            </h2>
            <Card variant="elevated" padding="none">
              <div className="p-4 border-b border-gray-100 opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">Daily SMS Reminders</p>
                      <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Get reminded to train {dog?.name}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">Weekly Progress Email</p>
                      <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{dog?.name}&apos;s weekly summary</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Support & Legal Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Support & Legal
            </h2>
            <Card variant="elevated" padding="none">
              <a
                href="https://pawcalm.ai/#faq"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition block"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">FAQ</p>
                  <p className="text-sm text-gray-500">Common questions answered</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>

              <a
                href="https://pawcalm.ai/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition block"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Terms of Service</p>
                  <p className="text-sm text-gray-500">Our terms and conditions</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>

              <a
                href="https://pawcalm.ai/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 flex items-center gap-3 hover:bg-gray-50 transition block"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Privacy Policy</p>
                  <p className="text-sm text-gray-500">How we protect your data</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>
            </Card>
          </div>

          {/* Connect Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Connect
            </h2>
            <Card variant="elevated" padding="none">
              <a
                href="https://instagram.com/pawcalm.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 flex items-center gap-3 hover:bg-gray-50 transition block"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Follow @pawcalm.ai</p>
                  <p className="text-sm text-gray-500">Tips, updates & community</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </a>
            </Card>
          </div>

          {/* App Info */}
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">PawCalm Beta</p>
            <p className="text-gray-400 text-xs mt-1">© 2025 PawCalm. All rights reserved.</p>
          </div>

        </div>
      </main>

      <BottomNavSpacer />
      <BottomNav />
    </div>
  )
}