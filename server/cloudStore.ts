import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'cloud_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface CloudStoreData {
  users: Record<string, any>;
  stories: Record<string, any>;
  chapters: Record<string, any>;
  segments: Record<string, any>;
  characters: Record<string, any>;
  pronounRules: Record<string, any>;
  translationMemory: Record<string, any>;
  vocabulary: Record<string, any>;
  terminology: Record<string, any>;
  contributions: Record<string, any>;
  storyBible: Record<string, any>;
  auditLogs: any[];
  lastUpdated: string;
}

const DEFAULT_STORE: CloudStoreData = {
  users: {},
  stories: {},
  chapters: {},
  segments: {},
  characters: {},
  pronounRules: {},
  translationMemory: {},
  vocabulary: {},
  terminology: {},
  contributions: {},
  storyBible: {},
  auditLogs: [],
  lastUpdated: new Date().toISOString(),
};

export class CloudStore {
  private data: CloudStoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): CloudStoreData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_STORE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load cloud_store.json, using defaults:', e);
    }
    this.save(DEFAULT_STORE);
    return DEFAULT_STORE;
  }

  private save(data?: CloudStoreData) {
    try {
      const target = data || this.data;
      target.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(target, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write cloud_store.json:', e);
    }
  }

  public getData(): CloudStoreData {
    return this.data;
  }

  public getStoriesForUser(userId: string, isAdmin = false) {
    const all = Object.values(this.data.stories);
    if (isAdmin) return all;
    return all.filter((s: any) => s.ownerId === userId || s.privacy === 'public' || s.visibility === 'PUBLIC' || s.sourceType === 'SYSTEM');
  }

  public saveStories(stories: any[], userId: string, userName?: string) {
    for (const story of stories) {
      this.data.stories[story.id] = {
        ...story,
        ownerId: story.ownerId || userId,
        ownerName: story.ownerName || userName || 'Translator',
        updatedAt: new Date().toISOString(),
      };
    }
    this.save();
    this.logAudit(userId, userName || 'User', 'SAVE_STORIES', 'story', `${stories.length} stories`, { count: stories.length });
    return true;
  }

  public saveChapters(chapters: any[], userId: string) {
    for (const ch of chapters) {
      this.data.chapters[ch.id] = {
        ...ch,
        updatedAt: new Date().toISOString(),
      };
    }
    this.save();
    return true;
  }

  public saveTranslationMemory(items: any[], userId: string) {
    for (const item of items) {
      this.data.translationMemory[item.id] = {
        ...item,
        updatedAt: new Date().toISOString(),
      };
    }
    this.save();
    return true;
  }

  public saveVocabulary(items: any[], userId: string) {
    for (const item of items) {
      this.data.vocabulary[item.id] = {
        ...item,
        updatedAt: new Date().toISOString(),
      };
    }
    this.save();
    return true;
  }

  public saveTerminology(items: any[], userId: string) {
    for (const item of items) {
      this.data.terminology[item.id] = {
        ...item,
        updatedAt: new Date().toISOString(),
      };
    }
    this.save();
    return true;
  }

  public addContribution(contribution: any, userId: string, userName: string) {
    const id = contribution.id || `contrib-${Date.now()}`;
    const entry = {
      ...contribution,
      id,
      contributorId: userId,
      contributorName: userName,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.data.contributions[id] = entry;
    this.save();
    this.logAudit(userId, userName, 'SUBMIT_CONTRIBUTION', 'contribution', id, { type: contribution.contributionType, original: contribution.original });
    return entry;
  }

  public reviewContribution(id: string, decision: 'APPROVED' | 'REJECTED' | 'MERGE', reviewerId: string, reviewerName: string, notes?: string) {
    const target = this.data.contributions[id];
    if (!target) return null;

    target.status = decision === 'MERGE' ? 'APPROVED' : decision;
    target.reviewedBy = reviewerId;
    target.reviewedAt = new Date().toISOString();

    // If approved, integrate into translation memory, vocabulary, or terminology!
    if (decision === 'APPROVED' || decision === 'MERGE') {
      if (target.contributionType === 'translation_memory') {
        const tmId = `tm-comm-${Date.now()}`;
        this.data.translationMemory[tmId] = {
          id: tmId,
          original: target.original,
          translation: target.proposedValue,
          sourceText: target.original,
          targetText: target.proposedValue,
          language: 'zh',
          context: target.reason || 'Được duyệt từ đóng góp cộng đồng',
          sourceType: 'COMMUNITY',
          status: 'approved',
          preferred: true,
          frequency: 1,
          usageCount: 1,
          contributorCount: 1,
          confidenceScore: 0.96,
          createdBy: target.contributorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          firstChapter: 1,
          lastChapter: 999,
          chapterIds: [],
          notes: target.evidence || '',
        };
      } else if (target.contributionType === 'terminology') {
        const termId = `term-comm-${Date.now()}`;
        this.data.terminology[termId] = {
          id: termId,
          term: target.original,
          preferredTranslation: target.proposedValue,
          category: 'general',
          context: target.reason || '',
          notes: target.evidence || '',
          usageCount: 1,
          status: 'approved',
          sourceType: 'COMMUNITY',
          createdBy: target.contributorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else if (target.contributionType === 'vocabulary') {
        const vocabId = `vocab-comm-${Date.now()}`;
        this.data.vocabulary[vocabId] = {
          id: vocabId,
          term: target.original,
          language: 'zh',
          meaning: target.reason || '',
          preferredTranslation: target.proposedValue,
          notes: target.evidence || '',
          usageCount: 1,
          contributorCount: 1,
          status: 'approved',
          sourceType: 'COMMUNITY',
          createdBy: target.contributorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    this.save();
    this.logAudit(reviewerId, reviewerName, `REVIEW_CONTRIBUTION_${decision}`, 'contribution', id, { targetOriginal: target.original, decision, notes });
    return target;
  }

  public logAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, details: any) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return entry;
  }

  public searchKnowledge(query: string, category?: string, source?: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        translationMemory: Object.values(this.data.translationMemory).slice(0, 20),
        vocabulary: Object.values(this.data.vocabulary).slice(0, 20),
        terminology: Object.values(this.data.terminology).slice(0, 20),
      };
    }

    const matchesTM = Object.values(this.data.translationMemory).filter((item: any) => {
      const matchText = (item.original || '').toLowerCase().includes(q) ||
        (item.translation || '').toLowerCase().includes(q) ||
        (item.context || '').toLowerCase().includes(q);
      const matchSource = !source || source === 'all' || item.sourceType === source;
      return matchText && matchSource;
    });

    const matchesVocab = Object.values(this.data.vocabulary).filter((item: any) => {
      const matchText = (item.term || '').toLowerCase().includes(q) ||
        (item.preferredTranslation || '').toLowerCase().includes(q) ||
        (item.meaning || '').toLowerCase().includes(q) ||
        (item.pinyin || '').toLowerCase().includes(q);
      return matchText;
    });

    const matchesTerm = Object.values(this.data.terminology).filter((item: any) => {
      const matchText = (item.term || '').toLowerCase().includes(q) ||
        (item.preferredTranslation || '').toLowerCase().includes(q) ||
        (item.context || '').toLowerCase().includes(q);
      const matchCat = !category || category === 'all' || item.category === category;
      return matchText && matchCat;
    });

    return {
      translationMemory: matchesTM,
      vocabulary: matchesVocab,
      terminology: matchesTerm,
    };
  }

  public getDashboardStats() {
    const storiesList = Object.values(this.data.stories);
    const chaptersList = Object.values(this.data.chapters);
    const tmList = Object.values(this.data.translationMemory);
    const vocabList = Object.values(this.data.vocabulary);
    const termList = Object.values(this.data.terminology);
    const contribList = Object.values(this.data.contributions);

    return {
      totalStories: storiesList.length,
      userStories: storiesList.filter((s: any) => s.sourceType === 'USER').length,
      systemStories: storiesList.filter((s: any) => s.sourceType === 'SYSTEM').length,
      totalChapters: chaptersList.length,
      totalTranslationMemory: tmList.length,
      totalVocabulary: vocabList.length,
      totalTerminology: termList.length,
      totalCharacters: Object.keys(this.data.characters).length,
      totalPronounRules: Object.keys(this.data.pronounRules).length,
      totalContributions: contribList.length,
      pendingContributions: contribList.filter((c: any) => c.status === 'PENDING').length,
      approvedContributions: contribList.filter((c: any) => c.status === 'APPROVED').length,
      auditLogsCount: this.data.auditLogs.length,
      lastSyncTimestamp: this.data.lastUpdated,
    };
  }
}

export const cloudStore = new CloudStore();
