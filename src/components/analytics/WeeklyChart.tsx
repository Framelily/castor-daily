'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WeeklyChartProps {
  data: { week: string; rate: number }[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxRate = Math.max(...data.map(d => d.rate), 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📈</span>
          เทรนด์รายสัปดาห์
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-around h-32 gap-2">
          {data.map((week, index) => {
            const height = maxRate > 0 ? (week.rate / maxRate) * 100 : 0
            const barColor = week.rate >= 80
              ? 'bg-emerald-500'
              : week.rate >= 60
              ? 'bg-emerald-400'
              : week.rate >= 40
              ? 'bg-yellow-400'
              : 'bg-red-400'

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex justify-center" style={{ height: '100px' }}>
                  <div
                    className={`w-8 ${barColor} rounded-t-md transition-all duration-300`}
                    style={{ height: `${height}%`, minHeight: week.rate > 0 ? '8px' : '0' }}
                  />
                  <span className="absolute -top-5 text-xs font-medium">
                    {week.rate}%
                  </span>
                </div>
                <span className="mt-2 text-xs text-muted-foreground">{week.week}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          อัตราสำเร็จ 4 สัปดาห์ที่ผ่านมา
        </p>
      </CardContent>
    </Card>
  )
}
