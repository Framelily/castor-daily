import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/th'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('th')

export { dayjs }

export function formatDate(date: Date | string, format = 'D MMMM YYYY') {
  return dayjs(date).format(format)
}

export function formatTime(time: string) {
  return dayjs(`1970-01-01 ${time}`).format('HH:mm')
}

export function getToday(tz = 'Asia/Bangkok') {
  return dayjs().tz(tz).format('YYYY-MM-DD')
}

export function getYesterday(tz = 'Asia/Bangkok') {
  return dayjs().tz(tz).subtract(1, 'day').format('YYYY-MM-DD')
}

export function getDayOfWeek(date: Date | string, tz = 'Asia/Bangkok') {
  return dayjs(date).tz(tz).day()
}

export function isRestDay(date: Date | string, restDayIndex: number, tz = 'Asia/Bangkok') {
  return getDayOfWeek(date, tz) === restDayIndex
}

export function getThaiDayName(dayIndex: number) {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return days[dayIndex]
}

export function getThaiDayShort(dayIndex: number) {
  const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  return days[dayIndex]
}
