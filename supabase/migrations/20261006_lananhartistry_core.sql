-- ==============================================================================
-- LANANHARTISTRY CORE DATABASE MIGRATION
-- Platform: Supabase / PostgreSQL
-- Features: Multi-user, RLS, Shared Translation Memory, Terminology, Pronouns,
--           Granular Story Privacy, Audit Logs, and Multi-device Sync.
-- Migration: 20261006_lananhartistry_core.sql
-- ==============================================================================

-- Enable pgcrypto for UUID generation if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Supabase Auth link)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Literary Translator',
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    default_story_privacy TEXT DEFAULT 'private' CHECK (default_story_privacy IN ('private', 'public', 'link_only', 'public_memory_only')),
    allow_public_memory_by_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. STORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover TEXT,
    source_language TEXT NOT NULL DEFAULT 'zh',
    target_language TEXT NOT NULL DEFAULT 'vi',
    status TEXT NOT NULL DEFAULT 'translating' CHECK (status IN ('planning', 'translating', 'paused', 'completed', 'archived')),
    privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public', 'link_only', 'public_memory_only')),
    visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'LINK_ONLY')),
    original_visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (original_visibility IN ('PRIVATE', 'PUBLIC', 'LINK_ONLY')),
    translation_visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (translation_visibility IN ('PRIVATE', 'PUBLIC', 'LINK_ONLY')),
    source_type TEXT NOT NULL DEFAULT 'USER' CHECK (source_type IN ('SYSTEM', 'USER', 'IMPORTED', 'COMMUNITY')),
    share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    sharing_permissions JSONB NOT NULL DEFAULT '{
        "showOriginal": false,
        "showTranslation": true,
        "showSummary": true,
        "showCharacters": true,
        "showStoryBible": false,
        "showPlotTimeline": true,
        "showTranslationMemory": true,
        "showTerminology": true,
        "showPronouns": true,
        "showNotes": false
    }'::jsonb,
    total_chapters INT NOT NULL DEFAULT 0,
    translated_chapters INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CHAPTERS & SEGMENTS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.story_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title TEXT NOT NULL,
    original_text TEXT NOT NULL DEFAULT '',
    translation_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'translating', 'reviewed', 'completed')),
    summary TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS public.story_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id TEXT NOT NULL,
    chapter_id UUID NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    segment_order INT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL DEFAULT '',
    translation_status TEXT NOT NULL DEFAULT 'untranslated' CHECK (translation_status IN ('untranslated', 'draft', 'translated', 'reviewed')),
    notes TEXT DEFAULT '',
    character_from TEXT,
    character_to TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. CHARACTERS & RELATIONSHIPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    gender TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    role TEXT NOT NULL DEFAULT 'supporting' CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'minor')),
    status TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'deceased', 'unknown', 'sealed')),
    identity TEXT DEFAULT '',
    faction TEXT DEFAULT '',
    personality TEXT DEFAULT '',
    speaking_style TEXT DEFAULT '',
    first_appearance INT DEFAULT 1,
    important_chapters INT[] DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.character_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    character_a TEXT NOT NULL,
    character_b TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    current_status TEXT DEFAULT 'active',
    start_chapter INT DEFAULT 1,
    end_chapter INT,
    context TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PRONOUN RULES & USAGE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pronoun_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    from_character TEXT NOT NULL,
    to_character TEXT NOT NULL,
    self_pronoun TEXT NOT NULL,
    target_address TEXT NOT NULL,
    context TEXT DEFAULT '',
    start_chapter INT DEFAULT 1,
    end_chapter INT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'historical')),
    reason_for_change TEXT DEFAULT '',
    chapters INT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pronoun_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.pronoun_rules(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    segment_id TEXT,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. TRANSLATION MEMORY (Story-specific & Shared Global)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'zh',
    target_language TEXT NOT NULL DEFAULT 'vi',
    context TEXT DEFAULT '',
    genre TEXT DEFAULT 'general',
    speaker_gender TEXT,
    relationship_context TEXT,
    notes TEXT DEFAULT '',
    confidence_score NUMERIC(4,3) DEFAULT 0.95,
    usage_count INT NOT NULL DEFAULT 1,
    contributor_count INT NOT NULL DEFAULT 1,
    source_type TEXT NOT NULL DEFAULT 'USER' CHECK (source_type IN ('SYSTEM', 'USER', 'IMPORTED', 'COMMUNITY')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending', 'approved')),
    preferred BOOLEAN NOT NULL DEFAULT TRUE,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.translation_memory_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES public.translation_memory(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    story_title TEXT,
    chapter_number INT NOT NULL,
    segment_number INT,
    example_sentence_original TEXT,
    example_sentence_translation TEXT,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. VOCABULARY & TERMINOLOGY DATABASES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'zh',
    meaning TEXT NOT NULL,
    pronunciation TEXT,
    pinyin TEXT,
    preferred_translation TEXT NOT NULL,
    alternative_translations TEXT[] DEFAULT '{}',
    context TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    usage_count INT NOT NULL DEFAULT 1,
    contributor_count INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    source_type TEXT NOT NULL DEFAULT 'USER' CHECK (source_type IN ('SYSTEM', 'USER', 'IMPORTED', 'COMMUNITY')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.terminology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    preferred_translation TEXT NOT NULL,
    alternative_translations TEXT[] DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'title', 'organization', 'location', 'item', 'cultivation', 'fantasy',
        'historical', 'modern', 'character_title', 'proper_noun', 'general'
    )),
    context TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    usage_count INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    source_type TEXT NOT NULL DEFAULT 'USER' CHECK (source_type IN ('SYSTEM', 'USER', 'IMPORTED', 'COMMUNITY')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. STORY BIBLE, PLOT EVENTS & VERSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.story_bible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID UNIQUE NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    locations JSONB DEFAULT '[]'::jsonb,
    organizations JSONB DEFAULT '[]'::jsonb,
    terminology JSONB DEFAULT '[]'::jsonb,
    important_objects JSONB DEFAULT '[]'::jsonb,
    mysteries JSONB DEFAULT '[]'::jsonb,
    important_quotes JSONB DEFAULT '[]'::jsonb,
    worldbuilding_rules JSONB DEFAULT '[]'::jsonb,
    translation_style JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plot_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.story_chapters(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    characters TEXT[] DEFAULT '{}',
    importance TEXT NOT NULL DEFAULT 'minor' CHECK (importance IN ('major', 'minor', 'climax', 'turning_point')),
    order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.translation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    translation_text TEXT NOT NULL,
    summary TEXT DEFAULT '',
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author TEXT NOT NULL DEFAULT 'Translator'
);

-- ==============================================================================
-- 9. COMMUNITY CONTRIBUTIONS & WORKFLOW
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shared_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contributor_name TEXT NOT NULL,
    contribution_type TEXT NOT NULL CHECK (contribution_type IN ('translation_memory', 'vocabulary', 'terminology', 'pronoun_rule')),
    target_record_id UUID,
    original TEXT NOT NULL,
    proposed_value TEXT NOT NULL,
    reason TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    source_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    source_story_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. SHARE LINKS & PERMISSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.story_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    permissions JSONB NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==============================================================================
-- 11. IMPORT JOBS & AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'zh',
    target_language TEXT NOT NULL DEFAULT 'vi',
    genre TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    source_type TEXT NOT NULL DEFAULT 'USER' CHECK (source_type IN ('SYSTEM', 'USER', 'IMPORTED')),
    status TEXT NOT NULL DEFAULT 'parsing' CHECK (status IN ('parsing', 'reviewing', 'committing', 'completed', 'failed')),
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_stories_owner_id ON public.stories(owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON public.stories(visibility);
CREATE INDEX IF NOT EXISTS idx_stories_privacy ON public.stories(privacy);
CREATE INDEX IF NOT EXISTS idx_stories_share_token ON public.stories(share_token);

CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON public.story_chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON public.story_chapters(story_id, chapter_number);

CREATE INDEX IF NOT EXISTS idx_segments_chapter_id ON public.story_segments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_segments_story_id ON public.story_segments(story_id);

CREATE INDEX IF NOT EXISTS idx_characters_story_id ON public.characters(story_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON public.characters(name);

CREATE INDEX IF NOT EXISTS idx_pronouns_story_id ON public.pronoun_rules(story_id);

CREATE INDEX IF NOT EXISTS idx_tm_source_text ON public.translation_memory(source_text);
CREATE INDEX IF NOT EXISTS idx_tm_target_text ON public.translation_memory(target_text);
CREATE INDEX IF NOT EXISTS idx_tm_status ON public.translation_memory(status);
CREATE INDEX IF NOT EXISTS idx_tm_source_type ON public.translation_memory(source_type);

CREATE INDEX IF NOT EXISTS idx_vocab_term ON public.vocabulary(term);
CREATE INDEX IF NOT EXISTS idx_vocab_status ON public.vocabulary(status);

CREATE INDEX IF NOT EXISTS idx_term_term ON public.terminology(term);
CREATE INDEX IF NOT EXISTS idx_term_category ON public.terminology(category);

CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.shared_contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON public.shared_contributions(contributor_id);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronoun_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronoun_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_memory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_bible ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'USER');


-- Prevent a user from promoting their own profile to administrator.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an administrator can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();
-- Stories Policies
-- SELECT: Owner, or Public, or System story, or Admin, or user with explicit permission
CREATE POLICY "Stories are viewable by owner or if public or if system"
ON public.stories FOR SELECT USING (
    owner_id = auth.uid()
    OR visibility = 'PUBLIC'
    OR privacy = 'public'
    OR source_type = 'SYSTEM'
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.story_permissions sp
        WHERE sp.story_id = id AND sp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own stories"
ON public.stories FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    OR (source_type = 'SYSTEM' AND public.is_admin())
);

CREATE POLICY "Users can update own stories"
ON public.stories FOR UPDATE USING (
    owner_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.story_permissions sp
        WHERE sp.story_id = id AND sp.user_id = auth.uid() AND sp.permission_level IN ('write', 'admin')
    )
);

CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE USING (
    owner_id = auth.uid()
    OR public.is_admin()
);

-- Story Chapters Policies
CREATE POLICY "Chapters viewable if parent story is viewable"
ON public.story_chapters FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (
            s.owner_id = auth.uid()
            OR s.visibility = 'PUBLIC'
            OR s.privacy = 'public'
            OR s.source_type = 'SYSTEM'
            OR public.is_admin()
        )
    )
);

CREATE POLICY "Chapters editable by story owner or admin"
ON public.story_chapters FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR public.is_admin())
    )
);

