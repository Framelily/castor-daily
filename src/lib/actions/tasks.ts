'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskInsert, TaskUpdate, TaskTemplate, Profile } from '@/types/database'
import dayjs from 'dayjs'

export async function getTodayTasks(): Promise<{ tasks: Task[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { tasks: [], error: 'Not authenticated' }
  }

  const today = dayjs().format('YYYY-MM-DD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('scheduled_date', today)
    .order('time_slot')

  if (error) {
    return { tasks: [], error: error.message }
  }

  return { tasks: data ?? [], error: null }
}

export async function updateTaskStatus(id: string, status: 'pending' | 'completed' | 'skipped') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const updateData: TaskUpdate = {
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createAdhocTask(data: { title: string; time_slot: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const today = dayjs().format('YYYY-MM-DD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title,
      scheduled_date: today,
      time_slot: data.time_slot,
      status: 'pending',
      is_adhoc: true,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

function shouldGenerateTask(
  template: TaskTemplate,
  date: dayjs.Dayjs,
  profile: Profile
): boolean {
  const dayOfWeek = date.day() // 0-6 (Sunday-Saturday)
  const dayOfMonth = date.date() // 1-31

  // Check if it's a rest day and strict mode is on
  if (profile.strict_mode && dayOfWeek === profile.rest_day_index) {
    return false
  }

  switch (template.frequency_type) {
    case 'daily':
      return true

    case 'weekly':
      const days = template.frequency_config?.days ?? [1, 2, 3, 4, 5] // Default weekdays
      return days.includes(dayOfWeek)

    case 'interval':
      const everyNDays = template.frequency_config?.every_n_days ?? 1
      const anchorDateStr = template.frequency_config?.anchor_date
      if (!anchorDateStr) return true

      const anchorDate = dayjs(anchorDateStr)
      const diffDays = date.diff(anchorDate, 'day')
      return diffDays >= 0 && diffDays % everyNDays === 0

    case 'monthly':
      const targetDay = template.frequency_config?.day_of_month ?? 1
      // Handle month-end cases (e.g., day 31 in a 30-day month)
      const lastDayOfMonth = date.endOf('month').date()
      const effectiveDay = Math.min(targetDay, lastDayOfMonth)
      return dayOfMonth === effectiveDay

    default:
      return false
  }
}

export async function generateDailyTasks(dateStr?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', generated: 0 }
  }

  const targetDate = dateStr ? dayjs(dateStr) : dayjs()
  const formattedDate = targetDate.format('YYYY-MM-DD')

  // Get user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profile not found', generated: 0 }
  }

  // Get active templates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templates, error: templatesError } = await (supabase as any)
    .from('task_templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (templatesError) {
    return { error: templatesError.message, generated: 0 }
  }

  if (!templates || templates.length === 0) {
    return { error: null, generated: 0 }
  }

  // Check existing tasks for this date to avoid duplicates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingTasks } = await (supabase as any)
    .from('tasks')
    .select('template_id')
    .eq('user_id', user.id)
    .eq('scheduled_date', formattedDate)
    .eq('is_adhoc', false)

  const existingTemplateIds = new Set(
    (existingTasks ?? []).map((t: { template_id: string }) => t.template_id)
  )

  // Generate tasks
  const tasksToInsert: TaskInsert[] = []

  for (const template of templates as TaskTemplate[]) {
    // Skip if already generated
    if (existingTemplateIds.has(template.id)) continue

    // Check if should generate based on frequency
    if (!shouldGenerateTask(template, targetDate, profile)) continue

    tasksToInsert.push({
      user_id: user.id,
      template_id: template.id,
      title: template.title,
      scheduled_date: formattedDate,
      time_slot: template.time_slot,
      status: 'pending',
      is_adhoc: false,
      completed_at: null,
    })
  }

  if (tasksToInsert.length === 0) {
    return { error: null, generated: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('tasks')
    .insert(tasksToInsert)

  if (insertError) {
    return { error: insertError.message, generated: 0 }
  }

  revalidatePath('/dashboard')
  return { error: null, generated: tasksToInsert.length }
}

export async function getOverdueTasks(): Promise<{ tasks: Task[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { tasks: [], error: 'Not authenticated' }
  }

  const today = dayjs().format('YYYY-MM-DD')

  // Get pending tasks from before today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lt('scheduled_date', today)
    .order('scheduled_date', { ascending: false })
    .limit(10)

  if (error) {
    return { tasks: [], error: error.message }
  }

  return { tasks: data ?? [], error: null }
}

export async function getTaskStats(dateStr?: string): Promise<{
  total: number
  completed: number
  pending: number
  skipped: number
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { total: 0, completed: 0, pending: 0, skipped: 0, error: 'Not authenticated' }
  }

  const targetDate = dateStr || dayjs().format('YYYY-MM-DD')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tasks, error } = await (supabase as any)
    .from('tasks')
    .select('status')
    .eq('user_id', user.id)
    .eq('scheduled_date', targetDate)

  if (error) {
    return { total: 0, completed: 0, pending: 0, skipped: 0, error: error.message }
  }

  const stats = (tasks ?? []).reduce(
    (acc: { completed: number; pending: number; skipped: number }, task: { status: string }) => {
      if (task.status === 'completed') acc.completed++
      else if (task.status === 'skipped') acc.skipped++
      else acc.pending++
      return acc
    },
    { completed: 0, pending: 0, skipped: 0 }
  )

  return {
    total: tasks?.length ?? 0,
    ...stats,
    error: null,
  }
}
