export type SourceLanguage = 'zh' | 'en' | 'other';
export type TargetLanguage = 'vi';

export type StoryStatus = 'planning' | 'translating' | 'paused' | 'completed' | 'archived';
export type ChapterStatus = 'draft' | 'translating' | 'reviewed' | 'completed';
export type SegmentStatus = 'untranslated' | 'draft' | 'translated' | 'reviewed';

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';
export type CharacterGender = 'male' | 'female' | 'other' | 'unknown';
export type CharacterLifeStatus = 'alive' | 'deceased' | 'unknown' | 'sealed';

export type WarningType = 'translation' | 'pronoun' | 'character' | 'terminology' | 'bible' | 'timeline';
export type WarningSeverity = 'low' | 'medium' | 'high';
export type WarningStatus = 'open' | 'reviewed' | 'ignored' | 'resolved';

export type UserRole = 'ADMIN' | 'USER';
export type SourceType = 'SYSTEM' | 'USER' | 'IMPORTED' | 'COMMUNITY';
export type ContentVisibility = 'PRIVATE' | 'PUBLIC' | 'LINK_ONLY';

export type StoryPrivacyLevel = 'private' | 'public' | 'link_only' | 'public_memory_only';

export interface StorySharingPermissions {
  showOriginal: boolean;
  showTranslation: boolean;
  showSummary: boolean;
  showCharacters: boolean;
  showStoryBible: boolean;
  showPlotTimeline: boolean;
  showTranslationMemory: boolean;
  showTerminology: boolean;
  showPronouns: boolean;
  showNotes?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role?: UserRole;
  createdAt: string;
  defaultStoryPrivacy?: StoryPrivacyLevel;
  allowPublicMemoryByDefault?: boolean;
}

