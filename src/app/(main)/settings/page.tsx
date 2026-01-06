'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Clock, Calendar, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getThaiDayName } from '@/lib/utils/date'
import { useState } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { profile, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-emerald-600" />
        <h1 className="text-xl font-semibold">ตั้งค่า</h1>
      </div>

      {/* Profile Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-xl">🦫</span>
            </div>
            <div>
              <p className="font-medium">{profile?.display_name ?? 'ผู้ใช้'}</p>
              <p className="text-sm text-muted-foreground font-normal">
                บัญชี Castor Daily
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Work Schedule Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            ตารางเวลาทำงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">เวลาเข้างาน</span>
            <span className="font-medium">{profile?.work_start ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">เวลาเลิกงาน</span>
            <span className="font-medium">{profile?.work_end ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Rest Day Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            วันหยุด
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">วันหยุดประจำสัปดาห์</span>
            <span className="font-medium">
              วัน{profile?.rest_day_index !== undefined ? getThaiDayName(profile.rest_day_index) : '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Strict Mode Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            โหมดเข้มงวด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">สถานะ</span>
            <span className={`font-medium ${profile?.strict_mode ? 'text-emerald-600' : 'text-gray-500'}`}>
              {profile?.strict_mode ? 'เปิด' : 'ปิด'}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            เมื่อเปิด จะไม่มีงานใดๆ ในวันหยุด
          </p>
        </CardContent>
      </Card>

      {/* Sign Out Button */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            กำลังออกจากระบบ...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </>
        )}
      </Button>

      {/* App Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Castor Daily v0.1.0
        </p>
        <p className="text-xs text-muted-foreground">
          🦫 สร้างนิสัยดีๆ ทีละวัน
        </p>
      </div>
    </div>
  )
}
