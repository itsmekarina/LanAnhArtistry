import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Keyboard,
  Save,
  AlertTriangle,
  Share2,
  Lock,
  Globe,
  Link2,
  Brain,
  User as UserIcon,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  Loader2,
  Cloud,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    activeStory,
    currentView,
    setCurrentView,
    openChapterForTranslation,
    setGlobalSearchQuery,
    setShowWhatChangedModal,
    setShowShortcutsModal,
    setShowShareModal,
    setShowProfileModal,
    currentUser,
    triggerSave,
    triggerConsistencyCheck,
    syncStatus,
    lastSyncedTime,
    triggerSyncNow,
  } = useApp();

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'my_library':
        return 'My Library — Thư Viện Cá Nhân';
      case 'import_center':
        return 'Import Center — Nạp Tư Liệu Dịch Thuật';
      case 'knowledge_dashboard':
        return 'Database & Knowledge Dashboard';
      case 'contributions':
        return 'Community Knowledge Contributions';
      case 'stories':
        return 'My Stories';
      case 'story_detail':
        return `Story Overview — ${activeStory?.title || ''}`;
      case 'explore':
        return 'Khám phá & Chia sẻ Tri thức';
      case 'public_reader':
        return 'Chế độ Đọc Tác phẩm Chia sẻ';
      case 'translate':
        return 'Translation Workspace';
      case 'history':
        return 'Translation History';
      case 'tm':
        return 'Translation Memory (TM)';
      case 'vocab':
        return 'Vocabulary Knowledge';
      case 'terms':
        return 'Story Terminology';
      case 'pronouns':
        return 'Pronoun Rules & Address System';
      case 'style':
        return 'Translation Style Rules';
      case 'characters':
        return 'Characters Database';
      case 'relationships':
        return 'Character Relationships';
      case 'character_timeline':
        return 'Character Timeline';
      case 'bible':
        return 'Story Bible & Worldbuilding';
      case 'plot_timeline':
        return 'Plot Timeline';
      case 'summaries':
        return 'Chapter & Arc Summaries';
      case 'mysteries':
        return 'Story Mysteries & Clues';
      case 'consistency_warnings':
        return 'Consistency Warnings';
      case 'pronoun_warnings':
        return 'Pronoun Warnings';
      case 'review_publish':
        return 'Review Before Publish';
      case 'search':
        return 'Global Story Search';
      case 'settings':
        return 'Settings & Backup';
      default:
        return 'LanAnhArtistry';
    }
  };

  const userInitials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LA';

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#122228]/90 backdrop-blur-md border-b border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-semibold text-[#26343B] dark:text-[#ECF7F9] font-serif tracking-tight truncate max-w-[180px] sm:max-w-md">
            {getViewTitle()}
          </h1>
          {activeStory && (
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
              <BookOpen className="w-3 h-3 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span className="truncate max-w-[130px] font-medium">{activeStory.title}</span>
              <button
                onClick={() => setShowShareModal(true)}
                className="hover:opacity-75 transition-opacity ml-0.5 cursor-pointer"
                title="Thay đổi quyền riêng tư & chia sẻ"
              >
                {activeStory.privacy === 'public' ? (
                  <Globe className="w-2.5 h-2.5 text-emerald-600" />
                ) : activeStory.privacy === 'link_only' ? (
                  <Link2 className="w-2.5 h-2.5 text-sky-600" />
                ) : activeStory.privacy === 'public_memory_only' ? (
                  <Brain className="w-2.5 h-2.5 text-cyan-600" />
                ) : (
                  <Lock className="w-2.5 h-2.5 text-[#647780]" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Cloud Sync Status Indicator (Section 31) */}
        <button
          onClick={() => triggerSyncNow()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#122228] hover:border-[#77CBDA] transition-colors cursor-pointer"
          title={`Bấm để đồng bộ ngay với máy chủ. Lần đồng bộ cuối: ${lastSyncedTime ? new Date(lastSyncedTime).toLocaleTimeString() : 'Vừa xong'}`}
        >
          {syncStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden md:inline">Saving...</span>
            </span>
          ) : syncStatus === 'syncing' ? (
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden md:inline">Syncing...</span>
            </span>
          ) : syncStatus === 'offline' ? (
            <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-medium">
              <WifiOff className="w-3 h-3" />
              <span className="hidden md:inline">Offline</span>
            </span>
          ) : syncStatus === 'conflict' ? (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden md:inline">Conflict</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden md:inline">Synced</span>
            </span>
          )}
        </button>

        {/* Quick Search Button */}
        <button
          onClick={() => setCurrentView('search')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0C171B] text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:border-[#77CBDA] transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
          <span className="hidden sm:inline">Tìm kiếm từ vựng, xưng hô...</span>
          <span className="hidden md:inline text-[10px] text-[#647780] bg-[#E8F7FA] dark:bg-[#172D35] px-1 py-0.5 rounded">
            ⌘K
          </span>
        </button>

        {/* Share Button (if active story) */}
        {activeStory && (
          <button
            onClick={() => setShowShareModal(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] hover:bg-[#B3EBF2]/60 dark:bg-[#172D35] dark:hover:bg-[#1F3A44] border border-[#D7EDF2] dark:border-[#1F3A44] transition-colors cursor-pointer"
            title="Thiết lập quyền chia sẻ & quyền riêng tư"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chia sẻ</span>
          </button>
        )}

        {/* What Changed Button */}
        <button
          onClick={() => setShowWhatChangedModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] hover:bg-[#B3EBF2]/50 border border-[#D7EDF2] dark:border-[#1F3A44] transition-colors cursor-pointer"
          title="Xem tóm lược những thay đổi mới nhất"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
          <span>What Changed?</span>
        </button>

        {/* Consistency Check Quick Trigger */}
        <button
          onClick={() => triggerConsistencyCheck()}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors cursor-pointer"
          title="Chạy kiểm tra tính nhất quán (⌥C)"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden xl:inline">Consistency Check</span>
          <kbd className="text-[10px] font-mono text-[#647780] bg-[#F4FBFD] dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
            ⌥C
          </kbd>
        </button>

        {/* Quick Save Trigger */}
        <button
          onClick={() => triggerSave()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors cursor-pointer"
          title="Lưu bản dịch tức thì (⌘S)"
        >
          <Save className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Save</span>
          <kbd className="hidden sm:inline text-[10px] font-mono text-[#647780] bg-[#F4FBFD] dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
            ⌘S
          </kbd>
        </button>

        {/* Keyboard Shortcuts Trigger Button */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="p-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors cursor-pointer"
          title="Phím tắt hệ thống (Bấm ?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Continue Translating quick button */}
        {currentView !== 'translate' && activeStory && (
          <button
            onClick={() => {
              if (activeStory.id === '__no_seed_story__') {
                openChapterForTranslation(activeStory.id, '__no_seed_chapter__', true);
              } else {
                setCurrentView('translate');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-all cursor-pointer"
          >
            <span>Tiếp tục dịch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User Avatar quick trigger */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-7 h-7 rounded-full bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA] border border-[#77CBDA] font-bold text-[10px] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
          title={`Hồ sơ: ${currentUser.displayName}`}
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
};
