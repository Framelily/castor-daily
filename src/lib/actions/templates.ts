'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TaskTemplateInsert, TaskTemplateUpdate, TaskTemplate, TaskTemplateWithCategory, Category } from '@/types/database'

export async function getTemplates(): Promise<{ templates: TaskTemplateWithCategory[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { templates: [], error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('task_templates')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { templates: [], error: error.message }
  }

  return { templates: data ?? [], error: null }
}

export async function getActiveTemplates(): Promise<{ templates: TaskTemplate[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { templates: [], error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('task_templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    return { templates: [], error: error.message }
  }

  return { templates: data ?? [], error: null }
}

export async function createTemplate(data: Omit<TaskTemplateInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('task_templates')
    .insert({
      ...data,
      user_id: user.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/routines')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTemplate(id: string, data: TaskTemplateUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('task_templates')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/routines')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTemplate(id: string, isActive: boolean) {
  return updateTemplate(id, { is_active: isActive })
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('task_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/routines')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Combined action for Routines page - fetches templates and categories in one call
 */
export async function loadRoutinesData(): Promise<{
  templates: TaskTemplateWithCategory[]
  categories: Category[]
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { templates: [], categories: [], error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Fetch templates and categories in parallel
  const [templatesResult, categoriesResult] = await Promise.all([
    sb.from('task_templates').select('*, category:categories(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    sb.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  return {
    templates: templatesResult.data ?? [],
    categories: categoriesResult.data ?? [],
    error: templatesResult.error?.message || categoriesResult.error?.message || null,
  }
}
