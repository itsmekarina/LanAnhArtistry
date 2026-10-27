import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Story, TranslationMemory, PronounRule } from '../../types';
import {
  getAllStories,
  getPublicLanguageMemories,
  saveTranslationMemory,
  savePronounRule,
} from '../../services/db';
import {
  Globe,
  Brain,
  Search,
  BookOpen,
  User,
  ArrowRight,
  Sparkles,
  Download,
  Check,
  Lock,
  Link2,
  Filter,
  CheckCircle2,
  Layers,
  Languages,
} from 'lucide-react';

export const ExplorePublicView: React.FC = () => {
  const { activeStory, openSharedStory, showToast, setCurrentView } = useApp();

  const [activeTab, setActiveTab] = useState<'stories' | 'memory'>('stories');
  const [publicStories, setPublicStories] = useState<Story[]>([]);
  const [publicMemories, setPublicMemories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'zh' | 'en'>('all');
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await getAllStories();
      // Public stories
      const pub = all.filter((s) => s.privacy === 'public');
      setPublicStories(pub);

      // Public language memories
      const mems = await getPublicLanguageMemories();
      setPublicMemories(mems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMemory = async (item: any) => {
    if (!activeStory) {
      showToast('Vui lòng chọn hoặc tạo một truyện của bạn trước khi nhập từ vựng.', 'warning');
      return;
    }

    try {
      const newMemory: TranslationMemory = {
        id: `tm-imported-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        storyId: activeStory.id,
        original: item.original,
        translation: item.translation,
        language: item.language,
        context: item.contextSanitized || `Được nhập từ kho cộng đồng (${item.storyTitle})`,
        frequency: 1,
        firstChapter: 1,
        lastChapter: 1,
        chapterIds: [1],
        status: 'active',
        preferred: true,
        notes: `Chia sẻ bởi dịch giả: ${item.contributorName}`,
        category: (item.category as any) || 'terminology',
      };

      await saveTranslationMemory(newMemory);
      setImportedIds((prev) => ({ ...prev, [item.id]: true }));
      showToast(`✓ Đã lưu "${item.original} → ${item.translation}" vào bộ nhớ truyện của bạn!`, 'success');
    } catch (e: any) {
      showToast('Lỗi nhập từ vựng: ' + e.message, 'error');
    }
  };

  const filteredStories = publicStories.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = languageFilter === 'all' || s.sourceLanguage === languageFilter;
    return matchesSearch && matchesLang;
  });

  const filteredMemories = publicMemories.filter((m) => {
    const matchesSearch =
      m.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.storyTitle && m.storyTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.contributorName && m.contributorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLang = languageFilter === 'all' || m.language === languageFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      
      {/* Hero Banner in Pastel Blue */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#E8F7FA] via-[#F4FBFD] to-[#E8F7FA] dark:from-[#172D35] dark:via-[#122228] dark:to-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>LanAnhArtistry Community Library</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#26343B] dark:text-[#ECF7F9]">
              Khám Phá & Chia Sẻ Tri Thức Dịch Thuật
            </h1>
            <p className="text-xs sm:text-sm text-[#647780] dark:text-[#8AA4AE] max-w-2xl leading-relaxed">
              Truy cập các tác phẩm được công khai hoặc học hỏi từ kho từ vựng và đại từ xưng hô được đóng góp bởi các dịch giả văn học.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'stories'
                  ? 'bg-[#2E6C7B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#122228] text-[#647780] hover:text-[#26343B] border border-[#D7EDF2] dark:border-[#1F3A44]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tác phẩm công khai ({publicStories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'memory'
                  ? 'bg-[#2E6C7B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#122228] text-[#647780] hover:text-[#26343B] border border-[#D7EDF2] dark:border-[#1F3A44]'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Kho từ vựng & xưng hô ({publicMemories.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#647780] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'stories'
                ? 'Tìm kiếm theo tên truyện, tác giả, dịch giả...'
                : 'Tìm kiếm từ gốc (师兄, 师尊), từ dịch, tên truyện...'
            }
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-xl p-1 bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44]">
            <button
              onClick={() => setLanguageFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                languageFilter === 'all'
                  ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                  : 'text-[#647780]'
              }`}
            >
              Tất cả ngôn ngữ
            </button>
            <button
              onClick={() => setLanguageFilter('zh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                languageFilter === 'zh'
                  ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                  : 'text-[#647780]'
              }`}
            >
              Trung → Việt
            </button>
            <button
              onClick={() => setLanguageFilter('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                languageFilter === 'en'
                  ? 'bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                  : 'text-[#647780]'
              }`}
            >
              Anh → Việt
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          {filteredStories.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44]">
              <Globe className="w-10 h-10 text-[#77CBDA] mx-auto mb-3" />
              <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                Không có truyện công khai nào khớp với tìm kiếm
              </h3>
              <p className="text-xs text-[#647780] mt-1 max-w-md mx-auto">
                Hiện tại các truyện khác đang được tác giả giữ ở chế độ Riêng tư hoặc Chia sẻ qua liên kết bí mật.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStories.map((story) => (
                <div
                  key={story.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] hover:border-[#77CBDA] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
                        {story.sourceLanguage === 'zh' ? 'Trung → Việt' : 'Anh → Việt'}
                      </span>
                      <span className="text-[11px] text-[#647780] flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{story.ownerName || 'Dịch giả'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9] line-clamp-1">
                        {story.title}
                      </h3>
                      <p className="text-xs text-[#647780] line-clamp-1 mt-0.5">
                        Tác giả: {story.author}
                      </p>
                    </div>

                    <p className="text-xs text-[#647780] line-clamp-2 leading-relaxed">
                      {story.description || 'Chưa có lời giới thiệu'}
                    </p>

                    {/* Permissions allowed */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {story.sharingPermissions.showTranslation && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✓ Bản dịch
                        </span>
                      )}
                      {story.sharingPermissions.showOriginal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          ✓ Nguyên tác
                        </span>
                      )}
                      {story.sharingPermissions.showCharacters && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          ✓ Nhân vật
                        </span>
                      )}
                      {story.sharingPermissions.showTranslationMemory && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                          ✓ TM từ điển
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] flex items-center justify-between">
                    <span className="text-[11px] text-[#647780]">
                      {story.translatedChapters}/{story.totalChapters} chương
                    </span>
                    <button
                      onClick={() => openSharedStory(story)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Xem tác phẩm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Shared Language Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          
          <div className="p-4 rounded-xl bg-[#E8F7FA] dark:bg-[#172D35] border border-[#77CBDA]/40 flex items-start gap-3">
            <Brain className="w-5 h-5 text-[#2E6C7B] dark:text-[#77CBDA] shrink-0 mt-0.5" />
            <div className="text-xs text-[#26343B] dark:text-[#ECF7F9] space-y-1">
              <p className="font-semibold">Kho Từ Vựng & Quy Tắc Xưng Hô Dùng Chung:</p>
              <p className="text-[#647780] dark:text-[#C9EAF2] leading-relaxed">
                Những thuật ngữ này được các dịch giả chọn lọc và chia sẻ công khai mà không làm lộ nội dung hay bí mật truyện của họ. Bạn có thể nhấn <strong>"Nhập vào TM"</strong> để bổ sung ngay vào truyện bạn đang dịch!
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9]">
                    <th className="py-3 px-4 font-semibold">Nguyên ngữ (Original)</th>
                    <th className="py-3 px-4 font-semibold">Bản dịch chuẩn (Vietnamese)</th>
                    <th className="py-3 px-4 font-semibold">Phân loại</th>
                    <th className="py-3 px-4 font-semibold">Tác phẩm & Đóng góp</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
                  {filteredMemories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#647780]">
                        Không tìm thấy từ vựng nào khớp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredMemories.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F4FBFD]/60 dark:hover:bg-[#172D35]/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-serif text-sm font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                          {item.original}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#2E6C7B] dark:text-[#77CBDA]">
                          {item.translation}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
                            {item.category || 'Thuật ngữ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#647780]">
                          <span className="block font-medium text-[#26343B] dark:text-[#ECF7F9] truncate max-w-xs">
                            {item.storyTitle}
                          </span>
                          <span className="text-[10px] text-[#647780]">
                            Bởi: {item.contributorName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleImportMemory(item)}
                            disabled={importedIds[item.id]}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                              importedIds[item.id]
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-[#E8F7FA] hover:bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#172D35] dark:hover:bg-[#1F3A44] dark:text-[#77CBDA]'
                            }`}
                          >
                            {importedIds[item.id] ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã lưu</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Lưu vào TM</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
