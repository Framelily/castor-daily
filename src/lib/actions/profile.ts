'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ProfileUpdate } from '@/types/database'

export async function updateProfile(data: ProfileUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(data)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')

  return { success: true }
}

export async function completeOnboarding(data: {
  work_start: string
  work_end: string
  rest_day_index: number
  strict_mode: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user metadata for display name and avatar
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url || null

  // Upsert profile (insert if not exists, update if exists)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
      work_start: data.work_start,
      work_end: data.work_end,
      rest_day_index: data.rest_day_index,
      strict_mode: data.strict_mode,
      onboarding_completed: true,
    }, { onConflict: 'id' })

  if (profileError) {
    return { error: profileError.message }
  }

  // Create default categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: categoriesError } = await (supabase as any).rpc(
    'create_default_categories',
    { p_user_id: user.id }
  )

  if (categoriesError) {
    console.error('Error creating default categories:', categoriesError)
    // Don't fail the onboarding if categories fail
  }

  revalidatePath('/dashboard')

  return { success: true }
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', profile: null }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: error.message, profile: null }
  }

  return { profile, error: null }
}
