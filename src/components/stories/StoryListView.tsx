import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Story, StoryStatus } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
  Archive,
  CheckCircle,
  PlayCircle,
  Trash2,
  Share2,
  Lock,
  Globe,
  Link2,
  Brain,
  User,
} from 'lucide-react';
import { deleteStory } from '../../services/db';
import { NewStoryModal } from '../modals/NewStoryModal';

export const StoryListView: React.FC = () => {
  const {
    stories,
    refreshStories,
    setActiveStoryId,
    setCurrentView,
    openChapterForTranslation,
    showToast,
    setShowShareModal,
    currentUser,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const filteredStories = stories.filter((s) => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesPrivacy = filterPrivacy === 'all' || s.privacy === filterPrivacy;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPrivacy && matchesSearch;
  });

  const handleDelete = async (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa bộ nhớ truyện "${story.title}"? Thao tác này không thể hoàn tác.`)) {
      await deleteStory(story.id);
      await refreshStories();
      showToast(`Đã xóa truyện ${story.title}`, 'info');
    }
  };

  const getPrivacyBadge = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Globe className="w-2.5 h-2.5" />
            <span>Công khai</span>
          </span>
        );
      case 'link_only':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Link2 className="w-2.5 h-2.5" />
            <span>Có link</span>
          </span>
        );
      case 'public_memory_only':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Brain className="w-2.5 h-2.5" />
            <span>Shared TM</span>
          </span>
        );
      case 'private':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
            <Lock className="w-2.5 h-2.5" />
            <span>Riêng tư</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
            My Stories (Thư viện cá nhân)
          </h1>
          <p className="text-xs text-[#647780] mt-0.5">
            Dữ liệu riêng tư thuộc tài khoản <strong className="text-[#26343B] dark:text-[#ECF7F9]">{currentUser?.displayName || 'Translator'}</strong>. Mỗi truyện là một không gian dịch thuật độc lập, bảo mật.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo truyện mới</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'Tất cả trạng thái' },
            { id: 'translating', label: 'Đang dịch' },
            { id: 'completed', label: 'Đã hoàn thành' },
            { id: 'paused', label: 'Tạm dừng' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#B3EBF2]/50 dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                  : 'text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-[#D7EDF2] dark:text-[#1F3A44] px-1">|</span>

          {[
            { id: 'all', label: 'Mọi quyền' },
            { id: 'private', label: '🔒 Riêng tư' },
            { id: 'link_only', label: '🔗 Có link' },
            { id: 'public', label: '🌎 Công khai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPrivacy(tab.id)}
              className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterPrivacy === tab.id
                  ? 'bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold border border-[#77CBDA]/40'
                  : 'text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#647780]" />
          <input
            type="text"
            placeholder="Tìm theo tên truyện, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0C171B] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-1 focus:ring-[#77CBDA]"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#122228] rounded-3xl border border-[#D7EDF2] dark:border-[#1F3A44] p-8 shadow-xs">
          <BookOpen className="w-10 h-10 text-[#77CBDA] mx-auto" />
          <h3 className="text-sm font-semibold text-[#26343B] dark:text-[#ECF7F9]">
            Không tìm thấy truyện nào
          </h3>
          <p className="text-xs text-[#647780] max-w-sm mx-auto">
            Không có truyện nào phù hợp với bộ lọc hiện tại. Bấm "Tạo truyện mới" để thêm bộ nhớ truyện đầu tiên.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="mt-2 px-4 py-2 text-xs font-semibold bg-[#2E6C7B] text-white rounded-xl cursor-pointer"
          >
            + Khởi tạo truyện mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((story) => {
            const pct = Math.round((story.translatedChapters / (story.totalChapters || 1)) * 100);
            return (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryId(story.id);
                  setCurrentView('story_detail');
                }}
                className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] hover:border-[#77CBDA] hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
                      {story.sourceLanguage.toUpperCase()} → VI
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPrivacyBadge(story.privacy)}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[#26343B] dark:text-[#ECF7F9] group-hover:text-[#2E6C7B] dark:group-hover:text-[#77CBDA] transition-colors line-clamp-1">
                    {story.title}
                  </h3>
                  <p className="text-xs text-[#647780] mt-0.5 mb-2">Tác giả: {story.author}</p>
                  <p className="text-xs text-[#647780] line-clamp-3 mb-4 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#647780]">
                      <span>Tiến độ dịch</span>
                      <span className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA]">
                        {story.translatedChapters}/{story.totalChapters} ch ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E8F7FA] dark:bg-[#172D35] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2E6C7B] dark:bg-[#77CBDA] h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStoryId(story.id);
                          setShowShareModal(true);
                        }}
                        className="p-1.5 rounded-lg text-[#647780] hover:text-[#2E6C7B] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]"
                        title="Thiết lập quyền chia sẻ"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, story)}
                        className="text-[#647780] hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Xóa truyện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story.id === '__no_seed_story__') {
                          openChapterForTranslation(story.id, '__no_seed_chapter__', true);
                        } else {
                          setActiveStoryId(story.id);
                          setCurrentView('translate');
                        }
                      }}
                      className="flex items-center gap-1 text-[#2E6C7B] dark:text-[#77CBDA] font-semibold group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Vào dịch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewModalOpen && (
        <NewStoryModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
      )}
    </div>
  );
};
