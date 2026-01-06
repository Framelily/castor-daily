'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dayjs from 'dayjs'

interface DayStats {
  date: string
  total: number
  completed: number
  skipped: number
  rate: number
}

interface HeatmapProps {
  data: DayStats[]
  restDayIndex: number
}

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

function getHeatmapColor(rate: number, isRestDay: boolean, hasData: boolean): string {
  if (isRestDay) return 'bg-gray-100'
  if (!hasData) return 'bg-gray-50'

  if (rate === 100) return 'bg-emerald-500'
  if (rate >= 80) return 'bg-emerald-400'
  if (rate >= 60) return 'bg-emerald-300'
  if (rate >= 40) return 'bg-yellow-300'
  if (rate >= 20) return 'bg-orange-300'
  return 'bg-red-300'
}

export function Heatmap({ data, restDayIndex }: HeatmapProps) {
  // Organize data into weeks (7 columns)
  // Each row is a day of week (Sun-Sat)
  const weeks: (DayStats | null)[][] = []
  let currentWeek: (DayStats | null)[] = []

  // Fill in leading empty cells for the first week
  if (data.length > 0) {
    const firstDay = dayjs(data[0].date)
    const firstDayOfWeek = firstDay.day()
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null)
    }
  }

  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill in trailing empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📅</span>
          30 วันที่ผ่านมา
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Day labels */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {THAI_DAYS.map((day, i) => (
            <div key={i}>{day}</div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className="aspect-square rounded-sm" />
                }

                const date = dayjs(day.date)
                const isRestDay = date.day() === restDayIndex
                const hasData = day.total > 0
                const color = getHeatmapColor(day.rate, isRestDay, hasData)

                return (
                  <div
                    key={dayIndex}
                    className={`aspect-square rounded-sm ${color} cursor-pointer transition-transform hover:scale-110`}
                    title={`${date.format('D MMM')}: ${day.completed}/${day.total - day.skipped} (${day.rate}%)`}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span>60-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-yellow-300" />
            <span>40-59%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-red-300" />
            <span>&lt;40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-gray-100" />
            <span>วันหยุด</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
