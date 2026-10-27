import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Story, SourceLanguage, StoryPrivacyLevel } from '../../types';
import { saveStory, saveStoryBible } from '../../services/db';
import { generateShareToken } from '../../services/auth';
import { X, BookPlus, Sparkles, Lock, Globe, Link2, Brain } from 'lucide-react';

interface NewStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewStoryModal: React.FC<NewStoryModalProps> = ({ isOpen, onClose }) => {
  const { refreshStories, setActiveStoryId, showToast, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>('zh');
  const [description, setDescription] = useState('');
  const [totalChapters, setTotalChapters] = useState<number>(100);
  const [privacy, setPrivacy] = useState<StoryPrivacyLevel>(
    currentUser?.defaultStoryPrivacy || 'private'
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên truyện', 'warning');
      return;
    }

    const storyId = `story-${Date.now()}`;
    const newStory: Story = {
      id: storyId,
      ownerId: currentUser.id,
      ownerName: currentUser.displayName,
      title: title.trim(),
      author: author.trim() || 'Khuyết danh',
      sourceLanguage,
      targetLanguage: 'vi',
      description: description.trim() || 'Chưa có mô tả',
      status: 'translating',
      privacy,
      shareToken: generateShareToken(),
      sharingPermissions: {
        showOriginal: false,
        showTranslation: true,
        showSummary: true,
        showCharacters: true,
        showStoryBible: false,
        showPlotTimeline: true,
        showTranslationMemory: true,
        showTerminology: true,
        showPronouns: true,
      },
      totalChapters: totalChapters || 100,
      translatedChapters: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    try {
      await saveStory(newStory);
      // Initialize default Story Bible
      await saveStoryBible({
        id: `bible-${storyId}`,
        storyId,
        locations: [],
        organizations: [],
        terminology: [],
        importantObjects: [],
        mysteries: [],
        importantQuotes: [],
        worldbuildingRules: [],
        translationStyle: {
          tone: sourceLanguage === 'zh' ? 'Cổ phong, hàm súc, tự nhiên' : 'Hiện đại, giàu cảm xúc',
          narrativeStyle: 'Văn phong văn học, mạch lạc',
          dialogueStyle: 'Đối thoại chân thực, chuẩn đại từ xưng hô',
          formality: 'Linh hoạt theo địa vị nhân vật',
          preferredVocabulary: [],
          preferredPronouns: [],
          forbiddenTerms: [],
          specialRules: [],
        },
      });

      await refreshStories();
      setActiveStoryId(storyId);
      showToast(`Đã tạo bộ nhớ truyện mới: ${newStory.title}`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Lỗi tạo truyện: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <BookPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                New Knowledge Base
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Tạo tác phẩm dịch mới
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Tên truyện dịch <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ví dụ: Đoạn Tuyệt, The Clockwork Heart..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
                Tác giả gốc
              </label>
              <input
                type="text"
                placeholder="ví dụ: Nhĩ Căn, George Orwell..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
                Tổng số chương dự kiến
              </label>
              <input
                type="number"
                min="1"
                value={totalChapters}
                onChange={(e) => setTotalChapters(parseInt(e.target.value) || 100)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Cặp ngôn ngữ dịch
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceLanguage('zh')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                  sourceLanguage === 'zh'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD]'
                }`}
              >
                Tiếng Trung (zh) → Tiếng Việt (vi)
              </button>
              <button
                type="button"
                onClick={() => setSourceLanguage('en')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                  sourceLanguage === 'en'
                    ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                    : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD]'
                }`}
              >
                Tiếng Anh (en) → Tiếng Việt (vi)
              </button>
            </div>
          </div>

          {/* Privacy Level selection */}
          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Quyền riêng tư ban đầu (Privacy Setting)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'private', label: '🔒 Riêng tư (Private)', desc: 'Chỉ mình bạn (Khuyến nghị)' },
                { id: 'link_only', label: '🔗 Có link (Link Only)', desc: 'Ai có link mới xem được' },
                { id: 'public_memory_only', label: '🧠 Shared Memory', desc: 'Chia sẻ từ vựng, giấu bản dịch' },
                { id: 'public', label: '🌎 Công khai (Public)', desc: 'Công khai trên thư viện' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrivacy(p.id as StoryPrivacyLevel)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    privacy === p.id
                      ? 'border-[#2E6C7B] dark:border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] ring-1 ring-[#77CBDA]'
                      : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD]'
                  }`}
                >
                  <span className="text-xs font-bold block">{p.label}</span>
                  <span className="text-[10px] text-[#647780] block mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Giới thiệu ngắn / Phong cách truyện
            </label>
            <textarea
              rows={3}
              placeholder="Tóm tắt bối cảnh, nhân vật chính, tông giọng dịch cần duy trì..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
            />
          </div>

          <div className="pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-between">
            <span className="text-[11px] text-[#647780]">
              Chủ sở hữu: <strong>{currentUser?.displayName || 'Translator'}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Khởi tạo bộ nhớ truyện</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
