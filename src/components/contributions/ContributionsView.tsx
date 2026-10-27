import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  Merge,
  Search,
  Plus,
  ShieldCheck,
  Brain,
  Tag,
  Sparkles,
} from 'lucide-react';
import { SharedContribution } from '../../types';
import { cloudSync } from '../../services/cloudSync';

export const ContributionsView: React.FC = () => {
  const { currentUser, showToast, setShowContributeModal } = useApp();
  const isAdmin = currentUser.role === 'ADMIN';

  const [contributions, setContributions] = useState<SharedContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const list = await cloudSync.fetchContributions();
      setContributions(list);
    } catch (e) {
      console.error('Error fetching contributions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, decision: 'APPROVED' | 'REJECTED' | 'MERGE') => {
    try {
      const res = await cloudSync.reviewContribution(
        id,
        decision,
        currentUser.id,
        currentUser.displayName
      );
      if (res) {
        showToast(
          decision === 'APPROVED'
            ? 'Đã duyệt đề xuất và tích hợp vào Kho Tri Thức!'
            : decision === 'MERGE'
            ? 'Đã gộp đề xuất thành phương án dịch thay thế!'
            : 'Đã từ chối đề xuất đóng góp.',
          'success'
        );
        fetchContributions();
      }
    } catch (e: any) {
      showToast(e.message || 'Lỗi xét duyệt', 'error');
    }
  };

  const filtered = contributions.filter((c) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.contributionType === filterType;
    const matchesSearch =
      c.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.proposedValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.reason && c.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.contributorName && c.contributorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
            Trung Tâm Đóng Góp & Xét Duyệt Tri Thức
          </span>
          <h1 className="font-serif text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9] mt-0.5">
            Community Knowledge Contributions
          </h1>
          <p className="text-xs text-[#647780] mt-1">
            Đề xuất và kiểm duyệt Translation Memory, thuật ngữ, đại từ xưng hô từ cộng đồng dịch giả trước khi cập nhật vào kho ngữ liệu dùng chung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContributeModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gửi đề xuất mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="APPROVED">Đã duyệt (APPROVED)</option>
            <option value="REJECTED">Đã từ chối (REJECTED)</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="translation_memory">Translation Memory</option>
            <option value="terminology">Thuật ngữ</option>
            <option value="vocabulary">Từ vựng</option>
            <option value="pronoun_rule">Đại từ xưng hô</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#647780]" />
          <input
            type="text"
            placeholder="Tìm đề xuất..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none"
          />
        </div>
      </div>

      {/* Contributions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#647780] bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl">
            Không tìm thấy đề xuất đóng góp nào phù hợp với bộ lọc.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] px-2 py-0.5 rounded-full">
                      {item.contributionType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#26343B] dark:text-[#ECF7F9] mt-1.5 flex items-center gap-2">
                    <span>{item.original}</span>
                    <span className="text-[#647780]">→</span>
                    <span className="text-[#2E6C7B] dark:text-[#77CBDA]">{item.proposedValue}</span>
                  </h3>
                </div>

                {isAdmin && item.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReview(item.id, 'APPROVED')}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Duyệt</span>
                    </button>
                    <button
                      onClick={() => handleReview(item.id, 'MERGE')}
                      className="px-3 py-1.5 text-xs font-semibold text-[#2E6C7B] bg-[#E8F7FA] hover:bg-[#B3EBF2]/40 dark:bg-[#1F3A44] dark:text-[#77CBDA] rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Merge className="w-3.5 h-3.5" />
                      <span>Gộp phương án</span>
                    </button>
                    <button
                      onClick={() => handleReview(item.id, 'REJECTED')}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                )}
              </div>

              {item.reason && (
                <p className="text-xs text-[#26343B] dark:text-[#ECF7F9] leading-relaxed">
                  <strong>Lý do & Ngữ cảnh:</strong> {item.reason}
                </p>
              )}

              {item.evidence && (
                <div className="p-2.5 rounded-xl bg-[#F4FBFD] dark:bg-[#0E1A1E] border border-[#D7EDF2] dark:border-[#1F3A44] text-[11px] text-[#647780]">
                  <strong>Dẫn chứng:</strong> {item.evidence}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[#647780] pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <span>Người đóng góp: <strong>{item.contributorName}</strong></span>
                <span>Ngày gửi: {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
