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
} from '../types';
import {
  getAllStories,
  getStoryById,
  saveStory,
  getChaptersByStory,
  saveChapter,
  getCharacters,
  saveCharacter,
  getCharacterRelationships,
  saveCharacterRelationship,
  getPronounRules,
  savePronounRule,
  getTranslationMemories,
  saveTranslationMemory,
  getStoryBible,
  saveStoryBible,
  getPlotEvents,
  savePlotEvent,
  getVersions,
  saveVersion,
} from './db';
import { generateStoryDocx } from './docxExport';
import { ensureAppFolders, uploadFileToDrive, listFolderFiles, downloadFileContent } from './googleDrive';
import { getGoogleAccessToken, isGoogleConnected } from './googleAuth';

// Helper: Calculate simple checksum string
function generateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `crc32-${Math.abs(hash).toString(16)}`;
}

// Format timestamp: YYYY-MM-DD_HH-mm
function getBackupTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
    d.getMinutes()
  )}`;
}

export class BackupEngine {
  // 1. Collect all data for the current user
  public async collectUserDatabasePayload(
    userId: string,
    userEmail?: string
  ): Promise<FullBackupPayload> {
    const allStories = await getAllStories();
    // Only user's own stories and system stories
    const targetStories = allStories.filter((s) => s.ownerId === userId || !s.ownerId);

    const allChapters: Chapter[] = [];
    const allCharacters: Character[] = [];
    const allRelationships: CharacterRelationship[] = [];
    const allPronouns: PronounRule[] = [];
    const allTM: TranslationMemory[] = [];
    const allBibles: StoryBible[] = [];
    const allPlotEvents: PlotEvent[] = [];
    const allVersions: TranslationVersion[] = [];

    for (const story of targetStories) {
      const chs = await getChaptersByStory(story.id);
      allChapters.push(...chs);

      const chars = await getCharacters(story.id);
      allCharacters.push(...chars);

      const rels = await getCharacterRelationships(story.id);
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

    const manifest: DatabaseManifest = {
      application: 'LanAnhArtistry',
      backupVersion: '1.0',
      createdAt: new Date().toISOString(),
      databaseVersion: '2.0-cloud',
      userId,
      userEmail,
      stories: targetStories.length,
      chapters: allChapters.length,
      segments: allChapters.reduce((sum, ch) => sum + (ch.originalText?.split('\n').length || 0), 0),
      characters: allCharacters.length,
      translationMemory: allTM.length,
      vocabulary: 0,
      terminology: 0,
      pronounRules: allPronouns.length,
    };

    return {
      manifest,
      data: {
        stories: targetStories,
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

  // 2. Perform Full Backup to Google Drive
  public async createFullGoogleDriveBackup(
    userId: string,
    userName: string,
    options: {
      includeDocx?: boolean;
      onProgress?: (percent: number, stepText: string) => void;
    } = {}
  ): Promise<{
    backupRecord: BackupRecord;
    driveFileId: string;
    folderUrl?: string;
  }> {
    const { onProgress } = options;

    onProgress?.(10, 'Đang chuẩn bị thư mục Google Drive LanAnhArtistry...');
    const folders = await ensureAppFolders();

    onProgress?.(25, 'Đang tổng hợp dữ liệu bản dịch và ngữ liệu...');
    const payload = await this.collectUserDatabasePayload(userId);

    const ts = getBackupTimestamp();
    const backupJsonString = JSON.stringify(payload, null, 2);
    const checksum = generateSimpleChecksum(backupJsonString);
    payload.manifest.checksum = checksum;

    const fullBackupFileName = `LanAnhArtistry_Full_Backup_${ts}.json`;
    const manifestFileName = `Database_Manifest_${ts}.json`;

    onProgress?.(45, 'Đang tải tệp bản sao lưu JSON lên Google Drive...');
    const uploadedBackupFile = await uploadFileToDrive(
      fullBackupFileName,
      backupJsonString,
      'application/json',
      folders.backupsId
    );

    onProgress?.(65, 'Đang lưu trữ Manifest và biên bản kiểm toán...');
    await uploadFileToDrive(
      manifestFileName,
      JSON.stringify(payload.manifest, null, 2),
      'application/json',
      folders.backupsId
    );

    // Optional: Generate and upload human-readable DOCX for each story
    if (options.includeDocx && payload.data.stories.length > 0) {
      onProgress?.(80, 'Đang tạo bản sao lưu tài liệu Word (.docx) trực quan...');
      for (const st of payload.data.stories) {
        try {
          const stChapters = payload.data.chapters.filter((c) => c.storyId === st.id);
          const stChars = payload.data.characters.filter((c) => c.storyId === st.id);
          const stPronouns = payload.data.pronouns.filter((p) => p.storyId === st.id);
          const stTM = payload.data.translationMemory.filter((m) => m.storyId === st.id);
          const stBible = payload.data.storyBible.find((b) => b.storyId === st.id);

          const docxBlob = await generateStoryDocx(
            st,
            stChapters,
            stChars,
            stPronouns,
            stTM,
            stBible
          );

          const safeTitle = st.title.replace(/[^a-zA-Z0-9_-]/g, '_');
          const docxFileName = `LanAnhArtistry_${safeTitle}_${ts}.docx`;

          await uploadFileToDrive(
            docxFileName,
            docxBlob,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            folders.storiesId
          );
        } catch (docxErr) {
          console.warn('Failed to generate DOCX for story:', st.title, docxErr);
        }
      }
    }

    onProgress?.(95, 'Đang ghi nhận lịch sử sao lưu...');
    const record: BackupRecord = {
      id: `bk-${Date.now()}`,
      userId,
      backupType: 'full',
      databaseVersion: '2.0',
      fileName: fullBackupFileName,
      googleDriveFileId: uploadedBackupFile.id,
      googleDriveFolderId: folders.backupsId,
      fileSize: backupJsonString.length,
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

    // Store in local backup history
    this.saveLocalBackupRecord(record);

    // Update connection timestamp
    localStorage.setItem('lananh_last_gdrive_backup', new Date().toISOString());

    onProgress?.(100, 'Sao lưu Google Drive hoàn tất thành công!');

    return {
      backupRecord: record,
      driveFileId: uploadedBackupFile.id,
      folderUrl: uploadedBackupFile.webViewLink,
    };
  }

  // 3. Local Backup Records management
  public getLocalBackupRecords(userId: string): BackupRecord[] {
    try {
      const raw = localStorage.getItem(`lananh_backups_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  private saveLocalBackupRecord(record: BackupRecord) {
    const list = this.getLocalBackupRecords(record.userId);
    list.unshift(record);
    // Keep max 30 records
    localStorage.setItem(
      `lananh_backups_${record.userId}`,
      JSON.stringify(list.slice(0, 30))
    );
  }

  // 4. Validate Backup Payload
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

      return {
        valid: true,
        manifest: parsed.manifest,
        payload: parsed,
      };
    } catch (e: any) {
      return { valid: false, error: `Lỗi phân tích JSON: ${e.message}` };
    }
  }

  // 5. Restore Backup with Safety Backup check
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

    // Safety backup of current state
    if (options.createSafetyBackup) {
      onProgress?.(10, 'Đang tạo bản sao lưu an toàn trước khi khôi phục...');
      const currentPayload = await this.collectUserDatabasePayload(userId);
      const safetyJson = JSON.stringify(currentPayload);
      localStorage.setItem(`lananh_safety_backup_${userId}`, safetyJson);
    }

    onProgress?.(30, 'Đang đối chiếu dữ liệu cần khôi phục...');
    const storiesToRestore =
      options.mode === 'selective' && options.selectedStoryIds
        ? payload.data.stories.filter((s) => options.selectedStoryIds!.includes(s.id))
        : payload.data.stories;

    const storyIdSet = new Set(storiesToRestore.map((s) => s.id));

    onProgress?.(50, 'Đang phục hồi các tác phẩm và chương truyện...');
    let restoredStoryCount = 0;
    for (const story of storiesToRestore) {
      await saveStory({
        ...story,
        ownerId: userId,
      });
      restoredStoryCount++;
    }

    let restoredChapterCount = 0;
    const chaptersToRestore = payload.data.chapters.filter((ch) => storyIdSet.has(ch.storyId));
    for (const ch of chaptersToRestore) {
      await saveChapter(ch);
      restoredChapterCount++;
    }

    onProgress?.(75, 'Đang phục hồi nhân vật, xưng hô và Story Bible...');
    const charsToRestore = payload.data.characters.filter((c) => storyIdSet.has(c.storyId));
    for (const c of charsToRestore) {
      await saveCharacter(c);
    }

    const relsToRestore = payload.data.relationships.filter((r) => storyIdSet.has(r.storyId));
    for (const r of relsToRestore) {
      await saveCharacterRelationship(r);
    }

    const pronounsToRestore = payload.data.pronouns.filter((p) => storyIdSet.has(p.storyId));
    for (const p of pronounsToRestore) {
      await savePronounRule(p);
    }

    const biblesToRestore = payload.data.storyBible.filter((b) => storyIdSet.has(b.storyId));
    for (const b of biblesToRestore) {
      await saveStoryBible(b);
    }

    let restoredTMCount = 0;
    if (options.restoreKnowledge !== false) {
      onProgress?.(90, 'Đang phục hồi Translation Memory và thuật ngữ...');
      const tmToRestore =
        options.mode === 'selective'
          ? payload.data.translationMemory.filter((m) => storyIdSet.has(m.storyId))
          : payload.data.translationMemory;

      for (const tm of tmToRestore) {
        await saveTranslationMemory(tm);
        restoredTMCount++;
      }
    }

    onProgress?.(100, 'Khôi phục hoàn tất thành công!');

    return {
      success: true,
      restoredStories: restoredStoryCount,
      restoredChapters: restoredChapterCount,
      restoredTM: restoredTMCount,
    };
  }

  // 6. Incremental Backup to Google Drive
  public async createIncrementalGoogleDriveBackup(
    userId: string,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<{ backupRecord: BackupRecord; driveFileId: string }> {
    onProgress?.(10, 'Đang kiểm tra thời điểm sao lưu gần nhất...');
    const lastBackupTime = localStorage.getItem('lananh_last_gdrive_backup') || new Date(0).toISOString();
    const lastTs = new Date(lastBackupTime).getTime();

    onProgress?.(25, 'Đang phân tích các bản ghi thay đổi từ lần sao lưu trước...');
    const fullPayload = await this.collectUserDatabasePayload(userId);

    // Filter changed data
    const changedStories = fullPayload.data.stories.filter(
      (s) => new Date(s.updatedAt || s.createdAt).getTime() > lastTs
    );
    const changedChapters = fullPayload.data.chapters.filter(
      (c) => new Date(c.updatedAt || c.createdAt).getTime() > lastTs
    );
    const changedTM = fullPayload.data.translationMemory.filter(
      (t) => new Date(t.createdAt || 0).getTime() > lastTs
    );
    const changedChars = fullPayload.data.characters.filter(
      (c) => new Date(c.createdAt || 0).getTime() > lastTs
    );

    const ts = getBackupTimestamp();
    const incrementalPayload = {
      type: 'incremental_backup',
      baseBackupTime: lastBackupTime,
      createdAt: new Date().toISOString(),
      userId,
      data: {
        stories: changedStories,
        chapters: changedChapters,
        translationMemory: changedTM,
        characters: changedChars,
      },
      stats: {
        changedStories: changedStories.length,
        changedChapters: changedChapters.length,
        changedTM: changedTM.length,
        changedCharacters: changedChars.length,
      },
    };

    onProgress?.(50, 'Đang chuẩn bị thư mục Google Drive...');
    const folders = await ensureAppFolders();

    const fileName = `LanAnhArtistry_Incremental_Backup_${ts}.json`;
    const jsonStr = JSON.stringify(incrementalPayload, null, 2);

    onProgress?.(75, 'Đang tải tệp thay đổi Incremental lên Google Drive...');
    const uploaded = await uploadFileToDrive(fileName, jsonStr, 'application/json', folders.backupsId);

    const record: BackupRecord = {
      id: `bk-inc-${Date.now()}`,
      userId,
      backupType: 'incremental',
      databaseVersion: '2.0',
      fileName,
      googleDriveFileId: uploaded.id,
      googleDriveFolderId: folders.backupsId,
      fileSize: jsonStr.length,
      status: 'completed',
      storyCount: changedStories.length,
      chapterCount: changedChapters.length,
      segmentCount: 0,
      translationMemoryCount: changedTM.length,
      vocabularyCount: 0,
      terminologyCount: 0,
      characterCount: changedChars.length,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.saveLocalBackupRecord(record);
    localStorage.setItem('lananh_last_gdrive_backup', new Date().toISOString());

    onProgress?.(100, 'Sao lưu Incremental thành công!');
    return { backupRecord: record, driveFileId: uploaded.id };
  }

  // 7. TYPE C — RAW EXPORTS (TXT, CSV) to Google Drive / Local
  public async generateRawExports(
    userId: string,
    targetStoryId?: string
  ): Promise<{
    files: Array<{ name: string; content: string; mimeType: string }>;
  }> {
    const payload = await this.collectUserDatabasePayload(userId);
    const stories = targetStoryId
      ? payload.data.stories.filter((s) => s.id === targetStoryId)
      : payload.data.stories;

    const files: Array<{ name: string; content: string; mimeType: string }> = [];

    // Story_Original.txt & Story_Translation.txt
    for (const story of stories) {
      const chs = payload.data.chapters.filter((c) => c.storyId === story.id);
      const originalLines = chs.map((c) => `=== Chapter ${c.chapterNumber}: ${c.title} ===\n\n${c.originalText}\n\n`);
      const transLines = chs.map((c) => `=== Chương ${c.chapterNumber}: ${c.title} ===\n\n${c.translationText || ''}\n\n`);

      const safeTitle = story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      files.push({
        name: `${safeTitle}_Original.txt`,
        content: originalLines.join('\n---\n\n'),
        mimeType: 'text/plain',
      });
      files.push({
        name: `${safeTitle}_Translation.txt`,
        content: transLines.join('\n---\n\n'),
        mimeType: 'text/plain',
      });
    }

    // Translation_Memory.csv
    const tmHeaders = ['id', 'storyId', 'original', 'translation', 'category', 'notes'];
    const tmRows = payload.data.translationMemory.map((m) =>
      [
        `"${m.id}"`,
        `"${m.storyId}"`,
        `"${(m.original || '').replace(/"/g, '""')}"`,
        `"${(m.translation || '').replace(/"/g, '""')}"`,
        `"${m.category || ''}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    files.push({
      name: 'Translation_Memory.csv',
      content: [tmHeaders.join(','), ...tmRows].join('\n'),
      mimeType: 'text/csv',
    });

    // Characters.csv
    const charHeaders = ['id', 'storyId', 'name', 'pinyin', 'role', 'gender', 'identity', 'personality'];
    const charRows = payload.data.characters.map((c) =>
      [
        `"${c.id}"`,
        `"${c.storyId}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.pinyin || '').replace(/"/g, '""')}"`,
        `"${c.role || ''}"`,
        `"${c.gender || ''}"`,
        `"${(c.identity || '').replace(/"/g, '""')}"`,
        `"${(c.personality || c.description || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    files.push({
      name: 'Characters.csv',
      content: [charHeaders.join(','), ...charRows].join('\n'),
      mimeType: 'text/csv',
    });

    // Pronouns.csv
    const prHeaders = ['id', 'storyId', 'fromCharacter', 'toCharacter', 'selfPronoun', 'targetAddress', 'context'];
    const prRows = payload.data.pronouns.map((p) =>
      [
        `"${p.id}"`,
        `"${p.storyId}"`,
        `"${(p.fromCharacter || p.characterFrom || '').replace(/"/g, '""')}"`,
        `"${(p.toCharacter || p.characterTo || '').replace(/"/g, '""')}"`,
        `"${(p.selfPronoun || p.originalPronoun || '').replace(/"/g, '""')}"`,
        `"${(p.targetAddress || p.suggestedTranslation || '').replace(/"/g, '""')}"`,
        `"${(p.context || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    files.push({
      name: 'Pronouns.csv',
      content: [prHeaders.join(','), ...prRows].join('\n'),
      mimeType: 'text/csv',
    });

    return { files };
  }

  // Upload Raw Export files to Google Drive (LanAnhArtistry/Exports/)
  public async uploadRawExportsToDrive(
    userId: string,
    targetStoryId?: string,
    onProgress?: (percent: number, text: string) => void
  ): Promise<string[]> {
    onProgress?.(15, 'Đang kết nối thư mục LanAnhArtistry/Exports/ trên Google Drive...');
    const folders = await ensureAppFolders();

    onProgress?.(35, 'Đang kết xuất các tệp TXT và CSV...');
    const { files } = await this.generateRawExports(userId, targetStoryId);

    const uploadedIds: string[] = [];
    const stepRatio = 60 / Math.max(1, files.length);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      onProgress?.(Math.round(40 + i * stepRatio), `Đang tải ${f.name} lên Google Drive...`);
      const item = await uploadFileToDrive(f.name, f.content, f.mimeType, folders.exportsId);
      uploadedIds.push(item.id);
    }

    onProgress?.(100, `Đã xuất ${files.length} tệp lên thư mục Exports của Google Drive!`);
    return uploadedIds;
  }

  // 8. Auto Backup Configurations
  public getAutoBackupSettings(): {
    enabled: boolean;
    frequency: 'daily' | '3days' | 'weekly';
    backupBeforeMajorOps: boolean;
    includeDocx: boolean;
  } {
    try {
      const raw = localStorage.getItem('lananh_auto_backup_config');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return {
      enabled: true,
      frequency: 'weekly',
      backupBeforeMajorOps: true,
      includeDocx: true,
    };
  }

  public saveAutoBackupSettings(settings: {
    enabled: boolean;
    frequency: 'daily' | '3days' | 'weekly';
    backupBeforeMajorOps: boolean;
    includeDocx: boolean;
  }) {
    localStorage.setItem('lananh_auto_backup_config', JSON.stringify(settings));
  }

  // 9. Safety Backup before major operations (e.g. before deleting, before large import, before restore)
  public async backupBeforeMajorOperation(operationName: string, userId: string): Promise<boolean> {
    const settings = this.getAutoBackupSettings();
    if (!settings.backupBeforeMajorOps) return false;

    try {
      // Local snapshot
      const payload = await this.collectUserDatabasePayload(userId);
      const snapshotKey = `lananh_safety_snapshot_${Date.now()}`;
      localStorage.setItem(snapshotKey, JSON.stringify(payload));

      // If Google Drive is connected, create lightweight backup
      if (isGoogleConnected()) {
        const folders = await ensureAppFolders();
        const ts = getBackupTimestamp();
        const fileName = `Safety_Backup_Before_${operationName.replace(/[^a-zA-Z0-9]/g, '_')}_${ts}.json`;
        await uploadFileToDrive(fileName, JSON.stringify(payload), 'application/json', folders.backupsId);
      }
      return true;
    } catch (e) {
      console.warn('Safety backup before major op encountered error:', e);
      return false;
    }
  }
}

export const backupEngine = new BackupEngine();
