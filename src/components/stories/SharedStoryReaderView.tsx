import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Chapter, Story, Character, TranslationMemory, PronounRule } from '../../types';
import {
  getChaptersByStory,
  getCharacters,
  getTranslationMemories,
  getPronounRules,
  getStoryBible,
} from '../../services/db';
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Brain,
  FileText,
  Users,
  Compass,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export const SharedStoryReaderView: React.FC = () => {
  const { sharedStory, setCurrentView, activeStory } = useApp();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [memories, setMemories] = useState<TranslationMemory[]>([]);
  const [pronouns, setPronouns] = useState<PronounRule[]>([]);
  const [activeTab, setActiveTab] = useState<'read' | 'characters' | 'memory' | 'pronouns' | 'summary'>('read');
  const [loading, setLoading] = useState(true);

  const story = sharedStory || activeStory;

  useEffect(() => {
    if (!story) return;
    loadStoryData(story.id);
  }, [story?.id]);

  const loadStoryData = async (storyId: string) => {
    setLoading(true);
    try {
      const chaps = await getChaptersByStory(storyId);
      setChapters(chaps);
      if (chaps.length > 0) {
        setSelectedChapter(chaps[0]);
      }

      if (story?.sharingPermissions?.showCharacters) {
        const chars = await getCharacters(storyId);
        setCharacters(chars);
      }

      if (story?.sharingPermissions?.showTranslationMemory) {
        const tms = await getTranslationMemories(storyId);
        setMemories(tms);
      }

      if (story?.sharingPermissions?.showPronouns) {
        const prs = await getPronounRules(storyId);
        setPronouns(prs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!story) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44]">
        <p className="text-sm text-[#647780]">Không tìm thấy thông tin tác phẩm được chia sẻ.</p>
        <button
          onClick={() => setCurrentView('explore')}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-[#2E6C7B] text-white rounded-xl"
        >
          Quay lại Thư viện Cộng đồng
        </button>
      </div>
    );
  }

  const permissions = story.sharingPermissions || {
    showOriginal: false,
    showTranslation: true,
    showSummary: true,
    showCharacters: true,
    showStoryBible: false,
    showPlotTimeline: false,
    showTranslationMemory: true,
    showTerminology: true,
    showPronouns: true,
  };

  const handlePrevChapter = () => {
    if (!selectedChapter) return;
    const currentIndex = chapters.findIndex((c) => c.id === selectedChapter.id);
    if (currentIndex > 0) {
      setSelectedChapter(chapters[currentIndex - 1]);
    }
  };

  const handleNextChapter = () => {
    if (!selectedChapter) return;
    const currentIndex = chapters.findIndex((c) => c.id === selectedChapter.id);
    if (currentIndex < chapters.length - 1) {
      setSelectedChapter(chapters[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('explore')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E6C7B] dark:text-[#77CBDA] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Khám phá</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
            <span>
              {story.privacy === 'public'
                ? 'Công khai (Public)'
                : story.privacy === 'link_only'
                ? 'Chia sẻ qua liên kết'
                : 'Chế độ người đọc'}
            </span>
          </span>
          <span className="text-[11px] text-[#647780]">
            Dịch giả: <strong className="text-[#26343B] dark:text-[#ECF7F9]">{story.ownerName || 'Translator'}</strong>
          </span>
        </div>
      </div>

      {/* Story Title & Meta Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
              {story.sourceLanguage === 'zh' ? 'Nguyên tác tiếng Trung' : 'Nguyên tác tiếng Anh'} → Bản dịch tiếng Việt
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#26343B] dark:text-[#ECF7F9]">
              {story.title}
            </h1>
            <p className="text-xs text-[#647780]">
              Tác giả: <span className="font-medium text-[#26343B] dark:text-[#ECF7F9]">{story.author}</span> • Tiến độ: {chapters.length}/{story.totalChapters} chương
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap gap-1.5 bg-[#F4FBFD] dark:bg-[#172D35] p-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44]">
            {permissions.showTranslation && (
              <button
                onClick={() => setActiveTab('read')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'read'
                    ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                    : 'text-[#647780]'
                }`}
              >
                Đọc chương
              </button>
            )}

            {permissions.showSummary && (
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'summary'
                    ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                    : 'text-[#647780]'
                }`}
              >
                Tóm tắt chương
              </button>
            )}

            {permissions.showCharacters && (
              <button
                onClick={() => setActiveTab('characters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'characters'
                    ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                    : 'text-[#647780]'
                }`}
              >
                Nhân vật ({characters.length})
              </button>
            )}

            {permissions.showPronouns && (
              <button
                onClick={() => setActiveTab('pronouns')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'pronouns'
                    ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                    : 'text-[#647780]'
                }`}
              >
                Xưng hô ({pronouns.length})
              </button>
            )}

            {permissions.showTranslationMemory && (
              <button
                onClick={() => setActiveTab('memory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'memory'
                    ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                    : 'text-[#647780]'
                }`}
              >
                Từ điển TM ({memories.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Reader View */}
      {activeTab === 'read' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Chapter list selector */}
          <div className="lg:col-span-1 bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-4 space-y-2 max-h-[600px] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#26343B] dark:text-[#ECF7F9] mb-2">
              Danh sách chương
            </h3>
            {chapters.map((chap) => (
              <button
                key={chap.id}
                onClick={() => setSelectedChapter(chap)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                  selectedChapter?.id === chap.id
                    ? 'bg-[#B3EBF2]/40 text-[#2E6C7B] dark:bg-[#172D35] dark:text-[#77CBDA] font-semibold border border-[#77CBDA]/50'
                    : 'text-[#647780] hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Chương {chap.chapterNumber}</span>
                  <span className="text-[10px] text-[#647780]">
                    {chap.status === 'completed' || chap.status === 'reviewed' ? 'Đã dịch' : 'Bản nháp'}
                  </span>
                </div>
                <p className="truncate text-[11px] text-[#26343B] dark:text-[#ECF7F9] font-serif mt-0.5">
                  {chap.title}
                </p>
              </button>
            ))}
          </div>

          {/* Reader Body */}
          <div className="lg:col-span-3 bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-6 sm:p-8 space-y-6 shadow-xs">
            {selectedChapter ? (
              <>
                <div className="flex items-center justify-between border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-4">
                  <div>
                    <span className="text-xs font-bold text-[#2E6C7B] dark:text-[#77CBDA] uppercase tracking-wider">
                      Chương {selectedChapter.chapterNumber}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9]">
                      {selectedChapter.title}
                    </h2>
                  </div>

                  {/* Navigation prev/next */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevChapter}
                      disabled={chapters.findIndex((c) => c.id === selectedChapter.id) <= 0}
                      className="p-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:text-[#26343B] disabled:opacity-30 cursor-pointer"
                      title="Chương trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextChapter}
                      disabled={
                        chapters.findIndex((c) => c.id === selectedChapter.id) >=
                        chapters.length - 1
                      }
                      className="p-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780] hover:text-[#26343B] disabled:opacity-30 cursor-pointer"
                      title="Chương sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Side-by-side or Single View depending on permissions */}
                {permissions.showOriginal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 p-4 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#647780]">
                        Nguyên tác ({story.sourceLanguage === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh'})
                      </span>
                      <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-[#26343B] dark:text-[#ECF7F9]">
                        {selectedChapter.originalText || '(Chưa có văn bản gốc)'}
                      </div>
                    </div>

                    <div className="space-y-2 p-4 rounded-xl bg-white dark:bg-[#122228] border border-[#77CBDA]/40 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                        Bản dịch Tiếng Việt
                      </span>
                      <div className="text-sm font-serif leading-relaxed whitespace-pre-line text-[#26343B] dark:text-[#ECF7F9]">
                        {selectedChapter.translationText || '(Đang dịch chương này...)'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#647780] bg-[#F4FBFD] dark:bg-[#172D35] px-3 py-1.5 rounded-lg border border-[#D7EDF2] dark:border-[#1F3A44]">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Nguyên tác được chủ sở hữu giữ riêng tư. Bạn đang xem bản dịch được phép chia sẻ.</span>
                    </div>
                    <div className="text-base font-serif leading-relaxed whitespace-pre-line text-[#26343B] dark:text-[#ECF7F9] p-4 rounded-xl bg-[#F4FBFD]/40 dark:bg-[#172D35]/30">
                      {selectedChapter.translationText || '(Bản dịch chương này chưa được công bố)'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-[#647780]">Chọn một chương để bắt đầu đọc.</p>
            )}
          </div>
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                  {char.name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
                  {char.role}
                </span>
              </div>
              <p className="text-xs text-[#647780] leading-relaxed">
                {char.identity || 'Chưa cập nhật thông tin'}
              </p>
              {char.speakingStyle && (
                <p className="text-[11px] text-[#2E6C7B] dark:text-[#77CBDA]">
                  Khí chất: {char.speakingStyle}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Translation Memory Tab */}
      {activeTab === 'memory' && (
        <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden">
          <div className="p-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
            <h3 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
              Thuật ngữ và Bộ nhớ dịch ({memories.length})
            </h3>
          </div>
          <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
            {memories.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
                    {m.original}
                  </span>
                  <span className="mx-2 text-[#647780]">→</span>
                  <span className="font-semibold text-sm text-[#2E6C7B] dark:text-[#77CBDA]">
                    {m.translation}
                  </span>
                  <p className="text-[11px] text-[#647780] mt-0.5">{m.context}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA]">
                  {m.category || 'Thuật ngữ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pronouns Tab */}
      {activeTab === 'pronouns' && (
        <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden">
          <div className="p-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
            <h3 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
              Quy tắc xưng hô ({pronouns.length})
            </h3>
          </div>
          <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
            {pronouns.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#26343B] dark:text-[#ECF7F9]">
                    {p.fromCharacter} ➔ {p.toCharacter}
                  </span>
                  <p className="text-xs text-[#2E6C7B] dark:text-[#77CBDA] font-serif mt-0.5">
                    Tự xưng: "{p.selfPronoun}" • Gọi đối phương: "{p.targetAddress}"
                  </p>
                  <p className="text-[10px] text-[#647780] mt-0.5">{p.context}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA]">
                  Chương {p.startChapter} - {p.endChapter ? p.endChapter : 'Hiện tại'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          {chapters.map((chap) => (
            <div
              key={chap.id}
              className="p-4 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2E6C7B] dark:text-[#77CBDA]">
                  Chương {chap.chapterNumber}: {chap.title}
                </span>
                <span className="text-[10px] text-[#647780]">
                  {chap.summary ? 'Tóm tắt sự kiện' : 'Chưa có tóm tắt'}
                </span>
              </div>
              <p className="text-xs text-[#26343B] dark:text-[#ECF7F9] leading-relaxed">
                {chap.summary || 'Chưa tạo tóm tắt cho chương này.'}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
