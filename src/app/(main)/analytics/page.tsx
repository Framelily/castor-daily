'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getAnalytics } from '@/lib/actions/analytics'
import { StatsCard } from '@/components/analytics/StatsCard'
import { Heatmap } from '@/components/analytics/Heatmap'
import { WeeklyChart } from '@/components/analytics/WeeklyChart'

interface DayStats {
  date: string
  total: number
  completed: number
  skipped: number
  rate: number
}

interface AnalyticsData {
  streak: number
  totalCompleted: number
  averageRate: number
  heatmapData: DayStats[]
  weeklyData: { week: string; rate: number }[]
}

export default function AnalyticsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      const result = await getAnalytics()
      if (!result.error && result.data) {
        setData(result.data)
      }
      setLoading(false)
    }

    if (!authLoading) {
      fetchAnalytics()
    }
  }, [authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <h1 className="mb-6 text-xl font-semibold">📊 สถิติของฉัน</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลได้</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      <h1 className="mb-6 text-xl font-semibold">📊 สถิติของฉัน</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatsCard
          icon="🔥"
          value={data.streak}
          label="วันต่อเนื่อง"
          color={data.streak > 0 ? 'text-orange-500' : 'text-gray-400'}
        />
        <StatsCard
          icon="✅"
          value={`${data.averageRate}%`}
          label="อัตราสำเร็จเฉลี่ย"
          color={data.averageRate >= 80 ? 'text-emerald-600' : data.averageRate >= 50 ? 'text-yellow-600' : 'text-red-500'}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatsCard
          icon="🎯"
          value={data.totalCompleted}
          label="งานสำเร็จ (30 วัน)"
          color="text-blue-600"
        />
        <StatsCard
          icon="📅"
          value={data.heatmapData.filter(d => d.total > 0).length}
          label="วันที่มีงาน"
          color="text-purple-600"
        />
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <Heatmap data={data.heatmapData} restDayIndex={profile?.rest_day_index ?? 0} />
      </div>

      {/* Weekly Chart */}
      <div className="mb-6">
        <WeeklyChart data={data.weeklyData} />
      </div>

      {/* Motivation */}
      {data.streak > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4 text-center">
            <p className="text-emerald-800">
              {data.streak >= 7 ? (
                <>🎉 ยอดเยี่ยม! คุณทำได้ต่อเนื่อง {data.streak} วันแล้ว!</>
              ) : (
                <>💪 ทำได้ดีมาก! รักษา streak {data.streak} วันไว้นะ!</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {data.streak === 0 && data.totalCompleted > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-center">
            <p className="text-amber-800">
              🦫 เริ่มต้นใหม่วันนี้! ทำงานให้ครบ 80% เพื่อเริ่ม streak
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
