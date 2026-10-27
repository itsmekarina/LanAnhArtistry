import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { StoryListView } from './components/stories/StoryListView';
import { StoryDetailView } from './components/stories/StoryDetailView';
import { TranslationWorkspace } from './components/translate/TranslationWorkspace';
import { TranslationMemoryView } from './components/memory/TranslationMemoryView';
import { PronounRulesView } from './components/memory/PronounRulesView';
import { CharactersView } from './components/characters/CharactersView';
import { StoryBibleView } from './components/bible/StoryBibleView';
import { PlotTimelineView } from './components/timeline/PlotTimelineView';
import { ReviewCenterView } from './components/review/ReviewCenterView';
import { ReviewBeforePublishView } from './components/review/ReviewBeforePublishView';
import { GlobalSearchView } from './components/search/GlobalSearchView';
import { SettingsView } from './components/settings/SettingsView';
import { ExplorePublicView } from './components/explore/ExplorePublicView';
import { SharedStoryReaderView } from './components/stories/SharedStoryReaderView';
import { MyLibraryView } from './components/library/MyLibraryView';
import { ImportCenterView } from './components/import/ImportCenterView';
import { KnowledgeDashboardView } from './components/dashboard/KnowledgeDashboardView';
import { ContributionsView } from './components/contributions/ContributionsView';
import { WhatChangedModal } from './components/modals/WhatChangedModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { AuthModal } from './components/modals/AuthModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { ShareStoryModal } from './components/modals/ShareStoryModal';
import { MigrateDataModal } from './components/modals/MigrateDataModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { ContributeModal } from './components/modals/ContributeModal';
import { LandingPage } from './components/landing/LandingPage';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    activeStory,
    sharedStory,
    showWhatChangedModal,
    setShowWhatChangedModal,
    showShortcutsModal,
    setShowShortcutsModal,
    showAuthModal,
    setShowAuthModal,
    showProfileModal,
    setShowProfileModal,
    showShareModal,
    setShowShareModal,
    showMigrateModal,
    setShowMigrateModal,
    showSupabaseConfigModal,
    setShowSupabaseConfigModal,
    showContributeModal,
    setShowContributeModal,
    contributeTargetItem,
    openSharedStory,
    toast,
  } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check for hash share link on mount
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const token = hash.replace('#share=', '');
        if (token) {
          openSharedStory(token);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'my_library':
        return <MyLibraryView />;
      case 'import_center':
        return <ImportCenterView />;
      case 'knowledge_dashboard':
        return <KnowledgeDashboardView />;
      case 'contributions':
        return <ContributionsView />;
      case 'stories':
        return <StoryListView />;
      case 'story_detail':
        return <StoryDetailView />;
      case 'explore':
        return <ExplorePublicView />;
      case 'public_reader':
        return <SharedStoryReaderView />;
      case 'translate':
      case 'history':
        return <TranslationWorkspace />;
      case 'tm':
      case 'vocab':
      case 'terms':
        return <TranslationMemoryView />;
      case 'pronouns':
      case 'character_timeline':
        return <PronounRulesView />;
      case 'characters':
      case 'relationships':
        return <CharactersView />;
      case 'bible':
      case 'style':
      case 'summaries':
      case 'mysteries':
        return <StoryBibleView />;
      case 'plot_timeline':
        return <PlotTimelineView />;
      case 'consistency_warnings':
        return <ReviewCenterView initialTypeFilter="translation" />;
      case 'pronoun_warnings':
        return <ReviewCenterView initialTypeFilter="pronoun" />;
      case 'review_publish':
        return <ReviewBeforePublishView />;
      case 'search':
        return <GlobalSearchView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBFD] dark:bg-[#0C171B] text-[#26343B] dark:text-[#ECF7F9] flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="md:pl-72 flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global What Changed Modal */}
      {showWhatChangedModal && (
        <WhatChangedModal
          isOpen={showWhatChangedModal}
          onClose={() => setShowWhatChangedModal(false)}
        />
      )}

      {/* Global Keyboard Shortcuts Cheat-sheet Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Story Privacy & Sharing Modal */}
      {showShareModal && (activeStory || sharedStory) && (
        <ShareStoryModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          story={(activeStory || sharedStory)!}
        />
      )}

      {/* Migrate Data Modal */}
      {showMigrateModal && (
        <MigrateDataModal
          isOpen={showMigrateModal}
          onClose={() => setShowMigrateModal(false)}
        />
      )}

      {/* Supabase & Cloud Config Modal */}
      {showSupabaseConfigModal && (
        <SupabaseConfigModal
          isOpen={showSupabaseConfigModal}
          onClose={() => setShowSupabaseConfigModal(false)}
        />
      )}

      {/* Community Contribution Modal */}
      {showContributeModal && (
        <ContributeModal
          isOpen={showContributeModal}
          onClose={() => setShowContributeModal(false)}
          initialItem={contributeTargetItem}
        />
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-[#2E6C7B] text-white border-[#1A4954]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertOctagon className="w-4 h-4 text-rose-300" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#B3EBF2]" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isWorkspace, setIsWorkspace] = useState(() => window.location.hash === '#/workspace');

  useEffect(() => {
    const syncRoute = () => setIsWorkspace(window.location.hash === '#/workspace');
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  if (!isWorkspace) return <LandingPage />;

  return <AppProvider><AppContent /></AppProvider>;
}
