import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  AlertTriangle,
  GitMerge,
  Smartphone,
  Laptop,
  Check,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { ConflictData } from '../../types';

interface SyncConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ConflictData | null;
  onResolve: (decision: 'keep_local' | 'keep_cloud' | 'merged', mergedText?: string) => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  const { showToast } = useApp();
  const [activeDiffMode, setActiveDiffMode] = useState<'split' | 'merge'>('split');
  const [mergedText, setMergedText] = useState(conflict?.localVersion.text || '');

  if (!isOpen || !conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Xung Đột Đồng Bộ Đa Thiết Bị (Sync Conflict Detected)
              </h3>
              <p className="text-xs text-[#647780]">
                Tác phẩm: <strong>{conflict.storyTitle}</strong> (Chương {conflict.chapterNumber || 1})
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
          <p className="text-xs text-[#647780] leading-relaxed">
            Hệ thống phát hiện bản dịch này đã được chỉnh sửa cùng lúc từ 2 thiết bị khác nhau với mốc thời gian không đồng nhất. Để đảm bảo không làm mất bất kỳ câu chữ nào, vui lòng chọn phương án giải quyết dưới đây:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version Local */}
            <div className="p-4 rounded-xl border-2 border-[#77CBDA] bg-[#F4FBFD] dark:bg-[#172D35]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#2E6C7B] dark:text-[#77CBDA] flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  <span>Bản trên thiết bị hiện tại (Local)</span>
                </span>
                <span className="text-[10px] text-[#647780] font-mono">
                  {new Date(conflict.localVersion.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#0E1A1E] border border-[#D7EDF2] dark:border-[#1F3A44] font-serif text-xs text-[#26343B] dark:text-[#ECF7F9] max-h-48 overflow-y-auto whitespace-pre-wrap">
                {conflict.localVersion.text}
              </div>
              <button
                onClick={() => {
                  onResolve('keep_local');
                  showToast('Đã giữ phiên bản thiết bị này!', 'info');
                  onClose();
                }}
                className="w-full py-2 text-xs font-semibold text-[#2E6C7B] bg-white dark:bg-[#1F3A44] border border-[#77CBDA] rounded-lg hover:bg-[#E8F7FA] transition-colors"
              >
                Giữ phiên bản này (Keep Local)
              </button>
            </div>

            {/* Version Cloud */}
            <div className="p-4 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#647780]" />
                  <span>Bản lưu trên máy chủ đám mây (Cloud)</span>
                </span>
                <span className="text-[10px] text-[#647780] font-mono">
                  {new Date(conflict.cloudVersion.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F4FBFD] dark:bg-[#0E1A1E] border border-[#D7EDF2] dark:border-[#1F3A44] font-serif text-xs text-[#26343B] dark:text-[#ECF7F9] max-h-48 overflow-y-auto whitespace-pre-wrap">
                {conflict.cloudVersion.text}
              </div>
              <button
                onClick={() => {
                  onResolve('keep_cloud');
                  showToast('Đã khôi phục phiên bản từ Cloud!', 'info');
                  onClose();
                }}
                className="w-full py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-lg transition-colors"
              >
                Lấy phiên bản Cloud (Keep Cloud)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
