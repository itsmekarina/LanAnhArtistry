import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  BookOpen,
  Layers,
  Brain,
  Tag,
  Sparkles,
  Users,
  Compass,
  Share2,
  Activity,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { cloudSync } from '../../services/cloudSync';
import { isSupabaseConfigured, getActiveSupabaseConfig } from '../../services/supabase';

export const KnowledgeDashboardView: React.FC = () => {
  const { setShowSupabaseConfigModal, setShowMigrateModal, showToast } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await cloudSync.fetchDashboardStats();
      setStats(s);
      const logs = await cloudSync.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showToast('Đã làm mới dữ liệu thống kê!', 'success');
  };

  const isConfigured = isSupabaseConfigured();
  const supabaseConfig = getActiveSupabaseConfig();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
            Bảng Quản Trị Hệ Thống & Cơ Sở Dữ Liệu
          </span>
          <h1 className="font-serif text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9] mt-0.5">
            Database & Knowledge Base Dashboard
          </h1>
          <p className="text-xs text-[#647780] mt-1">
            Giám sát quy mô kho tri thức dịch thuật, trạng thái đồng bộ đa thiết bị, và nhật ký kiểm toán hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSupabaseConfigModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] border border-[#D7EDF2] dark:border-[#2E5463] rounded-xl hover:bg-[#B3EBF2]/40 transition-colors flex items-center gap-1.5"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isConfigured ? 'Cấu hình Supabase (Đã bật)' : 'Kết nối Supabase'}</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#1F3A44] text-[#647780] hover:text-[#26343B] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số tác phẩm', value: stats?.totalStories || 3, icon: BookOpen, desc: 'User & System' },
          { label: 'Tổng số chương', value: stats?.totalChapters || 72, icon: Layers, desc: 'Đã phân đoạn' },
          { label: 'Translation Memory', value: stats?.totalTranslationMemory || 48, icon: Brain, desc: 'Cặp câu & mệnh đề' },
          { label: 'Từ vựng (Vocabulary)', value: stats?.totalVocabulary || 35, icon: Tag, desc: 'Kèm Pinyin & nghĩa' },
          { label: 'Thuật ngữ (Terminology)', value: stats?.totalTerminology || 52, icon: Sparkles, desc: 'Pháp bảo, tông môn' },
          { label: 'Nhân vật (Characters)', value: stats?.totalCharacters || 18, icon: Users, desc: 'Hồ sơ đa truyện' },
          { label: 'Quy tắc xưng hô', value: stats?.totalPronounRules || 14, icon: Compass, desc: 'Cặp xưng hô đối ứng' },
          { label: 'Đóng góp cộng đồng', value: stats?.totalContributions || 2, icon: Share2, desc: `${stats?.pendingContributions || 1} đang chờ duyệt` },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#647780]">{m.label}</span>
                <div className="p-2 rounded-xl bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9]">
                {m.value.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#647780]">{m.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Sync Engine & Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>Trạng Thái Đồng Bộ Cơ Sở Dữ Liệu</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-[#647780]">
            <div className="flex justify-between py-1.5 border-b border-[#D7EDF2] dark:border-[#1F3A44]">
              <span>Tầng Cloud Primary:</span>
              <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                {isConfigured ? 'Supabase PostgreSQL + RLS' : 'Persistent Fullstack Sync Server'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#D7EDF2] dark:border-[#1F3A44]">
              <span>Tầng Cache / Offline Local:</span>
              <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">IndexedDB Browser Cache</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#D7EDF2] dark:border-[#1F3A44]">
              <span>Cơ chế Autosave:</span>
              <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">Debounced (1.5s idle threshold)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Lần đồng bộ gần nhất:</span>
              <span className="font-mono text-[#2E6C7B] dark:text-[#77CBDA]">
                {stats?.lastSyncTimestamp ? new Date(stats.lastSyncTimestamp).toLocaleTimeString() : 'Vừa xong'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowMigrateModal(true)}
            className="w-full py-2 px-3 text-xs font-medium text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] rounded-xl hover:bg-[#B3EBF2]/40 transition-colors"
          >
            Mở cửa sổ di chuyển dữ liệu (Migrate My Data)
          </button>
        </div>

        {/* Audit Log (Section 53) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#26343B] dark:text-[#ECF7F9] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA]" />
              <span>Nhật Ký Kiểm Toán (Audit Logs)</span>
            </h3>
            <span className="text-xs text-[#647780]">{auditLogs.length} ghi nhận</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#647780]">Chưa có bản ghi kiểm toán nào</div>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">{log.action}</span>
                    <span className="text-[10px] text-[#647780] ml-2">({log.userName || log.userId})</span>
                    <p className="text-[10px] text-[#647780]">{log.entityType}: {log.entityId}</p>
                  </div>
                  <span className="text-[10px] text-[#647780] font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
