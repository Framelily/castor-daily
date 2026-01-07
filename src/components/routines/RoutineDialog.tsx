'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createTemplate, updateTemplate } from '@/lib/actions/templates'
import type { TaskTemplateWithCategory, Category, FrequencyType, TimeSlot, FrequencyConfig } from '@/types/database'

const DAYS_OF_WEEK = [
  { value: 0, label: 'อาทิตย์' },
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
  { value: 6, label: 'เสาร์' },
]

interface RoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TaskTemplateWithCategory | null
  categories: Category[]
  onSuccess: () => void
}

export function RoutineDialog({
  open,
  onOpenChange,
  template,
  categories,
  onSuccess,
}: RoutineDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily')
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('anytime')

  // Frequency config
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [intervalDays, setIntervalDays] = useState(2)
  const [monthlyDay, setMonthlyDay] = useState(1)

  const isEditing = !!template

  // Sync form state when template changes
  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setDescription(template.description || '')
      setCategoryId(template.category_id || '')
      setFrequencyType(template.frequency_type)
      setTimeSlot(template.time_slot)

      if (template.frequency_config) {
        if (template.frequency_config.days) {
          setWeeklyDays(template.frequency_config.days)
        }
        if (template.frequency_config.every_n_days) {
          setIntervalDays(template.frequency_config.every_n_days)
        }
        if (template.frequency_config.day_of_month) {
          setMonthlyDay(template.frequency_config.day_of_month)
        }
      }
    } else {
      // Reset form
      setTitle('')
      setDescription('')
      setCategoryId(categories[0]?.id || '')
      setFrequencyType('daily')
      setTimeSlot('anytime')
      setWeeklyDays([1, 2, 3, 4, 5])
      setIntervalDays(2)
      setMonthlyDay(1)
    }
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, open])

  const buildFrequencyConfig = (): FrequencyConfig => {
    switch (frequencyType) {
      case 'weekly':
        return { days: weeklyDays }
      case 'interval':
        return {
          every_n_days: intervalDays,
          anchor_date: new Date().toISOString().split('T')[0],
        }
      case 'monthly':
        return { day_of_month: monthlyDay }
      default:
        return {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      title,
      description: description || null,
      category_id: categoryId || null,
      frequency_type: frequencyType,
      frequency_config: buildFrequencyConfig(),
      time_slot: timeSlot,
      is_active: true,
    }

    let result
    if (isEditing) {
      result = await updateTemplate(template.id, data)
    } else {
      result = await createTemplate(data)
    }

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onSuccess()
  }

  const toggleWeeklyDay = (day: number) => {
    setWeeklyDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'แก้ไขกิจวัตร' : 'สร้างกิจวัตรใหม่'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อกิจวัตร *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="เช่น ออกกำลังกาย"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Type */}
          <div className="space-y-2">
            <Label>ความถี่</Label>
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as FrequencyType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">ทุกวัน</SelectItem>
                <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                <SelectItem value="interval">ทุก N วัน</SelectItem>
                <SelectItem value="monthly">รายเดือน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frequency Config - Weekly */}
          {frequencyType === 'weekly' && (
            <div className="space-y-2">
              <Label>เลือกวัน</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeeklyDay(day.value)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      weeklyDays.includes(day.value)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frequency Config - Interval */}
          {frequencyType === 'interval' && (
            <div className="space-y-2">
              <Label htmlFor="interval">ทุกกี่วัน</Label>
              <Input
                id="interval"
                type="number"
                min={1}
                max={365}
                value={intervalDays}
                onChange={e => setIntervalDays(parseInt(e.target.value) || 2)}
              />
            </div>
          )}

          {/* Frequency Config - Monthly */}
          {frequencyType === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="monthlyDay">วันที่ในเดือน</Label>
              <Input
                id="monthlyDay"
                type="number"
                min={1}
                max={31}
                value={monthlyDay}
                onChange={e => setMonthlyDay(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Time Slot */}
          <div className="space-y-2">
            <Label>ช่วงเวลา</Label>
            <Select
              value={timeSlot}
              onValueChange={(v) => setTimeSlot(v as TimeSlot)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_work">ก่อนเริ่มงาน</SelectItem>
                <SelectItem value="during_work">ระหว่างทำงาน</SelectItem>
                <SelectItem value="post_work">หลังเลิกงาน</SelectItem>
                <SelectItem value="anytime">ทำได้ตลอดวัน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !title}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                'บันทึก'
              ) : (
                'สร้าง'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
