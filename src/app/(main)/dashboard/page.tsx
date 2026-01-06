'use client'

import { useEffect, useState, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2, MoreHorizontal, SkipForward, RotateCcw, Plus } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { getGreeting } from '@/lib/utils/greeting'
import { getTodayTasks, updateTaskStatus, generateDailyTasks, createAdhocTask, getOverdueTasks } from '@/lib/actions/tasks'
import type { Task, TimeSlot } from '@/types/database'
import { OverdueAlert } from '@/components/dashboard/OverdueAlert'

const TIME_SLOT_CONFIG: Record<TimeSlot, { label: string; icon: string }> = {
  pre_work: { label: 'ก่อนเริ่มงาน', icon: '🌅' },
  during_work: { label: 'ระหว่างทำงาน', icon: '💼' },
  post_work: { label: 'หลังเลิกงาน', icon: '🌙' },
  anytime: { label: 'ทำได้ตลอดวัน', icon: '⭐' },
}

const TIME_SLOT_ORDER: TimeSlot[] = ['pre_work', 'during_work', 'post_work', 'anytime']

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingTasks, setGeneratingTasks] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskSlot, setNewTaskSlot] = useState<TimeSlot>('anytime')

  const greeting = getGreeting(profile?.timezone)

  const fetchTasks = useCallback(async () => {
    const [todayResult, overdueResult] = await Promise.all([
      getTodayTasks(),
      getOverdueTasks(),
    ])
    if (!todayResult.error) {
      setTasks(todayResult.tasks)
    }
    if (!overdueResult.error) {
      setOverdueTasks(overdueResult.tasks)
    }
    setLoading(false)
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setGeneratingTasks(true)

    // Generate tasks first (will skip if already generated today)
    await generateDailyTasks()
    setGeneratingTasks(false)

    // Then fetch tasks (parallel)
    await fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!authLoading) {
      loadDashboard()
    }
  }, [authLoading, loadDashboard])

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : t
      )
    )

    const result = await updateTaskStatus(task.id, newStatus)
    if (result.error) {
      // Revert on error
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? task : t
        )
      )
    }
  }

  const handleSkipTask = async (task: Task) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, status: 'skipped' as const } : t
      )
    )

    const result = await updateTaskStatus(task.id, 'skipped')
    if (result.error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? task : t
        )
      )
    }
  }

  const handleUnskipTask = async (task: Task) => {
    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, status: 'pending' as const } : t
      )
    )

    const result = await updateTaskStatus(task.id, 'pending')
    if (result.error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? task : t
        )
      )
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const result = await createAdhocTask({
      title: newTaskTitle.trim(),
      time_slot: newTaskSlot,
    })

    if (!result.error) {
      setNewTaskTitle('')
      setShowAddTask(false)
      fetchTasks()
    }
  }

  // Group tasks by time slot
  const groupedTasks = tasks.reduce<Record<TimeSlot, Task[]>>((acc, task) => {
    const slot = task.time_slot as TimeSlot
    if (!acc[slot]) acc[slot] = []
    acc[slot].push(task)
    return acc
  }, {} as Record<TimeSlot, Task[]>)

  // Calculate progress
  const activeTasks = tasks.filter(t => t.status !== 'skipped')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const progressPercent = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 0

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {greeting.emoji} {greeting.text}, {profile?.display_name ?? 'คุณ'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          วันนี้ {new Date().toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">ความคืบหน้าวันนี้</span>
            <span className="text-sm text-muted-foreground">
              {completedTasks.length} / {activeTasks.length} งาน
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-2xl font-bold text-emerald-600">
              {progressPercent}%
            </p>
            {progressPercent === 100 && activeTasks.length > 0 && (
              <span className="text-2xl">🎉</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      <OverdueAlert tasks={overdueTasks} onUpdate={fetchTasks} />

      {/* Tasks by time slot */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-4xl">🦫</p>
              <p className="mt-2 text-muted-foreground">
                ยังไม่มีงานสำหรับวันนี้
              </p>
              <p className="text-sm text-muted-foreground">
                ไปที่ &quot;กิจวัตร&quot; เพื่อเพิ่มงานประจำ
              </p>
              {generatingTasks && (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังสร้างงาน...
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {TIME_SLOT_ORDER.map(slot => {
              const slotTasks = groupedTasks[slot] || []
              if (slotTasks.length === 0) return null

              const config = TIME_SLOT_CONFIG[slot]
              const slotCompleted = slotTasks.filter(t => t.status === 'completed').length
              const slotActive = slotTasks.filter(t => t.status !== 'skipped').length

              return (
                <Card key={slot}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span>{config.icon}</span>
                      {config.label}
                      <span className="ml-auto text-xs font-normal text-muted-foreground">
                        {slotCompleted}/{slotActive}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {slotTasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          task.status === 'skipped'
                            ? 'bg-gray-50 opacity-50'
                            : task.status === 'completed'
                            ? 'bg-emerald-50'
                            : ''
                        }`}
                      >
                        {task.status !== 'skipped' ? (
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleTask(task)}
                            className="h-5 w-5"
                          />
                        ) : (
                          <button
                            onClick={() => handleUnskipTask(task)}
                            className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
                            title="เลิกข้าม"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <span
                          className={`flex-1 ${
                            task.status === 'completed'
                              ? 'text-muted-foreground line-through'
                              : task.status === 'skipped'
                              ? 'text-muted-foreground line-through'
                              : ''
                          }`}
                        >
                          {task.title}
                          {task.is_adhoc && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (งานพิเศษ)
                            </span>
                          )}
                        </span>
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleSkipTask(task)}
                            className="text-muted-foreground hover:text-foreground"
                            title="ข้าม"
                          >
                            <SkipForward className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>

      {/* Add adhoc task */}
      <div className="mt-4">
        {showAddTask ? (
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleAddTask} className="space-y-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="ชื่องาน"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  {TIME_SLOT_ORDER.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setNewTaskSlot(slot)}
                      className={`flex-1 rounded-md px-2 py-1 text-xs transition-colors ${
                        newTaskSlot === slot
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {TIME_SLOT_CONFIG[slot].icon}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowAddTask(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!newTaskTitle.trim()}
                  >
                    เพิ่ม
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มงานพิเศษ
          </Button>
        )}
      </div>
    </div>
  )
}
