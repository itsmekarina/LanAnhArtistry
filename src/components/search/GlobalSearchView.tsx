import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getChaptersByStory,
  getTranslationMemories,
  getCharacters,
  getPronounRules,
  getStoryBible,
  getPlotEvents,
} from '../../services/db';
import {
  Search,
  BookOpen,
  Brain,
  Users,
  Compass,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const GlobalSearchView: React.FC = () => {
  const { activeStory, globalSearchQuery, setGlobalSearchQuery, openChapterForTranslation, setCurrentView } = useApp();
  const [query, setQuery] = useState(globalSearchQuery || '');
  const [results, setResults] = useState<{
    memories: any[];
    characters: any[];
    chapters: any[];
    bibleItems: any[];
    plotEvents: any[];
  }>({
    memories: [],
    characters: [],
    chapters: [],
    bibleItems: [],
    plotEvents: [],
  });

  const performSearch = async (searchTerm: string) => {
    if (!activeStory || !searchTerm.trim()) {
      setResults({ memories: [], characters: [], chapters: [], bibleItems: [], plotEvents: [] });
      return;
    }

    const q = searchTerm.toLowerCase().trim();

    const [chaps, tms, chars, bible, events] = await Promise.all([
      getChaptersByStory(activeStory.id),
      getTranslationMemories(activeStory.id),
      getCharacters(activeStory.id),
      getStoryBible(activeStory.id),
      getPlotEvents(activeStory.id),
    ]);

    // 1. Search Translation Memory (Supports Bi-directional search: Chinese <-> Vietnamese)
    const matchedMemories = tms.filter(
      (m) =>
        m.original.toLowerCase().includes(q) ||
        m.translation.toLowerCase().includes(q) ||
        m.context.toLowerCase().includes(q)
    );

    // 2. Search Characters & Aliases
    const matchedCharacters = chars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q)) ||
        c.identity.toLowerCase().includes(q)
    );

    // 3. Search Chapters (Original & Translation text)
    const matchedChapters = chaps.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.originalText.toLowerCase().includes(q) ||
        c.translationText.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
    );

    // 4. Search Story Bible
    const matchedBible: any[] = [];
    if (bible) {
      for (const loc of bible.locations) {
        if (loc.name.toLowerCase().includes(q) || loc.description.toLowerCase().includes(q)) {
          matchedBible.push({ type: 'Location', title: loc.name, desc: loc.description });
        }
      }
      for (const org of bible.organizations) {
        if (org.name.toLowerCase().includes(q) || org.description.toLowerCase().includes(q)) {
          matchedBible.push({ type: 'Organization', title: org.name, desc: org.description });
        }
      }
      for (const obj of bible.importantObjects) {
        if (obj.name.toLowerCase().includes(q) || obj.description.toLowerCase().includes(q)) {
          matchedBible.push({ type: 'Object', title: obj.name, desc: obj.description });
        }
      }
      for (const mys of bible.mysteries) {
        if (mys.title.toLowerCase().includes(q) || mys.description.toLowerCase().includes(q)) {
          matchedBible.push({ type: 'Mystery', title: mys.title, desc: mys.description });
        }
      }
    }

    // 5. Search Plot Events
    const matchedEvents = events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    );

    setResults({
      memories: matchedMemories,
      characters: matchedCharacters,
      chapters: matchedChapters,
      bibleItems: matchedBible,
      plotEvents: matchedEvents,
    });
  };

  useEffect(() => {
    performSearch(query);
  }, [query, activeStory]);

  const totalResults =
    results.memories.length +
    results.characters.length +
    results.chapters.length +
    results.bibleItems.length +
    results.plotEvents.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
          Global Story Search (Tìm kiếm Toàn thư)
        </h1>
        <p className="text-xs text-stone-500">
          Hỗ trợ tìm kiếm hai chiều: tìm từ nguyên tác tiếng Trung/Anh ra bản dịch tiếng Việt hoặc ngược lại.
        </p>
      </div>

      {/* Omnibox Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-stone-400" />
        <input
          type="text"
          placeholder="Nhập từ cần tìm (ví dụ: 师尊, sư tôn, Nhân vật B, Huyết Sắc...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setGlobalSearchQuery(e.target.value);
          }}
          className="w-full pl-12 pr-4 py-3 text-sm rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
          autoFocus
        />
      </div>

      {/* Search Results */}
      {query.trim().length === 0 ? (
        <div className="p-12 text-center text-xs text-stone-400 space-y-2">
          <p>Nhập từ khóa bất kỳ để tìm kiếm trên toàn bộ dữ liệu truyện "{activeStory?.title}".</p>
          <div className="flex justify-center gap-2 pt-2">
            {['师尊', 'sư huynh', 'Nhân vật B', 'Huyết Sắc', 'tông môn'].map((hint) => (
              <button
                key={hint}
                onClick={() => setQuery(hint)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-500/15"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      ) : totalResults === 0 ? (
        <div className="p-12 text-center text-xs text-stone-500">
          Không tìm thấy kết quả nào phù hợp với từ khóa "{query}".
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs font-semibold text-stone-400">
            Tìm thấy {totalResults} kết quả phù hợp:
          </p>

          {/* 1. Translation Memories */}
          {results.memories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>Translation Memory ({results.memories.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {results.memories.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setCurrentView('tm')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                        {m.original}
                      </span>
                      {m.preferred && <span className="text-[10px] text-amber-600 font-bold">⭐ Preferred</span>}
                    </div>
                    <p className="font-serif font-semibold text-emerald-700 dark:text-emerald-400">
                      → {m.translation}
                    </p>
                    <p className="text-[10px] text-stone-400">{m.context} (Used {m.frequency} lần)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Characters */}
          {results.characters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Characters ({results.characters.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {results.characters.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCurrentView('characters')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-blue-500/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                        {c.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 capitalize">
                        {c.role}
                      </span>
                    </div>
                    <p className="text-stone-500 line-clamp-1">{c.identity}</p>
                    {c.aliases.length > 0 && (
                      <p className="text-[10px] text-stone-400">Biệt danh: {c.aliases.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Chapters */}
          {results.chapters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Chapters & Segments ({results.chapters.length})</span>
              </h3>
              <div className="space-y-2 text-xs">
                {results.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => openChapterForTranslation(activeStory!.id, ch.id, false)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-serif font-bold text-stone-900 dark:text-stone-100">
                        Chapter {ch.chapterNumber}: {ch.title}
                      </p>
                      <p className="text-stone-500 line-clamp-2 font-serif text-[11px]">
                        {ch.translationText || ch.originalText}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Story Bible */}
          {results.bibleItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Story Bible ({results.bibleItems.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {results.bibleItems.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentView('bible')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-purple-500/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-stone-400">{item.type}</span>
                    </div>
                    <p className="text-stone-500 line-clamp-2">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Plot Events */}
          {results.plotEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Plot Events ({results.plotEvents.length})</span>
              </h3>
              <div className="space-y-2 text-xs">
                {results.plotEvents.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setCurrentView('plot_timeline')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                        Chapter {e.chapterNumber}: {e.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 capitalize font-bold">
                        {e.importance}
                      </span>
                    </div>
                    <p className="text-stone-500 line-clamp-2">{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