-- Story Segments Policies
CREATE POLICY "Segments viewable if story viewable"
ON public.story_segments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR s.visibility = 'PUBLIC' OR s.privacy = 'public' OR s.source_type = 'SYSTEM' OR public.is_admin())
    )
);

CREATE POLICY "Segments editable by story owner"
ON public.story_segments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR public.is_admin())
    )
);

-- Characters Policies
CREATE POLICY "Characters viewable if story viewable"
ON public.characters FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR s.visibility = 'PUBLIC' OR s.privacy = 'public' OR s.source_type = 'SYSTEM' OR public.is_admin())
    )
);

CREATE POLICY "Characters editable by story owner"
ON public.characters FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR public.is_admin())
    )
);

-- Relationships & Pronouns
CREATE POLICY "Relationships viewable if story viewable"
ON public.character_relationships FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR s.visibility = 'PUBLIC' OR s.privacy = 'public' OR s.source_type = 'SYSTEM' OR public.is_admin())
    )
);

CREATE POLICY "Pronoun rules viewable if story viewable or public memory"
ON public.pronoun_rules FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (
            s.owner_id = auth.uid()
            OR s.visibility = 'PUBLIC'
            OR s.privacy IN ('public', 'public_memory_only')
            OR (s.sharing_permissions->>'showPronouns')::boolean = true
            OR s.source_type = 'SYSTEM'
            OR public.is_admin()
        )
    )
);

