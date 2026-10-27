import {
  Story,
  Chapter,
  TranslationSegment,
  TranslationMemory,
  PronounRule,
  Character,
  CharacterRelationship,
  StoryBible,
  PlotEvent,
  ConsistencyWarning,
  TranslationVersion,
  ArcSummary,
  GlobalTranslationMemory,
  StorySharingPermissions,
  StoryPrivacyLevel,
  StoryFileAttachment,
} from '../types';
import { generateShareToken } from './auth';

const DB_NAME = 'lananh_artistry_db';
const DB_VERSION = 2;

const DEFAULT_SHARING_PERMISSIONS: StorySharingPermissions = {
  showOriginal: false,
  showTranslation: true,
  showSummary: true,
  showCharacters: true,
  showStoryBible: false,
  showPlotTimeline: true,
  showTranslationMemory: true,
  showTerminology: true,
  showPronouns: true,
};

function normalizeStoryData(story: any): Story {
  return {
    ...story,
    ownerId: story.ownerId || 'local-guest',
    ownerName: story.ownerName || 'Translator',
    privacy: story.privacy || 'private',
    shareToken: story.shareToken || generateShareToken(),
    sharingPermissions: story.sharingPermissions || { ...DEFAULT_SHARING_PERMISSIONS },
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const store = db.createObjectStore('chapters', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
        store.createIndex('chapterNumber', ['storyId', 'chapterNumber'], { unique: false });
      }
      if (!db.objectStoreNames.contains('segments')) {
        const store = db.createObjectStore('segments', { keyPath: 'segmentId' });
        store.createIndex('chapterId', 'chapterId', { unique: false });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
      if (!db.objectStoreNames.contains('translation_memory')) {
        const store = db.createObjectStore('translation_memory', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
        store.createIndex('original', 'original', { unique: false });
      }
      if (!db.objectStoreNames.contains('pronoun_rules')) {
        const store = db.createObjectStore('pronoun_rules', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
      if (!db.objectStoreNames.contains('characters')) {
        const store = db.createObjectStore('characters', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
      if (!db.objectStoreNames.contains('relationships')) {
        const store = db.createObjectStore('relationships', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
      if (!db.objectStoreNames.contains('story_bible')) {
        db.createObjectStore('story_bible', { keyPath: 'storyId' });
      }
      if (!db.objectStoreNames.contains('plot_events')) {
        const store = db.createObjectStore('plot_events', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
        store.createIndex('chapterId', 'chapterId', { unique: false });
      }
      if (!db.objectStoreNames.contains('warnings')) {
        const store = db.createObjectStore('warnings', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
        store.createIndex('chapterId', 'chapterId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('versions')) {
        const store = db.createObjectStore('versions', { keyPath: 'id' });
        store.createIndex('chapterId', 'chapterId', { unique: false });
      }
      if (!db.objectStoreNames.contains('arc_summaries')) {
        const store = db.createObjectStore('arc_summaries', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
      if (!db.objectStoreNames.contains('global_memory')) {
        db.createObjectStore('global_memory', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('story_files')) {
        const store = db.createObjectStore('story_files', { keyPath: 'id' });
        store.createIndex('storyId', 'storyId', { unique: false });
      }
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Seed if empty
      await seedInitialDataIfEmpty(db);
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// Low level helpers
async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// --- Stories ---
export async function getAllStories(): Promise<Story[]> {
  const store = await getStore('stories');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []).map((s: any) => normalizeStoryData(s));
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getStoriesByUser(userId: string): Promise<Story[]> {
  const all = await getAllStories();
  return all.filter((s) => s.ownerId === userId);
}

export async function getPublicStories(): Promise<Story[]> {
  const all = await getAllStories();
  return all.filter((s) => s.privacy === 'public');
}

export async function getStoryByShareToken(token: string): Promise<Story | undefined> {
  if (!token) return undefined;
  const all = await getAllStories();
  const story = all.find((s) => s.shareToken === token);
  if (!story) return undefined;
  // If story is strictly private and not link_only or public, disallow
  if (story.privacy === 'private') return undefined;
  return story;
}

export async function regenerateStoryShareToken(storyId: string): Promise<string> {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Story not found');
  const newToken = generateShareToken();
  story.shareToken = newToken;
  await saveStory(story);
  return newToken;
}

export async function getPublicLanguageMemories(): Promise<
  Array<{
    id: string;
    original: string;
    translation: string;
    language: string;
    category?: string;
    frequency: number;
    preferred: boolean;
    storyTitle: string;
    contributorName: string;
    contextSanitized?: string;
  }>
> {
  const allStories = await getAllStories();
  // Only explicitly public stories can contribute to the shared memory list.
  const eligibleStories = allStories.filter(
    (s) => s.privacy === 'public' || s.privacy === 'public_memory_only'
  );

  const results: any[] = [];
  for (const st of eligibleStories) {
    const memories = await getTranslationMemories(st.id);
    for (const m of memories) {
      results.push({
        id: m.id,
        original: m.original,
        translation: m.translation,
        language: m.language,
        category: m.category || 'terminology',
        frequency: m.frequency,
        preferred: m.preferred,
        storyTitle: st.title,
        contributorName: st.ownerName || 'Dịch giả',
        // Sanitize private context if story itself is private
        contextSanitized:
          st.privacy === 'private' || st.privacy === 'public_memory_only'
            ? 'Cụm từ được chia sẻ trong cộng đồng dịch thuật'
            : m.context,
      });
    }
  }

  // Also include global memories
  const globals = await getGlobalMemories();
  for (const gm of globals) {
    results.push({
      id: gm.id,
      original: gm.original,
      translation: gm.preferredTranslation,
      language: gm.language,
      category: gm.category || 'expression',
      frequency: 1,
      preferred: true,
      storyTitle: 'Quy tắc toàn hệ thống',
      contributorName: 'LanAnhArtistry Community',
      contextSanitized: gm.notes,
    });
  }

  return results;
}

export async function migrateUnassignedStoriesToUser(userId: string, userName: string): Promise<number> {
  const stories = await getAllStories();
  let count = 0;
  for (const s of stories) {
    if (!s.ownerId || s.ownerId === 'local-guest' || s.ownerId === '') {
      s.ownerId = userId;
      s.ownerName = userName;
      await saveStory(s);
      count++;
    }
  }
  return count;
}

export async function getStoryById(id: string): Promise<Story | undefined> {
  const store = await getStore('stories');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        resolve(normalizeStoryData(req.result));
      } else {
        resolve(undefined);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveStory(story: Story): Promise<void> {
  const store = await getStore('stories', 'readwrite');
  story.updatedAt = new Date().toISOString();
  const normalized = normalizeStoryData(story);
  return new Promise((resolve, reject) => {
    const req = store.put(normalized);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteStory(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(
    ['stories', 'chapters', 'segments', 'translation_memory', 'pronoun_rules', 'characters', 'relationships', 'story_bible', 'plot_events', 'warnings', 'arc_summaries'],
    'readwrite'
  );

  tx.objectStore('stories').delete(id);
  tx.objectStore('story_bible').delete(id);

  // Clean related items
  const cleanStore = (name: string, indexName = 'storyId') => {
    const s = tx.objectStore(name);
    const idx = s.index(indexName);
    const req = idx.getAllKeys(id);
    req.onsuccess = () => {
      for (const k of req.result) {
        s.delete(k);
      }
    };
  };

  cleanStore('chapters');
  cleanStore('segments');
  cleanStore('translation_memory');
  cleanStore('pronoun_rules');
  cleanStore('characters');
  cleanStore('relationships');
  cleanStore('plot_events');
  cleanStore('warnings');
  cleanStore('arc_summaries');

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Chapters ---
export async function getChaptersByStory(storyId: string): Promise<Chapter[]> {
  const store = await getStore('chapters');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => {
      const list: Chapter[] = req.result || [];
      list.sort((a, b) => a.chapterNumber - b.chapterNumber);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getChapterById(id: string): Promise<Chapter | undefined> {
  const store = await getStore('chapters');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  const store = await getStore('chapters', 'readwrite');
  chapter.updatedAt = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const req = store.put(chapter);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['chapters', 'segments', 'warnings', 'versions', 'plot_events'], 'readwrite');
  tx.objectStore('chapters').delete(chapterId);

  const cleanByChapter = (storeName: string) => {
    const s = tx.objectStore(storeName);
    const idx = s.index('chapterId');
    const req = idx.getAllKeys(chapterId);
    req.onsuccess = () => {
      for (const k of req.result) s.delete(k);
    };
  };

  cleanByChapter('segments');
  cleanByChapter('warnings');
  cleanByChapter('versions');
  cleanByChapter('plot_events');

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Segments ---
export async function getSegmentsByChapter(chapterId: string): Promise<TranslationSegment[]> {
  const store = await getStore('segments');
  const index = store.index('chapterId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(chapterId);
    req.onsuccess = () => {
      const list: TranslationSegment[] = req.result || [];
      list.sort((a, b) => a.segmentOrder - b.segmentOrder);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSegments(segments: TranslationSegment[]): Promise<void> {
  const store = await getStore('segments', 'readwrite');
  return new Promise((resolve, reject) => {
    const tx = store.transaction;
    for (const seg of segments) {
      store.put(seg);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveSingleSegment(segment: TranslationSegment): Promise<void> {
  const store = await getStore('segments', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(segment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Translation Memory ---
export async function getTranslationMemories(storyId: string): Promise<TranslationMemory[]> {
  const store = await getStore('translation_memory');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTranslationMemory(tm: TranslationMemory): Promise<void> {
  const store = await getStore('translation_memory', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(tm);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTranslationMemory(id: string): Promise<void> {
  const store = await getStore('translation_memory', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Pronoun Rules ---
export async function getPronounRules(storyId: string): Promise<PronounRule[]> {
  const store = await getStore('pronoun_rules');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function savePronounRule(rule: PronounRule): Promise<void> {
  const store = await getStore('pronoun_rules', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(rule);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePronounRule(id: string): Promise<void> {
  const store = await getStore('pronoun_rules', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Characters ---
export async function getCharacters(storyId: string): Promise<Character[]> {
  const store = await getStore('characters');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCharacter(character: Character): Promise<void> {
  const store = await getStore('characters', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(character);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  const store = await getStore('characters', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Relationships ---
export async function getRelationships(storyId: string): Promise<CharacterRelationship[]> {
  const store = await getStore('relationships');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
export const getCharacterRelationships = getRelationships;

export async function saveRelationship(relationship: CharacterRelationship): Promise<void> {
  const store = await getStore('relationships', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(relationship);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
export const saveCharacterRelationship = saveRelationship;

export async function deleteRelationship(id: string): Promise<void> {
  const store = await getStore('relationships', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Story Bible ---
export async function getStoryBible(storyId: string): Promise<StoryBible | undefined> {
  const store = await getStore('story_bible');
  return new Promise((resolve, reject) => {
    const req = store.get(storyId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveStoryBible(bible: StoryBible): Promise<void> {
  const store = await getStore('story_bible', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(bible);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Plot Events ---
export async function getPlotEvents(storyId: string): Promise<PlotEvent[]> {
  const store = await getStore('plot_events');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => {
      const list: PlotEvent[] = req.result || [];
      list.sort((a, b) => a.chapterNumber - b.chapterNumber || a.order - b.order);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePlotEvent(event: PlotEvent): Promise<void> {
  const store = await getStore('plot_events', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(event);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePlotEvent(id: string): Promise<void> {
  const store = await getStore('plot_events', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Warnings ---
export async function getWarnings(storyId: string): Promise<ConsistencyWarning[]> {
  const store = await getStore('warnings');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveWarning(warning: ConsistencyWarning): Promise<void> {
  const store = await getStore('warnings', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(warning);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteWarning(id: string): Promise<void> {
  const store = await getStore('warnings', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Versions ---
export async function getVersions(chapterId: string): Promise<TranslationVersion[]> {
  const store = await getStore('versions');
  const index = store.index('chapterId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(chapterId);
    req.onsuccess = () => {
      const list: TranslationVersion[] = req.result || [];
      list.sort((a, b) => b.versionNumber - a.versionNumber);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveVersion(version: TranslationVersion): Promise<void> {
  const store = await getStore('versions', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(version);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Arc Summaries ---
export async function getArcSummaries(storyId: string): Promise<ArcSummary[]> {
  const store = await getStore('arc_summaries');
  const index = store.index('storyId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(storyId);
    req.onsuccess = () => {
      const list: ArcSummary[] = req.result || [];
      list.sort((a, b) => a.startChapter - b.startChapter);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveArcSummary(arc: ArcSummary): Promise<void> {
  const store = await getStore('arc_summaries', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(arc);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Global Memory ---
export async function getGlobalMemories(): Promise<GlobalTranslationMemory[]> {
  const store = await getStore('global_memory');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGlobalMemory(item: GlobalTranslationMemory): Promise<void> {
  const store = await getStore('global_memory', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Export & Import ---
export async function exportStoryData(storyId: string) {
  const story = await getStoryById(storyId);
  if (!story) throw new Error('Truyện không tồn tại');

  const chapters = await getChaptersByStory(storyId);
  const bible = await getStoryBible(storyId);
  const characters = await getCharacters(storyId);
  const relationships = await getRelationships(storyId);
  const pronounRules = await getPronounRules(storyId);
  const translationMemories = await getTranslationMemories(storyId);
  const plotEvents = await getPlotEvents(storyId);
  const warnings = await getWarnings(storyId);
  const arcSummaries = await getArcSummaries(storyId);

  // Collect segments & versions
  const allSegments: TranslationSegment[] = [];
  const allVersions: TranslationVersion[] = [];
  for (const ch of chapters) {
    const segs = await getSegmentsByChapter(ch.id);
    allSegments.push(...segs);
    const vers = await getVersions(ch.id);
    allVersions.push(...vers);
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    story,
    chapters,
    segments: allSegments,
    bible,
    characters,
    relationships,
    pronounRules,
    translationMemories,
    plotEvents,
    warnings,
    versions: allVersions,
    arcSummaries,
  };
}

export async function exportAllData() {
  const stories = await getAllStories();
  const storyDataList = [];
  for (const s of stories) {
    storyDataList.push(await exportStoryData(s.id));
  }
  const globalMemories = await getGlobalMemories();

  return {
    version: '1.0',
    type: 'LanAnhArtistry_FULL_BACKUP',
    exportedAt: new Date().toISOString(),
    stories: storyDataList,
    globalMemories,
  };
}

export async function importData(jsonData: any): Promise<{ storiesCount: number }> {
  if (!jsonData) throw new Error('Dữ liệu trống hoặc không hợp lệ');

  if (jsonData.type === 'LanAnhArtistry_FULL_BACKUP' && Array.isArray(jsonData.stories)) {
    for (const item of jsonData.stories) {
      await importSingleStoryPackage(item);
    }
    if (Array.isArray(jsonData.globalMemories)) {
      for (const gm of jsonData.globalMemories) {
        await saveGlobalMemory(gm);
      }
    }
    return { storiesCount: jsonData.stories.length };
  } else if (jsonData.story) {
    await importSingleStoryPackage(jsonData);
    return { storiesCount: 1 };
  } else {
    throw new Error('Định dạng tệp sao lưu LanAnhArtistry không hợp lệ');
  }
}

async function importSingleStoryPackage(pkg: any) {
  if (!pkg.story || !pkg.story.id) return;
  await saveStory(pkg.story);
  if (pkg.bible) await saveStoryBible(pkg.bible);

  if (Array.isArray(pkg.chapters)) {
    for (const c of pkg.chapters) await saveChapter(c);
  }
  if (Array.isArray(pkg.segments)) {
    await saveSegments(pkg.segments);
  }
  if (Array.isArray(pkg.characters)) {
    for (const char of pkg.characters) await saveCharacter(char);
  }
  if (Array.isArray(pkg.relationships)) {
    for (const rel of pkg.relationships) await saveRelationship(rel);
  }
  if (Array.isArray(pkg.pronounRules)) {
    for (const pr of pkg.pronounRules) await savePronounRule(pr);
  }
  if (Array.isArray(pkg.translationMemories)) {
    for (const tm of pkg.translationMemories) await saveTranslationMemory(tm);
  }
  if (Array.isArray(pkg.plotEvents)) {
    for (const pe of pkg.plotEvents) await savePlotEvent(pe);
  }
  if (Array.isArray(pkg.warnings)) {
    for (const w of pkg.warnings) await saveWarning(w);
  }
  if (Array.isArray(pkg.versions)) {
    for (const v of pkg.versions) await saveVersion(v);
  }
  if (Array.isArray(pkg.arcSummaries)) {
    for (const a of pkg.arcSummaries) await saveArcSummary(a);
  }
}

// Initial Data Seeding
async function seedInitialDataIfEmpty(db: IDBDatabase) {
  const tx = db.transaction('stories', 'readonly');
  const countReq = tx.objectStore('stories').count();

  return new Promise<void>((resolve) => {
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        console.log('Seeding initial LanAnhArtistry demo data...');
        await seedDefaultStories();
      }
      resolve();
    };
    countReq.onerror = () => resolve();
  });
}

async function seedDefaultStories() {
  // Public builds start with an empty library; users can create or import their own stories.
}
// DATA MIGRATION & BACKUP / EXPORT HELPERS
// ==========================================

export async function detectLocalDataSummary(): Promise<{
  storiesCount: number;
  chaptersCount: number;
  segmentsCount: number;
  charactersCount: number;
  tmCount: number;
  pronounRulesCount: number;
  totalSizeEstimatedKb: number;
}> {
  try {
    const db = await openDB();
    const countStore = (name: string): Promise<number> => {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(name, 'readonly');
          const store = tx.objectStore(name);
          const req = store.count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror = () => resolve(0);
        } catch (e) {
          resolve(0);
        }
      });
    };

    const [storiesCount, chaptersCount, segmentsCount, charactersCount, tmCount, pronounRulesCount] = await Promise.all([
      countStore('stories'),
      countStore('chapters'),
      countStore('segments'),
      countStore('characters'),
      countStore('translation_memory'),
      countStore('pronoun_rules'),
    ]);

    // Rough estimate: ~1KB per chapter/segment
    const totalSizeEstimatedKb = Math.round(storiesCount * 5 + chaptersCount * 15 + segmentsCount * 0.5 + tmCount * 0.5);

    return {
      storiesCount,
      chaptersCount,
      segmentsCount,
      charactersCount,
      tmCount,
      pronounRulesCount,
      totalSizeEstimatedKb,
    };
  } catch (err) {
    console.error('Error detecting local data summary:', err);
    return {
      storiesCount: 0,
      chaptersCount: 0,
      segmentsCount: 0,
      charactersCount: 0,
      tmCount: 0,
      pronounRulesCount: 0,
      totalSizeEstimatedKb: 0,
    };
  }
}

export async function exportAllDataAsJSON(): Promise<string> {
  const stories = await getAllStories();
  const db = await openDB();

  const fetchAllFromStore = (name: string): Promise<any[]> => {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  };

  const [chapters, segments, translationMemory, pronounRules, characters, relationships, warnings] = await Promise.all([
    fetchAllFromStore('chapters'),
    fetchAllFromStore('segments'),
    fetchAllFromStore('translation_memory'),
    fetchAllFromStore('pronoun_rules'),
    fetchAllFromStore('characters'),
    fetchAllFromStore('relationships'),
    fetchAllFromStore('warnings'),
  ]);

  const payload = {
    app: 'LanAnhArtistry',
    version: '2.0.0-cloud',
    exportedAt: new Date().toISOString(),
    stats: {
      stories: stories.length,
      chapters: chapters.length,
      segments: segments.length,
      translationMemory: translationMemory.length,
      characters: characters.length,
    },
    data: {
      stories,
      chapters,
      segments,
      translationMemory,
      pronounRules,
      characters,
      relationships,
      warnings,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export async function syncLocalDataToCloud(
  userId: string,
  userName: string,
  onProgress?: (percent: number, currentItem: string) => void
): Promise<{ success: boolean; migratedCounts: Record<string, number> }> {
  void userId;
  void userName;
  void onProgress;
  throw new Error('Cloud migration requires a verified sign-in provider. Export a local backup until one is configured.');
}
export async function getStoryFiles(storyId: string): Promise<StoryFileAttachment[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('story_files', 'readonly');
      const store = tx.objectStore('story_files');
      const index = store.index('storyId');
      const req = index.getAll(storyId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function saveStoryFile(file: StoryFileAttachment): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('story_files', 'readwrite');
      const store = tx.objectStore('story_files');
      const req = store.put(file);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

export async function deleteStoryFile(fileId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('story_files', 'readwrite');
      const store = tx.objectStore('story_files');
      const req = store.delete(fileId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

