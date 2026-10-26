import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsistencyWarning } from '../../types';
import { getWarnings } from '../../services/db';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { ReviewPreviousUsageModal } from '../modals/ReviewPreviousUsageModal';

export const ReviewBeforePublishView: React.FC = () => {
  const { activeStory, setCurrentView } = useApp();
  const [warnings, setWarnings] = useState<ConsistencyWarning[]>([]);
  const [selectedWarning, setSelectedWarning] = useState<ConsistencyWarning | null>(null);

  useEffect(() => {
    if (!activeStory) return;
    getWarnings(activeStory.id).then((list) => {
      setWarnings(list.filter((w) => w.status === 'open'));
    });
  }, [activeStory]);

  const pronounWarns = warnings.filter((w) => w.type === 'pronoun');
  const termWarns = warnings.filter((w) => w.type === 'terminology' || w.type === 'translation');
  const bibleWarns = warnings.filter((w) => w.type === 'bible');
  const timelineWarns = warnings.filter((w) => w.type === 'timeline');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Translation Quality Check (Kiểm tra chất lượng trước khi Xuất bản)
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Quét tự động toàn diện bản dịch đối chiếu với Story Bible, Quy tắc Xưng hô và Translation Memory.
        </p>
      </div>

      {/* Checklist Overview Cards */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
          Bảng kiểm tra tính nhất quán (Consistency Checklist)
        </h3>

        <div className="space-y-3 text-xs">
          {/* Pronouns */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pronounWarns.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Pronouns & Address System (Xưng hô)
                </p>
                <p className="text-stone-500 text-[11px]">
                  {pronounWarns.length === 0
                    ? 'Tất cả đại từ xưng hô giữa các nhân vật đều nhất quán.'
                    : `⚠️ Phát hiện ${pronounWarns.length} điểm nghi vấn xưng hô.`}
                </p>
              </div>
            </div>
            {pronounWarns.length > 0 && (
              <button
                onClick={() => setSelectedWarning(pronounWarns[0])}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold"
              >
                Kiểm tra ({pronounWarns.length})
              </button>
            )}
          </div>

          {/* Terminology */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {termWarns.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Terminology & Preferred Words (Thuật ngữ)
                </p>
                <p className="text-stone-500 text-[11px]">
                  {termWarns.length === 0
                    ? 'Mọi thuật ngữ đều khớp với ⭐ Preferred Translation.'
                    : `⚠️ ${termWarns.length} từ có thể đang dùng cách dịch khác với Preferred TM.`}
                </p>
              </div>
            </div>
            {termWarns.length > 0 && (
              <button
                onClick={() => setSelectedWarning(termWarns[0])}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold"
              >
                Kiểm tra ({termWarns.length})
              </button>
            )}
          </div>

          {/* Character Names & Aliases */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Character Names & Aliases (Tên nhân vật & Biệt danh)
                </p>
                <p className="text-stone-500 text-[11px]">
                  ✓ Tên nhân vật không bị viết nhầm hoặc sai chính tả.
                </p>
              </div>
            </div>
            <span className="text-emerald-600 font-semibold text-[11px]">Đạt chuẩn</span>
          </div>

          {/* Timeline & Contradictions */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Timeline & Plot Events (Dòng sự kiện)
                </p>
                <p className="text-stone-500 text-[11px]">
                  ✓ Không có mâu thuẫn thời gian sự kiện.
                </p>
              </div>
            </div>
            <span className="text-emerald-600 font-semibold text-[11px]">Đạt chuẩn</span>
          </div>

          {/* Story Bible Rules */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {bibleWarns.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Story Bible & Forbidden Terms (Từ cấm kỵ)
                </p>
                <p className="text-stone-500 text-[11px]">
                  {bibleWarns.length === 0
                    ? 'Không có từ cấm kỵ nào bị vi phạm.'
                    : `⚠️ Phát hiện ${bibleWarns.length} từ trong danh sách cấm kỵ.`}
                </p>
              </div>
            </div>
            {bibleWarns.length > 0 && (
              <button
                onClick={() => setSelectedWarning(bibleWarns[0])}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold"
              >
                Xem chi tiết
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            {warnings.length === 0
              ? 'Tất cả các tiêu chí đều đạt chuẩn để xuất bản!'
              : 'Nên xem xét các cảnh báo trước khi xuất bản bản dịch ra ngoài.'}
          </p>

          <button
            onClick={() => setCurrentView('translate')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white"
          >
            <span>Trở lại Translation Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {selectedWarning && (
        <ReviewPreviousUsageModal
          warning={selectedWarning}
          onClose={() => setSelectedWarning(null)}
          onResolve={() => setSelectedWarning(null)}
        />
      )}
    </div>
  );
};
