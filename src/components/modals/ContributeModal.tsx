import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Send,
  Brain,
  Tag,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { cloudSync } from '../../services/cloudSync';
import { ContributionType } from '../../types';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: {
    type?: ContributionType;
    original?: string;
    proposedValue?: string;
    context?: string;
    storyTitle?: string;
    storyId?: string;
  };
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  initialItem,
}) => {
  const { currentUser, showToast } = useApp();

  const [type, setType] = useState<ContributionType>('translation_memory');
  const [original, setOriginal] = useState('');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialItem) {
      setType(initialItem.type || 'translation_memory');
      setOriginal(initialItem.original || '');
      setProposedValue(initialItem.proposedValue || '');
      setReason(initialItem.context || '');
      setEvidence('');
    }
  }, [isOpen, initialItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!original.trim() || !proposedValue.trim()) {
      showToast('Vui lòng điền nguyên tác và đề xuất dịch', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await cloudSync.submitContribution(
        {
          contributorId: currentUser.id,
          contributorName: currentUser.displayName,
          contributionType: type,
          original: original.trim(),
          proposedValue: proposedValue.trim(),
          reason: reason.trim(),
          evidence: evidence.trim(),
          sourceStoryId: initialItem?.storyId || '',
          sourceStoryTitle: initialItem?.storyTitle || '',
        },
        currentUser.id,
        currentUser.displayName
      );

      if (res) {
        showToast('Đã gửi đề xuất đóng góp tri thức! Quản trị viên sẽ sớm xét duyệt.', 'success');
        onClose();
      } else {
        showToast('Lỗi khi gửi đóng góp', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi gửi đóng góp', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#B3EBF2]/40 dark:bg-[#77CBDA]/20 text-[#2E6C7B] dark:text-[#77CBDA]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Đóng góp vào Kho Tri Thức Cộng Đồng
              </h3>
              <p className="text-xs text-[#647780]">
                Chia sẻ Translation Memory, thuật ngữ hoặc đại từ dịch chuẩn
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Privacy Guarantee */}
          <div className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA] mt-0.5 shrink-0" />
              <div className="text-xs text-[#647780] leading-relaxed">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                  Bảo mật tác phẩm riêng tư:
                </span>{' '}
                Hệ thống chỉ chia sẻ thuật ngữ hoặc cặp câu dịch bạn chọn. Nội dung bản thảo, cốt truyện và ghi chú cá nhân của bạn <strong>hoàn toàn được giữ kín</strong>.
              </div>
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Loại tri thức đóng góp
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('translation_memory')}
                className={`py-2 px-2.5 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'translation_memory'
                    ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA]'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:border-[#77CBDA]'
                }`}
              >
                Translation Memory
              </button>
              <button
                type="button"
                onClick={() => setType('terminology')}
                className={`py-2 px-2.5 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'terminology'
                    ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA]'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:border-[#77CBDA]'
                }`}
              >
                Thuật ngữ (Terminology)
              </button>
              <button
                type="button"
                onClick={() => setType('vocabulary')}
                className={`py-2 px-2.5 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'vocabulary'
                    ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA]'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:border-[#77CBDA]'
                }`}
              >
                Từ vựng (Vocabulary)
              </button>
            </div>
          </div>

          {/* Original Text */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
              Nguyên tác (Từ / Cụm từ / Mẫu câu gốc)
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 师兄, 白月光, 魔尊..."
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA]"
            />
          </div>

          {/* Proposed Translation */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
              Bản dịch tiếng Việt đề xuất
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: sư huynh, ánh trăng sáng, Ma Tôn..."
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA]"
            />
          </div>

          {/* Reason / Context */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
              Ngữ cảnh & Lý do sử dụng (Context & Rationale)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Xưng hô sư muội gọi đệ tử nam nhập môn trước, sắc thái trang trọng hoặc thân thiết..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA]"
            />
          </div>

          {/* Evidence / Example sentence */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
              Dẫn chứng / Câu ví dụ (Evidence / Example)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: '师兄，你等等我。' → 'Sư huynh, huynh đợi muội một chút.'"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang gửi...' : 'Gửi đề xuất xét duyệt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
