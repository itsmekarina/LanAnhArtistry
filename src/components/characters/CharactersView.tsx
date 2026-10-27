import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Character, CharacterRelationship, CharacterRole, CharacterGender } from '../../types';
import {
  getCharacters,
  saveCharacter,
  deleteCharacter,
  getRelationships,
  saveRelationship,
  deleteRelationship,
} from '../../services/db';
import {
  Users,
  Plus,
  Compass,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  ArrowRight,
  Shield,
  Heart,
  X,
} from 'lucide-react';

export const CharactersView: React.FC = () => {
  const { activeStory, showToast } = useApp();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([]);
  const [activeTab, setActiveTab] = useState<'characters' | 'relationships'>('characters');
  const [searchQuery, setSearchQuery] = useState('');

  // Character Modal
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [charEditingId, setCharEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [role, setRole] = useState<CharacterRole>('supporting');
  const [gender, setGender] = useState<CharacterGender>('male');
  const [identity, setIdentity] = useState('');
  const [faction, setFaction] = useState('');
  const [personality, setPersonality] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [notes, setNotes] = useState('');

  // Relationship Modal
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [relCharA, setRelCharA] = useState('');
  const [relCharB, setRelCharB] = useState('');
  const [relType, setRelType] = useState('');
  const [relStatus, setRelStatus] = useState('');
  const [relContext, setRelContext] = useState('');

  const loadData = async () => {
    if (!activeStory) return;
    const [chars, rels] = await Promise.all([
      getCharacters(activeStory.id),
      getRelationships(activeStory.id),
    ]);
    setCharacters(chars);
    setRelationships(rels);
  };

  useEffect(() => {
    loadData();
  }, [activeStory]);

  const handleDeleteChar = async (id: string, charName: string) => {
    if (confirm(`Xóa nhân vật "${charName}"?`)) {
      await deleteCharacter(id);
      await loadData();
      showToast('Đã xóa nhân vật', 'info');
    }
  };

  const handleDeleteRel = async (id: string) => {
    if (confirm('Xóa quan hệ nhân vật này?')) {
      await deleteRelationship(id);
      await loadData();
      showToast('Đã xóa quan hệ', 'info');
    }
  };

  const handleSaveChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeStory) return;

    const newChar: Character = {
      id: charEditingId || `char-${Date.now()}`,
      storyId: activeStory.id,
      name: name.trim(),
      aliases: aliases.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
      gender,
      role,
      status: 'alive',
      identity: identity.trim() || 'Chưa rõ thân phận',
      faction: faction.trim() || 'Tự do',
      personality: personality.trim(),
      speakingStyle: speakingStyle.trim(),
      firstAppearance: 1,
      importantChapters: [1],
      notes: notes.trim(),
    };

    await saveCharacter(newChar);
    await loadData();
    showToast(`Đã lưu nhân vật: ${name}`, 'success');
    setIsCharModalOpen(false);
  };

  const handleSaveRel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relCharA.trim() || !relCharB.trim() || !relType.trim() || !activeStory) return;

    const newRel: CharacterRelationship = {
      id: `rel-${Date.now()}`,
      storyId: activeStory.id,
      characterA: relCharA.trim(),
      characterB: relCharB.trim(),
      relationshipType: relType.trim(),
      currentStatus: relStatus.trim() || 'Bình thường',
      startChapter: 1,
      context: relContext.trim(),
      notes: '',
    };

    await saveRelationship(newRel);
    await loadData();
    showToast(`Đã lưu quan hệ: ${relCharA} ↔ ${relCharB}`, 'success');
    setIsRelModalOpen(false);
  };

  const openCharModal = (char?: Character) => {
    if (char) {
      setCharEditingId(char.id);
      setName(char.name);
      setAliases(char.aliases.join(', '));
      setRole(char.role);
      setGender(char.gender);
      setIdentity(char.identity);
      setFaction(char.faction);
      setPersonality(char.personality);
      setSpeakingStyle(char.speakingStyle);
      setNotes(char.notes);
    } else {
      setCharEditingId(null);
      setName('');
      setAliases('');
      setRole('supporting');
      setGender('male');
      setIdentity('');
      setFaction('');
      setPersonality('');
      setSpeakingStyle('');
      setNotes('');
    }
    setIsCharModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Character Memory & Relationships (Nhân vật & Quan hệ)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 font-bold">
              {characters.length} characters
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Duy trì bộ nhớ hồ sơ nhân vật, biệt danh (aliases), phong cách nói chuyện và mạng lưới quan hệ.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'characters' ? (
            <button
              onClick={() => openCharModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhân vật</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRelModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm quan hệ</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('characters')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'characters'
              ? 'border-amber-600 text-amber-900 dark:text-amber-200'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Hồ sơ Nhân vật ({characters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'relationships'
              ? 'border-amber-600 text-amber-900 dark:text-amber-200'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Mạng lưới Quan hệ ({relationships.length})</span>
        </button>
      </div>

      {/* TAB 1: Characters Grid */}
      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                      {char.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                        char.role === 'protagonist'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : char.role === 'antagonist'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {char.role}
                    </span>
                  </div>
                  {char.aliases.length > 0 && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Biệt danh: {char.aliases.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openCharModal(char)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChar(char.id, char.name)}
                    className="p-1.5 text-stone-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                <p>
                  <strong className="text-stone-700 dark:text-stone-300">Thân phận:</strong> {char.identity}
                </p>
                {char.faction && (
                  <p>
                    <strong className="text-stone-700 dark:text-stone-300">Phe phái:</strong> {char.faction}
                  </p>
                )}
                {char.personality && (
                  <p>
                    <strong className="text-stone-700 dark:text-stone-300">Tính cách:</strong> {char.personality}
                  </p>
                )}
                {char.speakingStyle && (
                  <p>
                    <strong className="text-stone-700 dark:text-stone-300">Giọng điệu / Phong cách nói:</strong> {char.speakingStyle}
                  </p>
                )}
                {char.notes && (
                  <p className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-500 italic text-[11px]">
                    {char.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Relationships */}
      {activeTab === 'relationships' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {relationships.map((rel) => (
              <div
                key={rel.id}
                className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {rel.characterA}
                    </span>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {rel.characterB}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                      {rel.relationshipType}
                    </span>
                  </div>
                  <p className="text-stone-500">
                    Trạng thái hiện tại: <strong className="text-stone-700 dark:text-stone-300">{rel.currentStatus}</strong>
                  </p>
                  <p className="text-stone-400">{rel.context}</p>
                </div>

                <button
                  onClick={() => handleDeleteRel(rel.id)}
                  className="p-1.5 text-stone-400 hover:text-red-500 self-end md:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character Modal */}
      {isCharModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-stone-50 dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              {charEditingId ? 'Chỉnh sửa hồ sơ nhân vật' : 'Thêm nhân vật mới'}
            </h3>

            <form onSubmit={handleSaveChar} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tên nhân vật *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nhân vật B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CharacterRole)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  >
                    <option value="protagonist">Nhân vật chính (Protagonist)</option>
                    <option value="supporting">Hỗ trợ (Supporting)</option>
                    <option value="antagonist">Phản diện / Đối thủ (Antagonist)</option>
                    <option value="minor">Phụ (Minor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Biệt danh / Danh xưng khác (phân tách bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phong ca, Lâm sư đệ, Tiểu Phong"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Thân phận / Vị trí
                  </label>
                  <input
                    type="text"
                    placeholder="Đệ tử ngoại môn..."
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Môn phái / Phe phái
                  </label>
                  <input
                    type="text"
                    placeholder="Thanh Vân Kiếm Tông..."
                    value={faction}
                    onChange={(e) => setFaction(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Giọng điệu / Phong cách nói
                </label>
                <input
                  type="text"
                  placeholder="Khiêm tốn, trầm tĩnh, chuẩn lễ bối phận..."
                  value={speakingStyle}
                  onChange={(e) => setSpeakingStyle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Ghi chú lưu ý khi dịch
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCharModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relationship Modal */}
      {isRelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Thêm quan hệ nhân vật mới
            </h3>

            <form onSubmit={handleSaveRel} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nhân vật A *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhân vật B"
                    value={relCharA}
                    onChange={(e) => setRelCharA(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nhân vật B *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhân vật A"
                    value={relCharB}
                    onChange={(e) => setRelCharB(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Loại quan hệ (Relationship Type) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sư huynh / Sư đệ, Sư đồ, Kẻ thù, Bằng hữu..."
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Trạng thái hiện tại
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thân thiết, Xung đột âm thầm, Xa cách..."
                  value={relStatus}
                  onChange={(e) => setRelStatus(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsRelModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                >
                  Lưu quan hệ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
