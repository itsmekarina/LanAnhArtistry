import React, { useState } from 'react';
import { useApp, NavView } from '../../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Brain,
  Users,
  Compass,
  AlertTriangle,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookMarked,
  Layers,
  History,
  Languages,
  CheckCircle2,
  Bookmark,
  ShieldAlert,
  Moon,
  Sun,
  X,
  Keyboard,
  Globe,
  Share2,
  Lock,
  Link2,
  User,
  LogOut,
  Library,
  UploadCloud,
  Database,
  Cloud,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    activeStory,
    stories,
    setActiveStoryId,
    warningsCount,
    theme,
    toggleTheme,
    setShowWhatChangedModal,
    setShowShortcutsModal,
    setShowShareModal,
    setShowMigrateModal,
    setShowSupabaseConfigModal,
    currentUser,
    setShowProfileModal,
    setShowAuthModal,
    logout,
    isAdmin,
  } = useApp();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stories: true,
    corpus: true,
    translation: true,
    memory: true,
    characters: true,
    knowledge: true,
    review: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleNav = (view: NavView) => {
    setCurrentView(view);
    onCloseMobile();
  };

  const navItemClass = (view: NavView) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
      currentView === view
        ? 'bg-[#B3EBF2]/50 dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold shadow-xs'
        : 'text-[#647780] dark:text-[#8AA4AE] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]/60 hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
    }`;

  const subNavItemClass = (view: NavView) =>
    `flex items-center justify-between pl-8 pr-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
      currentView === view
        ? 'bg-[#B3EBF2]/50 dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
        : 'text-[#647780] dark:text-[#8AA4AE] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]/60 hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
    }`;

  const userInitials = currentUser?.displayName
    ? currentUser.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LA';

  const getPrivacyBadge = () => {
    if (!activeStory) return null;
    switch (activeStory.privacy) {
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
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-[#F4FBFD] dark:bg-[#0C171B] border-r border-[#D7EDF2] dark:border-[#1F3A44] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-white/70 dark:bg-[#122228]/80 backdrop-blur-sm">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#77CBDA] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-[#26343B] dark:text-[#ECF7F9]">
                ✦ LanAnhArtistry
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-[#2E6C7B] dark:text-[#77CBDA] font-semibold">
                Literary Workspace
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Story Selector & Privacy Sharing Button */}
        <div className="px-3 pt-3 pb-2.5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#E8F7FA]/60 dark:bg-[#172D35]/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE]">
              Active Story
            </span>
            {activeStory && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Cài đặt quyền riêng tư & chia sẻ"
                >
                  <Share2 className="w-2.5 h-2.5" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            )}
          </div>

          {stories.length > 0 ? (
            <select
              value={activeStory?.id || ''}
              onChange={(e) => setActiveStoryId(e.target.value)}
              className="w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA] cursor-pointer truncate"
            >
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.sourceLanguage.toUpperCase()} → VI)
                </option>
              ))}
            </select>
          ) : (
            <div
              onClick={() => handleNav('stories')}
              className="p-2 rounded-xl text-center bg-white dark:bg-[#122228] border border-dashed border-[#D7EDF2] dark:border-[#1F3A44] text-[11px] text-[#647780] cursor-pointer hover:border-[#77CBDA]"
            >
              + Tạo tác phẩm dịch đầu tiên
            </div>
          )}

          {activeStory && (
            <div className="flex items-center justify-between mt-2 text-[11px] px-0.5">
              <div className="flex items-center gap-1">
                {getPrivacyBadge()}
              </div>
              <span className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA]">
                {Math.round((activeStory.translatedChapters / (activeStory.totalChapters || 1)) * 100)}% ({activeStory.translatedChapters}/{activeStory.totalChapters})
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-sm select-none">
          {/* Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full justify-between ${navItemClass('dashboard')}`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>Dashboard</span>
            </div>
            <kbd className="text-[10px] font-mono font-medium text-[#647780] bg-white dark:bg-[#172D35] px-1.5 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
              ⌥1
            </kbd>
          </button>

          {/* My Library (Section 44) */}
          <button
            onClick={() => handleNav('my_library')}
            className={`w-full justify-between ${navItemClass('my_library')}`}
          >
            <div className="flex items-center gap-2.5">
              <Library className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>My Library</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold">
              {stories.length}
            </span>
          </button>

          {/* Explore Community Shared Knowledge */}
          <button
            onClick={() => handleNav('explore')}
            className={`w-full justify-between ${navItemClass('explore')}`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>Khám phá & Chia sẻ</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#2E6C7B] dark:text-[#E8F7FA] font-bold">
              Cộng đồng
            </span>
          </button>

          {/* Section: Corpus & Cloud Knowledge */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('corpus')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                Corpus & Cloud
              </span>
              {expandedSections.corpus ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.corpus && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('import_center')}
                  className={`w-full justify-between ${subNavItemClass('import_center')}`}
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import Center</span>
                  </div>
                  <span className="text-[10px] bg-[#B3EBF2]/40 text-[#2E6C7B] dark:text-[#77CBDA] px-1.5 py-0.2 rounded">
                    15 steps
                  </span>
                </button>
                <button
                  onClick={() => handleNav('knowledge_dashboard')}
                  className={`w-full ${subNavItemClass('knowledge_dashboard')}`}
                >
                  <span>Knowledge Dashboard</span>
                </button>
                <button
                  onClick={() => handleNav('contributions')}
                  className={`w-full ${subNavItemClass('contributions')}`}
                >
                  <span>Cộng đồng đóng góp</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: My Stories */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('stories')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                My Stories
              </span>
              {expandedSections.stories ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.stories && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('stories')}
                  className={`w-full ${subNavItemClass('stories')}`}
                >
                  <span>All Stories</span>
                  <span className="text-[10px] bg-[#E8F7FA] dark:bg-[#172D35] px-1.5 py-0.5 rounded-full text-[#2E6C7B] dark:text-[#77CBDA] font-semibold">
                    {stories.length}
                  </span>
                </button>
                <button
                  onClick={() => handleNav('story_detail')}
                  className={`w-full ${subNavItemClass('story_detail')}`}
                >
                  <span>Story Dashboard</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Translation */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('translation')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                Translation
              </span>
              {expandedSections.translation ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.translation && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('translate')}
                  className={`w-full justify-between ${subNavItemClass('translate')}`}
                >
                  <span>Workspace</span>
                  <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                    ⌥2
                  </kbd>
                </button>
                <button
                  onClick={() => handleNav('history')}
                  className={`w-full ${subNavItemClass('history')}`}
                >
                  <span>History & Versions</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Memory & Language Rules */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('memory')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                Memory & Rules
              </span>
              {expandedSections.memory ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.memory && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('tm')}
                  className={`w-full justify-between ${subNavItemClass('tm')}`}
                >
                  <span>Translation Memory</span>
                  <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                    ⌥5
                  </kbd>
                </button>
                <button
                  onClick={() => handleNav('pronouns')}
                  className={`w-full ${subNavItemClass('pronouns')}`}
                >
                  <span>Pronoun Rules & Address</span>
                </button>
                <button
                  onClick={() => handleNav('vocab')}
                  className={`w-full ${subNavItemClass('vocab')}`}
                >
                  <span>Vocabulary Knowledge</span>
                </button>
                <button
                  onClick={() => handleNav('style')}
                  className={`w-full ${subNavItemClass('style')}`}
                >
                  <span>Translation Style</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Characters & Relationships */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('characters')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                Characters
              </span>
              {expandedSections.characters ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.characters && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('characters')}
                  className={`w-full justify-between ${subNavItemClass('characters')}`}
                >
                  <span>Database & Roles</span>
                  <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                    ⌥6
                  </kbd>
                </button>
                <button
                  onClick={() => handleNav('relationships')}
                  className={`w-full ${subNavItemClass('relationships')}`}
                >
                  <span>Relationships</span>
                </button>
                <button
                  onClick={() => handleNav('character_timeline')}
                  className={`w-full ${subNavItemClass('character_timeline')}`}
                >
                  <span>Character Timeline</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Story Bible & World */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('knowledge')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                Story Bible
              </span>
              {expandedSections.knowledge ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            {expandedSections.knowledge && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('bible')}
                  className={`w-full justify-between ${subNavItemClass('bible')}`}
                >
                  <span>Story Bible & Rules</span>
                  <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                    ⌥4
                  </kbd>
                </button>
                <button
                  onClick={() => handleNav('plot_timeline')}
                  className={`w-full justify-between ${subNavItemClass('plot_timeline')}`}
                >
                  <span>Plot Timeline</span>
                  <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                    ⌥7
                  </kbd>
                </button>
                <button
                  onClick={() => handleNav('summaries')}
                  className={`w-full ${subNavItemClass('summaries')}`}
                >
                  <span>Arc & Summaries</span>
                </button>
                <button
                  onClick={() => handleNav('mysteries')}
                  className={`w-full ${subNavItemClass('mysteries')}`}
                >
                  <span>Mysteries & Clues</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Review & Warnings */}
          <div className="pt-2">
            <button
              onClick={() => toggleSection('review')}
              className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#647780] dark:text-[#8AA4AE] hover:text-[#26343B] dark:hover:text-[#ECF7F9]"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Review & Warnings
              </span>
              <div className="flex items-center gap-1.5">
                {warningsCount.total > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-bold">
                    {warningsCount.total}
                  </span>
                )}
                {expandedSections.review ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>
            {expandedSections.review && (
              <div className="mt-0.5 space-y-0.5">
                <button
                  onClick={() => handleNav('consistency_warnings')}
                  className={`w-full ${subNavItemClass('consistency_warnings')}`}
                >
                  <span>Consistency Warnings</span>
                  {warningsCount.translation > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                      {warningsCount.translation}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNav('pronoun_warnings')}
                  className={`w-full ${subNavItemClass('pronoun_warnings')}`}
                >
                  <span>Pronoun Inconsistencies</span>
                  {warningsCount.pronoun > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                      {warningsCount.pronoun}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNav('review_publish')}
                  className={`w-full ${subNavItemClass('review_publish')}`}
                >
                  <span>Review Before Publish</span>
                </button>
              </div>
            )}
          </div>

          {/* Global Search & Settings & Shortcuts */}
          <div className="pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44] space-y-0.5">
            <button
              onClick={() => handleNav('search')}
              className={`w-full justify-between ${navItemClass('search')}`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#647780]" />
                <span>Global Search</span>
              </div>
              <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => {
                setShowShortcutsModal(true);
                onCloseMobile();
              }}
              className={`w-full justify-between ${navItemClass('settings')}`}
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-[#647780]" />
                <span>Phím tắt (Shortcuts)</span>
              </div>
              <kbd className="text-[10px] font-mono text-[#647780] bg-white dark:bg-[#172D35] px-1.5 py-0.2 rounded border border-[#D7EDF2] dark:border-[#1F3A44]">
                ?
              </kbd>
            </button>
            <button
              onClick={() => handleNav('settings')}
              className={`w-full ${navItemClass('settings')}`}
            >
              <Settings className="w-4 h-4 text-[#647780]" />
              <span>Settings & Backup</span>
            </button>
            <button
              onClick={() => {
                setShowMigrateModal(true);
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-[#2E6C7B] dark:text-[#77CBDA] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4" />
                <span className="font-semibold">Di chuyển dữ liệu (Migrate)</span>
              </div>
            </button>
            <button
              onClick={() => {
                setShowSupabaseConfigModal(true);
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-[#2E6C7B] dark:text-[#77CBDA] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4" />
                <span>Supabase & Cloud</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Footer: User Account & Theme toggle */}
        <div className="p-3 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-white/70 dark:bg-[#122228]/80 backdrop-blur-sm flex items-center justify-between text-xs">
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
            title="Xem & chỉnh sửa Hồ sơ cá nhân"
          >
            <div className="w-7 h-7 rounded-full bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA] border border-[#77CBDA] flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#26343B] dark:text-[#ECF7F9] leading-tight truncate">
                {currentUser?.displayName || 'Translator'}
              </p>
              <p className="text-[10px] text-[#647780] truncate">
                {currentUser?.email || 'artistrytranslator@example.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => setShowAuthModal(true)}
              className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors"
              title="Đổi tài khoản"
            >
              <User className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang Giao diện sáng' : 'Chuyển sang Giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