export interface Story {
  id: string;
  ownerId?: string;
  ownerName?: string;
  title: string;
  author: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  description: string;
  cover?: string;
  status: StoryStatus;
  privacy: StoryPrivacyLevel;
  visibility?: ContentVisibility;
  originalVisibility?: ContentVisibility;
  translationVisibility?: ContentVisibility;
  sourceType?: SourceType;
  shareToken?: string;
  sharingPermissions: StorySharingPermissions;
  totalChapters: number;
  translatedChapters: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  originalText: string;
  translationText: string;
  status: ChapterStatus;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationSegment {
  segmentId: string;
  chapterId: string;
  storyId: string;
  segmentOrder: number;
  originalText: string;
  translatedText: string;
  translationStatus: SegmentStatus;
  notes: string;
  characterFrom?: string;
  characterTo?: string;
}

export interface TranslationMemory {
  id: string;
  storyId: string;
  original: string;
  translation: string;
  sourceText?: string;
  targetText?: string;
  language: SourceLanguage | string;
  sourceLanguage?: SourceLanguage | string;
  targetLanguage?: TargetLanguage | string;
  context: string;
  genre?: string;
  speakerGender?: string;
  relationshipContext?: string;
  characterFrom?: string;
  characterTo?: string;
  relationship?: string;
  chapterIds: number[];
  frequency: number;
  usageCount?: number;
  contributorCount?: number;
  confidenceScore?: number;
  sourceType?: SourceType;
  createdBy?: string;
  firstChapter: number;
  lastChapter: number;
  status: 'active' | 'archived';
  preferred: boolean;
  notes: string;
  category?: 'title' | 'expression' | 'terminology' | 'idiom' | 'name' | 'general';
  createdAt?: string;
  updatedAt?: string;
}

export interface PronounRule {
  id: string;
  storyId: string;
  fromCharacter: string;
  toCharacter: string;
  selfPronoun: string; // Xưng hô bản thân (ví dụ: em, ta, tôi, đệ, muội)
  targetAddress: string; // Cách gọi đối phương (ví dụ: anh, ngươi, huynh, sư tôn)
  context: string;
  startChapter: number;
  endChapter?: number;
  status: 'active' | 'historical';
  reasonForChange?: string;
  chapters: number[];
  originalPronoun?: string;
  suggestedTranslation?: string;
  characterFrom?: string;
  characterTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Character {
  id: string;
  storyId: string;
  name: string;
  aliases: string[];
  gender: CharacterGender;
  role: CharacterRole;
  status: CharacterLifeStatus;
  identity: string;
  faction: string;
  personality: string;
  speakingStyle: string;
  firstAppearance: number;
  importantChapters: number[];
  notes: string;
  pinyin?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharacterRelationship {
  id: string;
  storyId: string;
  characterA: string;
  characterB: string;
  relationshipType: string;
  currentStatus: string;
  startChapter: number;
  endChapter?: number;
  context: string;
  notes: string;
}

export interface BibleLocation {
  id: string;
  name: string;
  description: string;
  firstChapter?: number;
  notes?: string;
}

export interface BibleOrganization {
  id: string;
  name: string;
  description: string;
  leader?: string;
  notes?: string;
}

export interface BibleTerminology {
  id: string;
  term: string;
  translation: string;
  definition: string;
  category?: string;
}

export interface BibleObject {
  id: string;
  name: string;
  originalName?: string;
  owner?: string;
  description: string;
}

export interface BibleMystery {
  id: string;
  title: string;
  description: string;
  status: 'unresolved' | 'partially_revealed' | 'resolved';
  clues?: string[];
  resolvedChapter?: number;
}

export interface BibleQuote {
  id: string;
  original: string;
  translation: string;
  speaker: string;
  chapter: number;
  context: string;
}

export interface BibleRule {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface TranslationStyle {
  tone: string;
  narrativeStyle: string;
  dialogueStyle: string;
  formality: string;
  preferredVocabulary: string[];
  preferredPronouns: string[];
  forbiddenTerms: string[];
  specialRules: string[];
}

export interface StoryBible {
  id: string;
  storyId: string;
  locations: BibleLocation[];
  organizations: BibleOrganization[];
  terminology: BibleTerminology[];
  importantObjects: BibleObject[];
  mysteries: BibleMystery[];
  importantQuotes: BibleQuote[];
  worldbuildingRules: BibleRule[];
  translationStyle: TranslationStyle;
}

export interface PlotEvent {
  id: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  title: string;
  description: string;
  characters: string[];
  importance: 'major' | 'minor' | 'climax' | 'turning_point';
  order: number;
}

export interface ConsistencyWarning {
  id: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  segmentId?: string;
  type: WarningType;
  severity: WarningSeverity;
  original: string;
  previousTranslation: string;
  currentTranslation: string;
  relatedCharacters?: string[];
  relatedChapters: number[];
  status: WarningStatus;
  explanation: string;
  userResolution?: string;
  createdAt: string;
}

export interface TranslationVersion {
  id: string;
  chapterId: string;
  versionNumber: number;
  translationText: string;
  summary: string;
  savedAt: string;
  author: string;
}

export interface ArcSummary {
  id: string;
  storyId: string;
  arcTitle: string;
  startChapter: number;
  endChapter: number;
  summary: string;
}

export interface GlobalTranslationMemory {
  id: string;
  original: string;
  preferredTranslation: string;
  language: SourceLanguage | string;
  category: string;
  notes: string;
}

export interface RecapData {
  chapterTarget: number;
  summaryRecentChapters: string;
  keyCharacters: string[];
  currentRelationships: string[];
  currentPronouns: string[];
  importantTerminology: string[];
  recentEvents: string[];
  unresolvedMysteries: string[];
  thingsToRemember: string[];
}

export interface WhatChangedSummary {
  newCharactersCount: number;
  newRelationshipsCount: number;
  terminologyCount: number;
  memoriesCount: number;
  pronounChangesCount: number;
  plotEventsCount: number;
  newCharacters: string[];
  newRelationships: string[];
  changedRelationships?: string[];
  newTerminology?: string[];
  newMemories: string[];
  newPlotEvents: string[];
  resolvedWarningsCount?: number;
}

// ==========================================
// NEW DATABASE & SHARED KNOWLEDGE ENTITIES
// ==========================================

export interface TranslationMemoryUsage {
  id: string;
  memoryId: string;
  storyId: string;
  storyTitle?: string;
  chapterNumber: number;
  segmentNumber?: number;
  exampleSentenceOriginal?: string;
  exampleSentenceTranslation?: string;
  usedAt: string;
}

export interface VocabularyItem {
  id: string;
  term: string;
  language: string;
  meaning: string;
  pronunciation?: string;
  pinyin?: string;
  preferredTranslation: string;
  alternativeTranslations?: string[];
  context?: string;
  notes?: string;
  usageCount: number;
  contributorCount: number;
  status: 'approved' | 'pending' | 'rejected';
  sourceType: SourceType;
  createdBy?: string;
  sourceStoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TerminologyCategory =
  | 'title'
  | 'organization'
  | 'location'
  | 'item'
  | 'cultivation'
  | 'fantasy'
  | 'historical'
  | 'modern'
  | 'character_title'
  | 'proper_noun'
  | 'general';

export interface TerminologyItem {
  id: string;
  term: string;
  preferredTranslation: string;
  alternativeTranslations?: string[];
  category: TerminologyCategory;
  context?: string;
  notes?: string;
  usageCount: number;
  status: 'approved' | 'pending' | 'rejected';
  sourceType: SourceType;
  createdBy?: string;
  sourceStoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContributionType = 'translation_memory' | 'vocabulary' | 'terminology' | 'pronoun_rule';
export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SharedContribution {
  id: string;
  contributorId: string;
  contributorName?: string;
  contributionType: ContributionType;
  targetRecordId?: string;
  original: string;
  proposedValue: string;
  reason?: string;
  evidence?: string;
  status: ContributionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  sourceStoryId?: string;
  sourceStoryTitle?: string;
  sourceChapterId?: string;
  sourceSegmentId?: string;
  createdAt: string;
}

export interface StoryPermission {
  id: string;
  storyId: string;
  userId: string;
  permissionLevel: 'read' | 'write' | 'admin';
  grantedBy: string;
  createdAt: string;
}

export interface ShareLinkRecord {
  id: string;
  storyId: string;
  shareToken: string;
  permissions: StorySharingPermissions;
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any> | string;
  createdAt: string;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'offline' | 'conflict';

export interface ConflictData {
  storyId: string;
  storyTitle: string;
  chapterNumber?: number;
  localVersion: {
    timestamp: string;
    text: string;
    editor: string;
  };
  cloudVersion: {
    timestamp: string;
    text: string;
    editor: string;
  };
}

export interface ImportParsedChapter {
  chapterNumber: number;
  title: string;
  originalText: string;
  translationText: string;
  detectedSegmentsCount: number;
}

export interface ImportCandidateItem {
  id: string;
  type: 'character' | 'terminology' | 'vocabulary' | 'translation_memory' | 'pronoun_rule';
  original: string;
  translation: string;
  details: string;
  status: 'accept' | 'reject' | 'edit' | 'merge_duplicate' | 'ignore';
  isDuplicate?: boolean;
  existingId?: string;
}

export interface ImportJob {
  id: string;
  userId: string;
  title: string;
  author: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  genre: string;
  tags: string[];
  sourceType: SourceType;
  status: 'parsing' | 'reviewing' | 'committing' | 'completed' | 'failed';
  totalChapters: number;
  totalSegments: number;
  candidates: ImportCandidateItem[];
  chapters: ImportParsedChapter[];
  stats: {
    charactersCount: number;
    termsCount: number;
    tmCount: number;
    pronounsCount: number;
  };
  createdAt: string;
  completedAt?: string;
}

// ==========================================
// GOOGLE DRIVE BACKUP & FILE ARCHIVE TYPES
// ==========================================

export interface GoogleDriveConnection {
  id?: string;
  userId: string;
  googleAccountId?: string;
  email?: string;
  rootFolderId?: string;
  backupFolderId?: string;
  storiesFolderId?: string;
  exportsFolderId?: string;
  restoreFolderId?: string;
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | '3days' | 'weekly';
  backupBeforeMajorOps: boolean;
  retentionCount: number;
  connectedAt: string;
  lastSyncAt?: string;
  lastBackupAt?: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
}

export interface BackupRecord {
  id: string;
  userId: string;
  backupType: 'full' | 'incremental' | 'selective' | 'docx';
  databaseVersion: string;
  fileName: string;
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  fileSize: number;
  checksum?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  storyCount: number;
  chapterCount: number;
  segmentCount: number;
  translationMemoryCount: number;
  vocabularyCount: number;
  terminologyCount: number;
  characterCount: number;
  manifestData?: DatabaseManifest;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DatabaseManifest {
  application: string;
  backupVersion: string;
  createdAt: string;
  databaseVersion: string;
  userId: string;
  userEmail?: string;
  stories: number;
  chapters: number;
  segments: number;
  characters: number;
  translationMemory: number;
  vocabulary: number;
  terminology: number;
  pronounRules: number;
  checksum?: string;
}

export interface StoryFileAttachment {
  id: string;
  storyId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageProvider: 'google_drive' | 'supabase_storage' | 'local';
  storagePath?: string;
  googleDriveFileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FullBackupPayload {
  manifest: DatabaseManifest;
  data: {
    userProfile?: any;
    stories: Story[];
    chapters: Chapter[];
    segments: TranslationSegment[];
    characters: Character[];
    relationships: CharacterRelationship[];
    pronouns: PronounRule[];
    translationMemory: TranslationMemory[];
    vocabulary: VocabularyItem[];
    terminology: TerminologyItem[];
    storyBible: StoryBible[];
    plotEvents: PlotEvent[];
    versions: TranslationVersion[];
  };
}

export interface DriveFileItem {
  id: string;
  name: string;
  size?: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}


