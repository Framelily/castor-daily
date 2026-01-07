-- Castor Daily Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'interval', 'monthly');
CREATE TYPE time_slot AS ENUM ('pre_work', 'during_work', 'post_work', 'anytime');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'skipped');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  work_start TIME NOT NULL DEFAULT '08:00',
  work_end TIME NOT NULL DEFAULT '17:00',
  rest_day_index INTEGER NOT NULL DEFAULT 0 CHECK (rest_day_index >= 0 AND rest_day_index <= 6),
  strict_mode BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ============================================
-- TASK_TEMPLATES TABLE
-- ============================================
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency_type frequency_type NOT NULL DEFAULT 'daily',
  frequency_config JSONB NOT NULL DEFAULT '{}',
  time_slot time_slot NOT NULL DEFAULT 'anytime',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX idx_task_templates_is_active ON task_templates(is_active);

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  time_slot time_slot NOT NULL DEFAULT 'anytime',
  status task_status NOT NULL DEFAULT 'pending',
  is_adhoc BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_template_id ON tasks(template_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_date ON tasks(user_id, scheduled_date);

-- Unique constraint to prevent duplicate tasks from same template on same day
CREATE UNIQUE INDEX idx_tasks_unique_template_date
  ON tasks(user_id, template_id, scheduled_date)
  WHERE template_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories: Users can only access their own categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Task Templates: Users can only access their own templates
CREATE POLICY "Users can view own task templates" ON task_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task templates" ON task_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task templates" ON task_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task templates" ON task_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks: Users can only access their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- DEFAULT CATEGORIES FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, sort_order, is_default) VALUES
    (p_user_id, 'งานบ้าน', '#f59e0b', 'Home', 1, true),
    (p_user_id, 'สุขภาพ', '#10b981', 'Heart', 2, true),
    (p_user_id, 'งานประจำ', '#3b82f6', 'Briefcase', 3, true),
    (p_user_id, 'อื่นๆ', '#8b5cf6', 'MoreHorizontal', 4, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
