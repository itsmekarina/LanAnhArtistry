import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getActiveSupabaseConfig();
      setUrl(cfg.url || '');
      setAnonKey(cfg.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Temporarily save to test
      saveCustomSupabaseConfig(url, anonKey);
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        showToast('Kết nối Supabase thành công!', 'success');
      } else {
        showToast('Chưa kết nối được Supabase', 'warning');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    saveCustomSupabaseConfig(url, anonKey);
    showToast('Đã lưu cấu hình kết nối Supabase Cloud!', 'success');
    onClose();
  };

  const handleClear = () => {
    saveCustomSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showToast('Đã chuyển về chế độ Local / Server Sync Engine', 'info');
  };

  const handleCopyMigrationPath = () => {
    navigator.clipboard.writeText('/supabase/migrations/20261006_lananhartistry_core.sql');
    setCopiedSql(true);
    showToast('Đã sao chép đường dẫn migration SQL!', 'success');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#B3EBF2]/40 dark:bg-[#77CBDA]/20 text-[#2E6C7B] dark:text-[#77CBDA]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Cấu hình Supabase & Cloud Database
              </h3>
              <p className="text-xs text-[#647780]">
                PostgreSQL · Row Level Security (RLS) · Supabase Auth
              </p>
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
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#2E6C7B] dark:text-[#77CBDA] mt-0.5 shrink-0" />
              <div className="text-xs text-[#647780] leading-relaxed">
                <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                  Bảo mật cấp cơ sở dữ liệu:
                </span>{' '}
                LanAnhArtistry chỉ sử dụng <strong>Public Publishable Anon Key</strong> cùng cơ chế RLS. Tuyệt đối không bao giờ sử dụng hay lưu trữ Service Role Secret Key trong trình duyệt.
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                Supabase Anon Public Key (Publishable)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] text-[#26343B] dark:text-[#ECF7F9] focus:outline-none focus:border-[#77CBDA] focus:ring-1 focus:ring-[#77CBDA] font-mono"
              />
            </div>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latencyMs !== undefined && (
                  <p className="text-[10px] opacity-75 mt-0.5">Độ trễ: {testResult.latencyMs}ms</p>
                )}
              </div>
            </div>
          )}

          {/* Database Migration Instructions */}
          <div className="p-3.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#E8F7FA]/40 dark:bg-[#122228] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2E6C7B] dark:text-[#77CBDA] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Migration SQL có sẵn</span>
              </span>
              <button
                onClick={handleCopyMigrationPath}
                className="text-[11px] flex items-center gap-1 text-[#2E6C7B] dark:text-[#77CBDA] hover:underline"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Đã copy' : 'Copy file path'}</span>
              </button>
            </div>
            <p className="text-[#647780] leading-relaxed">
              Tập lệnh SQL đầy đủ cho toàn bộ 20 bảng (profiles, stories, TM, terminology, contributions, RLS) đã được lưu tại:{' '}
              <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0C1619] border border-[#D7EDF2] dark:border-[#1F3A44] font-mono text-[10px]">
                /supabase/migrations/20261006_lananhartistry_core.sql
              </code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30">
          <button
            onClick={handleClear}
            className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
          >
            Xóa cấu hình
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !url}
              className="px-3.5 py-2 text-xs font-medium text-[#2E6C7B] dark:text-[#77CBDA] bg-white dark:bg-[#1F3A44] border border-[#D7EDF2] dark:border-[#2E5463] rounded-xl hover:bg-[#E8F7FA] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
