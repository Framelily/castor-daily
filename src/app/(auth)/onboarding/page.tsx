'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { completeOnboarding } from '@/lib/actions/profile'
import { getThaiDayShort, getThaiDayName } from '@/lib/utils/date'
import { cn } from '@/lib/utils'
import { Loader2, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    work_start: '08:00',
    work_end: '17:00',
    rest_day_index: 0, // Sunday
    strict_mode: false,
  })

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = () => {
    setError(null)

    startTransition(async () => {
      const result = await completeOnboarding(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
    })
  }

  const progressValue = (step / TOTAL_STEPS) * 100

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                ขั้นตอนที่ {step} จาก {TOTAL_STEPS}
              </span>
              <span className="font-medium text-emerald-600">
                {Math.round(progressValue)}%
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step title */}
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              {step === 1 && (
                <>
                  <Clock className="h-5 w-5 text-emerald-600" />
                  ตารางเวลาของคุณ
                </>
              )}
              {step === 2 && (
                <>
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  วันหยุดของคุณ
                </>
              )}
              {step === 3 && (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  เสร็จสิ้น!
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'กรอกเวลาเข้างานและเลิกงานของคุณ'}
              {step === 2 && 'เลือกวันหยุดประจำสัปดาห์และตั้งค่าโหมด'}
              {step === 3 && 'ตรวจสอบข้อมูลและเริ่มใช้งาน'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Work Schedule */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="work_start" className="text-base">
                  เวลาเข้างาน
                </Label>
                <Input
                  id="work_start"
                  type="time"
                  value={formData.work_start}
                  onChange={(e) =>
                    setFormData({ ...formData, work_start: e.target.value })
                  }
                  className="text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_end" className="text-base">
                  เวลาเลิกงาน
                </Label>
                <Input
                  id="work_end"
                  type="time"
                  value={formData.work_end}
                  onChange={(e) =>
                    setFormData({ ...formData, work_end: e.target.value })
                  }
                  className="text-lg h-12"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                ข้อมูลนี้ใช้สำหรับแบ่งช่วงเวลาของงาน เช่น &quot;ก่อนเข้างาน&quot;, &quot;ระหว่างงาน&quot;
              </p>
            </div>
          )}

          {/* Step 2: Rest Day */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">เลือกวันหยุดประจำสัปดาห์</Label>
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, rest_day_index: day })
                      }
                      className={cn(
                        'flex flex-col items-center justify-center rounded-lg border-2 p-2 transition-all',
                        formData.rest_day_index === day
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      )}
                    >
                      <span className="text-sm font-medium">
                        {getThaiDayShort(day)}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  เลือกแล้ว: วัน{getThaiDayName(formData.rest_day_index)}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="strict_mode"
                    checked={formData.strict_mode}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, strict_mode: checked as boolean })
                    }
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="strict_mode" className="text-base font-medium">
                      เปิดโหมดเข้มงวด
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      เมื่อเปิด จะไม่สร้างงานใดๆ ในวันหยุด เหมาะสำหรับคนที่ต้องการพักผ่อนอย่างแท้จริง
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">เวลาเข้างาน</span>
                  <span className="font-medium text-lg">{formData.work_start}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">เวลาเลิกงาน</span>
                  <span className="font-medium text-lg">{formData.work_end}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">วันหยุดประจำสัปดาห์</span>
                  <span className="font-medium text-lg">
                    วัน{getThaiDayName(formData.rest_day_index)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">โหมดเข้มงวด</span>
                  <span className={cn(
                    'font-medium text-lg',
                    formData.strict_mode ? 'text-emerald-600' : 'text-gray-500'
                  )}>
                    {formData.strict_mode ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">
                  🦫 พร้อมเริ่มสร้างนิสัยดีๆ แล้ว! คุณสามารถเปลี่ยนแปลงการตั้งค่าได้ภายหลังในหน้าตั้งค่า
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isPending}
              >
                ← ย้อนกลับ
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                ถัดไป →
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  '🦫 เริ่มใช้งาน'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
