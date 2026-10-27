/**
 * LanAnhArtistry — Backup Service
 * Central utility service for:
 * 1. Google Drive OAuth 2.0 connection flows
 * 2. File management on Google Drive (Backups, Stories, Exports, Restore)
 * 3. Machine-readable JSON full backups generation & restoration
 */

import {
  Story,
  Chapter,
  TranslationSegment,
  Character,
  CharacterRelationship,
  PronounRule,
  TranslationMemory,
  VocabularyItem,
  TerminologyItem,
  StoryBible,
  PlotEvent,
  TranslationVersion,
  DatabaseManifest,
  FullBackupPayload,
  BackupRecord,
  DriveFileItem,
} from '../types';
import {
  signInWithGoogleDrive,
  disconnectGoogleDrive,
  getGoogleAccessToken,
  isGoogleConnected,
  getCachedGoogleUser,
  subscribeGoogleAuth,
} from './googleAuth';
import {
  ensureAppFolders,
  uploadFileToDrive,
  listFolderFiles,
  downloadFileContent,
  deleteDriveFile,
  DriveFoldersMap,
} from './googleDrive';
import {
  getAllStories,
  getChaptersByStory,
  saveStory,
  saveChapter,
  getCharacters,
  saveCharacter,
  getRelationships,
  saveRelationship,
  getPronounRules,
  savePronounRule,
  getTranslationMemories,
  saveTranslationMemory,
  getStoryBible,
  saveStoryBible,
  getPlotEvents,
  savePlotEvent,
  getVersions,
} from './db';

// Helper: Calculate standard checksum string
export function calculateBackupChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `crc32-${Math.abs(hash).toString(16)}`;
}

