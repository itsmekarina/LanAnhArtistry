import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TranslationMemory, SourceLanguage } from '../../types';
import {
  getTranslationMemories,
  saveTranslationMemory,
  deleteTranslationMemory,
  getGlobalMemories,
} from '../../services/db';
import {
  Brain,
  Search,
  Plus,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  Filter,
  Check,
  BookOpen,
  X,
  Globe,
  Lock,
} from 'lucide-react';

export const TranslationMemoryView: React.FC = () => {
  const { activeStory, openChapterForTranslation, showToast } = useApp();
  const [memories, setMemories] = useState<TranslationMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMemoryForOccurrences, setSelectedMemoryForOccurrences] = useState<TranslationMemory | null>(null);

  // Add / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [origInput, setOrigInput] = useState('');
  const [transInput, setTransInput] = useState('');
  const [catInput, setCatInput] = useState<any>('terminology');
  const [contextInput, setContextInput] = useState('');
  const [charFromInput, setCharFromInput] = useState('');
  const [charToInput, setCharToInput] = useState('');
  const [preferredInput, setPreferredInput] = useState(true);

  const loadMemories = async () => {
    if (!activeStory) return;
    const list = await getTranslationMemories(activeStory.id);
    setMemories(list);
  };

  useEffect(() => {
    loadMemories();
  }, [activeStory]);

  const filtered = memories.filter((m) => {
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      m.original.toLowerCase().includes(q) ||
      m.translation.toLowerCase().includes(q) ||
      m.context.toLowerCase().includes(q) ||
      (m.characterFrom && m.characterFrom.toLowerCase().includes(q)) ||
      (m.characterTo && m.characterTo.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const handleTogglePreferred = async (mem: TranslationMemory) => {
    const updated = { ...mem, preferred: !mem.preferred };
    await saveTranslationMemory(updated);
    await loadMemories();
    showToast(`Đã cập nhật trạng thái ⭐ Preferred cho "${mem.original}"`, 'info');
  };

  const handleDelete = async (id: string, orig: string) => {
    if (confirm(`Bạn có chắc muốn xóa Translation Memory cho "${orig}"?`)) {
      await deleteTranslationMemory(id);
      await loadMemories();
      showToast('Đã xóa Translation Memory', 'info');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origInput.trim() || !transInput.trim() || !activeStory) return;

    const memoryItem: TranslationMemory = {
      id: editingId || `tm-${Date.now()}`,
      storyId: activeStory.id,
      original: origInput.trim(),
      translation: transInput.trim(),
      language: activeStory.sourceLanguage,
      category: catInput,
      context: contextInput.trim() || 'Lưu thủ công',
      characterFrom: charFromInput.trim() || undefined,
      characterTo: charToInput.trim() || undefined,
      chapterIds: [1],
      frequency: editingId ? (memories.find((m) => m.id === editingId)?.frequency || 1) : 1,
      firstChapter: 1,
      lastChapter: 1,
      status: 'active',
      preferred: preferredInput,
      notes: '',
    };

    await saveTranslationMemory(memoryItem);
    await loadMemories();
    showToast(editingId ? 'Đã cập nhật Translation Memory' : 'Đã thêm Translation Memory mới', 'success');
    closeModal();
  };

  const openEditModal = (mem?: TranslationMemory) => {
    if (mem) {
      setEditingId(mem.id);
      setOrigInput(mem.original);
      setTransInput(mem.translation);
      setCatInput(mem.category || 'terminology');
      setContextInput(mem.context);
      setCharFromInput(mem.characterFrom || '');
      setCharToInput(mem.characterTo || '');
      setPreferredInput(mem.preferred);
    } else {
      setEditingId(null);
      setOrigInput('');
      setTransInput('');
      setCatInput('terminology');
      setContextInput('');
      setCharFromInput('');
      setCharToInput('');
      setPreferredInput(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
              Translation Memory (Bộ nhớ dịch thuật)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#2E6C7B] dark:text-[#E8F7FA] font-bold">
              {memories.length} entries
            </span>
          </div>
          <p className="text-xs text-[#647780] mt-0.5">
            Truy xuất ngữ cảnh, tần suất xuất hiện và cách dịch ưu tiên (⭐ Preferred) cho từng thuật ngữ.
          </p>
        </div>

        <button
          onClick={() => openEditModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Translation Memory</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'title', label: 'Danh xưng / Chức vụ' },
            { id: 'terminology', label: 'Thuật ngữ' },
            { id: 'expression', label: 'Cách diễn đạt' },
            { id: 'idiom', label: 'Thành ngữ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-[#B3EBF2]/50 dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
                  : 'text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#647780]" />
          <input
            type="text"
            placeholder="Tìm theo nguyên tác hoặc bản dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0C171B] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-1 focus:ring-[#77CBDA]"
          />
        </div>
      </div>

      {/* Memories Table */}
      <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-[#647780] text-xs">
            <Brain className="w-8 h-8 text-[#77CBDA] mx-auto" />
            <p className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
              Chưa tìm thấy Translation Memory nào.
            </p>
            <p>Khi bạn dịch, LanAnhArtistry sẽ tự động gợi ý và ghi nhớ các từ quan trọng cho bạn.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
            {filtered.map((mem) => (
              <div
                key={mem.id}
                className="p-4 hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePreferred(mem)}
                      className={`text-sm transition-transform hover:scale-125 cursor-pointer ${
                        mem.preferred ? 'text-amber-500' : 'text-[#647780]'
                      }`}
                      title={mem.preferred ? 'Preferred Translation' : 'Bấm để đặt làm ưu tiên'}
                    >
                      ★
                    </button>

                    <span className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                      {mem.original}
                    </span>

                    <span className="text-[#647780]">→</span>

                    <span className="font-serif font-bold text-base text-[#2E6C7B] dark:text-[#77CBDA]">
                      {mem.translation}
                    </span>

                    {mem.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] capitalize border border-[#D7EDF2] dark:border-[#1F3A44]">
                        {mem.category}
                      </span>
                    )}

                    {mem.preferred && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                        ⭐ Preferred
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#647780] line-clamp-1">
                    Ngữ cảnh: {mem.context}
                    {mem.characterFrom && ` (${mem.characterFrom} → ${mem.characterTo})`}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <p className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                      {mem.frequency} lần xuất hiện
                    </p>
                    <p className="text-[10px] text-[#647780]">
                      Ch. {mem.chapterIds.slice(0, 4).join(', ')}{mem.chapterIds.length > 4 ? '...' : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedMemoryForOccurrences(mem)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#E8F7FA] dark:hover:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] cursor-pointer"
                  >
                    <span>Xem occurrences</span>
                    <ExternalLink className="w-3 h-3 text-[#647780]" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(mem)}
                      className="p-1.5 text-[#647780] hover:text-[#2E6C7B] dark:hover:text-[#ECF7F9] rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mem.id, mem.original)}
                      className="p-1.5 text-[#647780] hover:text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: View All Occurrences */}
      {selectedMemoryForOccurrences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                  Translation Memory Occurrences
                </span>
                <h3 className="text-lg font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                  {selectedMemoryForOccurrences.original} → {selectedMemoryForOccurrences.translation}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMemoryForOccurrences(null)}
                className="p-1 rounded-lg text-[#647780] hover:text-[#26343B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {selectedMemoryForOccurrences.chapterIds.map((chNum, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35]/40 border border-[#D7EDF2] dark:border-[#1F3A44] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2E6C7B] dark:text-[#77CBDA]">
                      Chapter {chNum}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMemoryForOccurrences(null);
                        openChapterForTranslation(activeStory!.id, '__no_seed_chapter__', false);
                      }}
                      className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở chapter này</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-serif text-[#647780] dark:text-[#8AA4AE]">
                    Nguyên tác: "...{selectedMemoryForOccurrences.original}..."
                  </p>
                  <p className="font-serif text-[#2E6C7B] dark:text-[#77CBDA] font-semibold">
                    Bản dịch: "...{selectedMemoryForOccurrences.translation}..."
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMemoryForOccurrences(null)}
                className="px-4 py-2 bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Memory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-4">
              <h3 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                {editingId ? 'Chỉnh sửa Translation Memory' : 'Thêm Translation Memory mới'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-lg text-[#647780] hover:text-[#26343B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Từ / Cụm từ gốc (Original Text) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 师尊, 宗门, clockwork..."
                  value={origInput}
                  onChange={(e) => setOrigInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Bản dịch chuẩn tiếng Việt (Vietnamese Translation) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: sư tôn, tông môn, cỗ máy đồng hồ..."
                  value={transInput}
                  onChange={(e) => setTransInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Phân loại (Category)
                  </label>
                  <select
                    value={catInput}
                    onChange={(e) => setCatInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9]"
                  >
                    <option value="terminology">Thuật ngữ</option>
                    <option value="title">Danh xưng / Chức vụ</option>
                    <option value="expression">Cách diễn đạt</option>
                    <option value="idiom">Thành ngữ</option>
                    <option value="name">Tên riêng</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferredInput}
                      onChange={(e) => setPreferredInput(e.target.checked)}
                      className="rounded text-[#2E6C7B] focus:ring-[#77CBDA]"
                    />
                    <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                      ⭐ Preferred Translation
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Ngữ cảnh sử dụng (Context / Note)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khi đệ tử xưng hô với trưởng bối..."
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-[#647780] hover:text-[#26343B] rounded-xl hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl font-semibold shadow-xs"
                >
                  Lưu Translation Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
