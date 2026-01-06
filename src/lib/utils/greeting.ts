import { dayjs } from './date'
import type { GreetingConfig, TimeSlotLabel } from '@/types'
import type { TimeSlot } from '@/types/database'

export function getGreeting(tz = 'Asia/Bangkok'): GreetingConfig {
  const hour = dayjs().tz(tz).hour()

  if (hour >= 5 && hour < 12) {
    return { text: 'สวัสดีตอนเช้า', emoji: '🌅' }
  } else if (hour >= 12 && hour < 17) {
    return { text: 'สวัสดีตอนบ่าย', emoji: '☀️' }
  } else if (hour >= 17 && hour < 21) {
    return { text: 'สวัสดีตอนเย็น', emoji: '🌆' }
  } else {
    return { text: 'สวัสดีตอนดึก', emoji: '🌙' }
  }
}

export function getTimeSlotLabels(workStart: string, workEnd: string): TimeSlotLabel[] {
  return [
    {
      slot: 'pre_work',
      label: `ก่อนเข้างาน (${workStart})`,
      icon: '🌅',
      description: `ก่อนเวลา ${workStart}`,
    },
    {
      slot: 'during_work',
      label: `ระหว่างงาน (${workStart}-${workEnd})`,
      icon: '💼',
      description: `${workStart} - ${workEnd}`,
    },
    {
      slot: 'post_work',
      label: `หลังเลิกงาน (${workEnd}+)`,
      icon: '🌙',
      description: `หลังเวลา ${workEnd}`,
    },
    {
      slot: 'anytime',
      label: 'ตลอดวัน',
      icon: '📦',
      description: 'ทำได้ตลอดวัน',
    },
  ]
}

export function getTimeSlotIcon(slot: TimeSlot): string {
  const icons: Record<TimeSlot, string> = {
    pre_work: '🌅',
    during_work: '💼',
    post_work: '🌙',
    anytime: '📦',
  }
  return icons[slot]
}

export function getTimeSlotLabel(slot: TimeSlot): string {
  const labels: Record<TimeSlot, string> = {
    pre_work: 'ก่อนงาน',
    during_work: 'ระหว่างงาน',
    post_work: 'หลังงาน',
    anytime: 'ตลอดวัน',
  }
  return labels[slot]
}
