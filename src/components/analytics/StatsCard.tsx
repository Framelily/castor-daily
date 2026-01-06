'use client'

import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  icon: string
  value: string | number
  label: string
  color?: string
}

export function StatsCard({ icon, value, label, color = 'text-emerald-600' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <span className="text-3xl mb-1">{icon}</span>
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        <span className="text-sm text-muted-foreground mt-1">{label}</span>
      </CardContent>
    </Card>
  )
}
