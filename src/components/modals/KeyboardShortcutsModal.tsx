import React from 'react';
import { X, Command, Keyboard, ArrowRight, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';
  const altKey = isMac ? '⌥' : 'Alt';

  const shortcutSections = [
    {
      title: 'Điều hướng chính (Primary Navigation)',
      shortcuts: [
        { keys: [`${altKey}`, '1'], description: 'Chuyển đến Dashboard' },
        { keys: [`${altKey}`, '2'], description: 'Chuyển đến Translation Workspace (Tiếp tục dịch)' },
        { keys: [`${altKey}`, '3'], description: 'Chuyển đến Review Center (Kiểm tra bất nhất)' },
        { keys: [`${altKey}`, '4'], description: 'Chuyển đến Story Bible (Kinh Thánh Tác Phẩm)' },
        { keys: [`${altKey}`, '5'], description: 'Chuyển đến Translation Memory (TM)' },
        { keys: [`${altKey}`, '6'], description: 'Chuyển đến Characters (Nhân vật)' },
        { keys: [`${altKey}`, '7'], description: 'Chuyển đến Plot Timeline' },
        { keys: [`${modKey}`, 'K'], description: 'Mở Global Search (Tìm kiếm toàn thư)' },
      ],
    },
    {
      title: 'Hành động nhanh (Quick Actions)',
      shortcuts: [
        { keys: [`${modKey}`, 'S'], description: 'Lưu bản dịch tức thì (Save Workspace & Segments)' },
        { keys: [`${altKey}`, 'C'], description: 'Chạy kiểm tra tính nhất quán (Run Consistency Check)' },
        { keys: [`${modKey}`, 'Enter'], description: 'Hoàn thành đoạn hiện tại & nhảy sang đoạn tiếp theo' },
        { keys: ['?'], description: 'Mở bảng phím tắt này (Keyboard Shortcuts Cheat Sheet)' },
        { keys: ['Esc'], description: 'Đóng modal / panel đang mở' },
      ],
    },
    {
      title: 'Chế độ xem trong Workspace (View Modes)',
      shortcuts: [
        { keys: [`${altKey}`, 'S'], description: 'Chế độ Split (Side-by-side song song)' },
        { keys: [`${altKey}`, 'O'], description: 'Chỉ hiển thị Original (Nguyên tác)' },
        { keys: [`${altKey}`, 'T'], description: 'Chỉ hiển thị Translation (Bản dịch)' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#122228] rounded-3xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                Productivity & Hotkeys
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                Phím tắt hệ thống (Keyboard Shortcuts)
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
        <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh] text-xs">
          {shortcutSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2.5">
              <h3 className="font-bold text-[#647780] uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
                <span>{section.title}</span>
              </h3>
              <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#172D35]/30 overflow-hidden shadow-xs">
                {section.shortcuts.map((sc, i) => (
                  <div
                    key={i}
                    className="p-3 flex items-center justify-between hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]/60 transition-colors"
                  >
                    <span className="text-[#26343B] dark:text-[#ECF7F9] font-medium">
                      {sc.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
