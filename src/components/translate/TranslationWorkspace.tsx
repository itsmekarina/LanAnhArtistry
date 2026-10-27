import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Chapter,
  TranslationSegment,
  TranslationMemory,
  PronounRule,
  Character,
  StoryBible,
  ConsistencyWarning,
  ChapterStatus,
  SegmentStatus,
} from '../../types';
import {
  getChapterById,
  getChaptersByStory,
  saveChapter,
  getSegmentsByChapter,
  saveSegments,
  saveSingleSegment,
  getTranslationMemories,
  saveTranslationMemory,
  getPronounRules,
  getCharacters,
  getStoryBible,
  getWarnings,
  saveWarning,
} from '../../services/db';
import {
  detectConsistencyIssues,
  analyzeChapterContent,
  AnalysisResult,
} from '../../services/ai';
import {
  ArrowLeft,
  Columns,
  FileText,
  AlignLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Brain,
  MessageSquare,
  AlertTriangle,
  History,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  StickyNote,
  Copy,
  Plus,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { RecapModal } from '../modals/RecapModal';
import { ReviewPreviousUsageModal } from '../modals/ReviewPreviousUsageModal';
import { VersionHistoryModal } from '../modals/VersionHistoryModal';

export const TranslationWorkspace: React.FC = () => {
  const {
    activeStory,
    activeChapterId,
    setActiveChapterId,
    setCurrentView,
    showRecapModal,
    setShowRecapModal,
    showToast,
    refreshWarnings,
    registerSaveAction,
    registerConsistencyCheckAction,
    setShowShortcutsModal,
  } = useApp();

  // Core state
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);

  // Knowledge base state
  const [memories, setMemories] = useState<TranslationMemory[]>([]);
  const [pronounRules, setPronounRules] = useState<PronounRule[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [bible, setBible] = useState<StoryBible | undefined>(undefined);
  const [warnings, setWarnings] = useState<ConsistencyWarning[]>([]);

  // UI modes
  const [viewMode, setViewMode] = useState<'split' | 'original' | 'translation'>('split');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'memory' | 'pronouns' | 'style' | 'warnings' | 'context'>('memory');
  const [chapterSearch, setChapterSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Modals
  const [activeWarningForReview, setActiveWarningForReview] = useState<ConsistencyWarning | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalysisResult | null>(null);

  // Quick candidate TM prompt state
  const [candidateTm, setCandidateTm] = useState<{ original: string; translation: string } | null>(null);

  const saveTimerRef = useRef<any>(null);

  // Load Chapter & Knowledge Base
  const loadWorkspace = useCallback(async () => {
    if (!activeStory) return;

    try {
      const chaps = await getChaptersByStory(activeStory.id);
      setAllChapters(chaps);

      let targetChapId = activeChapterId;
      if (!targetChapId && chaps.length > 0) {
        targetChapId = chaps[0].id;
        setActiveChapterId(targetChapId);
      }

      if (targetChapId) {
        const currentChap = await getChapterById(targetChapId);
        if (currentChap) {
          setChapter(currentChap);
          let segs = await getSegmentsByChapter(targetChapId);

          // If no segments exist yet, generate them from originalText
          if (segs.length === 0 && currentChap.originalText) {
            const lines = currentChap.originalText
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l.length > 0);

            segs = lines.map((line, idx) => ({
              segmentId: `seg-${currentChap.id}-${idx + 1}`,
              chapterId: currentChap.id,
              storyId: activeStory.id,
              segmentOrder: idx + 1,
              originalText: line,
              translatedText: '',
              translationStatus: 'untranslated',
              notes: '',
            }));
            await saveSegments(segs);
          }

          setSegments(segs);
        }
      }

      // Load Story Knowledge
      const [tms, pronouns, chars, stBible, warns] = await Promise.all([
        getTranslationMemories(activeStory.id),
        getPronounRules(activeStory.id),
        getCharacters(activeStory.id),
        getStoryBible(activeStory.id),
        getWarnings(activeStory.id),
      ]);

      setMemories(tms);
      setPronounRules(pronouns);
      setCharacters(chars);
      setBible(stBible);
      setWarnings(warns.filter((w) => w.chapterId === targetChapId && w.status === 'open'));
    } catch (err) {
      console.error('Workspace load error:', err);
    }
  }, [activeStory, activeChapterId, setActiveChapterId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Debounced Auto-save
  const triggerAutoSave = (updatedSegments: TranslationSegment[]) => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveSegments(updatedSegments);

        // Update full chapter translationText
        if (chapter) {
          const fullTranslation = updatedSegments.map((s) => s.translatedText).join('\n');
          const updatedChap = {
            ...chapter,
            translationText: fullTranslation,
            updatedAt: new Date().toISOString(),
          };
          await saveChapter(updatedChap);
          setChapter(updatedChap);
        }

        setSaveStatus('saved');

        // Check for consistency issues
        if (chapter && activeStory) {
          const detected = detectConsistencyIssues({
            storyId: activeStory.id,
            chapterId: chapter.id,
            chapterNumber: chapter.chapterNumber,
            segments: updatedSegments,
            memories,
            pronounRules,
            storyBible: bible,
          });

          // Save new warnings
          for (const w of detected) {
            await saveWarning(w);
          }
          const allW = await getWarnings(activeStory.id);
          setWarnings(allW.filter((w) => w.chapterId === chapter.id && w.status === 'open'));
          refreshWarnings();
        }
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 800);
  };

  // Update a segment's translation
  const handleSegmentChange = (index: number, newText: string) => {
    const updated = [...segments];
    const prevStatus = updated[index].translationStatus;
    const newStatus: SegmentStatus = newText.trim().length > 0 ? (prevStatus === 'reviewed' ? 'reviewed' : 'translated') : 'untranslated';

    updated[index] = {
      ...updated[index],
      translatedText: newText,
      translationStatus: newStatus,
    };
    setSegments(updated);
    triggerAutoSave(updated);

    // Heuristic: check if user translated a candidate phrase
    const orig = updated[index].originalText;
    if (orig.includes('师兄') && newText.includes('sư huynh')) {
      // already in memory
    }
  };

  const handleStatusChange = async (status: ChapterStatus) => {
    if (!chapter) return;
    const updated = { ...chapter, status, updatedAt: new Date().toISOString() };
    await saveChapter(updated);
    setChapter(updated);
    showToast(`Đã đổi trạng thái chapter thành: ${status}`, 'success');
  };

  const handleSegmentStatusToggle = (index: number) => {
    const order: SegmentStatus[] = ['untranslated', 'draft', 'translated', 'reviewed'];
    const current = segments[index].translationStatus;
    const next = order[(order.indexOf(current) + 1) % order.length];

    const updated = [...segments];
    updated[index] = { ...updated[index], translationStatus: next };
    setSegments(updated);
    triggerAutoSave(updated);
  };

  // Register Workspace Action Hooks (Save & Consistency Check) with AppContext
  useEffect(() => {
    const unregisterSave = registerSaveAction(async () => {
      await saveSegments(segments);
      if (chapter) {
        const fullTranslation = segments.map((s) => s.translatedText).join('\n');
        const updatedChap = {
          ...chapter,
          translationText: fullTranslation,
          updatedAt: new Date().toISOString(),
        };
        await saveChapter(updatedChap);
        setChapter(updatedChap);
      }
      setSaveStatus('saved');
    });

    const unregisterCheck = registerConsistencyCheckAction(async () => {
      showToast('Đang chạy kiểm tra tính nhất quán (⌥C)...', 'info');
      if (chapter && activeStory) {
        const detected = detectConsistencyIssues({
          storyId: activeStory.id,
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          segments,
          memories,
          pronounRules,
          storyBible: bible,
        });

        for (const w of detected) {
          await saveWarning(w);
        }

        const allW = await getWarnings(activeStory.id);
        const openList = allW.filter((w) => w.chapterId === chapter.id && w.status === 'open');
        setWarnings(openList);
        await refreshWarnings();

        if (openList.length > 0) {
          setSidebarOpen(true);
          setActiveSidebarTab('warnings');
          showToast(`Phát hiện ${openList.length} cảnh báo cần xem xét (⌥C)!`, 'warning');
        } else {
          showToast('✓ Tuyệt vời! Không phát hiện bất nhất nào.', 'success');
        }
      }
    });

    return () => {
      unregisterSave();
      unregisterCheck();
    };
  }, [segments, chapter, activeStory, memories, pronounRules, bible, registerSaveAction, registerConsistencyCheckAction, refreshWarnings, showToast]);

  // Workspace-specific Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to complete segment and move to next
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeSegmentIndex < segments.length - 1) {
          setActiveSegmentIndex((prev) => prev + 1);
        }
        return;
      }

      // Alt + S / O / T for View Modes (when not accompanied by numbers)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setViewMode('split');
          showToast('Chế độ xem: Song song (⌥S)', 'info');
          return;
        }
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          setViewMode('original');
          showToast('Chế độ xem: Nguyên tác (⌥O)', 'info');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          setViewMode('translation');
          showToast('Chế độ xem: Bản dịch (⌥T)', 'info');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [segments, activeSegmentIndex, showToast]);

  // AI Chapter Analysis
  const handleRunAiAnalysis = async () => {
    if (!chapter || !activeStory) return;
    setIsAiAnalyzing(true);
    showToast('AI đang phân tích chapter...', 'info');

    try {
      const result = await analyzeChapterContent({
        storyTitle: activeStory.title,
        originalText: chapter.originalText,
        translationText: chapter.translationText,
        characters,
        translationMemories: memories,
        pronounRules,
        storyBible: bible,
      });

      setAiAnalysisResult(result);
      if (result.vocabularySuggestions.length > 0) {
        setActiveSidebarTab('memory');
      }
      showToast(`AI đã trích xuất xong! (${result.source === 'gemini' ? 'Gemini 3.8 Flash' : 'NLP Heuristic Engine'})`, 'success');
    } catch (e: any) {
      showToast('Lỗi phân tích: ' + e.message, 'error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Accept a vocabulary suggestion into Translation Memory
  const handleSaveToMemory = async (orig: string, trans: string, cat: any = 'expression') => {
    if (!activeStory || !chapter) return;

    const newTm: TranslationMemory = {
      id: `tm-${Date.now()}`,
      storyId: activeStory.id,
      original: orig,
      translation: trans,
      language: activeStory.sourceLanguage,
      context: `Thêm từ Chapter ${chapter.chapterNumber}`,
      chapterIds: [chapter.chapterNumber],
      frequency: 1,
      firstChapter: chapter.chapterNumber,
      lastChapter: chapter.chapterNumber,
      status: 'active',
      preferred: true,
      notes: 'Lưu từ Trợ lý Dịch thuật',
      category: cat,
    };

    await saveTranslationMemory(newTm);
    const updated = await getTranslationMemories(activeStory.id);
    setMemories(updated);
    setCandidateTm(null);
    showToast(`Đã lưu vào Translation Memory: ${orig} → ${trans}`, 'success');
  };

  const currentSegment = segments[activeSegmentIndex];

  // Matched memories for active segment
  const matchedMemories = memories.filter(
    (m) => currentSegment && currentSegment.originalText.includes(m.original)
  );

  // Active characters for active segment
  const presentCharacters = characters.filter(
    (c) =>
      currentSegment &&
      (currentSegment.translatedText.includes(c.name) ||
        c.aliases.some((a) => currentSegment.translatedText.includes(a)))
  );

  const translatedSegmentsCount = segments.filter((s) => s.translationStatus === 'translated' || s.translationStatus === 'reviewed').length;
  const progressPercent = segments.length > 0 ? Math.round((translatedSegmentsCount / segments.length) * 100) : 0;

  if (!chapter) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-stone-500">Chưa có chapter nào được chọn.</p>
        <button
          onClick={() => setCurrentView('story_detail')}
          className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-semibold"
        >
          Trở về Story Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 sm:-m-6 overflow-hidden bg-stone-100 dark:bg-stone-950">
      {/* 1. Header Toolbar (Section 61) */}
      <div className="h-14 px-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Back & Chapter Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('story_detail')}
            className="flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Story</span>
          </button>

          <span className="text-[#D7EDF2] dark:text-[#1F3A44]">|</span>

          <select
            value={chapter.id}
            onChange={(e) => setActiveChapterId(e.target.value)}
            className="text-xs font-serif font-bold py-1 px-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9]"
          >
            {allChapters.map((c) => (
              <option key={c.id} value={c.id}>
                Chapter {c.chapterNumber}: {c.title}
              </option>
            ))}
          </select>

          {/* Status Picker */}
          <select
            value={chapter.status}
            onChange={(e) => handleStatusChange(e.target.value as ChapterStatus)}
            className="text-[11px] font-semibold py-1 px-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] capitalize cursor-pointer"
          >
            <option value="draft">Draft</option>
            <option value="translating">Translating</option>
            <option value="reviewed">Reviewed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Center: Mode Switcher [Original] [Split] [Translation] */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] text-xs">
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              viewMode === 'original'
                ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold shadow-xs'
                : 'text-[#647780] hover:text-[#26343B]'
            }`}
          >
            Original Only
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold shadow-xs'
                : 'text-[#647780] hover:text-[#26343B]'
            }`}
          >
            Split (Song song)
          </button>
          <button
            onClick={() => setViewMode('translation')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              viewMode === 'translation'
                ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold shadow-xs'
                : 'text-[#647780] hover:text-[#26343B]'
            }`}
          >
            Translation Only
          </button>
        </div>

        {/* Right: Actions, Autosave & Sidebar toggle */}
        <div className="flex items-center gap-2">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#647780] font-medium mr-2">
            {saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">✓ Saved</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#2E6C7B] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#77CBDA]" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
          </div>

          {/* Recap Button */}
          <button
            onClick={() => setShowRecapModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#D7EDF2] dark:border-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] hover:bg-[#B3EBF2]/50 dark:bg-[#172D35] dark:hover:bg-[#1F3A44] transition-colors cursor-pointer"
            title="Xem tóm lược bối cảnh trước khi dịch"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recap</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="p-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] transition-colors cursor-pointer"
            title="Lịch sử phiên bản"
          >
            <History className="w-4 h-4" />
          </button>

          {/* AI Analysis Trigger */}
          <button
            onClick={handleRunAiAnalysis}
            disabled={isAiAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            title="AI phân tích chapter và đề xuất thuật ngữ"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B3EBF2]" />
            <span className="hidden md:inline">{isAiAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}</span>
          </button>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              sidebarOpen
                ? 'border-[#77CBDA] bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA]'
                : 'border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780]'
            }`}
            title="Đóng / mở Trợ lý Dịch thuật"
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-[#E8F7FA] dark:bg-[#172D35]">
        <div
          className="h-full bg-gradient-to-r from-[#77CBDA] to-[#2E6C7B] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area (Left / Center) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Chapter Subheader Stats */}
          <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                Chapter Progress:
              </span>
              <span>
                {translatedSegmentsCount} / {segments.length} segments translated ({progressPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search within chapter (Section 65) */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm trong chapter..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="pl-7 pr-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-hidden"
                />
              </div>

              <span className="hidden sm:inline text-stone-400 text-[11px]">
                Hotkeys: ⌘S (Lưu) • ⌘Enter (Hoàn tất đoạn)
              </span>
            </div>
          </div>

          {/* Segments List */}
          <div className="space-y-4 pb-24">
            {segments
              .filter((seg) => {
                if (!chapterSearch) return true;
                const q = chapterSearch.toLowerCase();
                return (
                  seg.originalText.toLowerCase().includes(q) ||
                  seg.translatedText.toLowerCase().includes(q) ||
                  seg.notes.toLowerCase().includes(q)
                );
              })
              .map((seg, idx) => {
                const isActive = activeSegmentIndex === idx;

                return (
                  <div
                    key={seg.segmentId}
                    onClick={() => setActiveSegmentIndex(idx)}
                    className={`rounded-2xl transition-all duration-150 border ${
                      isActive
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-white dark:bg-stone-900'
                        : 'border-stone-200 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/60 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    {/* Segment Meta Bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 dark:border-stone-800/60 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-400">
                          #{String(seg.segmentOrder).padStart(3, '0')}
                        </span>
                        {/* Status Toggle Button (Section 63) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSegmentStatusToggle(idx);
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full capitalize font-semibold cursor-pointer transition-colors ${
                            seg.translationStatus === 'reviewed'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : seg.translationStatus === 'translated'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : seg.translationStatus === 'draft'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                        >
                          <span>
                            {seg.translationStatus === 'reviewed'
                              ? '★ Reviewed'
                              : seg.translationStatus === 'translated'
                              ? '✓ Translated'
                              : seg.translationStatus === 'draft'
                              ? '◐ Draft'
                              : '○ Untranslated'}
                          </span>
                        </button>

                        {/* Speaker tag if present */}
                        {seg.characterFrom && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                            {seg.characterFrom} {seg.characterTo ? `→ ${seg.characterTo}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Copy Original Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(seg.originalText);
                            showToast('Đã sao chép nguyên tác!', 'info');
                          }}
                          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                          title="Sao chép nguyên tác"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Segment Content (Supports Split / Original / Translation View Modes) */}
                    <div
                      className={`p-4 gap-4 ${
                        viewMode === 'split'
                          ? 'grid grid-cols-1 md:grid-cols-2'
                          : 'block'
                      }`}
                    >
                      {/* ORIGINAL TEXT (Protected, copyable, intact) (Section 11) */}
                      {(viewMode === 'split' || viewMode === 'original') && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                            Original ({activeStory?.sourceLanguage.toUpperCase()})
                          </span>
                          <div className="font-serif text-sm leading-relaxed text-stone-900 dark:text-stone-100 select-text bg-stone-50/70 dark:bg-stone-950/50 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800">
                            {seg.originalText}
                          </div>
                        </div>
                      )}

                      {/* TRANSLATION INPUT (Vietnamese, editable independently) (Section 11) */}
                      {(viewMode === 'split' || viewMode === 'translation') && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                            Vietnamese Translation
                          </span>
                          <textarea
                            rows={Math.max(2, Math.ceil(seg.originalText.length / 50))}
                            placeholder="Nhập bản dịch tiếng Việt tại đây..."
                            value={seg.translatedText}
                            onChange={(e) => handleSegmentChange(idx, e.target.value)}
                            className="w-full font-serif text-sm leading-relaxed p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                          />
                        </div>
                      )}
                    </div>

                    {/* Segment Notes Footer (Section 64) */}
                    {seg.notes && (
                      <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-950/30 flex items-center gap-2">
                        <StickyNote className="w-3 h-3 text-amber-600" />
                        <span>{seg.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 3. AI Translation Assistant Sidebar (Right) (Section 38 & 60) */}
        {sidebarOpen && (
          <aside className="w-80 sm:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Sidebar Tabs */}
            <div className="flex items-center border-b border-stone-200 dark:border-stone-800 text-xs overflow-x-auto bg-stone-50/60 dark:bg-stone-950/60">
              <button
                onClick={() => setActiveSidebarTab('memory')}
                className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'memory'
                    ? 'border-amber-600 text-amber-900 dark:text-amber-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span>Memory</span>
                {matchedMemories.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-700 text-[10px] flex items-center justify-center">
                    {matchedMemories.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSidebarTab('pronouns')}
                className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'pronouns'
                    ? 'border-amber-600 text-amber-900 dark:text-amber-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Pronouns</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab('warnings')}
                className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'warnings'
                    ? 'border-amber-600 text-amber-900 dark:text-amber-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Warnings</span>
                {warnings.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {warnings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSidebarTab('context')}
                className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'context'
                    ? 'border-amber-600 text-amber-900 dark:text-amber-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Context</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: TRANSLATION MEMORY */}
              {activeSidebarTab === 'memory' && (
                <div className="space-y-4">
                  {/* Matched Memories for Current Segment */}
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
                      <span>Matches Trong Đoạn #{activeSegmentIndex + 1}</span>
                      <span className="text-[10px] text-amber-600 font-semibold">
                        {matchedMemories.length} match
                      </span>
                    </h4>

                    {matchedMemories.length === 0 ? (
                      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 text-stone-500 text-center">
                        <p>Không có từ nào trong đoạn này khớp với Translation Memory đã lưu.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {matchedMemories.map((mem) => (
                          <div
                            key={mem.id}
                            className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">
                                {mem.original}
                              </span>
                              {mem.preferred && (
                                <span className="text-amber-600 font-bold text-[10px] flex items-center gap-0.5">
                                  ⭐ Preferred
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-serif font-semibold text-emerald-700 dark:text-emerald-400">
                                → {mem.translation}
                              </span>
                              <button
                                onClick={() => {
                                  // Quick append/insert into current segment
                                  const cur = segments[activeSegmentIndex];
                                  handleSegmentChange(activeSegmentIndex, cur.translatedText ? `${cur.translatedText} ${mem.translation}` : mem.translation);
                                  showToast(`Đã chèn "${mem.translation}"`, 'info');
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]"
                              >
                                Chèn
                              </button>
                            </div>
                            <p className="text-[10px] text-stone-400">
                              Dùng {mem.frequency} lần (Ch. {mem.chapterIds.slice(0, 3).join(', ')})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Vocabulary Suggestions */}
                  {aiAnalysisResult?.vocabularySuggestions && aiAnalysisResult.vocabularySuggestions.length > 0 && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI Đề xuất lưu Translation Memory</span>
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysisResult.vocabularySuggestions.map((sug, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                                {sug.original}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/50 text-amber-900 dark:text-amber-200 font-medium capitalize">
                                {sug.category}
                              </span>
                            </div>
                            <p className="font-serif font-semibold text-emerald-700 dark:text-emerald-400">
                              → {sug.translation}
                            </p>
                            <p className="text-[10px] text-stone-500">{sug.notes}</p>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => handleSaveToMemory(sug.original, sug.translation, sug.category)}
                                className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-medium text-[10px]"
                              >
                                Lưu vào Memory
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Story Translation Memories summary */}
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-stone-500 uppercase text-[10px]">
                        Tất cả từ đã lưu ({memories.length})
                      </span>
                      <button
                        onClick={() => setCurrentView('tm')}
                        className="text-amber-700 dark:text-amber-400 hover:underline text-[10px]"
                      >
                        Quản lý TM →
                      </button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {memories.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/60 text-xs"
                        >
                          <span className="font-serif font-medium">{m.original}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-serif">
                            {m.translation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRONOUNS */}
              {activeSidebarTab === 'pronouns' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold uppercase tracking-wider text-stone-400">
                      Quy tắc xưng hô ({pronounRules.length})
                    </h4>
                    <button
                      onClick={() => setCurrentView('pronouns')}
                      className="text-amber-700 dark:text-amber-400 hover:underline text-[10px]"
                    >
                      Timeline xưng hô →
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-500">
                    Hệ thống kiểm tra đại từ xưng hô theo từng cặp nhân vật và cảnh báo nếu có sự xáo trộn bất thường.
                  </p>

                  <div className="space-y-2">
                    {pronounRules.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {p.fromCharacter} → {p.toCharacter}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Ch. {p.startChapter}–{p.endChapter || 'hiện tại'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 font-mono text-xs flex justify-between">
                          <span>Xưng: <strong className="text-amber-600">{p.selfPronoun}</strong></span>
                          <span>Gọi: <strong className="text-amber-600">{p.targetAddress}</strong></span>
                        </div>
                        <p className="text-[10px] text-stone-400 italic">{p.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: WARNINGS */}
              {activeSidebarTab === 'warnings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cảnh báo bất nhất ({warnings.length})</span>
                    </h4>
                    <button
                      onClick={() => setCurrentView('consistency_warnings')}
                      className="text-amber-700 dark:text-amber-400 hover:underline text-[10px]"
                    >
                      Review Center →
                    </button>
                  </div>

                  {warnings.length === 0 ? (
                    <div className="py-8 text-center space-y-2 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-medium text-stone-800 dark:text-stone-200">Không có cảnh báo nào</p>
                      <p className="text-[10px] text-stone-500">Mọi thuật ngữ và xưng hô trong chapter đều đồng bộ.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {warnings.map((w) => (
                        <div
                          key={w.id}
                          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900 dark:text-amber-300 capitalize text-xs">
                              ⚠️ {w.type} Inconsistency
                            </span>
                            <span className="text-[10px] uppercase font-bold text-rose-600">
                              {w.severity}
                            </span>
                          </div>

                          <p className="text-xs text-stone-700 dark:text-stone-300 font-serif">
                            {w.explanation}
                          </p>

                          <div className="pt-1 flex items-center justify-between">
                            <button
                              onClick={() => setActiveWarningForReview(w)}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1"
                            >
                              <span>So sánh & Quyết định</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONTEXT & BIBLE */}
              {activeSidebarTab === 'context' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Nhân vật xuất hiện
                    </h4>
                    <div className="space-y-2">
                      {characters.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 dark:text-stone-100">{c.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 capitalize">
                              {c.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500">{c.identity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bible?.translationStyle && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                      <h4 className="font-bold uppercase tracking-wider text-stone-400">
                        Văn phong & Style Rules
                      </h4>
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                        <p><strong>Tone:</strong> {bible.translationStyle.tone}</p>
                        <p><strong>Đối thoại:</strong> {bible.translationStyle.dialogueStyle}</p>
                        <p><strong>Tránh dùng:</strong> {bible.translationStyle.forbiddenTerms.join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Recap Modal (Before You Continue) */}
      {showRecapModal && (
        <RecapModal
          isOpen={showRecapModal}
          onClose={() => setShowRecapModal(false)}
          onStartTranslating={() => setShowRecapModal(false)}
        />
      )}

      {/* Review Previous Usage Modal */}
      {activeWarningForReview && (
        <ReviewPreviousUsageModal
          warning={activeWarningForReview}
          onClose={() => setActiveWarningForReview(null)}
          onResolve={async (action) => {
            const w = activeWarningForReview;
            if (action === 'use_previous') {
              // Replace in segment
              if (w.segmentId) {
                const segIdx = segments.findIndex((s) => s.segmentId === w.segmentId);
                if (segIdx !== -1) {
                  // Replace
                  const updated = [...segments];
                  updated[segIdx].translatedText = updated[segIdx].translatedText.replace(
                    w.currentTranslation,
                    w.previousTranslation
                  );
                  setSegments(updated);
                  triggerAutoSave(updated);
                  showToast(`Đã thay thế bằng: "${w.previousTranslation}"`, 'success');
                }
              }
            } else if (action === 'keep_current') {
              showToast('Đã giữ nguyên cách dịch hiện tại', 'info');
            } else if (action === 'create_rule') {
              showToast('Đã tạo quy tắc xưng hô / ngữ cảnh mới!', 'success');
            }

            // Mark warning resolved/ignored
            const updatedWarning: ConsistencyWarning = {
              ...w,
              status: action === 'ignore' ? 'ignored' : 'resolved',
            };
            await saveWarning(updatedWarning);
            const allW = await getWarnings(activeStory?.id || '');
            setWarnings(allW.filter((item) => item.chapterId === chapter.id && item.status === 'open'));
            refreshWarnings();
            setActiveWarningForReview(null);
          }}
        />
      )}

      {/* Version History Modal */}
      {isVersionModalOpen && (
        <VersionHistoryModal
          chapterId={chapter.id}
          chapterNumber={chapter.chapterNumber}
          currentTranslation={chapter.translationText}
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          onRestore={(text) => {
            // Split restored text into segments
            const lines = text.split('\n');
            const updated = segments.map((seg, i) => ({
              ...seg,
              translatedText: lines[i] || '',
              translationStatus: (lines[i] ? 'translated' : 'untranslated') as SegmentStatus,
            }));
            setSegments(updated);
            triggerAutoSave(updated);
            showToast('Đã khôi phục phiên bản!', 'success');
          }}
        />
      )}
    </div>
  );
};