// Helper: Format timestamp YYYY-MM-DD_HH-mm
export function getFormattedBackupTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
    d.getMinutes()
  )}`;
}

export class BackupService {
  // ==========================================
  // 1. GOOGLE DRIVE OAUTH 2.0 FLOWS
  // ==========================================

  public async connectGoogleDrive() {
    return await signInWithGoogleDrive();
  }

  public async disconnectGoogleDrive() {
    return await disconnectGoogleDrive();
  }

  public async getAccessToken(): Promise<string | null> {
    return await getGoogleAccessToken();
  }

  public isConnected(): boolean {
    return isGoogleConnected();
  }

  public getConnectedUser() {
    return getCachedGoogleUser();
  }

  public subscribeAuthStatus(listener: (connected: boolean, user: any) => void): () => void {
    return subscribeGoogleAuth(listener);
  }

  // ==========================================
  // 2. FILE MANAGEMENT ON GOOGLE DRIVE
  // ==========================================

  public async ensureAppFolderStructure(): Promise<DriveFoldersMap> {
    return await ensureAppFolders();
  }

  public async uploadFile(
    fileName: string,
    content: string | Blob,
    mimeType: string,
    folderId: string,
    onProgress?: (percent: number) => void
  ): Promise<DriveFileItem> {
    return await uploadFileToDrive(fileName, content, mimeType, folderId, onProgress);
  }

  public async listBackups(): Promise<DriveFileItem[]> {
    const folders = await this.ensureAppFolderStructure();
    return await listFolderFiles(folders.backupsId, {
      query: "mimeType = 'application/json' and name contains 'Backup'",
      orderBy: 'createdTime desc',
    });
  }

  public async downloadFile(fileId: string): Promise<string> {
    return await downloadFileContent(fileId);
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    return await deleteDriveFile(fileId);
  }

  // ==========================================
  // 3. MACHINE-READABLE JSON FULL BACKUP LOGIC
  // ==========================================

  /**
   * Collect all user-owned data necessary for machine-readable restoration
   */
  public async collectUserDatabasePayload(
    userId: string,
    userEmail?: string
  ): Promise<FullBackupPayload> {
    const allStories = await getAllStories();
    const userStories = allStories.filter((s) => s.ownerId === userId || !s.ownerId);

    const allChapters: Chapter[] = [];
    const allCharacters: Character[] = [];
    const allRelationships: CharacterRelationship[] = [];
    const allPronouns: PronounRule[] = [];
    const allTM: TranslationMemory[] = [];
    const allBibles: StoryBible[] = [];
    const allPlotEvents: PlotEvent[] = [];
    const allVersions: TranslationVersion[] = [];

    for (const story of userStories) {
      const chs = await getChaptersByStory(story.id);
      allChapters.push(...chs);

      const chars = await getCharacters(story.id);
      allCharacters.push(...chars);

      const rels = await getRelationships(story.id);
      allRelationships.push(...rels);

      const prs = await getPronounRules(story.id);
      allPronouns.push(...prs);

      const tms = await getTranslationMemories(story.id);
      allTM.push(...tms);

      const bible = await getStoryBible(story.id);
      if (bible) allBibles.push(bible);

      const plots = await getPlotEvents(story.id);
      allPlotEvents.push(...plots);

      for (const ch of chs) {
        const v = await getVersions(ch.id);
        allVersions.push(...v);
      }
    }

    const segmentsCount = allChapters.reduce(
      (sum, ch) => sum + (ch.originalText ? ch.originalText.split('\n').filter(Boolean).length : 0),
      0
    );

    const manifest: DatabaseManifest = {
      application: 'LanAnhArtistry',
      backupVersion: '1.0',
      createdAt: new Date().toISOString(),
      databaseVersion: '2.0-cloud',
      userId,
      userEmail,
      stories: userStories.length,
      chapters: allChapters.length,
      segments: segmentsCount,
      characters: allCharacters.length,
      translationMemory: allTM.length,
      vocabulary: 0,
      terminology: allTM.filter((m) => m.category === 'terminology').length,
      pronounRules: allPronouns.length,
    };

    return {
      manifest,
      data: {
        stories: userStories,
        chapters: allChapters,
        segments: [],
        characters: allCharacters,
        relationships: allRelationships,
        pronouns: allPronouns,
        translationMemory: allTM,
        vocabulary: [],
        terminology: [],
        storyBible: allBibles,
        plotEvents: allPlotEvents,
        versions: allVersions,
      },
    };
  }

  /**
   * Generate canonical Full Backup JSON string & Manifest
   */
  public async generateFullBackupJSON(
    userId: string,
    userEmail?: string
  ): Promise<{
    payload: FullBackupPayload;
    jsonString: string;
    fileName: string;
    manifestFileName: string;
    checksum: string;
  }> {
    const payload = await this.collectUserDatabasePayload(userId, userEmail);
    const ts = getFormattedBackupTimestamp();

    const jsonString = JSON.stringify(payload, null, 2);
    const checksum = calculateBackupChecksum(jsonString);
    payload.manifest.checksum = checksum;

    const fileName = `LanAnhArtistry_Full_Backup_${ts}.json`;
    const manifestFileName = `Database_Manifest_${ts}.json`;

    return {
      payload,
      jsonString,
      fileName,
      manifestFileName,
      checksum,
    };
  }

  /**
   * Execute Full Backup to Google Drive with progress reporting
   */
  public async executeFullBackup(
    userId: string,
    userName: string = 'Translator',
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<{
    backupRecord: BackupRecord;
    driveFileId: string;
    manifestFileId: string;
  }> {
    onProgress?.(10, 'Đang chuẩn bị thư mục Google Drive LanAnhArtistry...');
    const folders = await this.ensureAppFolderStructure();

    onProgress?.(25, 'Đang tổng hợp dữ liệu toàn diện (Full Database JSON)...');
    const { payload, jsonString, fileName, manifestFileName, checksum } =
      await this.generateFullBackupJSON(userId);

    onProgress?.(45, 'Đang tải tệp bản sao lưu JSON lên Google Drive...');
    const backupFile = await this.uploadFile(
      fileName,
      jsonString,
      'application/json',
      folders.backupsId,
      (p) => onProgress?.(Math.round(45 + p * 0.25), 'Đang tải tệp lên Google Drive...')
    );

    onProgress?.(75, 'Đang tải tệp Database_Manifest.json...');
    const manifestFile = await this.uploadFile(
      manifestFileName,
      JSON.stringify(payload.manifest, null, 2),
      'application/json',
      folders.backupsId
    );

    const record: BackupRecord = {
      id: `bk-${Date.now()}`,
      userId,
      backupType: 'full',
      databaseVersion: '2.0',
      fileName,
      googleDriveFileId: backupFile.id,
      googleDriveFolderId: folders.backupsId,
      fileSize: jsonString.length,
      checksum,
      status: 'completed',
      storyCount: payload.manifest.stories,
      chapterCount: payload.manifest.chapters,
      segmentCount: payload.manifest.segments,
      translationMemoryCount: payload.manifest.translationMemory,
      vocabularyCount: payload.manifest.vocabulary,
      terminologyCount: payload.manifest.terminology,
      characterCount: payload.manifest.characters,
      manifestData: payload.manifest,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // Save record to local history
    this.saveBackupHistoryRecord(record);
    localStorage.setItem('lananh_last_gdrive_backup', new Date().toISOString());

    onProgress?.(100, 'Sao lưu Full Backup lên Google Drive hoàn tất thành công!');

    return {
      backupRecord: record,
      driveFileId: backupFile.id,
      manifestFileId: manifestFile.id,
    };
  }

  /**
   * Validate a backup JSON string
   */
  public validateBackupString(jsonStr: string): {
    valid: boolean;
    manifest?: DatabaseManifest;
    payload?: FullBackupPayload;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonStr) as FullBackupPayload;
      if (!parsed || (!parsed.manifest && !parsed.data)) {
        return { valid: false, error: 'Tệp sao lưu không đúng định dạng LanAnhArtistry JSON.' };
      }
      if (!parsed.data?.stories || !Array.isArray(parsed.data.stories)) {
        return { valid: false, error: 'Thiếu dữ liệu danh sách truyện hợp lệ.' };
      }
      return { valid: true, manifest: parsed.manifest, payload: parsed };
    } catch (e: any) {
      return { valid: false, error: `Lỗi phân tích JSON: ${e.message}` };
    }
  }

  /**
   * Restore user data from a FullBackupPayload safely
   */
  public async restoreFromBackupPayload(
    payload: FullBackupPayload,
    userId: string,
    options: {
      mode: 'entire' | 'selective';
      selectedStoryIds?: string[];
      restoreKnowledge?: boolean;
      createSafetyBackup?: boolean;
      onProgress?: (percent: number, text: string) => void;
    }
  ): Promise<{
    success: boolean;
    restoredStories: number;
    restoredChapters: number;
    restoredTM: number;
  }> {
    const { onProgress } = options;

    if (options.createSafetyBackup) {
      onProgress?.(10, 'Đang tạo bản sao lưu an toàn hiện tại...');
      const current = await this.collectUserDatabasePayload(userId);
      localStorage.setItem(`lananh_safety_backup_${userId}`, JSON.stringify(current));
    }

    onProgress?.(30, 'Đang chuẩn bị danh sách truyện phục hồi...');
    const storiesToRestore =
      options.mode === 'selective' && options.selectedStoryIds
        ? payload.data.stories.filter((s) => options.selectedStoryIds!.includes(s.id))
        : payload.data.stories;

    const storyIdSet = new Set(storiesToRestore.map((s) => s.id));

    onProgress?.(50, 'Đang phục hồi truyện và các chương...');
    let restoredStories = 0;
    for (const story of storiesToRestore) {
      await saveStory({ ...story, ownerId: userId });
      restoredStories++;
    }

    let restoredChapters = 0;
    const chaptersToRestore = payload.data.chapters.filter((ch) => storyIdSet.has(ch.storyId));
    for (const ch of chaptersToRestore) {
      await saveChapter(ch);
      restoredChapters++;
    }

    onProgress?.(75, 'Đang phục hồi nhân vật, xưng hô và Story Bible...');
    for (const char of payload.data.characters.filter((c) => storyIdSet.has(c.storyId))) {
      await saveCharacter(char);
    }
    for (const rel of payload.data.relationships.filter((r) => storyIdSet.has(r.storyId))) {
      await saveRelationship(rel);
    }
    for (const pronoun of payload.data.pronouns.filter((p) => storyIdSet.has(p.storyId))) {
      await savePronounRule(pronoun);
    }
    for (const bible of payload.data.storyBible.filter((b) => storyIdSet.has(b.storyId))) {
      await saveStoryBible(bible);
    }

    let restoredTM = 0;
    if (options.restoreKnowledge !== false) {
      onProgress?.(90, 'Đang phục hồi Translation Memory...');
      const tmToRestore =
        options.mode === 'selective'
          ? payload.data.translationMemory.filter((m) => storyIdSet.has(m.storyId))
          : payload.data.translationMemory;

      for (const tm of tmToRestore) {
        await saveTranslationMemory(tm);
        restoredTM++;
      }
    }

    onProgress?.(100, 'Khôi phục hoàn tất!');
    return {
      success: true,
      restoredStories,
      restoredChapters,
      restoredTM,
    };
  }

  // Backup history tracking
  public getBackupHistory(userId: string): BackupRecord[] {
    try {
      const raw = localStorage.getItem(`lananh_backups_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return [];
  }

  private saveBackupHistoryRecord(record: BackupRecord) {
    const list = this.getBackupHistory(record.userId);
    list.unshift(record);
    localStorage.setItem(`lananh_backups_${record.userId}`, JSON.stringify(list.slice(0, 30)));
  }
}

export const backupService = new BackupService();