CREATE POLICY "Pronoun rules editable by story owner"
ON public.pronoun_rules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR public.is_admin())
    )
);

-- Translation memory is private by default. Shared entries must be approved by an administrator.
CREATE POLICY "TM readable by owner or when explicitly public"
ON public.translation_memory FOR SELECT USING (
    created_by = auth.uid()
    OR (source_type IN ('SYSTEM', 'COMMUNITY') AND status = 'approved')
    OR EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
          AND (s.owner_id = auth.uid() OR s.visibility = 'PUBLIC' OR s.privacy IN ('public', 'public_memory_only'))
    )
);

CREATE POLICY "Users can add pending private TM"
ON public.translation_memory FOR INSERT WITH CHECK (
    (created_by = auth.uid() AND source_type = 'USER' AND status = 'pending')
    OR public.is_admin()
);

CREATE POLICY "Only admins can update shared TM"
ON public.translation_memory FOR UPDATE USING (public.is_admin())
WITH CHECK (public.is_admin());
-- Vocabulary & Terminology (Shared Knowledge)
CREATE POLICY "Approved vocabulary readable by everyone"
ON public.vocabulary FOR SELECT USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR source_type = 'SYSTEM'
    OR public.is_admin()
);

CREATE POLICY "Users can insert vocabulary suggestions"
ON public.vocabulary FOR INSERT WITH CHECK (
    created_by = auth.uid() OR (source_type = 'SYSTEM' AND public.is_admin())
);

