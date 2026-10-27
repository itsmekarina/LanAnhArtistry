import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StoryBible } from '../../types';
import { getStoryBible, saveStoryBible } from '../../services/db';
import {
  Compass,
  MapPin,
  Building2,
  BookOpen,
  Sparkles,
  HelpCircle,
  Quote,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export const StoryBibleView: React.FC = () => {
  const { activeStory, showToast } = useApp();
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [activeTab, setActiveTab] = useState<
    'locations' | 'organizations' | 'terminology' | 'objects' | 'mysteries' | 'quotes' | 'rules' | 'style'
  >('locations');

  // Simple Add Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemExtra, setItemExtra] = useState('');

  const loadBible = async () => {
    if (!activeStory) return;
    const b = await getStoryBible(activeStory.id);
    if (b) setBible(b);
  };

  useEffect(() => {
    loadBible();
  }, [activeStory]);

  if (!bible) {
    return <div className="py-20 text-center text-xs text-stone-500">Đang tải Story Bible...</div>;
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const updated = { ...bible };

    if (activeTab === 'locations') {
      updated.locations.push({
        id: `loc-${Date.now()}`,
        name: itemTitle.trim(),
        description: itemDesc.trim(),
        notes: itemExtra.trim(),
      });
    } else if (activeTab === 'organizations') {
      updated.organizations.push({
        id: `org-${Date.now()}`,
        name: itemTitle.trim(),
        description: itemDesc.trim(),
        leader: itemExtra.trim(),
      });
    } else if (activeTab === 'terminology') {
      updated.terminology.push({
        id: `term-${Date.now()}`,
        term: itemTitle.trim(),
        translation: itemExtra.trim() || itemTitle.trim(),
        definition: itemDesc.trim(),
      });
    } else if (activeTab === 'objects') {
      updated.importantObjects.push({
        id: `obj-${Date.now()}`,
        name: itemTitle.trim(),
        owner: itemExtra.trim(),
        description: itemDesc.trim(),
      });
    } else if (activeTab === 'mysteries') {
      updated.mysteries.push({
        id: `mys-${Date.now()}`,
        title: itemTitle.trim(),
        description: itemDesc.trim(),
        status: 'unresolved',
        clues: itemExtra ? [itemExtra.trim()] : [],
      });
    } else if (activeTab === 'quotes') {
      updated.importantQuotes.push({
        id: `quote-${Date.now()}`,
        original: itemTitle.trim(),
        translation: itemDesc.trim(),
        speaker: itemExtra.trim() || 'Nhân vật',
        chapter: 1,
        context: '',
      });
    } else if (activeTab === 'rules') {
      updated.worldbuildingRules.push({
        id: `rule-${Date.now()}`,
        title: itemTitle.trim(),
        description: itemDesc.trim(),
        category: itemExtra.trim() || 'Thiết lập',
      });
    }

    await saveStoryBible(updated);
    setBible(updated);
    setIsAddOpen(false);
    setItemTitle('');
    setItemDesc('');
    setItemExtra('');
    showToast('Đã lưu vào Story Bible!', 'success');
  };

  const handleDeleteItem = async (listName: keyof StoryBible, id: string) => {
    if (confirm('Xóa mục này khỏi Story Bible?')) {
      const updated: any = { ...bible };
      if (Array.isArray(updated[listName])) {
        updated[listName] = updated[listName].filter((item: any) => item.id !== id);
        await saveStoryBible(updated);
        setBible(updated);
        showToast('Đã xóa', 'info');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Story Bible (Kinh Thánh Tác Phẩm)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
              {activeStory?.title}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Kho tri thức toàn thư về địa danh, môn phái, bảo vật, bí ẩn chưa giải và phong cách dịch thuật.
          </p>
        </div>

        {activeTab !== 'style' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mục mới</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 text-xs">
        {[
          { id: 'locations', label: 'Địa danh (Locations)', count: bible.locations.length },
          { id: 'organizations', label: 'Thế lực (Organizations)', count: bible.organizations.length },
          { id: 'terminology', label: 'Thuật ngữ (Terminology)', count: bible.terminology.length },
          { id: 'objects', label: 'Bảo vật (Objects)', count: bible.importantObjects.length },
          { id: 'mysteries', label: 'Bí ẩn cốt truyện (Mysteries)', count: bible.mysteries.length },
          { id: 'quotes', label: 'Danh ngôn (Quotes)', count: bible.importantQuotes.length },
          { id: 'rules', label: 'Quy tắc thế giới (Rules)', count: bible.worldbuildingRules.length },
          { id: 'style', label: 'Văn phong & Style', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-3 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {/* 1. Locations */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bible.locations.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {loc.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteItem('locations', loc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {loc.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Organizations */}
      {activeTab === 'organizations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bible.organizations.map((org) => (
            <div
              key={org.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {org.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteItem('organizations', org.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {org.leader && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  Người đứng đầu / Chưởng môn: {org.leader}
                </p>
              )}
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {org.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 3. Terminology */}
      {activeTab === 'terminology' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bible.terminology.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5 relative group text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {t.term}
                </span>
                <button
                  onClick={() => handleDeleteItem('terminology', t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                → {t.translation}
              </p>
              <p className="text-stone-500">{t.definition}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Objects */}
      {activeTab === 'objects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bible.importantObjects.map((obj) => (
            <div
              key={obj.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 relative group text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  {obj.name} {obj.originalName && `(${obj.originalName})`}
                </h3>
                <button
                  onClick={() => handleDeleteItem('importantObjects', obj.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {obj.owner && (
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  Sở hữu: {obj.owner}
                </p>
              )}
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                {obj.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 5. Mysteries */}
      {activeTab === 'mysteries' && (
        <div className="space-y-3">
          {bible.mysteries.map((mys) => (
            <div
              key={mys.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500" />
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {mys.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full capitalize font-semibold text-[10px] ${
                      mys.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {mys.status}
                  </span>
                  <button
                    onClick={() => handleDeleteItem('mysteries', mys.id)}
                    className="p-1 text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                {mys.description}
              </p>

              {mys.clues && mys.clues.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                  <strong>Manh mối:</strong> {mys.clues.join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 6. Quotes */}
      {activeTab === 'quotes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bible.importantQuotes.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 relative group"
            >
              <Quote className="w-5 h-5 text-amber-500/40" />
              <p className="font-serif italic text-sm text-stone-800 dark:text-stone-200">
                "{q.translation}"
              </p>
              <p className="font-serif text-xs text-stone-400">
                {q.original}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
                <span>— {q.speaker} (Chapter {q.chapter})</span>
                <button
                  onClick={() => handleDeleteItem('importantQuotes', q.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. Translation Style (Section 58) */}
      {activeTab === 'style' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-6 text-xs">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Quy chuẩn văn phong & Phong cách dịch (Translation Style Rules)
            </h3>
            <p className="text-stone-500 mt-1">
              Bộ quy tắc định hướng cho người dịch và AI nhằm đảm bảo tính đồng nhất giữa hàng trăm chapter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
              <h4 className="font-bold text-stone-800 dark:text-stone-200">Tone & Giọng điệu chủ đạo</h4>
              <p className="text-stone-600 dark:text-stone-400 font-serif text-sm">
                {bible.translationStyle.tone}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
              <h4 className="font-bold text-stone-800 dark:text-stone-200">Phong cách hội thoại</h4>
              <p className="text-stone-600 dark:text-stone-400 font-serif text-sm">
                {bible.translationStyle.dialogueStyle}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Từ vựng & Đại từ Ưu tiên</h4>
              <div className="flex flex-wrap gap-1.5">
                {bible.translationStyle.preferredVocabulary.map((v, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-mono text-[11px]"
                  >
                    ✓ {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <h4 className="font-bold text-rose-900 dark:text-rose-300">Từ cấm kỵ / Cần tránh</h4>
              <div className="flex flex-wrap gap-1.5">
                {bible.translationStyle.forbiddenTerms.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-rose-200/50 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 font-mono text-[11px]"
                  >
                    ✕ {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 capitalize">
              Thêm mục mới vào: {activeTab}
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tên / Tiêu đề *
                </label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Mô tả chi tiết *
                </label>
                <textarea
                  rows={3}
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Thông tin bổ sung (người đứng đầu, manh mối, hoặc ghi chú)
                </label>
                <input
                  type="text"
                  value={itemExtra}
                  onChange={(e) => setItemExtra(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium"
                >
                  Lưu vào Bible
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
