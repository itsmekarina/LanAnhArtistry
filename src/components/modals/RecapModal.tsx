import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  BookOpen,
  Users,
  Compass,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { generateRecap } from '../../services/ai';
import {
  getChaptersByStory,
  getCharacters,
  getPronounRules,
  getTranslationMemories,
  getStoryBible,
  getPlotEvents,
} from '../../services/db';
import { RecapData } from '../../types';

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTranslating: () => void;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  isOpen,
  onClose,
  onStartTranslating,
}) => {
  const { activeStory, activeChapterId } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [recapData, setRecapData] = useState<RecapData | null>(null);

  useEffect(() => {
    if (!isOpen || !activeStory) return;

    let mounted = true;
    setLoading(true);

    const loadRecap = async () => {
      try {
        const [chapters, characters, pronouns, memories, bible, events] = await Promise.all([
          getChaptersByStory(activeStory.id),
          getCharacters(activeStory.id),
          getPronounRules(activeStory.id),
          getTranslationMemories(activeStory.id),
          getStoryBible(activeStory.id),
          getPlotEvents(activeStory.id),
        ]);

        const currentChapter = chapters.find((c) => c.id === activeChapterId) || chapters[chapters.length - 1];
        const currentChapterNum = currentChapter ? currentChapter.chapterNumber : 36;
        const precedingChapters = chapters.filter((c) => c.chapterNumber < currentChapterNum);

        const data = await generateRecap({
          storyTitle: activeStory.title,
          chapterNumber: currentChapterNum,
          recentChapters: precedingChapters,
          characters,
          pronounRules: pronouns,
          memories,
          bible,
          plotEvents: events,
        });

        if (mounted) {
          setRecapData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to generate recap:', err);
        if (mounted) setLoading(false);
      }
    };

    loadRecap();

    return () => {
      mounted = false;
    };
  }, [isOpen, activeStory, activeChapterId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                  Second Memory Retrieval
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#2E6C7B] dark:text-[#E8F7FA] font-medium">
                  {activeStory?.title}
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                📖 Before You Continue
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800 dark:text-stone-200 text-sm">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-stone-500">Đang truy xuất bộ nhớ cốt truyện, nhân vật và xưng hô...</p>
            </div>
          ) : (
            <>
              {/* Resuming Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-stone-800 dark:text-stone-200">
                <p className="font-medium text-amber-900 dark:text-amber-300">
                  Bạn đang chuẩn bị tiếp tục dịch{' '}
                  <span className="font-bold underline">
                    Chapter {recapData?.chapterTarget || 36}
                  </span>
                  .
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  Đây là tóm tắt nhanh giúp bạn lấy lại mạch truyện, phong cách và các quy tắc xưng hô quan trọng sau một khoảng thời gian gián đoạn.
                </p>
              </div>

              {/* Summary of Recent Chapters */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Summary of Preceding Chapters
                </h3>
                <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 leading-relaxed font-serif text-sm whitespace-pre-line">
                  {recapData?.summaryRecentChapters}
                </div>
              </div>

              {/* Grid: Characters & Relationships */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Important Characters */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Important Characters
                  </h3>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 space-y-2">
                    {recapData?.keyCharacters.map((c, i) => (
                      <div key={i} className="text-xs flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Relationships & Pronouns */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                    Current Pronouns & Rules
                  </h3>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 space-y-2">
                    {recapData?.currentPronouns.map((p, i) => (
                      <div key={i} className="text-xs flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="font-mono">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terminology & Mysteries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Important Terminology */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Important Terminology (⭐ Preferred)
                  </h3>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 space-y-1.5">
                    {recapData?.importantTerminology.map((t, i) => (
                      <div key={i} className="text-xs flex items-center gap-2 font-mono text-stone-700 dark:text-stone-300">
                        <span className="text-amber-500">⭐</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unresolved Mysteries */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                    Unresolved Mysteries
                  </h3>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-800 space-y-2">
                    {recapData?.unresolvedMysteries.map((m, i) => (
                      <div key={i} className="text-xs flex items-start gap-2 text-stone-700 dark:text-stone-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Things to Remember */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Things to Remember
                </h3>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs text-stone-800 dark:text-stone-200">
                  {recapData?.thingsToRemember.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Mọi thông tin đã được đồng bộ với bộ nhớ riêng của truyện.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onStartTranslating();
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition-all"
            >
              <span>Start Translating</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
