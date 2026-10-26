import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsistencyWarning, WarningType, WarningSeverity, WarningStatus } from '../../types';
import { getWarnings, saveWarning } from '../../services/db';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Clock,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { ReviewPreviousUsageModal } from '../modals/ReviewPreviousUsageModal';

export const ReviewCenterView: React.FC<{ initialTypeFilter?: string }> = ({ initialTypeFilter }) => {
  const { activeStory, refreshWarnings, showToast } = useApp();
  const [warnings, setWarnings] = useState<ConsistencyWarning[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || 'all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [activeWarningForModal, setActiveWarningForModal] = useState<ConsistencyWarning | null>(null);

  const loadWarnings = async () => {
    if (!activeStory) return;
    const list = await getWarnings(activeStory.id);
    setWarnings(list);
  };

  useEffect(() => {
    loadWarnings();
  }, [activeStory]);

  const filtered = warnings.filter((w) => {
    const matchesType = typeFilter === 'all' || w.type === typeFilter;
    const matchesSev = severityFilter === 'all' || w.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesType && matchesSev && matchesStatus;
  });

  const handleResolve = async (warning: ConsistencyWarning, action: 'use_previous' | 'keep_current' | 'create_rule' | 'ignore') => {
    const updated: ConsistencyWarning = {
      ...warning,
      status: action === 'ignore' ? 'ignored' : 'resolved',
      userResolution: action,
    };
    await saveWarning(updated);
    await loadWarnings();
    await refreshWarnings();
    showToast(`Đã cập nhật cảnh báo: ${action}`, 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Review Center (Trung tâm Kiểm soát Tính nhất quán)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
              {warnings.filter((w) => w.status === 'open').length} việc cần duyệt
            </span>
          </div>
          <p className="text-xs text-stone-500">
            AI phát hiện các dấu hiệu lệch chuẩn dịch thuật hoặc xưng hô. Người dịch toàn quyền quyết định giữ hay đổi.
          </p>
        </div>
      </div>

      {/* Filter Toolbar (Section 46) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
        {/* Type filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="font-bold text-stone-400 shrink-0">Phân loại:</span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'translation', label: 'Translation' },
            { id: 'pronoun', label: 'Pronouns (Xưng hô)' },
            { id: 'terminology', label: 'Terminology' },
            { id: 'bible', label: 'Story Bible' },
            { id: 'character', label: 'Characters' },
            { id: 'timeline', label: 'Timeline' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                typeFilter === t.id
                  ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Severity & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">Mức độ:</span>
            {['all', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-0.5 rounded text-[11px] uppercase font-semibold transition-colors ${
                  severityFilter === sev
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">Trạng thái:</span>
            {['open', 'resolved', 'ignored', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 rounded text-[11px] capitalize font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
              Không có cảnh báo nào trong mục này
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tất cả các đoạn dịch đều nhất quán với Translation Memory, Quy tắc Xưng hô và Story Bible.
            </p>
          </div>
        ) : (
          filtered.map((w) => (
            <div
              key={w.id}
              className={`p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all space-y-4 ${
                w.status === 'open'
                  ? 'border-amber-300 dark:border-amber-700/60 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 opacity-70'
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      w.severity === 'high' ? 'bg-red-500' : w.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-bold text-xs capitalize text-amber-900 dark:text-amber-300">
                    ⚠️ {w.type} Inconsistency
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="text-xs text-stone-500">Chapter {w.chapterNumber}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      w.severity === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {w.severity}
                  </span>
                </div>

                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${
                    w.status === 'open'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {w.status}
                </span>
              </div>

              {/* Explanation */}
              <p className="text-xs text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
                {w.explanation}
              </p>

              {/* Side-by-side comparison block (Section 21) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">
                    Cách dịch trước đây:
                  </span>
                  <p className="font-serif font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {w.previousTranslation}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Used in: Chapter {w.relatedChapters.join(', ') || 'trước'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 block">
                    Cách dịch hiện tại:
                  </span>
                  <p className="font-serif font-bold text-amber-900 dark:text-amber-200 text-sm">
                    {w.currentTranslation}
                  </p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400">
                    Chapter {w.chapterNumber} (Hiện tại)
                  </p>
                </div>
              </div>

              {/* Action Buttons (Section 22) */}
              {w.status === 'open' && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setActiveWarningForModal(w)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Previous Usage (Xem câu cũ)</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleResolve(w, 'use_previous')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                      title="Sử dụng lại cách dịch trước đây"
                    >
                      Dùng cách trước ({w.previousTranslation})
                    </button>
                    <button
                      onClick={() => handleResolve(w, 'keep_current')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                      title="Giữ nguyên cách dịch hiện tại"
                    >
                      Giữ nguyên
                    </button>
                    <button
                      onClick={() => handleResolve(w, 'create_rule')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition-colors"
                      title="Tạo quy tắc mới do thay đổi có chủ ý"
                    >
                      Tạo Rule mới
                    </button>
                    <button
                      onClick={() => handleResolve(w, 'ignore')}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {activeWarningForModal && (
        <ReviewPreviousUsageModal
          warning={activeWarningForModal}
          onClose={() => setActiveWarningForModal(null)}
          onResolve={(action) => {
            handleResolve(activeWarningForModal, action);
            setActiveWarningForModal(null);
          }}
        />
      )}
    </div>
  );
};
