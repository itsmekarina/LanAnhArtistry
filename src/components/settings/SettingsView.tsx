import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportStoryData, exportAllData, importData } from '../../services/db';
import {
  Settings,
  Download,
  Upload,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  Check,
  RefreshCw,
  User,
  Globe,
  Lock,
  Cloud,
} from 'lucide-react';
import { BackupSyncView } from './BackupSyncView';
import { RestoreBackupModal } from '../modals/RestoreBackupModal';

export const SettingsView: React.FC = () => {
  const {
    activeStory,
    stories,
    theme,
    toggleTheme,
    refreshStories,
    showToast,
    currentUser,
    setShowProfileModal,
    setShowAuthModal,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'backup_sync' | 'storage' | 'account'>('backup_sync');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportCurrentStory = async () => {
    if (!activeStory) return;
    try {
      const data = await exportStoryData(activeStory.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LanAnhArtistry_${activeStory.title.replace(/\s+/g, '_')}_Backup.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Đã xuất dữ liệu truyện "${activeStory.title}"`, 'success');
    } catch (e: any) {
      alert('Lỗi xuất dữ liệu: ' + e.message);
    }
  };

  const handleExportFullBackup = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LanAnhArtistry_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất toàn bộ dữ liệu sao lưu (Full Backup)!', 'success');
    } catch (e: any) {
      alert('Lỗi xuất sao lưu: ' + e.message);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importData(parsed);
      await refreshStories();
      showToast(`Đã khôi phục thành công ${result.storiesCount} truyện!`, 'success');
    } catch (err: any) {
      alert('Lỗi nhập dữ liệu: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
          Cài đặt & An toàn Dữ liệu (Settings & Safety)
        </h1>
        <p className="text-xs text-[#647780] mt-0.5">
          Quản lý tài khoản dịch giả, đồng bộ Google Drive, tùy chỉnh giao diện Pastel Blue và sao lưu an toàn toàn bộ dữ liệu.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('backup_sync')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
            activeTab === 'backup_sync'
              ? 'bg-[#2E6C7B] text-white shadow-xs'
              : 'text-[#647780] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Backup & Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
            activeTab === 'storage'
              ? 'bg-[#2E6C7B] text-white shadow-xs'
              : 'text-[#647780] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dữ liệu nội bộ & Xuất JSON</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
            activeTab === 'account'
              ? 'bg-[#2E6C7B] text-white shadow-xs'
              : 'text-[#647780] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Tài khoản & Giao diện</span>
        </button>
      </div>

      {activeTab === 'backup_sync' && (
        <BackupSyncView onOpenRestoreModal={() => setShowRestoreModal(true)} />
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Architecture Overview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                Hạ tầng lưu trữ IndexedDB (Client-Side Persistence)
              </h3>
            </div>

            <p className="text-[#647780] leading-relaxed">
              LanAnhArtistry sử dụng cơ sở dữ liệu IndexedDB chuẩn trình duyệt với 13 kho dữ liệu độc lập:
              <code className="text-[#2E6C7B] dark:text-[#77CBDA] font-mono ml-1">
                stories, chapters, segments, translation_memory, pronoun_rules, characters, relationships, story_bible, plot_events, warnings, versions, global_memory, story_files
              </code>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44]">
                <p className="text-[#647780] text-[10px] uppercase font-bold">Tổng số truyện</p>
                <p className="text-lg font-bold text-[#26343B] dark:text-[#ECF7F9] mt-0.5">{stories.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44]">
                <p className="text-[#647780] text-[10px] uppercase font-bold">Cơ chế lưu</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">Autosave 800ms</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44]">
                <p className="text-[#647780] text-[10px] uppercase font-bold">Nguyên tác</p>
                <p className="text-sm font-bold text-[#26343B] dark:text-[#ECF7F9] mt-0.5">Bảo toàn vĩnh viễn</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44]">
                <p className="text-[#647780] text-[10px] uppercase font-bold">AI Autocorrect</p>
                <p className="text-sm font-bold text-rose-600 mt-0.5">Tắt hoàn toàn</p>
              </div>
            </div>
          </div>

          {/* Export & Import */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-5 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <FileJson className="w-5 h-5 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                Xuất & Nhập tệp sao lưu JSON (Backup & Restore)
              </h3>
            </div>

            <p className="text-[#647780] leading-relaxed">
              Tệp sao lưu chứa đầy đủ: Nguyên tác, Bản dịch, Phân đoạn (Segments), Translation Memory, Hồ sơ nhân vật, Quy tắc xưng hô, Story Bible, Dòng sự kiện và Lịch sử phiên bản.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Export Current Story */}
              <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                    Xuất truyện hiện tại ({activeStory?.title || 'Chưa chọn'})
                  </h4>
                  <p className="text-[#647780] mt-1">
                    Tải xuống trọn bộ dữ liệu của riêng bộ truyện này dưới định dạng JSON.
                  </p>
                </div>
                <button
                  onClick={handleExportCurrentStory}
                  disabled={!activeStory}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E6C7B] hover:bg-[#1A4954] text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất JSON truyện này</span>
                </button>
              </div>

              {/* Export Full Backup */}
              <div className="p-4 rounded-2xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                    Xuất toàn bộ hệ thống (Full System Backup)
                  </h4>
                  <p className="text-[#647780] mt-1">
                    Sao lưu tất cả {stories.length} bộ truyện và Translation Memory toàn cục.
                  </p>
                </div>
                <button
                  onClick={handleExportFullBackup}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#26343B] hover:bg-black text-white dark:bg-[#172D35] dark:hover:bg-[#1F3A44] font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Full Backup</span>
                </button>
              </div>
            </div>

            {/* Import JSON */}
            <div className="pt-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                  Khôi phục từ tệp JSON (Restore Data)
                </h4>
                <p className="text-[#647780]">
                  Chọn tệp sao lưu `.json` đã tải về trước đây để khôi phục vào hệ thống.
                </p>
              </div>

              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] font-semibold cursor-pointer hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors">
                <Upload className="w-4 h-4 text-[#2E6C7B]" />
                <span>{importing ? 'Đang khôi phục...' : 'Chọn tệp JSON để Restore'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* User Account Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA] border border-[#77CBDA] flex items-center justify-center font-bold text-base shadow-xs">
                  {currentUser?.displayName
                    ? currentUser.displayName
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'LA'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                    Tài khoản đang đăng nhập
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#26343B] dark:text-[#ECF7F9]">
                    {currentUser?.displayName || 'Translator'}
                  </h3>
                  <p className="text-xs text-[#647780]">{currentUser?.email || 'artistrytranslator@example.com'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E8F7FA] hover:bg-[#B3EBF2]/60 text-[#2E6C7B] dark:bg-[#172D35] dark:hover:bg-[#1F3A44] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44] transition-colors cursor-pointer"
                >
                  Hồ sơ & Quyền riêng tư
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Đổi tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Theme & Display Preferences */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-between text-xs shadow-xs">
            <div>
              <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                Giao diện Pastel Blue (Dark / Light Mode)
              </h3>
              <p className="text-[#647780] mt-0.5">
                Tông màu xanh pastel dịu mát, thanh tao, bảo vệ thị lực cho dịch giả làm việc lâu giờ.
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] font-semibold text-[#2E6C7B] dark:text-[#77CBDA] cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2E6C7B]" />}
              <span>{theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng (Pastel Blue)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Restore Modal */}
      {showRestoreModal && (
        <RestoreBackupModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          onRestoreSuccess={() => refreshStories()}
        />
      )}

    </div>
  );
};
