'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useState, Suspense } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for error in URL params
  const urlError = searchParams.get('error')
  const errorMessage = urlError === 'auth' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' : null

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl">🦫</div>
          <CardTitle className="text-2xl font-bold">Castor Daily</CardTitle>
          <CardDescription>สร้างนิสัยดีๆ ทีละวัน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || errorMessage) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => handleSignIn('google')}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              เข้าสู่ระบบด้วย Google
            </Button>

            {/* LINE Login - เปิดใช้เมื่อตั้งค่า LINE OAuth แล้ว */}
            {/*
            <Button
              onClick={() => handleSignIn('line')}
              className="w-full bg-[#00B900] hover:bg-[#00A000] text-white"
              size="lg"
              disabled={loading}
            >
              เข้าสู่ระบบด้วย LINE
            </Button>
            */}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            เข้าสู่ระบบเพื่อเริ่มติดตามกิจวัตรของคุณ
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
