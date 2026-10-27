import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Layers,
  Brain,
  Shield,
  Upload,
  Clock,
  ArrowRight,
  Database,
  Cloud,
} from 'lucide-react';
import { backupEngine } from '../../services/backupEngine';
import { FullBackupPayload, DatabaseManifest, DriveFileItem } from '../../types';
import { listFolderFiles, downloadFileContent, ensureAppFolders } from '../../services/googleDrive';
import { isGoogleConnected } from '../../services/googleAuth';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const { currentUser, showToast, refreshStories } = useApp();

  const [step, setStep] = useState<'select' | 'preview' | 'restoring' | 'done'>('select');
  const [sourceType, setSourceType] = useState<'drive' | 'upload'>('drive');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Selected backup payload
  const [selectedPayload, setSelectedPayload] = useState<FullBackupPayload | null>(null);
  const [manifest, setManifest] = useState<DatabaseManifest | null>(null);

  // Options
  const [restoreMode, setRestoreMode] = useState<'entire' | 'selective'>('entire');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [restoreKnowledge, setRestoreKnowledge] = useState<boolean>(true);
  const [createSafetyBackup, setCreateSafetyBackup] = useState<boolean>(true);

  // Progress
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [restoreResults, setRestoreResults] = useState<{
    restoredStories: number;
    restoredChapters: number;
    restoredTM: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedPayload(null);
      setManifest(null);
      setProgressPercent(0);
      setRestoreResults(null);

      if (isGoogleConnected()) {
        loadDriveBackups();
      } else {
        setSourceType('upload');
      }
    }
  }, [isOpen]);

  const loadDriveBackups = async () => {
    setLoadingDrive(true);
    try {
      const folders = await ensureAppFolders();
      const files = await listFolderFiles(folders.backupsId, {
        query: "mimeType = 'application/json' and name contains 'Backup'",
      });
      setDriveFiles(files);
    } catch (e) {
      console.warn('Failed to list drive backups:', e);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleSelectDriveFile = async (fileId: string) => {
    try {
      showToast('Đang tải tệp bản sao lưu từ Google Drive...', 'info');
      const text = await downloadFileContent(fileId);
      const validation = backupEngine.validateBackupString(text);
      if (!validation.valid || !validation.payload) {
        showToast(`Tệp không hợp lệ: ${validation.error}`, 'error');
        return;
      }
      setSelectedPayload(validation.payload);
      setManifest(validation.manifest || null);
      setSelectedStoryIds(validation.payload.data.stories.map((s) => s.id));
      setStep('preview');
    } catch (e: any) {
      showToast(e.message || 'Lỗi tải bản sao lưu', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const validation = backupEngine.validateBackupString(text);
      if (!validation.valid || !validation.payload) {
        showToast(`Tệp không hợp lệ: ${validation.error}`, 'error');
        return;
      }
      setSelectedPayload(validation.payload);
      setManifest(validation.manifest || null);
      setSelectedStoryIds(validation.payload.data.stories.map((s) => s.id));
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!selectedPayload) return;

    setStep('restoring');
    try {
      const res = await backupEngine.restoreFromBackupPayload(selectedPayload, currentUser.id, {
        mode: restoreMode,
        selectedStoryIds,
        restoreKnowledge,
        createSafetyBackup,
        onProgress: (percent, text) => {
          setProgressPercent(percent);
          setProgressText(text);
        },
      });

      setRestoreResults(res);
      setStep('done');
      await refreshStories();
      showToast('Khôi phục cơ sở dữ liệu thành công!', 'success');
      onRestoreSuccess?.();
    } catch (e: any) {
      showToast(`Lỗi khôi phục: ${e.message}`, 'error');
      setStep('preview');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#B3EBF2]/40 dark:bg-[#77CBDA]/20 text-[#2E6C7B] dark:text-[#77CBDA]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Khôi Phục Cơ Sở Dữ Liệu (Restore Backup)
              </h3>
              <p className="text-xs text-[#647780]">
                Phục hồi an toàn từ Google Drive hoặc tệp JSON sao lưu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <strong>Cảnh báo khôi phục:</strong> Quá trình khôi phục sẽ ghi đè hoặc bổ sung dữ liệu vào cơ sở dữ liệu hiện tại. Hệ thống sẽ tự động tạo một bản sao lưu an toàn (Safety Backup) trước khi thực hiện.
              </div>
            </div>
          </div>

          {/* STEP 1: Select Backup Source */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-2">
                <button
                  onClick={() => setSourceType('drive')}
                  className={`pb-1 font-semibold transition-colors ${
                    sourceType === 'drive'
                      ? 'text-[#2E6C7B] dark:text-[#77CBDA] border-b-2 border-[#77CBDA]'
                      : 'text-[#647780]'
                  }`}
                >
                  Chọn từ Google Drive
                </button>
                <button
                  onClick={() => setSourceType('upload')}
                  className={`pb-1 font-semibold transition-colors ${
                    sourceType === 'upload'
                      ? 'text-[#2E6C7B] dark:text-[#77CBDA] border-b-2 border-[#77CBDA]'
                      : 'text-[#647780]'
                  }`}
                >
                  Tải lên tệp sao lưu (.json)
                </button>
              </div>

              {sourceType === 'drive' && (
                <div className="space-y-2">
                  {!isGoogleConnected() ? (
                    <div className="p-6 text-center text-xs text-[#647780] space-y-2">
                      <Cloud className="w-8 h-8 mx-auto text-[#647780]" />
                      <p>Bạn chưa kết nối tài khoản Google Drive.</p>
                      <button
                        onClick={() => setSourceType('upload')}
                        className="text-[#2E6C7B] dark:text-[#77CBDA] underline font-medium"
                      >
                        Chuyển sang tải file .json từ máy tính
                      </button>
                    </div>
                  ) : loadingDrive ? (
                    <div className="py-8 text-center text-xs text-[#647780]">
                      Đang tìm các bản sao lưu trong thư mục LanAnhArtistry/Backups...
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#647780]">
                      Không tìm thấy tệp sao lưu nào trong Google Drive.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectDriveFile(file.id)}
                          className="p-3 text-xs flex items-center justify-between hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/30 cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-[#647780]">
                              Tạo ngày: {new Date(file.createdTime).toLocaleString()}
                            </div>
                          </div>
                          <span className="text-[#2E6C7B] dark:text-[#77CBDA] font-semibold text-[11px] flex items-center gap-1">
                            Chọn tệp này <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sourceType === 'upload' && (
                <div className="p-6 rounded-xl border-2 border-dashed border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] text-center space-y-2">
                  <Upload className="w-8 h-8 text-[#2E6C7B] dark:text-[#77CBDA] mx-auto opacity-80" />
                  <div className="text-xs text-[#26343B] dark:text-[#ECF7F9] font-medium">
                    Chọn tệp sao lưu LanAnhArtistry_Full_Backup_*.json
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="text-[11px] text-[#647780] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#B3EBF2]/40 file:text-[#2E6C7B]"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview & Selective Configuration */}
          {step === 'preview' && selectedPayload && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Thông tin bản sao lưu & Tuỳ chọn khôi phục
              </h4>

              {/* Manifest Stats */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E]">
                  <div className="font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                    {selectedPayload.data.stories.length}
                  </div>
                  <div className="text-[10px] text-[#647780]">Bộ truyện</div>
                </div>
                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E]">
                  <div className="font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                    {selectedPayload.data.chapters.length}
                  </div>
                  <div className="text-[10px] text-[#647780]">Chương truyện</div>
                </div>
                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E]">
                  <div className="font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                    {selectedPayload.data.translationMemory.length}
                  </div>
                  <div className="text-[10px] text-[#647780]">Translation Memory</div>
                </div>
              </div>

              {/* Selective Options */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                  Chế độ phục hồi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('entire')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      restoreMode === 'entire'
                        ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                        : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780]'
                    }`}
                  >
                    <div>Toàn bộ cơ sở dữ liệu</div>
                    <div className="text-[10px] font-normal opacity-80">Phục hồi tất cả các tác phẩm & tri thức</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('selective')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      restoreMode === 'selective'
                        ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                        : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780]'
                    }`}
                  >
                    <div>Khôi phục chọn lọc</div>
                    <div className="text-[10px] font-normal opacity-80">Chỉ khôi phục truyện được chỉ định</div>
                  </button>
                </div>
              </div>

              {/* Story Checkboxes if selective */}
              {restoreMode === 'selective' && (
                <div className="space-y-1.5 p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] text-xs">
                  <span className="font-semibold block mb-1">Chọn tác phẩm cần khôi phục:</span>
                  {selectedPayload.data.stories.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStoryIds.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStoryIds([...selectedStoryIds, st.id]);
                          } else {
                            setSelectedStoryIds(selectedStoryIds.filter((id) => id !== st.id));
                          }
                        }}
                        className="rounded accent-[#2E6C7B]"
                      />
                      <span>{st.title}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44] text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createSafetyBackup}
                    onChange={(e) => setCreateSafetyBackup(e.target.checked)}
                    className="rounded accent-[#2E6C7B]"
                  />
                  <span>Tự động tạo bản sao lưu an toàn của cơ sở dữ liệu hiện tại trước khi khôi phục (Khuyến nghị)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreKnowledge}
                    onChange={(e) => setRestoreKnowledge(e.target.checked)}
                    className="rounded accent-[#2E6C7B]"
                  />
                  <span>Khôi phục kèm theo Translation Memory, thuật ngữ và quy tắc xưng hô</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Restoring Progress */}
          {step === 'restoring' && (
            <div className="space-y-3 py-6 text-center">
              <RotateCcw className="w-8 h-8 animate-spin mx-auto text-[#2E6C7B] dark:text-[#77CBDA]" />
              <div className="text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                {progressText || 'Đang khôi phục dữ liệu...'}
              </div>
              <div className="w-full bg-[#D7EDF2] dark:bg-[#1F3A44] rounded-full h-2 overflow-hidden max-w-md mx-auto">
                <div
                  className="bg-[#2E6C7B] dark:bg-[#77CBDA] h-2 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Done & Validation Report */}
          {step === 'done' && restoreResults && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Khôi phục thành công!</h4>
                  <p>Dữ liệu đã được kiểm toán và đối chiếu khớp với bản sao lưu.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] space-y-1.5">
                <div className="flex justify-between py-1 border-b border-[#D7EDF2] dark:border-[#1F3A44]">
                  <span>Số tác phẩm đã khôi phục:</span>
                  <span className="font-bold text-[#2E6C7B] dark:text-[#77CBDA]">{restoreResults.restoredStories} tác phẩm ✓</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D7EDF2] dark:border-[#1F3A44]">
                  <span>Số chương truyện:</span>
                  <span className="font-bold text-[#2E6C7B] dark:text-[#77CBDA]">{restoreResults.restoredChapters} chương ✓</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Translation Memory:</span>
                  <span className="font-bold text-[#2E6C7B] dark:text-[#77CBDA]">{restoreResults.restoredTM} mục ✓</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-xl transition-colors"
          >
            {step === 'done' ? 'Đóng' : 'Hủy'}
          </button>

          {step === 'preview' && (
            <button
              onClick={handleExecuteRestore}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tiến hành khôi phục ngay</span>
            </button>
          )}

          {step === 'done' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors"
            >
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
