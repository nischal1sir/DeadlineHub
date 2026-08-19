
-- PROJECT INTELLIGENCE PLATFORM - SUPABASE POSTGRESQL DDL SCHEMA
-- Safe to re-run: all statements are idempotent (DROP IF EXISTS first)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 2. ENUMS (safe: wrapped in DO blocks to skip if already exist)

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter existing enum if super_admin wasn't in it
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES (safe: IF NOT EXISTS)

-- PROFILES / USERS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure status and phone columns exist if table already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active'::project_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MODULES
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo'::task_status NOT NULL,
    priority task_priority DEFAULT 'medium'::task_priority NOT NULL,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SUBTASKS
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    order_index INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ACTIVITY LOGS (Audit Trail & Intelligence Engine Feed)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    category TEXT DEFAULT 'system' NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system' NOT NULL;

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_name TEXT DEFAULT 'DeadlineHub Platform' NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    allow_public_registration BOOLEAN DEFAULT TRUE NOT NULL,
    default_user_role TEXT DEFAULT 'user' NOT NULL,
    session_timeout_minutes INT DEFAULT 60 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      'user'::user_role,
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from aborting user registration
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 6. HELPER FUNCTION: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY POLICIES

-- ── Profiles 
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (true);

-- ── Projects ─
DROP POLICY IF EXISTS "Users view own projects or admins view all" ON public.projects;
CREATE POLICY "Users view own projects or admins view all"
ON public.projects FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own projects" ON public.projects;
CREATE POLICY "Users insert own projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users update own projects or admins update all" ON public.projects;
CREATE POLICY "Users update own projects or admins update all"
ON public.projects FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users delete own projects or admins delete all" ON public.projects;
CREATE POLICY "Users delete own projects or admins delete all"
ON public.projects FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

-- ── Modules ──
DROP POLICY IF EXISTS "Modules viewable if user owns project or admin" ON public.modules;
CREATE POLICY "Modules viewable if user owns project or admin"
ON public.modules FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = modules.project_id
          AND (owner_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "Modules writeable if user owns project or admin" ON public.modules;
CREATE POLICY "Modules writeable if user owns project or admin"
ON public.modules FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = modules.project_id
          AND (owner_id = auth.uid() OR public.is_admin()))
);

-- ── Tasks ────
DROP POLICY IF EXISTS "Tasks viewable if project owner or admin" ON public.tasks;
CREATE POLICY "Tasks viewable if project owner or admin"
ON public.tasks FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Tasks manageable if project owner or admin" ON public.tasks;
CREATE POLICY "Tasks manageable if project owner or admin"
ON public.tasks FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

-- ── Subtasks ─
DROP POLICY IF EXISTS "Subtasks manageable if task belongs to user or admin" ON public.subtasks;
CREATE POLICY "Subtasks manageable if task belongs to user or admin"
ON public.subtasks FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = subtasks.task_id
      AND (p.owner_id = auth.uid() OR public.is_admin())
  )
);

-- ── Activity Logs ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Activity logs viewable by owner or admin" ON public.activity_logs;
CREATE POLICY "Activity logs viewable by owner or admin"
ON public.activity_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Activity logs insertable by authenticated users" ON public.activity_logs;
CREATE POLICY "Activity logs insertable by authenticated users"
ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ── System Settings ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "System settings viewable by authenticated users" ON public.system_settings;
CREATE POLICY "System settings viewable by authenticated users"
ON public.system_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System settings editable by admins" ON public.system_settings;
CREATE POLICY "System settings editable by admins"
ON public.system_settings FOR ALL TO authenticated USING (public.is_admin());

-- ── 7-Day Deadline Schema Updates ──────────────────────────────────────
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.subtasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.user_notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    notification_key TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    is_cleared BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_notification UNIQUE (user_id, notification_key)
);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification reads" ON public.user_notification_reads;
CREATE POLICY "Users can manage their own notification reads"
ON public.user_notification_reads FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ── Admin Notification Read States ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_id UUID REFERENCES public.activity_logs(id) ON DELETE CASCADE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    is_cleared BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_admin_log_read UNIQUE (admin_id, log_id)
);

ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage their own notification reads" ON public.admin_notification_reads;
CREATE POLICY "Admins can manage their own notification reads"
ON public.admin_notification_reads FOR ALL TO authenticated
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());


-- SUPABASE STORAGE: Profile Picture Bucket


-- Create the avatars bucket (run in Supabase Dashboard → SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                                          -- publicly readable URLs
  5242880,                                       -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ── Storage RLS Policies ──

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update (overwrite) their own files
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for avatar images
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- 8. SINGLE SUPER ADMIN ENFORCEMENT & ATOMIC SWAP FUNCTION
-- Demote duplicate Super Admins if any exist before creating the unique index
WITH ranked_super_admins AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.profiles
  WHERE role = 'super_admin'
)
UPDATE public.profiles
SET role = 'admin'::user_role,
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_super_admins WHERE rn > 1
);

-- Enforce single Super Admin constraint
CREATE UNIQUE INDEX IF NOT EXISTS single_super_admin_idx
ON public.profiles (role)
WHERE role = 'super_admin';

-- Atomic procedure to transfer Super Admin privileges
CREATE OR REPLACE FUNCTION public.assign_super_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Demote current super admin(s) to admin
  UPDATE public.profiles
  SET role = 'admin'::user_role, updated_at = NOW()
  WHERE role = 'super_admin' AND id != target_user_id;

  -- Promote target user to super_admin
  UPDATE public.profiles
  SET role = 'super_admin'::user_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Testimonials ───────────────────────────────────────────────────────────
-- Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  profession TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quote TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read testimonials" ON public.testimonials
  FOR SELECT USING (true);

-- Admin insert/update/delete
CREATE POLICY "Allow authenticated insert testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update testimonials" ON public.testimonials
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete testimonials" ON public.testimonials
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER set_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_testimonials_updated_at();

-- Storage bucket for testimonial avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-avatars', 'testimonial-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow public read testimonial avatars" ON storage.objects;
CREATE POLICY "Allow public read testimonial avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'testimonial-avatars');

DROP POLICY IF EXISTS "Allow authenticated upload testimonial avatars" ON storage.objects;
CREATE POLICY "Allow authenticated upload testimonial avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'testimonial-avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete testimonial avatars" ON storage.objects;
CREATE POLICY "Allow authenticated delete testimonial avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'testimonial-avatars' AND auth.role() = 'authenticated');

-- SCHEMA COMPLETE ✓
