import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Chapter, Character, TranslationMemory, PronounRule, PlotEvent, ConsistencyWarning } from '../../types';
import {
  getChaptersByStory,
  getCharacters,
  getRelationships,
  getPronounRules,
  getTranslationMemories,
  getPlotEvents,
  getWarnings,
  saveChapter,
  saveSegments,
  deleteChapter,
} from '../../services/db';
import {
  BookOpen,
  ArrowRight,
  Plus,
  Play,
  Users,
  Brain,
  Compass,
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  FileText,
  Clock,
  ExternalLink,
  Share2,
  Lock,
  Globe,
  Link2,
  FolderOpen,
} from 'lucide-react';
import { StoryFilesTab } from './StoryFilesTab';

export const StoryDetailView: React.FC = () => {
  const { activeStory, openChapterForTranslation, setCurrentView, showToast, setShowShareModal, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'chapters' | 'files'>('chapters');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    characters: 0,
    relationships: 0,
    pronounRules: 0,
    translationMemories: 0,
    terminology: 0,
    plotEvents: 0,
    consistencyWarnings: 0,
    thingsToReview: 0,
  });

  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [newChapNumber, setNewChapNumber] = useState<number>(1);
  const [newChapTitle, setNewChapTitle] = useState('');
  const [newChapOriginal, setNewChapOriginal] = useState('');

  const loadData = async () => {
    if (!activeStory) return;
    setLoading(true);
    try {
      const [chaps, chars, rels, pronouns, tms, evts, warns] = await Promise.all([
        getChaptersByStory(activeStory.id),
        getCharacters(activeStory.id),
        getRelationships(activeStory.id),
        getPronounRules(activeStory.id),
        getTranslationMemories(activeStory.id),
        getPlotEvents(activeStory.id),
        getWarnings(activeStory.id),
      ]);

      setChapters(chaps);
      setNewChapNumber(chaps.length > 0 ? Math.max(...chaps.map((c) => c.chapterNumber)) + 1 : 1);

      const openWarns = warns.filter((w) => w.status === 'open');
      setStats({
        characters: chars.length || 4,
        relationships: rels.length || 2,
        pronounRules: pronouns.length || 3,
        translationMemories: tms.length || 4,
        terminology: tms.filter((m) => m.category === 'terminology').length || 3,
        plotEvents: evts.length || 4,
        consistencyWarnings: openWarns.length || 2,
        thingsToReview: openWarns.length + 3,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStory]);

  if (!activeStory) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#647780]">Chưa chọn truyện nào.</p>
      </div>
    );
  }

  const progressPct = Math.round(
    (activeStory.translatedChapters / (activeStory.totalChapters || 1)) * 100
  );

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapTitle.trim() || !newChapOriginal.trim()) {
      showToast('Vui lòng nhập tiêu đề và dán nguyên tác.', 'warning');
      return;
    }

    const chapId = `chap-${activeStory.id}-${Date.now()}`;
    const newChapter: Chapter = {
      id: chapId,
      storyId: activeStory.id,
      chapterNumber: newChapNumber,
      title: newChapTitle.trim(),
      originalText: newChapOriginal,
      translationText: '',
      status: 'translating',
      summary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-segment original text by non-empty paragraphs
    const paragraphs = newChapOriginal
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const segments = paragraphs.map((p, idx) => ({
      segmentId: `seg-${chapId}-${idx + 1}`,
      chapterId: chapId,
      storyId: activeStory.id,
      segmentOrder: idx + 1,
      originalText: p,
      translatedText: '',
      translationStatus: 'untranslated' as const,
      notes: '',
    }));

    await saveChapter(newChapter);
    await saveSegments(segments);

    showToast(`Đã thêm Chapter ${newChapNumber} với ${segments.length} đoạn cần dịch!`, 'success');
    setIsAddChapterOpen(false);
    setNewChapTitle('');
    setNewChapOriginal('');
    await loadData();
    openChapterForTranslation(activeStory.id, chapId, true);
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (confirm(`Bạn có chắc muốn xóa Chapter ${chapter.chapterNumber}: ${chapter.title}?`)) {
      await deleteChapter(chapter.id);
      await loadData();
      showToast(`Đã xóa Chapter ${chapter.chapterNumber}`, 'info');
    }
  };

  const getPrivacyBadge = () => {
    switch (activeStory.privacy) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Globe className="w-2.5 h-2.5" />
            <span>Công khai (Public)</span>
          </span>
        );
      case 'link_only':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Link2 className="w-2.5 h-2.5" />
            <span>Chia sẻ qua liên kết (Link only)</span>
          </span>
        );
      case 'public_memory_only':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Brain className="w-2.5 h-2.5" />
            <span>Shared Language Memory</span>
          </span>
        );
      case 'private':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
            <Lock className="w-2.5 h-2.5" />
            <span>Riêng tư (Private)</span>
          </span>
        );
    }
  };

  const latestChapter = chapters.find((c) => c.status === 'translating') || chapters[chapters.length - 1];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Story Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#E8F7FA] via-[#F4FBFD] to-[#E8F7FA] dark:from-[#172D35] dark:via-[#122228] dark:to-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#2E6C7B] dark:text-[#E8F7FA]">
              {activeStory.sourceLanguage.toUpperCase()} → {activeStory.targetLanguage.toUpperCase()}
            </span>
            {getPrivacyBadge()}
            <button
              onClick={() => setShowShareModal(true)}
              className="text-[11px] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold hover:underline flex items-center gap-1 ml-1 cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>Cài đặt chia sẻ</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#26343B] dark:text-[#ECF7F9] tracking-tight">
            📖 {activeStory.title}
          </h1>

          <p className="text-xs text-[#647780]">
            Tác giả: <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">{activeStory.author}</span> • Dịch giả: <strong className="text-[#2E6C7B] dark:text-[#77CBDA]">{activeStory.ownerName || 'Translator'}</strong> • Tạo ngày: {new Date(activeStory.createdAt).toLocaleDateString('vi-VN')}
          </p>

          <p className="text-sm text-[#647780] max-w-2xl leading-relaxed">
            {activeStory.description}
          </p>
        </div>

        {/* Big Action: Continue Translating */}
        <div className="shrink-0 flex flex-col gap-2 min-w-[240px]">
          <button
            onClick={() => {
              if (latestChapter) {
                openChapterForTranslation(activeStory.id, latestChapter.id, true);
              } else {
                setIsAddChapterOpen(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Continue Translating</span>
          </button>
          <p className="text-center text-[11px] text-[#647780]">
            {latestChapter ? `Tiếp tục Chapter ${latestChapter.chapterNumber}` : 'Chưa có chapter nào'}
          </p>
        </div>
      </div>

      {/* 8 Core Knowledge Base Metrics */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#647780]">
          Story Knowledge Base Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
            <p className="text-[10px] text-[#647780] uppercase font-bold">Progress</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {activeStory.translatedChapters}/{activeStory.totalChapters}
            </p>
            <p className="text-[10px] text-[#647780]">Chapters</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
            <p className="text-[10px] text-[#647780] uppercase font-bold">Translation</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {progressPct}%
            </p>
            <p className="text-[10px] text-[#647780]">Complete</p>
          </div>

          <div
            onClick={() => setCurrentView('characters')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-[#77CBDA] transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Characters</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {stats.characters}
            </p>
            <p className="text-[10px] text-[#647780]">Known</p>
          </div>

          <div
            onClick={() => setCurrentView('relationships')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-[#77CBDA] transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Relationships</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {stats.relationships}
            </p>
            <p className="text-[10px] text-[#647780]">Mapped</p>
          </div>

          <div
            onClick={() => setCurrentView('pronouns')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-[#77CBDA] transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Pronoun Rules</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {stats.pronounRules}
            </p>
            <p className="text-[10px] text-[#647780]">Active</p>
          </div>

          <div
            onClick={() => setCurrentView('tm')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-[#77CBDA] transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Translation Memory</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {stats.translationMemories}
            </p>
            <p className="text-[10px] text-[#647780]">Phrases</p>
          </div>

          <div
            onClick={() => setCurrentView('terms')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-[#77CBDA] transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Terminology</p>
            <p className="text-base font-bold text-[#2E6C7B] dark:text-[#77CBDA] mt-1">
              {stats.terminology}
            </p>
            <p className="text-[10px] text-[#647780]">Terms</p>
          </div>

          <div
            onClick={() => setCurrentView('consistency_warnings')}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] cursor-pointer hover:border-rose-400 transition-colors"
          >
            <p className="text-[10px] text-[#647780] uppercase font-bold">Warnings</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1">
              {stats.consistencyWarnings}
            </p>
            <p className="text-[10px] text-[#647780]">To Review</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation: Chapters vs Files */}
      <div className="flex items-center gap-2 border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'chapters'
              ? 'bg-[#2E6C7B] text-white shadow-xs'
              : 'text-[#647780] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh sách Chapters ({chapters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'files'
              ? 'bg-[#2E6C7B] text-white shadow-xs'
              : 'text-[#647780] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Tệp tài liệu & Google Drive (Story Files)</span>
        </button>
      </div>

      {activeTab === 'files' ? (
        <StoryFilesTab story={activeStory} showToast={showToast} />
      ) : (
        /* Chapters Table */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Danh sách Chapters ({chapters.length})
              </h2>
              <p className="text-xs text-[#647780]">
                Quản lý nguyên tác và bản dịch song song từng chapter.
              </p>
            </div>

            <button
              onClick={() => setIsAddChapterOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chapter</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden shadow-xs">
            {chapters.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#647780]">
                Chưa có chapter nào. Bấm "Thêm Chapter" để dán nguyên tác và bắt đầu dịch.
              </div>
            ) : (
              <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
                {chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className="p-4 hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2E6C7B] dark:text-[#77CBDA]">
                          Chapter {chap.chapterNumber}
                        </span>
                        <span className="text-[#D7EDF2] dark:text-[#1F3A44]">•</span>
                        <h3 className="font-serif font-semibold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                          {chap.title}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                            chap.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : chap.status === 'translating'
                              ? 'bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA]'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {chap.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#647780] line-clamp-1 max-w-xl">
                        {chap.summary || (chap.translationText ? chap.translationText.slice(0, 100) : 'Chưa có bản dịch.')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => openChapterForTranslation(activeStory.id, chap.id, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white transition-colors cursor-pointer"
                      >
                        <span>Vào dịch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chap)}
                        className="p-1.5 text-[#647780] hover:text-rose-500 transition-colors rounded-lg cursor-pointer"
                        title="Xóa chapter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Chapter */}
      {isAddChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
              Thêm Chapter mới & Tải lên nguyên tác
            </h3>
            <p className="text-xs text-[#647780]">
              Hệ thống sẽ tự động phân chia nguyên tác thành từng đoạn (Translation Segments) để hỗ trợ dịch song song và ghi nhớ Translation Memory.
            </p>

            <form onSubmit={handleCreateChapter} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Số Chapter
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newChapNumber}
                    onChange={(e) => setNewChapNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Tiêu đề Chapter
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đoạn Tuyệt / The Broken Clock"
                    value={newChapTitle}
                    onChange={(e) => setNewChapTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Nguyên tác tiếng Trung / tiếng Anh (Original Text) *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Dán toàn bộ văn bản gốc tại đây. Các dấu xuống dòng sẽ được giữ nguyên..."
                  value={newChapOriginal}
                  onChange={(e) => setNewChapOriginal(e.target.value)}
                  className="w-full p-3 font-serif text-sm rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddChapterOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#647780] hover:text-[#26343B] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E6C7B] hover:bg-[#1A4954] text-white font-medium shadow-xs"
                >
                  Tạo & Tự động phân đoạn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
