import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Users,
  Brain,
  Download,
} from 'lucide-react';
import { detectLocalDataSummary, syncLocalDataToCloud, exportAllDataAsJSON } from '../../services/db';

interface MigrateDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MigrateDataModal: React.FC<MigrateDataModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, showToast, refreshStories } = useApp();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    storiesCount: 0,
    chaptersCount: 0,
    segmentsCount: 0,
    charactersCount: 0,
    tmCount: 0,
    pronounRulesCount: 0,
    totalSizeEstimatedKb: 0,
  });

  const [migrating, setMigrating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setMigrationDone(false);
      setProgressPercent(0);
      detectLocalDataSummary().then((res) => {
        setSummary(res);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    setMigrating(true);
    setProgressPercent(10);
    setCurrentStepText('Bắt đầu quá trình di chuyển an toàn...');

    try {
      await syncLocalDataToCloud(
        currentUser.id,
        currentUser.displayName,
        (percent, status) => {
          setProgressPercent(percent);
          setCurrentStepText(status);
        }
      );

      setMigrationDone(true);
      await refreshStories();
      showToast('Toàn bộ dữ liệu dịch thuật đã được di chuyển lên đám mây!', 'success');
    } catch (err: any) {
      showToast(`Lỗi di chuyển: ${err.message || 'Lỗi kết nối mạng'}`, 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const json = await exportAllDataAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lananhartistry-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống bản sao lưu JSON cục bộ!', 'success');
    } catch (e) {
      showToast('Không thể tạo file sao lưu', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#B3EBF2]/40 dark:bg-[#77CBDA]/20 text-[#2E6C7B] dark:text-[#77CBDA]">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Di chuyển Dữ liệu lên Đám mây (Migrate Data)
              </h3>
              <p className="text-xs text-[#647780]">
                Chuyển đổi dữ liệu IndexedDB trình duyệt sang Cloud Database & Supabase
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
          {/* Principle Notice */}
          <div className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA] mt-0.5 shrink-0" />
              <div className="text-xs text-[#647780] leading-relaxed">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                  Nguyên tắc bảo vệ dữ liệu tuyệt đối:
                </span>{' '}
                Hệ thống <strong>KHÔNG</strong> xóa dữ liệu IndexedDB trên máy của bạn ngay lập tức. Bản sao lưu cục bộ sẽ được giữ nguyên cho đến khi việc đồng bộ đám mây được xác nhận hoàn toàn.
              </div>
            </div>
          </div>

          {/* Data Scan Summary */}
          {loading ? (
            <div className="py-8 text-center text-xs text-[#647780]">
              <Database className="w-6 h-6 animate-pulse mx-auto mb-2 text-[#2E6C7B] dark:text-[#77CBDA]" />
              Đang quét dữ liệu nội bộ trình duyệt...
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] flex items-center justify-between">
                <span>Dữ liệu phát hiện được trong trình duyệt:</span>
                <span className="text-[11px] font-normal text-[#647780]">
                  Ước tính: ~{summary.totalSizeEstimatedKb} KB
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <div>
                    <div className="font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                      {summary.storiesCount}
                    </div>
                    <div className="text-[11px] text-[#647780]">Bộ truyện</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <div>
                    <div className="font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                      {summary.chaptersCount}
                    </div>
                    <div className="text-[11px] text-[#647780]">Chương truyện</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <div>
                    <div className="font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                      {summary.tmCount}
                    </div>
                    <div className="text-[11px] text-[#647780]">Mục Translation Memory</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <div>
                    <div className="font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                      {summary.charactersCount}
                    </div>
                    <div className="text-[11px] text-[#647780]">Hồ sơ nhân vật</div>
                  </div>
                </div>
              </div>

              {/* Destination Account info */}
              <div className="p-3 rounded-xl bg-[#E8F7FA]/50 dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] text-xs">
                <span className="text-[#647780]">Tài khoản tiếp nhận quyền sở hữu:</span>{' '}
                <strong className="text-[#2E6C7B] dark:text-[#77CBDA]">
                  {currentUser.displayName} ({currentUser.email})
                </strong>
              </div>
            </div>
          )}

          {/* Progress bar when migrating */}
          {(migrating || migrationDone) && (
            <div className="space-y-2 p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                  {currentStepText || 'Đang tiến hành...'}
                </span>
                <span className="font-mono text-[#2E6C7B] dark:text-[#77CBDA]">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-[#D7EDF2] dark:bg-[#1F3A44] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2E6C7B] dark:bg-[#77CBDA] h-2 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {migrationDone && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Di chuyển thành công! Dữ liệu đã an toàn trên máy chủ đám mây.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
          <button
            onClick={handleDownloadBackup}
            className="text-xs text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-1 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file sao lưu (.json)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-xl transition-colors"
            >
              {migrationDone ? 'Đóng' : 'Để sau'}
            </button>
            {!migrationDone && (
              <button
                onClick={handleStartMigration}
                disabled={migrating || loading || summary.storiesCount === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{migrating ? 'Đang tải lên...' : 'Xác nhận di chuyển ngay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
