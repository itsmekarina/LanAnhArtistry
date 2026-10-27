import React, { useState, useEffect } from 'react';
import { TranslationVersion } from '../../types';
import { getVersions, saveVersion } from '../../services/db';
import { X, History, RotateCcw, Clock, ArrowRight, Check, Plus } from 'lucide-react';

interface VersionHistoryModalProps {
  chapterId: string;
  chapterNumber: number;
  currentTranslation: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionText: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  chapterId,
  chapterNumber,
  currentTranslation,
  isOpen,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<TranslationVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<TranslationVersion | null>(null);

  useEffect(() => {
    if (!isOpen || !chapterId) return;

    const loadVersions = async () => {
      const list = await getVersions(chapterId);
      setVersions(list);
      if (list.length > 0) {
        setSelectedVersion(list[0]);
      }
    };

    loadVersions();
  }, [isOpen, chapterId]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async () => {
    const nextVer = versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;
    const newVersion: TranslationVersion = {
      id: `ver-${chapterId}-${Date.now()}`,
      chapterId,
      versionNumber: nextVer,
      translationText: currentTranslation,
      summary: `Bản lưu thủ công v${nextVer}`,
      savedAt: new Date().toISOString(),
      author: 'Translator',
    };
    await saveVersion(newVersion);
    const updated = await getVersions(chapterId);
    setVersions(updated);
    setSelectedVersion(newVersion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Version Control
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Lịch sử phiên bản Chapter {chapterNumber}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo bản lưu hiện tại</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List */}
          <div className="w-72 border-r border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228] p-4 overflow-y-auto space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#647780] mb-2">
              Các mốc phiên bản ({versions.length})
            </h3>
            {versions.map((ver) => (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedVersion?.id === ver.id
                    ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold ring-1 ring-[#77CBDA]'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Phiên bản v{ver.versionNumber}</span>
                  <span className="text-[10px] text-[#647780]">
                    {new Date(ver.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#647780] mt-1 line-clamp-1">{ver.summary}</p>
              </div>
            ))}
          </div>

          {/* Version Diff / Preview */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                      Chi tiết phiên bản v{selectedVersion.versionNumber}
                    </h3>
                    <p className="text-xs text-[#647780]">
                      Lưu lúc: {new Date(selectedVersion.savedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onRestore(selectedVersion.translationText);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục về bản này</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] font-serif text-sm leading-relaxed whitespace-pre-line text-[#26343B] dark:text-[#ECF7F9]">
                  {selectedVersion.translationText || '(Văn bản rỗng)'}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#647780]">Chọn một phiên bản bên trái để xem nội dung.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
