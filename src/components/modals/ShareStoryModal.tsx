import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Story, StoryPrivacyLevel, StorySharingPermissions } from '../../types';
import { saveStory, regenerateStoryShareToken } from '../../services/db';
import {
  X,
  Share2,
  Lock,
  Globe,
  Link2,
  Brain,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
}

export const ShareStoryModal: React.FC<ShareStoryModalProps> = ({ isOpen, onClose, story }) => {
  const { refreshStories, showToast, openSharedStory } = useApp();

  const [privacy, setPrivacy] = useState<StoryPrivacyLevel>(story.privacy || 'private');
  const [permissions, setPermissions] = useState<StorySharingPermissions>({
    showOriginal: story.sharingPermissions?.showOriginal ?? false,
    showTranslation: story.sharingPermissions?.showTranslation ?? true,
    showSummary: story.sharingPermissions?.showSummary ?? true,
    showCharacters: story.sharingPermissions?.showCharacters ?? true,
    showStoryBible: story.sharingPermissions?.showStoryBible ?? false,
    showPlotTimeline: story.sharingPermissions?.showPlotTimeline ?? true,
    showTranslationMemory: story.sharingPermissions?.showTranslationMemory ?? true,
    showTerminology: story.sharingPermissions?.showTerminology ?? true,
    showPronouns: story.sharingPermissions?.showPronouns ?? true,
  });

  const [shareToken, setShareToken] = useState<string>(story.shareToken || '');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}/#share=${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('✓ Đã sao chép liên kết chia sẻ vào khay nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateToken = async () => {
    if (!window.confirm('Tạo liên kết mới sẽ vô hiệu hóa tất cả các liên kết chia sẻ cũ. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const newToken = await regenerateStoryShareToken(story.id);
      setShareToken(newToken);
      showToast('Đã cấp lại mã liên kết chia sẻ an toàn mới.', 'info');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const togglePermission = (key: keyof StorySharingPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: Story = {
        ...story,
        privacy,
        shareToken,
        sharingPermissions: permissions,
        updatedAt: new Date().toISOString(),
      };
      await saveStory(updated);
      await refreshStories();
      showToast(`Đã cập nhật quyền chia sẻ cho "${story.title}"`, 'success');
      onClose();
    } catch (e: any) {
      showToast('Lỗi lưu quyền chia sẻ: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#F4FBFD] dark:bg-[#172D35] border-b border-[#D7EDF2] dark:border-[#1F3A44]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA] flex items-center justify-center border border-[#77CBDA] shadow-xs">
              <Share2 className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Story Privacy & Sharing
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9] truncate max-w-md">
                {story.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          
          {/* Section 1: Privacy Levels */}
          <div>
            <label className="block text-xs font-bold text-[#26343B] dark:text-[#ECF7F9] uppercase tracking-wider mb-2">
              1. Cấp độ bảo mật (Privacy Level)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1: Private */}
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  privacy === 'private'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] ring-2 ring-[#77CBDA]/40'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD] dark:hover:bg-[#122228]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9]">
                    🔒 Riêng tư (Private)
                  </span>
                </div>
                <p className="text-[11px] text-[#647780]">
                  Chỉ mình bạn truy cập và chỉnh sửa bộ truyện này. Mặc định hệ thống.
                </p>
              </button>

              {/* Option 2: Anyone with link */}
              <button
                type="button"
                onClick={() => setPrivacy('link_only')}
                className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  privacy === 'link_only'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] ring-2 ring-[#77CBDA]/40'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD] dark:hover:bg-[#122228]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9]">
                    🔗 Ai có link (Link Only)
                  </span>
                </div>
                <p className="text-[11px] text-[#647780]">
                  Không xuất hiện trong tìm kiếm. Chỉ người có liên kết bí mật mới truy cập được.
                </p>
              </button>

              {/* Option 3: Public Vocabulary / Memory Only */}
              <button
                type="button"
                onClick={() => setPrivacy('public_memory_only')}
                className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  privacy === 'public_memory_only'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] ring-2 ring-[#77CBDA]/40'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD] dark:hover:bg-[#122228]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9]">
                    🧠 Public Language Memory
                  </span>
                </div>
                <p className="text-[11px] text-[#647780]">
                  Bảo mật bản dịch và nội dung; chỉ chia sẻ kho từ vựng và đại từ cho cộng đồng.
                </p>
              </button>

              {/* Option 4: Public */}
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  privacy === 'public'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] ring-2 ring-[#77CBDA]/40'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD] dark:hover:bg-[#122228]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9]">
                    🌎 Công khai (Public Story)
                  </span>
                </div>
                <p className="text-[11px] text-[#647780]">
                  Mọi độc giả và dịch giả đều có thể tìm thấy trên thư viện LanAnhArtistry.
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Share Link (if link_only or public) */}
          {(privacy === 'link_only' || privacy === 'public') && (
            <div className="p-4 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>Liên kết chia sẻ bảo mật (Share Link)</span>
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  disabled={isRegenerating}
                  className="text-[11px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-1"
                  title="Tạo lại token mới và vô hiệu hóa link cũ"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Cấp lại mã (Regenerate)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] font-mono select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Granular Permissions (Only for Public or Link_only) */}
          {(privacy === 'public' || privacy === 'link_only') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#26343B] dark:text-[#ECF7F9] uppercase tracking-wider">
                  2. Phân quyền hiển thị chi tiết (Granular Permissions)
                </label>
                <span className="text-[11px] text-[#647780]">
                  Không mặc định công khai tất cả
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'showTranslation' as const,
                    label: 'Bản dịch tiếng Việt (Show Translation)',
                    desc: 'Người xem có thể đọc các chương đã dịch',
                  },
                  {
                    key: 'showOriginal' as const,
                    label: 'Văn bản gốc (Show Original Text)',
                    desc: 'Cho phép so sánh song ngữ câu gốc (Trung/Anh)',
                  },
                  {
                    key: 'showSummary' as const,
                    label: 'Tóm tắt chương (Chapter Summaries)',
                    desc: 'Hiển thị bản tóm tắt diễn biến ngắn gọn',
                  },
                  {
                    key: 'showCharacters' as const,
                    label: 'Danh sách nhân vật (Characters)',
                    desc: 'Hiển thị hồ sơ nhân vật và phe phái',
                  },
                  {
                    key: 'showPronouns' as const,
                    label: 'Quy tắc xưng hô (Pronoun Conventions)',
                    desc: 'Hiển thị cách gọi nhau giữa các nhân vật',
                  },
                  {
                    key: 'showTerminology' as const,
                    label: 'Thuật ngữ truyện (Story Terminology)',
                    desc: 'Các chiêu thức, pháp bảo, địa danh',
                  },
                  {
                    key: 'showTranslationMemory' as const,
                    label: 'Bộ nhớ dịch (Translation Memory)',
                    desc: 'Cho phép người khác tham khảo từ điển câu',
                  },
                  {
                    key: 'showStoryBible' as const,
                    label: 'Story Bible & Worldbuilding (Nhạy cảm)',
                    desc: 'Thiết lập thế giới, bí mật và quy tắc cốt truyện',
                  },
                  {
                    key: 'showPlotTimeline' as const,
                    label: 'Dòng thời gian sự kiện (Plot Timeline)',
                    desc: 'Trục sự kiện xuyên suốt các chương',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer select-none transition-all ${
                      permissions[item.key]
                        ? 'border-[#77CBDA] bg-[#F4FBFD] dark:bg-[#172D35]'
                        : 'border-[#D7EDF2] dark:border-[#1F3A44] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="mt-0.5 text-[#2E6C7B] dark:text-[#77CBDA]">
                      {permissions[item.key] ? (
                        <CheckSquare className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#647780]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#647780] block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note for Public Memory */}
          {privacy === 'public_memory_only' && (
            <div className="p-4 rounded-xl bg-[#E8F7FA] dark:bg-[#172D35] border border-[#77CBDA]/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2E6C7B] dark:text-[#77CBDA] shrink-0 mt-0.5" />
              <div className="text-xs text-[#26343B] dark:text-[#ECF7F9] space-y-1">
                <p className="font-semibold">Bảo mật tuyệt đối bản dịch của bạn:</p>
                <p className="text-[#647780] dark:text-[#C9EAF2] leading-relaxed">
                  Bản dịch các chương, bản gốc và ghi chú riêng tư vẫn được giữ kín 100%. Chỉ các cặp từ điển dịch thuật và quy tắc đại từ (ví dụ: 师兄 → sư huynh) được đưa vào Kho Tri Thức Ngôn Ngữ để cộng đồng học hỏi.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228]">
          <span className="text-xs text-[#647780]">
            Chủ sở hữu: <strong className="text-[#26343B] dark:text-[#ECF7F9]">{story.ownerName || 'Translator'}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thiết lập'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