CREATE POLICY "Approved terminology readable by everyone"
ON public.terminology FOR SELECT USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR source_type = 'SYSTEM'
    OR public.is_admin()
);

CREATE POLICY "Users can insert terminology suggestions"
ON public.terminology FOR INSERT WITH CHECK (
    created_by = auth.uid() OR (source_type = 'SYSTEM' AND public.is_admin())
);

-- Shared Contributions Policies
CREATE POLICY "Contributions viewable by author or admin"
ON public.shared_contributions FOR SELECT USING (
    contributor_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "Authenticated users can submit contributions"
ON public.shared_contributions FOR INSERT WITH CHECK (
    contributor_id = auth.uid()
);

CREATE POLICY "Only admins can review contributions"
ON public.shared_contributions FOR UPDATE USING (
    public.is_admin()
);

-- Story Bible & Plot Events
CREATE POLICY "Bible viewable if story viewable"
ON public.story_bible FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (
            s.owner_id = auth.uid()
            OR (s.sharing_permissions->>'showStoryBible')::boolean = true
            OR s.source_type = 'SYSTEM'
            OR public.is_admin()
        )
    )
);

CREATE POLICY "Bible editable by story owner"
ON public.story_bible FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = story_id
        AND (s.owner_id = auth.uid() OR public.is_admin())
    )
);

-- Audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT USING (public.is_admin());

CREATE POLICY "System and users can insert audit logs"
ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ==============================================================================
-- 14. GOOGLE DRIVE BACKUP & FILE ARCHIVE TABLES (Section 3, 21, 31, 32)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.google_drive_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    google_account_id TEXT,
    email TEXT,
    root_folder_id TEXT,
    backup_folder_id TEXT,
    stories_folder_id TEXT,
    exports_folder_id TEXT,
    restore_folder_id TEXT,
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_backup_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (auto_backup_frequency IN ('daily', '3days', 'weekly')),
    backup_before_major_ops BOOLEAN NOT NULL DEFAULT TRUE,
    retention_count INT NOT NULL DEFAULT 10,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    last_backup_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired'))
);

CREATE TABLE IF NOT EXISTS public.backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL DEFAULT 'full' CHECK (backup_type IN ('full', 'incremental', 'selective', 'docx')),
    database_version TEXT NOT NULL DEFAULT '2.0',
    file_name TEXT NOT NULL,
    google_drive_file_id TEXT,
    google_drive_folder_id TEXT,
    file_size BIGINT NOT NULL DEFAULT 0,
    checksum TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'uploading', 'completed', 'failed')),
    story_count INT NOT NULL DEFAULT 0,
    chapter_count INT NOT NULL DEFAULT 0,
    segment_count INT NOT NULL DEFAULT 0,
    translation_memory_count INT NOT NULL DEFAULT 0,
    vocabulary_count INT NOT NULL DEFAULT 0,
    terminology_count INT NOT NULL DEFAULT 0,
    character_count INT NOT NULL DEFAULT 0,
    manifest_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.story_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_provider TEXT NOT NULL DEFAULT 'google_drive' CHECK (storage_provider IN ('google_drive', 'supabase_storage', 'local')),
    storage_path TEXT,
    google_drive_file_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backup_user_created ON public.backup_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_files_story ON public.story_files(story_id);

-- RLS
ALTER TABLE public.google_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Google Drive connection"
ON public.google_drive_connections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view and manage own backups"
ON public.backup_records FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own story files"
ON public.story_files FOR ALL USING (auth.uid() = user_id);

