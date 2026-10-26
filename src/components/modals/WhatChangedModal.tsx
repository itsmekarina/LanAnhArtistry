import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Users,
  Compass,
  Brain,
  History,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  getCharacters,
  getRelationships,
  getTranslationMemories,
  getWarnings,
  getPlotEvents,
} from '../../services/db';
import { calculateWhatChanged } from '../../services/ai';
import { WhatChangedSummary } from '../../types';

interface WhatChangedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatChangedModal: React.FC<WhatChangedModalProps> = ({ isOpen, onClose }) => {
  const { activeStory, setCurrentView } = useApp();
  const [data, setData] = useState<WhatChangedSummary | null>(null);

  useEffect(() => {
    if (!isOpen || !activeStory) return;

    const loadData = async () => {
      try {
        const [chars, rels, tms, warns, evts] = await Promise.all([
          getCharacters(activeStory.id),
          getRelationships(activeStory.id),
          getTranslationMemories(activeStory.id),
          getWarnings(activeStory.id),
          getPlotEvents(activeStory.id),
        ]);

        const summary = calculateWhatChanged({
          characters: chars,
          relationships: rels,
          memories: tms,
          warnings: warns,
          plotEvents: evts,
        });
        setData(summary);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [isOpen, activeStory]);

  if (!isOpen) return null;

  const navigateTo = (view: any) => {
    onClose();
    setCurrentView(view);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Activity Delta
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                What Changed Since Last Session?
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
          <p className="text-[#647780] leading-relaxed">
            Tổng hợp nhanh các thực thể mới, quan hệ nhân vật và thuật ngữ được phát hiện hoặc bổ sung kể từ lần đăng nhập trước của bạn:
          </p>

          <div className="space-y-3 pt-1">
            {/* New Characters */}
            <div
              onClick={() => navigateTo('characters')}
              className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/40 hover:border-[#77CBDA] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>Nhân vật mới ({data?.newCharacters.length || 0})</span>
                </span>
                <span className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-0.5 font-medium">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[11px] text-[#647780]">
                {data?.newCharacters.length
                  ? data.newCharacters.join(', ')
                  : 'Chưa có cập nhật.'}
              </p>
            </div>

            {/* Changed Relationships */}
            <div
              onClick={() => navigateTo('relationships')}
              className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/40 hover:border-[#77CBDA] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>Biến động quan hệ & xưng hô ({data?.changedRelationships?.length || 0})</span>
                </span>
                <span className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-0.5 font-medium">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[11px] text-[#647780]">
                {data?.changedRelationships && data.changedRelationships.length > 0
                  ? data.changedRelationships.join(', ')
                  : 'Chưa có cập nhật.'}
              </p>
            </div>

            {/* New Terminology */}
            <div
              onClick={() => navigateTo('terms')}
              className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/40 hover:border-[#77CBDA] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                  <span>Thuật ngữ mới ({data?.newTerminology?.length || 0})</span>
                </span>
                <span className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-0.5 font-medium">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[11px] text-[#647780]">
                {data?.newTerminology && data.newTerminology.length > 0
                  ? data.newTerminology.join(', ')
                  : 'Chưa có cập nhật.'}
              </p>
            </div>

            {/* Resolved Warnings */}
            <div
              onClick={() => navigateTo('consistency_warnings')}
              className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/40 hover:border-[#77CBDA] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Điểm bất nhất đã xử lý ({data?.resolvedWarningsCount || 0})</span>
                </span>
                <span className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-0.5 font-medium">
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <p className="text-[11px] text-[#647780]">
                Chưa có điểm bất nhất nào được xử lý.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white transition-colors cursor-pointer"
          >
            Đã nắm rõ
          </button>
        </div>
      </div>
    </div>
  );
};
