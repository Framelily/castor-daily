'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, SkipForward, ChevronDown, ChevronUp } from 'lucide-react'
import { updateTaskStatus } from '@/lib/actions/tasks'
import type { Task } from '@/types/database'
import dayjs from 'dayjs'

interface OverdueAlertProps {
  tasks: Task[]
  onUpdate: () => void
}

export function OverdueAlert({ tasks, onUpdate }: OverdueAlertProps) {
  const [expanded, setExpanded] = useState(true)
  const [localTasks, setLocalTasks] = useState(tasks)

  if (localTasks.length === 0) return null

  const handleComplete = async (task: Task) => {
    // Optimistic update
    setLocalTasks(prev => prev.filter(t => t.id !== task.id))

    const result = await updateTaskStatus(task.id, 'completed')
    if (result.error) {
      // Revert on error
      setLocalTasks(prev => [...prev, task])
    } else {
      onUpdate()
    }
  }

  const handleSkip = async (task: Task) => {
    // Optimistic update
    setLocalTasks(prev => prev.filter(t => t.id !== task.id))

    const result = await updateTaskStatus(task.id, 'skipped')
    if (result.error) {
      // Revert on error
      setLocalTasks(prev => [...prev, task])
    } else {
      onUpdate()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr)
    const today = dayjs()
    const diff = today.diff(date, 'day')

    if (diff === 1) return 'เมื่อวาน'
    if (diff < 7) return `${diff} วันที่แล้ว`
    return date.format('D MMM')
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle
          className="flex cursor-pointer items-center justify-between text-base text-amber-800"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            งานค้าง ({localTasks.length})
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2">
          {localTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white p-3"
            >
              <Checkbox
                onCheckedChange={() => handleComplete(task)}
                className="h-5 w-5"
              />
              <div className="flex-1">
                <span>{task.title}</span>
                <span className="ml-2 text-xs text-amber-600">
                  {formatDate(task.scheduled_date)}
                </span>
              </div>
              <button
                onClick={() => handleSkip(task)}
                className="text-amber-600 hover:text-amber-800"
                title="ข้าม"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
