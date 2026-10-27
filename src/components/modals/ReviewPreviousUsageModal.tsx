import React, { useState } from 'react';
import { ConsistencyWarning } from '../../types';
import { X, AlertTriangle, Check, BookOpen, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface ReviewPreviousUsageModalProps {
  warning: ConsistencyWarning | null;
  onClose: () => void;
  onResolve: (action: 'use_previous' | 'keep_current' | 'create_rule' | 'ignore') => void;
}

export const ReviewPreviousUsageModal: React.FC<ReviewPreviousUsageModalProps> = ({
  warning,
  onClose,
  onResolve,
}) => {
  const [ruleNotes, setRuleNotes] = useState('');
  const [showRuleInput, setShowRuleInput] = useState(false);

  if (!warning) return null;

  const prevChapterNum = (warning.relatedChapters && warning.relatedChapters[0]) || 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Consistency Review Center
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                So sánh bản dịch & Ngữ cảnh trước đây
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-[#E8F7FA] dark:bg-[#172D35] border border-[#77CBDA]/40 text-xs text-[#26343B] dark:text-[#ECF7F9]">
            <p className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA] mb-1">
              {warning.explanation}
            </p>
            <p className="text-[#647780] dark:text-[#C9EAF2]">
              Quy tắc LanAnhArtistry: AI không được tự ý sửa văn bản. Người dịch toàn quyền quyết định xem đây là lỗi dịch hay là thay đổi chủ ý (Intentional Change).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous Occurrence */}
            <div className="p-4 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#647780] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>Chapter {prevChapterNum} (Đã dùng trước đây)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Chuẩn tắc
                </span>
              </div>

              <div>
                <p className="text-[10px] text-[#647780] uppercase font-bold">Nguyên tác:</p>
                <p className="font-serif text-xs text-[#26343B] dark:text-[#ECF7F9] italic mt-0.5">
                  "{warning.original || '师尊，弟子明白了。'}"
                </p>
              </div>

              <div>
                <p className="text-[10px] text-[#647780] uppercase font-bold">Bản dịch đã chốt:</p>
                <p className="font-serif text-sm font-semibold text-[#2E6C7B] dark:text-[#77CBDA] mt-0.5">
                  "{warning.previousTranslation || 'sư tôn'}"
                </p>
              </div>
            </div>

            {/* Current Occurrence */}
            <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chapter {warning.chapterNumber} (Bản dịch hiện tại)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold">
                  Cần đối chiếu
                </span>
              </div>

              <div>
                <p className="text-[10px] text-amber-800/80 dark:text-amber-400 uppercase font-bold">Nguyên tác:</p>
                <p className="font-serif text-xs text-[#26343B] dark:text-[#ECF7F9] italic mt-0.5">
                  "{warning.original || '师尊，徒儿告退。'}"
                </p>
              </div>

              <div>
                <p className="text-[10px] text-amber-800/80 dark:text-amber-400 uppercase font-bold">Bạn vừa dịch là:</p>
                <p className="font-serif text-sm font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                  "{warning.currentTranslation || 'sư phụ'}"
                </p>
              </div>
            </div>
          </div>

          {/* Optional Rule Creation input */}
          {showRuleInput && (
            <div className="p-3.5 rounded-xl border border-[#77CBDA] bg-[#F4FBFD] dark:bg-[#172D35] space-y-2 animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                Ghi chú lý do chuyển biến xưng hô / thuật ngữ (Story Bible Timeline):
              </label>
              <textarea
                rows={2}
                value={ruleNotes}
                onChange={(e) => setRuleNotes(e.target.value)}
                placeholder="Ví dụ: Kể từ Chapter number, Nhân vật A tuyệt giao với sư môn, xưng hô chuyển sang lạnh nhạt..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* 4 Standard Decision Actions */}
        <div className="p-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228] flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => onResolve('ignore')}
            className="px-3 py-1.5 text-xs text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-xl hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors"
          >
            Bỏ qua (Dismiss)
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (!showRuleInput) {
                  setShowRuleInput(true);
                } else {
                  onResolve('create_rule');
                }
              }}
              className="px-3 py-2 text-xs font-semibold border border-[#77CBDA] text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] hover:bg-[#B3EBF2]/50 rounded-xl transition-colors cursor-pointer"
            >
              {showRuleInput ? '✓ Xác nhận Quy tắc Mới' : 'Tạo mốc chuyển đổi mới (New Rule)'}
            </button>

            <button
              onClick={() => onResolve('keep_current')}
              className="px-3.5 py-2 text-xs font-semibold border border-[#D7EDF2] dark:border-[#1F3A44] text-[#26343B] dark:text-[#ECF7F9] bg-white dark:bg-[#122228] hover:bg-[#F4FBFD] rounded-xl transition-colors cursor-pointer"
            >
              Giữ nguyên "{warning.currentTranslation}"
            </button>

            <button
              onClick={() => onResolve('use_previous')}
              className="px-4 py-2 text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Đổi về "{warning.previousTranslation}"</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
