export type FrequencyType = 'daily' | 'weekly' | 'interval' | 'monthly'
export type TimeSlot = 'pre_work' | 'during_work' | 'post_work' | 'anytime'
export type TaskStatus = 'pending' | 'completed' | 'skipped'

export interface FrequencyConfig {
  days?: number[] // for weekly: [0,1,2,3,4,5,6] (0=Sunday)
  every_n_days?: number // for interval
  anchor_date?: string // for interval: ISO date string
  day_of_month?: number // for monthly: 1-31
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  work_start: string // TIME format "HH:mm"
  work_end: string // TIME format "HH:mm"
  rest_day_index: number // 0-6 (0=Sunday)
  strict_mode: boolean
  timezone: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string // HEX color
  icon: string | null // Lucide icon name
  sort_order: number
  is_default: boolean
  created_at: string
}

export interface TaskTemplate {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  frequency_type: FrequencyType
  frequency_config: FrequencyConfig
  time_slot: TimeSlot
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  template_id: string | null
  title: string
  scheduled_date: string // DATE format "YYYY-MM-DD"
  time_slot: TimeSlot
  status: TaskStatus
  is_adhoc: boolean
  completed_at: string | null
  created_at: string
}

// Extended types with relations
export interface TaskWithTemplate extends Task {
  template: TaskTemplate | null
}

export interface TaskTemplateWithCategory extends TaskTemplate {
  category: Category | null
}

// Insert types (without generated fields)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>

export type TaskTemplateInsert = Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>
export type TaskTemplateUpdate = Partial<Omit<TaskTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type TaskInsert = Omit<Task, 'id' | 'created_at'>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>

// Database schema for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      categories: {
        Row: Category
        Insert: CategoryInsert
        Update: CategoryUpdate
      }
      task_templates: {
        Row: TaskTemplate
        Insert: TaskTemplateInsert
        Update: TaskTemplateUpdate
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
    }
    Enums: {
      frequency_type: FrequencyType
      time_slot: TimeSlot
      task_status: TaskStatus
    }
  }
}
