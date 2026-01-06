'use server'

import { createClient } from '@/lib/supabase/server'
import dayjs from 'dayjs'

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

export async function getAnalytics(): Promise<{ data: AnalyticsData | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Get user profile for rest day
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rest_day_index')
    .eq('id', user.id)
    .single()

  const restDayIndex = profile?.rest_day_index ?? 0

  // Get tasks for last 30 days
  const today = dayjs()
  const startDate = today.subtract(29, 'day').format('YYYY-MM-DD')
  const endDate = today.format('YYYY-MM-DD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tasks, error } = await (supabase as any)
    .from('tasks')
    .select('scheduled_date, status')
    .eq('user_id', user.id)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)

  if (error) {
    return { data: null, error: error.message }
  }

  // Group tasks by date
  const tasksByDate: Record<string, { total: number; completed: number; skipped: number }> = {}

  for (const task of tasks || []) {
    const date = task.scheduled_date
    if (!tasksByDate[date]) {
      tasksByDate[date] = { total: 0, completed: 0, skipped: 0 }
    }
    tasksByDate[date].total++
    if (task.status === 'completed') {
      tasksByDate[date].completed++
    } else if (task.status === 'skipped') {
      tasksByDate[date].skipped++
    }
  }

  // Build heatmap data for 30 days
  const heatmapData: DayStats[] = []
  for (let i = 29; i >= 0; i--) {
    const date = today.subtract(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const dayData = tasksByDate[dateStr] || { total: 0, completed: 0, skipped: 0 }
    const activeTasks = dayData.total - dayData.skipped
    const rate = activeTasks > 0 ? Math.round((dayData.completed / activeTasks) * 100) : 0

    heatmapData.push({
      date: dateStr,
      total: dayData.total,
      completed: dayData.completed,
      skipped: dayData.skipped,
      rate,
    })
  }

  // Calculate streak (consecutive days with >= 80% completion, excluding rest days)
  let streak = 0
  let checkDate = today.subtract(1, 'day') // Start from yesterday

  while (true) {
    const dayOfWeek = checkDate.day()

    // Skip rest day
    if (dayOfWeek === restDayIndex) {
      checkDate = checkDate.subtract(1, 'day')
      continue
    }

    const dateStr = checkDate.format('YYYY-MM-DD')
    const dayData = tasksByDate[dateStr]

    if (!dayData || dayData.total === 0) {
      break // No tasks for this day
    }

    const activeTasks = dayData.total - dayData.skipped
    const rate = activeTasks > 0 ? dayData.completed / activeTasks : 0

    if (rate >= 0.8) {
      streak++
      checkDate = checkDate.subtract(1, 'day')
    } else {
      break
    }

    // Safety limit
    if (streak > 365) break
  }

  // Calculate total completed and average rate
  let totalCompleted = 0
  let totalRate = 0
  let daysWithTasks = 0

  for (const day of heatmapData) {
    totalCompleted += day.completed
    if (day.total > 0) {
      totalRate += day.rate
      daysWithTasks++
    }
  }

  const averageRate = daysWithTasks > 0 ? Math.round(totalRate / daysWithTasks) : 0

  // Calculate weekly data (last 4 weeks)
  const weeklyData: { week: string; rate: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = today.subtract(w * 7 + 6, 'day')
    const weekEnd = today.subtract(w * 7, 'day')

    let weekCompleted = 0
    let weekActive = 0

    for (let d = 0; d < 7; d++) {
      const date = weekStart.add(d, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const dayData = tasksByDate[dateStr]

      if (dayData) {
        weekCompleted += dayData.completed
        weekActive += dayData.total - dayData.skipped
      }
    }

    const weekRate = weekActive > 0 ? Math.round((weekCompleted / weekActive) * 100) : 0
    weeklyData.push({
      week: `W${4 - w}`,
      rate: weekRate,
    })
  }

  return {
    data: {
      streak,
      totalCompleted,
      averageRate,
      heatmapData,
      weeklyData,
    },
    error: null,
  }
}
