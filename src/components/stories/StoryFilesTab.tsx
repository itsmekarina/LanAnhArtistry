import React, { useState, useEffect } from 'react';
import { Story, StoryFileAttachment } from '../../types';
import { getStoryFiles, saveStoryFile, deleteStoryFile } from '../../services/db';
import { isGoogleConnected } from '../../services/googleAuth';
import {
  ensureStoryFolder,
  uploadFileToDrive,
  listFolderFiles,
  downloadFileBlob,
  deleteDriveFile,
} from '../../services/googleDrive';
import { generateStoryDocx } from '../../services/docxExport';
import {
  getChaptersByStory,
  getCharacters,
  getPronounRules,
  getTranslationMemories,
  getStoryBible,
} from '../../services/db';
import {
  FolderOpen,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Cloud,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Download,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface StoryFilesTabProps {
  story: Story;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const StoryFilesTab: React.FC<StoryFilesTabProps> = ({ story, showToast }) => {
  const [files, setFiles] = useState<StoryFileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncingToDrive, setSyncingToDrive] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  // Conflict modal state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    file: StoryFileAttachment;
    driveFile: any;
  } | null>(null);

  useEffect(() => {
    loadFiles();
  }, [story.id]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const list = await getStoryFiles(story.id);
      setFiles(list);

      if (isGoogleConnected()) {
        try {
          const fid = await ensureStoryFolder(story.title);
          setDriveFolderId(fid);
        } catch (e) {
          console.warn('Drive story folder setup error:', e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      let folderId = driveFolderId;
      if (isGoogleConnected() && !folderId) {
        folderId = await ensureStoryFolder(story.title);
        setDriveFolderId(folderId);
      }

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        let driveFileId: string | undefined = undefined;

        // If Google Drive is connected, upload the file safely to the story's folder
        if (isGoogleConnected() && folderId) {
          const uploadedDriveItem = await uploadFileToDrive(
            file.name,
            file,
            file.type || 'application/octet-stream',
            folderId
          );
          driveFileId = uploadedDriveItem.id;
        }

        const attachment: StoryFileAttachment = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          storyId: story.id,
          userId: story.ownerId || 'local-guest',
          fileName: file.name,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
          fileSize: file.size,
          storageProvider: driveFileId ? 'google_drive' : 'local',
          googleDriveFileId: driveFileId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveStoryFile(attachment);
      }

      await loadFiles();
      showToast(`Đã đính kèm thành công ${uploadedFiles.length} tệp cho truyện!`, 'success');
    } catch (err: any) {
      showToast(`Lỗi tải tệp: ${err.message}`, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (file: StoryFileAttachment) => {
    if (!confirm(`Bạn có chắc muốn xóa tệp "${file.fileName}"?`)) return;

    try {
      if (file.googleDriveFileId && isGoogleConnected()) {
        try {
          await deleteDriveFile(file.googleDriveFileId);
        } catch (e) {
          console.warn('Failed to delete on drive:', e);
        }
      }
      await deleteStoryFile(file.id);
      await loadFiles();
      showToast('Đã xóa tệp đính kèm.', 'info');
    } catch (err: any) {
      showToast(`Lỗi xóa tệp: ${err.message}`, 'error');
    }
  };

  // Backup entire story bundle to Google Drive (Section 22)
  const handleBackupStoryToDrive = async () => {
    if (!isGoogleConnected()) {
      showToast('Vui lòng kết nối Google Drive trong Cài đặt trước.', 'warning');
      return;
    }

    setSyncingToDrive(true);
    try {
      showToast('Đang kết nối thư mục Google Drive cho truyện...', 'info');
      const folderId = await ensureStoryFolder(story.title);
      setDriveFolderId(folderId);

      // Collect story data
      const [chapters, chars, pronouns, tms, bible] = await Promise.all([
        getChaptersByStory(story.id),
        getCharacters(story.id),
        getPronounRules(story.id),
        getTranslationMemories(story.id),
        getStoryBible(story.id),
      ]);

      // 1. Generate & Upload Story DOCX
      const docxBlob = await generateStoryDocx(story, chapters, chars, pronouns, tms, bible);
      const safeTitle = story.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      await uploadFileToDrive(`${safeTitle}_Full.docx`, docxBlob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', folderId);

      // 2. Metadata.json
      const metadataJson = JSON.stringify({ story, chaptersCount: chapters.length, charactersCount: chars.length }, null, 2);
      await uploadFileToDrive('Metadata.json', metadataJson, 'application/json', folderId);

      // 3. Translation_Memory.csv
      const tmCsv = [
        'original,translation,category,notes',
        ...tms.map((m) => `"${(m.original || '').replace(/"/g, '""')}","${(m.translation || '').replace(/"/g, '""')}","${m.category || ''}","${(m.notes || '').replace(/"/g, '""')}"`),
      ].join('\n');
      await uploadFileToDrive('Translation_Memory.csv', tmCsv, 'text/csv', folderId);

      // 4. Original.txt & Translation.txt
      const origTxt = chapters.map((c) => `=== Chapter ${c.chapterNumber}: ${c.title} ===\n\n${c.originalText}`).join('\n\n---\n\n');
      const transTxt = chapters.map((c) => `=== Chương ${c.chapterNumber}: ${c.title} ===\n\n${c.translationText || ''}`).join('\n\n---\n\n');
      await uploadFileToDrive('Original.txt', origTxt, 'text/plain', folderId);
      await uploadFileToDrive('Translation.txt', transTxt, 'text/plain', folderId);

      showToast(`Đã đồng bộ trọn bộ tài liệu "${story.title}" lên Google Drive!`, 'success');
      await loadFiles();
    } catch (err: any) {
      showToast(`Lỗi đồng bộ truyện lên Drive: ${err.message}`, 'error');
    } finally {
      setSyncingToDrive(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-blue-600" />;
    if (ext === 'csv' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (ext === 'json') return <FileCode className="w-5 h-5 text-amber-600" />;
    if (ext === 'pdf') return <File className="w-5 h-5 text-rose-600" />;
    return <File className="w-5 h-5 text-[#2E6C7B]" />;
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
              Tệp tài liệu đính kèm (Story Files)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA]">
              {files.length} tệp
            </span>
          </div>
          <p className="text-xs text-[#647780] mt-0.5">
            Hỗ trợ đính kèm DOCX, TXT, PDF, EPUB, JSON, CSV và đồng bộ tự động vào thư mục riêng trên Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Backup this story to Google Drive button */}
          <button
            onClick={handleBackupStoryToDrive}
            disabled={syncingToDrive}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#E8F7FA] hover:bg-[#B3EBF2]/60 text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44] transition-colors cursor-pointer disabled:opacity-50"
            title="Đồng bộ toàn bộ tài liệu truyện lên Google Drive"
          >
            {syncingToDrive ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span>Sao lưu truyện lên Drive</span>
          </button>

          {/* Upload Button */}
          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Đang tải...' : 'Tải lên tệp mới'}</span>
            <input
              type="file"
              multiple
              accept=".docx,.doc,.txt,.pdf,.epub,.json,.csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden shadow-xs">
        {files.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#647780] space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-[#77CBDA] opacity-50" />
            <p>Chưa có tệp nào được đính kèm cho tác phẩm này.</p>
            <p className="text-[11px]">
              Tải lên tài liệu gốc DOCX, ghi chú nhân vật TXT, bản tham khảo PDF hoặc bấm "Sao lưu truyện lên Drive".
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-4 hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-center shrink-0">
                    {getFileIcon(file.fileName)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                      {file.fileName}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#647780] mt-0.5">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(file.updatedAt).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#2E6C7B] dark:text-[#77CBDA]">
                        {file.storageProvider === 'google_drive' ? (
                          <>
                            <Cloud className="w-3 h-3" />
                            <span>Google Drive</span>
                          </>
                        ) : (
                          <>
                            <File className="w-3 h-3" />
                            <span>Bộ nhớ máy</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {file.googleDriveFileId && (
                    <a
                      href={`https://drive.google.com/file/d/${file.googleDriveFileId}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-[#2E6C7B] hover:bg-[#E8F7FA] dark:text-[#77CBDA] dark:hover:bg-[#172D35] transition-colors"
                      title="Mở trên Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="p-2 text-[#647780] hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
                    title="Xóa tệp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
