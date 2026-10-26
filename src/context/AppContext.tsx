import React, { createContext, useContext, useState, useEffect } from 'react';
import { Story, Chapter, ConsistencyWarning, User, SyncStatus } from '../types';
import {
  getAllStories,
  getStoryById,
  saveStory,
  getChaptersByStory,
  getWarnings,
  getStoryByShareToken,
  migrateUnassignedStoriesToUser,
} from '../services/db';
import { getCurrentUser, logoutUser } from '../services/auth';
import { cloudSync } from '../services/cloudSync';

export type NavView =
  | 'dashboard'
  | 'my_library'
  | 'stories'
  | 'story_detail'
  | 'import_center'
  | 'knowledge_dashboard'
  | 'contributions'
  | 'translate'
  | 'history'
  | 'tm'
  | 'vocab'
  | 'terms'
  | 'pronouns'
  | 'style'
  | 'characters'
  | 'relationships'
  | 'character_timeline'
  | 'bible'
  | 'plot_timeline'
  | 'summaries'
  | 'mysteries'
  | 'consistency_warnings'
  | 'pronoun_warnings'
  | 'review_publish'
  | 'search'
  | 'settings'
  | 'explore'
  | 'public_reader'
  | 'profile';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  showMigrateModal: boolean;
  setShowMigrateModal: (show: boolean) => void;
  showSupabaseConfigModal: boolean;
  setShowSupabaseConfigModal: (show: boolean) => void;
  showContributeModal: boolean;
  setShowContributeModal: (show: boolean) => void;
  contributeTargetItem: any;
  openContributeModal: (item: any) => void;
  syncStatus: SyncStatus;
  lastSyncedTime: string;
  triggerSyncNow: () => Promise<void>;
  sharedStory: Story | null;
  openSharedStory: (tokenOrStory: string | Story) => Promise<void>;
  isOwner: (story?: Story | null) => boolean;
  activeStoryId: string | null;
  activeStory: Story | null;
  setActiveStoryId: (id: string | null) => void;
  stories: Story[];
  refreshStories: () => Promise<void>;
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  openChapterForTranslation: (storyId: string, chapterId: string, showRecapPrompt?: boolean) => void;
  warningsCount: { translation: number; pronoun: number; bible: number; total: number };
  refreshWarnings: () => Promise<void>;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  showRecapModal: boolean;
  setShowRecapModal: (show: boolean) => void;
  showWhatChangedModal: boolean;
  setShowWhatChangedModal: (show: boolean) => void;
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
  registerSaveAction: (fn: () => Promise<void> | void) => () => void;
  triggerSave: () => void;
  registerConsistencyCheckAction: (fn: () => Promise<void> | void) => () => void;
  triggerConsistencyCheck: () => Promise<void>;
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lananh_theme') as 'dark' | 'light') || 'light';
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showMigrateModal, setShowMigrateModal] = useState<boolean>(false);
  const [showSupabaseConfigModal, setShowSupabaseConfigModal] = useState<boolean>(false);
  const [showContributeModal, setShowContributeModal] = useState<boolean>(false);
  const [contributeTargetItem, setContributeTargetItem] = useState<any>(null);
  const [sharedStory, setSharedStory] = useState<Story | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => cloudSync.getLastSyncedTime());

  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryIdState] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);
  const [showWhatChangedModal, setShowWhatChangedModal] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [warningsCount, setWarningsCount] = useState({ translation: 0, pronoun: 0, bible: 0, total: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    const unsub = cloudSync.subscribeStatus((status, time) => {
      setSyncStatus(status);
      if (time) setLastSyncedTime(time);
    });
    return unsub;
  }, []);

  const openContributeModal = (item: any) => {
    setContributeTargetItem(item);
    setShowContributeModal(true);
  };

  const triggerSyncNow = async () => {
    showToast('Đang đồng bộ dữ liệu với máy chủ...', 'info');
    await cloudSync.pushPendingChanges(currentUser.id, currentUser.displayName);
    const pulled = await cloudSync.pullCloudData(currentUser.id, isAdmin);
    if (pulled) {
      await refreshStories();
      showToast('Đồng bộ dữ liệu hoàn tất!', 'success');
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    showToast(`Chào mừng trở lại, ${user.displayName}!`, 'success');
  };

  const logout = () => {
    logoutUser();
    const guestUser = getCurrentUser();
    setCurrentUserState(guestUser);
    showToast('Đã đăng xuất tài khoản.', 'info');
    setShowAuthModal(true);
  };

  const isOwner = (story?: Story | null): boolean => {
    const target = story || activeStory;
    if (!target) return false;
    return Boolean(target.ownerId && target.ownerId === currentUser.id);
  };

  const openSharedStory = async (tokenOrStory: string | Story) => {
    try {
      if (typeof tokenOrStory === 'string') {
        const found = await getStoryByShareToken(tokenOrStory);
        if (!found) {
          showToast('Liên kết không hợp lệ hoặc truyện đang ở chế độ Riêng tư.', 'error');
          return;
        }
        setSharedStory(found);
        setCurrentView('public_reader');
      } else {
        setSharedStory(tokenOrStory);
        setCurrentView('public_reader');
      }
    } catch (e: any) {
      showToast('Lỗi khi mở truyện chia sẻ: ' + e.message, 'error');
    }
  };

  // Registered Action Callbacks
  const saveActionRef = React.useRef<(() => Promise<void> | void) | null>(null);
  const consistencyCheckActionRef = React.useRef<(() => Promise<void> | void) | null>(null);

  const registerSaveAction = (fn: () => Promise<void> | void) => {
    saveActionRef.current = fn;
    return () => {
      if (saveActionRef.current === fn) {
        saveActionRef.current = null;
      }
    };
  };

  const registerConsistencyCheckAction = (fn: () => Promise<void> | void) => {
    consistencyCheckActionRef.current = fn;
    return () => {
      if (consistencyCheckActionRef.current === fn) {
        consistencyCheckActionRef.current = null;
      }
    };
  };

  const triggerSave = async () => {
    if (saveActionRef.current) {
      try {
        await saveActionRef.current();
        showToast('✓ Đã lưu bản dịch tức thì (⌘S)', 'success');
      } catch (err: any) {
        showToast('Lỗi lưu: ' + err.message, 'error');
      }
    } else if (activeStory) {
      await saveStory({ ...activeStory, updatedAt: new Date().toISOString() });
      showToast('✓ Đã lưu trạng thái truyện (⌘S)', 'success');
    }
  };

  const triggerConsistencyCheck = async () => {
    if (consistencyCheckActionRef.current) {
      try {
        await consistencyCheckActionRef.current();
      } catch (err: any) {
        showToast('Lỗi kiểm tra tính nhất quán: ' + err.message, 'error');
      }
    } else {
      await refreshWarnings();
      showToast('Đang chạy kiểm tra tính nhất quán (⌥C)...', 'info');
      setCurrentView('consistency_warnings');
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. SAVE: Cmd/Ctrl + S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSave();
        return;
      }

      // 2. RUN CONSISTENCY CHECK: Alt + C or Cmd/Ctrl + Shift + C
      if (
        (e.altKey && (e.key === 'c' || e.key === 'C')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C'))
      ) {
        e.preventDefault();
        triggerConsistencyCheck();
        return;
      }

      // 3. GLOBAL SEARCH: Cmd/Ctrl + K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCurrentView('search');
        return;
      }

      // 4. PRIMARY NAVIGATION TABS (Alt + 1, 2, 3, 4, 5, 6, 7)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setCurrentView('dashboard');
            showToast('Chuyển tab: Dashboard (⌥1)', 'info');
            return;
          case '2':
            e.preventDefault();
            setCurrentView('translate');
            showToast('Chuyển tab: Translation Workspace (⌥2)', 'info');
            return;
          case '3':
            e.preventDefault();
            setCurrentView('consistency_warnings');
            showToast('Chuyển tab: Review Center (⌥3)', 'info');
            return;
          case '4':
            e.preventDefault();
            setCurrentView('bible');
            showToast('Chuyển tab: Story Bible (⌥4)', 'info');
            return;
          case '5':
            e.preventDefault();
            setCurrentView('tm');
            showToast('Chuyển tab: Translation Memory (⌥5)', 'info');
            return;
          case '6':
            e.preventDefault();
            setCurrentView('characters');
            showToast('Chuyển tab: Characters (⌥6)', 'info');
            return;
          case '7':
            e.preventDefault();
            setCurrentView('plot_timeline');
            showToast('Chuyển tab: Plot Timeline (⌥7)', 'info');
            return;
          default:
            break;
        }
      }

      // 5. CHEAT SHEET MODAL: '?' (when not typing in an input) or Cmd/Ctrl + /
      if ((e.key === '?' && !isInput) || ((e.ctrlKey || e.metaKey) && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // 6. ESCAPE: Close modals
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowRecapModal(false);
        setShowWhatChangedModal(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeStory, triggerSave, triggerConsistencyCheck]);

  // Sync theme with DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lananh_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const refreshStories = async () => {
    try {
      const list = await getAllStories();
      // Multi-user data isolation: only show stories belonging to the current user
      const userStories = list.filter((s) => s.ownerId === currentUser.id || (!s.ownerId && currentUser.id === 'local-guest'));
      setStories(userStories);
      if (userStories.length > 0) {
        if (!activeStoryId || !userStories.some((s) => s.id === activeStoryId)) {
          setActiveStoryIdState(userStories[0].id);
          setActiveStory(userStories[0]);
        } else {
          const found = userStories.find((s) => s.id === activeStoryId);
          setActiveStory(found || userStories[0]);
        }
      } else {
        setActiveStoryIdState(null);
        setActiveStory(null);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  };

  const setActiveStoryId = (id: string | null) => {
    setActiveStoryIdState(id);
    if (id) {
      const found = stories.find((s) => s.id === id);
      setActiveStory(found || null);
      if (found) {
        // Update last opened
        const updated = { ...found, lastOpenedAt: new Date().toISOString() };
        saveStory(updated).catch(console.error);
      }
    } else {
      setActiveStory(null);
    }
  };

  const refreshWarnings = async () => {
    if (!activeStoryId) {
      setWarningsCount({ translation: 0, pronoun: 0, bible: 0, total: 0 });
      return;
    }
    try {
      const warns = await getWarnings(activeStoryId);
      const openWarns = warns.filter((w) => w.status === 'open');
      const trCount = openWarns.filter((w) => w.type === 'translation' || w.type === 'terminology').length;
      const prCount = openWarns.filter((w) => w.type === 'pronoun').length;
      const bbCount = openWarns.filter((w) => w.type === 'bible' || w.type === 'character' || w.type === 'timeline').length;
      setWarningsCount({
        translation: trCount,
        pronoun: prCount,
        bible: bbCount,
        total: openWarns.length,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshStories();
  }, [currentUser.id]);

  useEffect(() => {
    if (activeStoryId) {
      refreshWarnings();
    }
  }, [activeStoryId]);

  const openChapterForTranslation = async (storyId: string, chapterId: string, showRecapPrompt = false) => {
    setActiveStoryId(storyId);
    setActiveChapterId(chapterId);
    setCurrentView('translate');
    if (showRecapPrompt) {
      setShowRecapModal(true);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currentView,
        setCurrentView,
        currentUser,
        setCurrentUser,
        logout,
        isAdmin,
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
        openContributeModal,
        syncStatus,
        lastSyncedTime,
        triggerSyncNow,
        sharedStory,
        openSharedStory,
        isOwner,
        activeStoryId,
        activeStory,
        setActiveStoryId,
        stories,
        refreshStories,
        activeChapterId,
        setActiveChapterId,
        openChapterForTranslation,
        warningsCount,
        refreshWarnings,
        globalSearchQuery,
        setGlobalSearchQuery,
        showRecapModal,
        setShowRecapModal,
        showWhatChangedModal,
        setShowWhatChangedModal,
        showShortcutsModal,
        setShowShortcutsModal,
        registerSaveAction,
        triggerSave,
        registerConsistencyCheckAction,
        triggerConsistencyCheck,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
