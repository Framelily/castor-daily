export * from './database'

// UI types
export interface GreetingConfig {
  text: string
  emoji: string
}

export interface TimeSlotLabel {
  slot: import('./database').TimeSlot
  label: string
  icon: string
  description: string
}

// Form types
export interface OnboardingFormData {
  work_start: string
  work_end: string
  rest_day_index: number
  strict_mode: boolean
}

export interface TaskTemplateFormData {
  title: string
  description?: string
  category_id?: string
  frequency_type: import('./database').FrequencyType
  frequency_config: import('./database').FrequencyConfig
  time_slot: import('./database').TimeSlot
}

export interface AdhocTaskFormData {
  title: string
  time_slot: import('./database').TimeSlot
}
