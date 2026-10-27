import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  HardDrive,
  FileText,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  RotateCcw,
  Clock,
  Layers,
  Shield,
  FolderOpen,
  ArrowRight,
  Database,
  Trash2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import {
  signInWithGoogleDrive,
  disconnectGoogleDrive,
  isGoogleConnected,
  getCachedGoogleUser,
  subscribeGoogleAuth,
} from '../../services/googleAuth';
import {
  ensureAppFolders,
  DriveFoldersMap,
  getDriveStorageQuota,
} from '../../services/googleDrive';
import { backupEngine } from '../../services/backupEngine';
import { BackupRecord } from '../../types';

interface BackupSyncViewProps {
  onOpenRestoreModal: () => void;
}

export const BackupSyncView: React.FC<BackupSyncViewProps> = ({ onOpenRestoreModal }) => {
  const { currentUser, showToast, refreshStories } = useApp();

  const [connected, setConnected] = useState<boolean>(() => isGoogleConnected());
  const [googleUser, setGoogleUser] = useState<any>(() => getCachedGoogleUser());
  const [connecting, setConnecting] = useState(false);
  const [folders, setFolders] = useState<DriveFoldersMap | null>(null);
  const [quota, setQuota] = useState<{ limitBytes: number; usageBytes: number; userEmail: string } | null>(null);

  // Backup In-Progress State
  const [backingUp, setBackingUp] = useState(false);
  const [backupTypeRunning, setBackupTypeRunning] = useState<'full' | 'incremental' | 'raw' | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [lastBackupResult, setLastBackupResult] = useState<any>(null);

  // Backup History
  const [history, setHistory] = useState<BackupRecord[]>([]);

  // Auto Backup Settings
  const [autoSettings, setAutoSettings] = useState(() => backupEngine.getAutoBackupSettings());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() =>
    localStorage.getItem('lananh_last_gdrive_backup')
  );

  useEffect(() => {
    const unsub = subscribeGoogleAuth((isConnected, user) => {
      setConnected(isConnected);
      setGoogleUser(user);
      if (isConnected) {
        loadDriveInfo();
      }
    });

    loadHistory();
    return unsub;
  }, [currentUser.id]);

  const loadDriveInfo = async () => {
    try {
      const f = await ensureAppFolders();
      setFolders(f);
      const q = await getDriveStorageQuota();
      if (q) setQuota(q);
    } catch (e) {
      console.warn('Could not load drive folders info:', e);
    }
  };

  const loadHistory = () => {
    const records = backupEngine.getLocalBackupRecords(currentUser.id);
    setHistory(records);
    setLastBackupTime(localStorage.getItem('lananh_last_gdrive_backup'));
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        showToast('Kết nối Google Drive thành công!', 'success');
        await loadDriveInfo();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi kết nối Google Drive', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Bạn có chắc muốn ngắt kết nối Google Drive? Các tệp đã sao lưu vẫn được giữ nguyên an toàn trên Drive của bạn.')) {
      await disconnectGoogleDrive();
      setFolders(null);
      setQuota(null);
      showToast('Đã ngắt kết nối Google Drive', 'info');
    }
  };

  const handleFullBackupNow = async () => {
    if (!connected) {
      showToast('Vui lòng kết nối Google Drive trước khi sao lưu.', 'warning');
      return;
    }

    setBackingUp(true);
    setBackupTypeRunning('full');
    setProgressPercent(10);
    setProgressStep('Đang khởi tạo phiên sao lưu toàn diện...');
    setLastBackupResult(null);

    try {
      const res = await backupEngine.createFullGoogleDriveBackup(
        currentUser.id,
        currentUser.displayName || 'Translator',
        {
          includeDocx: autoSettings.includeDocx,
          onProgress: (pct, step) => {
            setProgressPercent(pct);
            setProgressStep(step);
          },
        }
      );

      setLastBackupResult(res);
      loadHistory();
      showToast('Sao lưu toàn diện (Full Backup) lên Google Drive thành công!', 'success');
    } catch (err: any) {
      showToast(`Sao lưu thất bại: ${err.message}`, 'error');
    } finally {
      setBackingUp(false);
      setBackupTypeRunning(null);
    }
  };

  const handleIncrementalBackupNow = async () => {
    if (!connected) {
      showToast('Vui lòng kết nối Google Drive trước.', 'warning');
      return;
    }

    setBackingUp(true);
    setBackupTypeRunning('incremental');
    setProgressPercent(15);
    setProgressStep('Đang rà soát các thay đổi gần đây...');

    try {
      const res = await backupEngine.createIncrementalGoogleDriveBackup(currentUser.id, (pct, step) => {
        setProgressPercent(pct);
        setProgressStep(step);
      });

      loadHistory();
      showToast(`Sao lưu gia tăng thành công (${res.backupRecord.storyCount} truyện cập nhật)`, 'success');
    } catch (err: any) {
      showToast(`Sao lưu gia tăng thất bại: ${err.message}`, 'error');
    } finally {
      setBackingUp(false);
      setBackupTypeRunning(null);
    }
  };

  const handleRawExportNow = async () => {
    if (!connected) {
      showToast('Vui lòng kết nối Google Drive trước.', 'warning');
      return;
    }

    setBackingUp(true);
    setBackupTypeRunning('raw');
    setProgressPercent(20);
    setProgressStep('Đang xuất các tệp TXT và CSV lên Drive/Exports...');

    try {
      const fileIds = await backupEngine.uploadRawExportsToDrive(currentUser.id, undefined, (pct, text) => {
        setProgressPercent(pct);
        setProgressStep(text);
      });
      showToast(`Đã xuất ${fileIds.length} tệp dữ liệu gốc lên Google Drive!`, 'success');
    } catch (err: any) {
      showToast(`Lỗi xuất dữ liệu gốc: ${err.message}`, 'error');
    } finally {
      setBackingUp(false);
      setBackupTypeRunning(null);
    }
  };

  const handleUpdateAutoSettings = (updates: Partial<typeof autoSettings>) => {
    const next = { ...autoSettings, ...updates };
    setAutoSettings(next);
    backupEngine.saveAutoBackupSettings(next);
    showToast('Đã lưu cấu hình tự động sao lưu', 'success');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Google Drive Account Connection Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F7FA] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.25z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                  Google Drive Backup & Sync
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                    connected
                      ? 'bg-[#E8F7FA] text-[#2E6C7B] border border-[#77CBDA] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connected ? 'bg-[#2E6C7B] dark:bg-emerald-400 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              <h2 className="font-serif font-bold text-lg text-[#26343B] dark:text-[#ECF7F9] mt-0.5">
                {connected && googleUser
                  ? `Google Drive (${googleUser.email || googleUser.displayName || 'Dịch giả Translator'})`
                  : 'Kết nối Google Drive'}
              </h2>

              <p className="text-xs text-[#647780] mt-0.5">
                {connected
                  ? 'Quyền tối thiểu `drive.file`: Chỉ đọc và ghi các tệp do LanAnhArtistry tạo trong thư mục riêng.'
                  : 'Sử dụng Google OAuth 2.0 an toàn để sao lưu nguyên tác, bản dịch và Translation Memory.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {connected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={loadDriveInfo}
                  className="p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] transition-colors cursor-pointer"
                  title="Làm mới trạng thái Drive"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                >
                  Disconnect Google Drive
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Connect Google Drive</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators & Folder Mappings */}
        {connected && (
          <div className="pt-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#647780]">Thời điểm sao lưu gần nhất</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#26343B] dark:text-[#ECF7F9]">
                  <Clock className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>
                    {lastBackupTime
                      ? new Date(lastBackupTime).toLocaleString('vi-VN')
                      : 'Chưa có bản sao lưu nào'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#647780]">Trạng thái đồng bộ</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Sao lưu an toàn (Ready)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-1">
                <p className="text-[10px] uppercase font-bold text-[#647780]">Thư mục gốc ứng dụng</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA] truncate">
                    LanAnhArtistry/
                  </span>
                  {folders?.rootId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${folders.rootId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2E6C7B] hover:text-[#1A4954] dark:text-[#77CBDA] flex items-center gap-0.5 text-[11px] font-medium"
                    >
                      <span>Mở</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Folder Structure Representation */}
            {folders && (
              <div className="p-3.5 rounded-2xl bg-[#E8F7FA]/60 dark:bg-[#172D35]/20 border border-[#D7EDF2] dark:border-[#1F3A44] text-xs">
                <p className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA] mb-2 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Cấu trúc lưu trữ định danh trên Google Drive của bạn:</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-[#647780]">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
                    📁 Backups/ (JSON & Manifest)
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
                    📁 Stories/ (DOCX, Files)
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
                    📁 Exports/ (TXT, CSV)
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
                    📁 Restore/ (Snapshot)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Manual Backup Actions & Live Progress */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
              Thao tác sao lưu tức thì (Manual Backup)
            </h3>
            <p className="text-xs text-[#647780]">
              Chọn hình thức sao lưu phù hợp để bảo vệ dữ liệu lên đám mây Google Drive ngay lập tức.
            </p>
          </div>

          <button
            onClick={onOpenRestoreModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E8F7FA] hover:bg-[#B3EBF2]/60 text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[ Phục hồi dữ liệu / Restore ]</span>
          </button>
        </div>

        {/* Progress bar when backing up */}
        {backingUp && (
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#77CBDA] space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {progressStep || 'Đang tiến hành sao lưu...'}
              </span>
              <span className="font-bold text-[#2E6C7B] dark:text-[#77CBDA]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#D7EDF2] dark:bg-[#1F3A44] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2E6C7B] dark:bg-[#77CBDA] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#647780]">
              Sử dụng Resumable Upload an toàn để tránh mất mát dữ liệu kể cả khi đường truyền mạng gián đoạn.
            </p>
          </div>
        )}

        {/* Success Banner */}
        {lastBackupResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">✓ Sao lưu hoàn tất thành công!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Đã tải lên: <b>{lastBackupResult.backupRecord.fileName}</b> ({formatFileSize(lastBackupResult.backupRecord.fileSize)})
                • {lastBackupResult.backupRecord.storyCount} truyện • {lastBackupResult.backupRecord.chapterCount} chương • {lastBackupResult.backupRecord.translationMemoryCount} mục TM.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TYPE A: Full Backup */}
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E6C7B] dark:text-[#77CBDA]">
                <FileJson className="w-4 h-4" />
                <span>TYPE A — FULL BACKUP</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                Toàn bộ cơ sở dữ liệu
              </h4>
              <p className="text-xs text-[#647780]">
                Tạo tệp JSON chuẩn hóa kèm Manifest và DOCX trực quan, chứa trọn vẹn truyện, chương, TM, thuật ngữ, Story Bible và dòng thời gian.
              </p>
            </div>

            <button
              onClick={handleFullBackupNow}
              disabled={backingUp || !connected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E6C7B] hover:bg-[#1A4954] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Cloud className="w-4 h-4" />
              <span>[ Backup Now — Sao lưu ngay ]</span>
            </button>
          </div>

          {/* Incremental Backup */}
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E6C7B] dark:text-[#77CBDA]">
                <RefreshCw className="w-4 h-4" />
                <span>INCREMENTAL BACKUP</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                Sao lưu gia tăng thay đổi
              </h4>
              <p className="text-xs text-[#647780]">
                Chỉ rà soát và tải lên các bản ghi mới hoặc vừa chỉnh sửa kể từ lần sao lưu gần nhất để tiết kiệm dung lượng và thời gian.
              </p>
            </div>

            <button
              onClick={handleIncrementalBackupNow}
              disabled={backingUp || !connected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#26343B] hover:bg-black text-white dark:bg-[#172D35] dark:hover:bg-[#1F3A44] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Layers className="w-4 h-4" />
              <span>Sao lưu gia tăng (Incremental)</span>
            </button>
          </div>

          {/* TYPE C: Raw Exports */}
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E6C7B] dark:text-[#77CBDA]">
                <FileSpreadsheet className="w-4 h-4" />
                <span>TYPE C — RAW EXPORTS</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                Xuất tệp thô TXT & CSV
              </h4>
              <p className="text-xs text-[#647780]">
                Xuất các tệp độc lập (Story_Original.txt, Story_Translation.txt, Translation_Memory.csv, Characters.csv, Pronouns.csv) lên Drive/Exports.
              </p>
            </div>

            <button
              onClick={handleRawExportNow}
              disabled={backingUp || !connected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Xuất TXT & CSV sang Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Automatic Backup Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#2E6C7B] dark:text-[#77CBDA]" />
          <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
            Cấu hình tự động sao lưu (Automatic Backup Settings)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          {/* Frequency & Toggle */}
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#26343B] dark:text-[#ECF7F9] block text-sm">
                  Automatic Backup
                </span>
                <span className="text-[11px] text-[#647780]">
                  Tự động sao lưu định kỳ dữ liệu lên Google Drive
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSettings.enabled}
                  onChange={(e) => handleUpdateAutoSettings({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#2E6C7B]"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
              <label className="block text-[#647780] mb-1 font-medium text-xs">
                Frequency (Tần suất sao lưu):
              </label>
              <select
                value={autoSettings.frequency}
                disabled={!autoSettings.enabled}
                onChange={(e) => handleUpdateAutoSettings({ frequency: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA] disabled:opacity-50 font-medium"
              >
                <option value="daily">Daily</option>
                <option value="3days">Every 3 days</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Safety Check Before Major Operations */}
          <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-bold text-[#26343B] dark:text-[#ECF7F9] block">
                  Tự động sao lưu trước thao tác quan trọng
                </span>
                <span className="text-[11px] text-[#647780]">
                  Tự động lưu bản snapshot trước khi xóa truyện, trước khi nhập dữ liệu lớn hoặc trước khi phục hồi.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSettings.backupBeforeMajorOps}
                onChange={(e) => handleUpdateAutoSettings({ backupBeforeMajorOps: e.target.checked })}
                className="w-4 h-4 rounded text-[#2E6C7B] focus:ring-[#77CBDA] shrink-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
              <div>
                <span className="font-bold text-[#26343B] dark:text-[#ECF7F9] block">
                  Đính kèm bản DOCX tài liệu đọc
                </span>
                <span className="text-[11px] text-[#647780]">
                  Sinh thêm tệp Word (.docx) chứa nguyên tác và bản dịch song song dễ đọc cho con người.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSettings.includeDocx}
                onChange={(e) => handleUpdateAutoSettings({ includeDocx: e.target.checked })}
                className="w-4 h-4 rounded text-[#2E6C7B] focus:ring-[#77CBDA] shrink-0"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4. Backup History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
              Lịch sử sao lưu (Backup History)
            </h3>
            <p className="text-xs text-[#647780]">
              Danh sách các bản sao lưu đã được lưu trữ an toàn kèm mã kiểm tra tính toàn vẹn (Checksum).
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA]">
            {history.length} bản sao lưu
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#647780] space-y-2">
            <CloudOff className="w-8 h-8 mx-auto text-[#77CBDA] opacity-60" />
            <p>Chưa có bản ghi sao lưu nào.</p>
            <p className="text-[11px]">Bấm "[ Backup Now ]" bên trên để tạo bản sao lưu đầu tiên lên Google Drive.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] font-semibold">
                  <th className="pb-3">Thời gian</th>
                  <th className="pb-3">Loại</th>
                  <th className="pb-3">Dung lượng</th>
                  <th className="pb-3">Nội dung</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/40 transition-colors">
                    <td className="py-3 font-medium text-[#26343B] dark:text-[#ECF7F9]">
                      {new Date(record.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                          record.backupType === 'full'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {record.backupType}
                      </span>
                    </td>
                    <td className="py-3 text-[#647780] font-mono">
                      {formatFileSize(record.fileSize)}
                    </td>
                    <td className="py-3 text-[#647780]">
                      {record.storyCount} truyện • {record.chapterCount} chương
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Thành công</span>
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.googleDriveFileId && (
                          <a
                            href={`https://drive.google.com/file/d/${record.googleDriveFileId}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-[#2E6C7B] hover:bg-[#E8F7FA] dark:text-[#77CBDA] dark:hover:bg-[#172D35] transition-colors"
                            title="Mở trên Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={onOpenRestoreModal}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#E8F7FA] hover:bg-[#B3EBF2]/60 text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] transition-colors cursor-pointer"
                        >
                          Khôi phục
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
