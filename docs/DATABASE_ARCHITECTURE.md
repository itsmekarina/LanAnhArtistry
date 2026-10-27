# LanAnhArtistry — Database, Authentication & Shared Knowledge Architecture

## 1. Executive Overview
LanAnhArtistry is an advanced translation management and literary memory platform designed for translators translating Chinese and English novels into Vietnamese. This document details the database migration from browser-isolated IndexedDB storage into a robust, normalized PostgreSQL / Supabase cloud architecture with real-time multi-device synchronization, Row Level Security (RLS), and a global shared language knowledge base.

---

## 2. Core Data Architecture & Entity Relationship

### Relational Schema Diagram
```text
auth.users
   │
   ├─► profiles (id, user_id, display_name, role [ADMIN|USER], avatar_url)
   │
   ├─► stories (id, owner_id, title, author, privacy, visibility, source_type [USER|SYSTEM|IMPORTED])
   │     │
   │     ├─► story_chapters (id, story_id, chapter_number, original_text, translation_text)
   │     │     │
   │     │     ├─► story_segments (segment_id, chapter_id, original_text, translated_text)
   │     │     └─► translation_versions (id, chapter_id, version_number, translation_text)
   │     │
   │     ├─► characters (id, story_id, name, aliases, role, gender, status)
   │     ├─► character_relationships (id, story_id, character_a, character_b, relationship_type)
   │     ├─► pronoun_rules (id, story_id, from_character, to_character, self_pronoun, target_address)
   │     ├─► story_bible (id, story_id, locations, organizations, terminology, mysteries)
   │     └─► plot_events (id, story_id, chapter_id, title, importance)
   │
   ├─► translation_memory (id, source_text, target_text, context, speaker_gender, usage_count, source_type)
   │     └─► translation_memory_usage (id, memory_id, story_id, chapter_number, example_original)
   │
   ├─► vocabulary (id, term, meaning, pinyin, preferred_translation, alternative_translations, status)
   ├─► terminology (id, term, preferred_translation, category [cultivation|title|item|...], status)
   ├─► shared_contributions (id, contributor_id, type, proposed_value, reason, status [PENDING|APPROVED])
   └─► audit_logs (id, user_id, action, entity_type, entity_id, details)
```

---

## 3. Security & Row Level Security (RLS) Policies

All database tables enforce PostgreSQL Row Level Security:
1. **User Ownership**: Stories, chapters, segments, characters, and personal notes are scoped by `owner_id = auth.uid()`.
2. **Story Privacy Levels**:
   - `PRIVATE`: Only accessible by owner and explicitly invited collaborators (`story_permissions`).
   - `PUBLIC`: Discoverable in Explore/Community view; granular field visibility (`showOriginal`, `showTranslation`, `showStoryBible`, etc.) is strictly filtered at query time.
   - `LINK_ONLY`: Accessible exclusively via a cryptographically secure random 32-character hexadecimal token (`share_token`).
3. **Dual-Layer Visibility Control**:
   - `original_visibility` (`PRIVATE`, `PUBLIC`, `LINK_ONLY`)
   - `translation_visibility` (`PRIVATE`, `PUBLIC`, `LINK_ONLY`)
   Translators can choose to share their translation publicly while keeping raw source drafts private.
4. **Shared Language Knowledge vs. Private Story Data**:
   - Approvals and System Knowledge records (`source_type = 'SYSTEM'`) are globally readable.
   - Private story details are NEVER exposed when language memory or terminology is shared.

---

## 4. Shared Language Knowledge Base & Contribution Pipeline

### Translation Memory Ranking & Recommendation Priority
When providing translation assistance, the system ranks suggestions in the following strict hierarchy:
1. **Current Story Context** (Character pairs, active scene, established terms in this novel)
2. **Current Character Relationships** (Pronoun rules: A calling B `huynh`, B calling A `muội`)
3. **Current Story Terminology** (Sect names, cultivation ranks, localized artifacts)
4. **User's Personal Translation Memory** (Across all stories translated by this user)
5. **User's Previous Translations**
6. **System Verified Translation Memory** (Imported reference corpus from senior translators)
7. **Approved Community Memory** (Verified community submissions)
8. **General AI Assistance** (Fallback translation)

### Contribution Workflow:
1. Translator clicks **"Contribute to Community Knowledge"** on any term, TM, or pronoun convention.
2. An entry is created in `shared_contributions` with status `PENDING`.
3. An Administrator reviews the suggestion in the Admin Review Center:
   - **Accept**: Moves record to global `translation_memory` / `terminology` / `vocabulary`, increments `contributor_count`.
   - **Reject**: Marks contribution with feedback.
   - **Merge Duplicate**: Merges into existing record as an alternative translation without losing context.

---

## 5. 15-Step Import Center Workflow (Old Novels & Reference Corpora)

1. **Upload Original**: TXT, JSON, or CSV file.
2. **Upload Translation**: Paired translated file.
3. **Metadata Entry**: Title, author, source language (`zh` or `en`), target language (`vi`), genre, tags, and source type (`SYSTEM` vs `USER`).
4. **Chapter Segmentation**: Regex and structural chapter header detection (`第X章`, `Chapter X`, `Hồi X`).
5. **Segment Alignment**: Aligns paragraphs and dialogues between source and translated text.
6. **Character Detection**: Identifies named entities and dialogue speakers.
7. **Terminology Extraction**: Identifies repeated titles, organizations, realms, martial arts, and items.
8. **Vocabulary Extraction**: Identifies key literary expressions and idioms.
9. **Translation Memory Mining**: Mines high-frequency sentence and clause pairs with usage count.
10. **Pronoun Pattern Detection**: Captures addressing pairs (`sư huynh` / `sư muội`, `tiểu thư` / `nô tỳ`).
11. **Summary Generation**: Computes initial chapter arc summaries.
12. **Story Bible Generation**: Prepopulates organizations, locations, and worldbuilding rules.
13. **Plot Timeline**: Builds sequential event cards.
14. **Interactive Import Review**: Human translator reviews candidate items (Accept, Reject, Edit, Merge duplicate, Ignore).
15. **Confirm & Commit**: Atomic commit to cloud database with audit logging.

---

## 6. Multi-Device Synchronization & Conflict Handling

### Architecture
- **Offline Cache**: IndexedDB in browser acts as read/write cache for instant responsiveness.
- **Cloud Database**: Supabase PostgreSQL / Cloud Sync Engine serves as authoritative source of truth.
- **Autosave Engine**: Debounced background saving (1.5s idle threshold).
- **Status Indicator**: Clear visual badges (`Saving...`, `Saved`, `Synced`, `Syncing...`, `Offline`, `Sync conflict`).
- **Conflict Resolution**:
  When timestamp skew or concurrent edits from multiple devices are detected:
  - System presents a side-by-side **Sync Conflict Resolution** modal:
    * Keep Local Device Version
    * Keep Cloud Server Version
    * Manual Line-by-Line Diff & Merge.

---

## 7. Existing Data Migration ("Migrate My Data")
For users with existing local translations stored in IndexedDB:
1. One-click **"Migrate My Data"** detects existing stories, chapters, characters, and TM.
2. Displays itemized count preview and target account confirmation.
3. Batches upload to the cloud database with integrity validation.
4. Preserves local IndexedDB backup until user explicitly verifies cloud synchronization.
