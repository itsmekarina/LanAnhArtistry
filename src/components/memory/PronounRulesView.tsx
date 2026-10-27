import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PronounRule } from '../../types';
import {
  getPronounRules,
  savePronounRule,
  deletePronounRule,
  getCharacters,
} from '../../services/db';
import {
  Users,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  Compass,
} from 'lucide-react';

export const PronounRulesView: React.FC = () => {
  const { activeStory, showToast } = useApp();
  const [rules, setRules] = useState<PronounRule[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromChar, setFromChar] = useState('');
  const [toChar, setToChar] = useState('');
  const [selfPronoun, setSelfPronoun] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [context, setContext] = useState('');
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState<number | undefined>(undefined);

  const loadData = async () => {
    if (!activeStory) return;
    const [pRules, chars] = await Promise.all([
      getPronounRules(activeStory.id),
      getCharacters(activeStory.id),
    ]);
    setRules(pRules);
    setCharacters(chars);
  };

  useEffect(() => {
    loadData();
  }, [activeStory]);

  const handleDelete = async (id: string) => {
    if (confirm('Xóa quy tắc xưng hô này?')) {
      await deletePronounRule(id);
      await loadData();
      showToast('Đã xóa quy tắc xưng hô', 'info');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromChar.trim() || !toChar.trim() || !selfPronoun.trim() || !targetAddress.trim() || !activeStory) return;

    const newRule: PronounRule = {
      id: editingId || `pr-${Date.now()}`,
      storyId: activeStory.id,
      fromCharacter: fromChar.trim(),
      toCharacter: toChar.trim(),
      selfPronoun: selfPronoun.trim(),
      targetAddress: targetAddress.trim(),
      context: context.trim() || 'Xưng hô tiêu chuẩn',
      startChapter: startChapter || 1,
      endChapter: endChapter || undefined,
      status: 'active',
      chapters: [startChapter],
    };

    await savePronounRule(newRule);
    await loadData();
    showToast(`Đã lưu quy tắc xưng hô: ${fromChar} → ${toChar}`, 'success');
    setIsModalOpen(false);
  };

  const openModal = (rule?: PronounRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFromChar(rule.fromCharacter);
      setToChar(rule.toCharacter);
      setSelfPronoun(rule.selfPronoun);
      setTargetAddress(rule.targetAddress);
      setContext(rule.context);
      setStartChapter(rule.startChapter);
      setEndChapter(rule.endChapter);
    } else {
      setEditingId(null);
      setFromChar('');
      setToChar('');
      setSelfPronoun('');
      setTargetAddress('');
      setContext('');
      setStartChapter(1);
      setEndChapter(undefined);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
              Pronoun System & Timeline (Hệ thống Xưng hô)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#B3EBF2] text-[#2E6C7B] dark:bg-[#2E6C7B] dark:text-[#E8F7FA] font-bold">
              {rules.length} rules
            </span>
          </div>
          <p className="text-xs text-[#647780] mt-0.5">
            Theo dõi chính xác cách xưng hô giữa từng cặp nhân vật theo dòng thời gian và bối cảnh (tình cảm, cãi vã, địa vị thay đổi).
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm quy tắc xưng hô</span>
        </button>
      </div>

      {/* Pronoun timeline guidance */}
      <div className="rounded-xl border border-[#d9e3e8] bg-white p-5 dark:border-[#334a54] dark:bg-[#17272d]">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="font-bold">Pronoun timeline</h3>
        </div>
        <p className="text-sm text-[#647780] dark:text-[#9db0b5]">
          Set a chapter range for each rule to track how forms of address change throughout your story.
        </p>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-[#122228] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-[#26343B] dark:text-[#ECF7F9]">
            Tất cả quy tắc xưng hô trong truyện
          </h3>
        </div>

        <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
          {rules.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#647780]">
              Chưa có quy tắc xưng hô nào được thiết lập.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                      {rule.fromCharacter} ➔ {rule.toCharacter}
                    </span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] border border-[#D7EDF2] dark:border-[#1F3A44]">
                      Tự xưng: <strong className="text-[#26343B] dark:text-[#ECF7F9]">{rule.selfPronoun}</strong> • Gọi đối phương: <strong className="text-[#26343B] dark:text-[#ECF7F9]">{rule.targetAddress}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-[#647780]">
                    Ngữ cảnh: {rule.context} • Áp dụng từ Chapter {rule.startChapter}{rule.endChapter ? ` đến Chapter ${rule.endChapter}` : ' trở đi'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(rule)}
                    className="p-1.5 text-[#647780] hover:text-[#2E6C7B] rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 text-[#647780] hover:text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-4">
              <h3 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                {editingId ? 'Chỉnh sửa quy tắc xưng hô' : 'Thêm quy tắc xưng hô mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-[#647780] hover:text-[#26343B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Nhân vật nói (From) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Nhân vật A"
                    value={fromChar}
                    onChange={(e) => setFromChar(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Nhân vật nghe (To) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Nhân vật B"
                    value={toChar}
                    onChange={(e) => setToChar(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Tự xưng (Self Pronoun) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: huynh, ta, đệ, muội..."
                    value={selfPronoun}
                    onChange={(e) => setSelfPronoun(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Gọi đối phương (Target Address) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: đệ, ngươi, sư tôn..."
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Từ Chapter
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startChapter}
                    onChange={(e) => setStartChapter(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                    Đến Chapter (để trống nếu áp dụng tiếp)
                  </label>
                  <input
                    type="number"
                    placeholder="Hiện tại"
                    value={endChapter || ''}
                    onChange={(e) => setEndChapter(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Bối cảnh / Lý do xưng hô
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khi ở riêng trong động phủ / Khi tranh cãi đối đầu..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[#647780] hover:text-[#26343B] rounded-xl hover:bg-[#E8F7FA] dark:hover:bg-[#172D35]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Lưu quy tắc xưng hô
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
