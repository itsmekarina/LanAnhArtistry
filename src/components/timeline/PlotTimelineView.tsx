import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PlotEvent } from '../../types';
import { getPlotEvents, savePlotEvent, deletePlotEvent, getCharacters } from '../../services/db';
import {
  History,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  Trash2,
  Calendar,
  Flame,
  X,
} from 'lucide-react';

export const PlotTimelineView: React.FC = () => {
  const { activeStory, openChapterForTranslation, showToast } = useApp();
  const [events, setEvents] = useState<PlotEvent[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharFilter, setSelectedCharFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapNum, setChapNum] = useState(1);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [importance, setImportance] = useState<any>('major');
  const [selectedChars, setSelectedChars] = useState('');

  const loadData = async () => {
    if (!activeStory) return;
    const [evts, chars] = await Promise.all([
      getPlotEvents(activeStory.id),
      getCharacters(activeStory.id),
    ]);
    setEvents(evts);
    setCharacters(chars);
  };

  useEffect(() => {
    loadData();
  }, [activeStory]);

  const filtered = events.filter((e) => {
    if (selectedCharFilter === 'all') return true;
    return e.characters.includes(selectedCharFilter);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeStory) return;

    const newEvent: PlotEvent = {
      id: `pe-${Date.now()}`,
      storyId: activeStory.id,
      chapterId: `chap-${chapNum}-demo`,
      chapterNumber: chapNum,
      title: title.trim(),
      description: desc.trim(),
      characters: selectedChars.split(',').map((c) => c.trim()).filter((c) => c.length > 0),
      importance,
      order: events.length + 1,
    };

    await savePlotEvent(newEvent);
    await loadData();
    setIsModalOpen(false);
    setTitle('');
    setDesc('');
    setSelectedChars('');
    showToast('Đã lưu sự kiện vào Timeline!', 'success');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa sự kiện này khỏi Timeline?')) {
      await deletePlotEvent(id);
      await loadData();
      showToast('Đã xóa sự kiện', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Plot Timeline (Dòng thời gian sự kiện)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
              {events.length} events
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Duy trì chuỗi sự kiện cốt truyện theo thứ tự chapter, giúp người dịch không bị lạc mất bối cảnh khi quay lại sau nhiều tháng.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận sự kiện</span>
        </button>
      </div>

      {/* Filter by Character */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-400 shrink-0 font-medium">Lọc theo nhân vật:</span>
        <button
          onClick={() => setSelectedCharFilter('all')}
          className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedCharFilter === 'all'
              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Tất cả
        </button>
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCharFilter(c.name)}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCharFilter === c.name
                ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Vertical Timeline Track (Section 35) */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
        {filtered.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline node */}
            <div
              className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 border-white dark:border-stone-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-125 ${
                evt.importance === 'climax'
                  ? 'bg-red-500 text-white'
                  : evt.importance === 'turning_point'
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-400 text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Event Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 hover:border-amber-500/50 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono">
                    Chapter {evt.chapterNumber}
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    {evt.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      evt.importance === 'climax'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : evt.importance === 'turning_point'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {evt.importance.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-serif">
                {evt.description}
              </p>

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Nhân vật: {evt.characters.join(', ') || 'Nhiều người'}</span>
                </div>

                <button
                  onClick={() => openChapterForTranslation(activeStory!.id, '__no_seed_chapter__', false)}
                  className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                >
                  <span>Mở chapter này</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Ghi nhận sự kiện cốt truyện
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Số Chapter *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={chapNum}
                    onChange={(e) => setChapNum(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Mức độ quan trọng
                  </label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  >
                    <option value="major">Sự kiện chính (Major)</option>
                    <option value="turning_point">Bước ngoặt (Turning Point)</option>
                    <option value="climax">Cao trào (Climax)</option>
                    <option value="minor">Sự kiện phụ (Minor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tiêu đề sự kiện *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nhân vật B phát hiện bức mật thư..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Mô tả chi tiết sự kiện
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nhân vật tham gia (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="Nhân vật B, Nhân vật A"
                  value={selectedChars}
                  onChange={(e) => setSelectedChars(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
