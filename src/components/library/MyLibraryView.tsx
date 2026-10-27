import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Share2,
  Brain,
  Tag,
  Users,
  Clock,
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  ArrowRight,
  Filter,
  CheckCircle2,
  Lock,
  Globe,
  Link2,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Story, TranslationMemory, SharedContribution } from '../../types';
import { getAllStories, getTranslationMemories, getCharacters } from '../../services/db';
import { cloudSync } from '../../services/cloudSync';

type LibraryTab =
  | 'stories'
  | 'shared_with_me'
  | 'translation_memory'
  | 'vocabulary'
  | 'terminology'
  | 'characters'
  | 'contributions'
  | 'recent';

export const MyLibraryView: React.FC = () => {
  const {
    currentUser,
    setActiveStoryId,
    setCurrentView,
    openChapterForTranslation,
    setShowShareModal,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<LibraryTab>('stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [myMemories, setMyMemories] = useState<TranslationMemory[]>([]);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [myContributions, setMyContributions] = useState<SharedContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryData();
  }, [currentUser.id]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const stories = await getAllStories();
      setAllStories(stories);

      // Collect memories from user's stories
      const userStories = stories.filter((s) => s.ownerId === currentUser.id);
      const allMemories: TranslationMemory[] = [];
      const allChars: any[] = [];

      for (const st of userStories) {
        const mems = await getTranslationMemories(st.id);
        allMemories.push(...mems);
        const chars = await getCharacters(st.id);
        allChars.push(...chars.map((c) => ({ ...c, storyTitle: st.title })));
      }

      setMyMemories(allMemories);
      setMyCharacters(allChars);

      const contribs = await cloudSync.fetchContributions();
      setMyContributions(contribs.filter((c) => c.contributorId === currentUser.id));
    } catch (e) {
      console.error('Error loading library data:', e);
    } finally {
      setLoading(false);
    }
  };

  const myStories = allStories.filter((s) => s.ownerId === currentUser.id);
  const sharedWithMe = allStories.filter(
    (s) => s.ownerId !== currentUser.id && (s.privacy === 'public' || s.privacy === 'link_only')
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
            Thư Viện Cá Nhân Của Bạn
          </span>
          <h1 className="font-serif text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9] mt-0.5">
            My Library — {currentUser.displayName}
          </h1>
          <p className="text-xs text-[#647780] mt-1">
            Không gian lưu trữ tập trung: Tác phẩm của tôi, tác phẩm chia sẻ, kho bộ nhớ dịch thuật, từ vựng và các đóng góp cộng đồng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('stories')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo truyện mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#F4FBFD] dark:bg-[#0E1A1E] rounded-2xl border border-[#D7EDF2] dark:border-[#1F3A44] text-xs">
        {[
          { id: 'stories', label: 'Tác phẩm của tôi', icon: BookOpen, count: myStories.length },
          { id: 'shared_with_me', label: 'Được chia sẻ', icon: Share2, count: sharedWithMe.length },
          { id: 'translation_memory', label: 'Translation Memory', icon: Brain, count: myMemories.length },
          { id: 'vocabulary', label: 'Từ vựng', icon: Tag, count: 12 },
          { id: 'terminology', label: 'Thuật ngữ', icon: Sparkles, count: 24 },
          { id: 'characters', label: 'Nhân vật', icon: Users, count: myCharacters.length },
          { id: 'contributions', label: 'Đóng góp của tôi', icon: CheckCircle2, count: myContributions.length },
          { id: 'recent', label: 'Vừa chỉnh sửa', icon: Clock, count: myStories.slice(0, 3).length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LibraryTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                  : 'text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F7FA] dark:bg-[#122228] text-[#2E6C7B] dark:text-[#77CBDA]">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myStories.map((story) => (
            <div
              key={story.id}
              onClick={() => {
                setActiveStoryId(story.id);
                setCurrentView('story_detail');
              }}
              className="p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] hover:border-[#77CBDA] cursor-pointer transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                    {story.title}
                  </h3>
                  <p className="text-xs text-[#647780]">Tác giả: {story.author}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F7FA] text-[#2E6C7B] dark:bg-[#1F3A44] dark:text-[#77CBDA] font-medium flex items-center gap-1">
                  {story.privacy === 'public' ? (
                    <>
                      <Globe className="w-3 h-3" /> Công khai
                    </>
                  ) : story.privacy === 'link_only' ? (
                    <>
                      <Link2 className="w-3 h-3" /> Có link
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Riêng tư
                    </>
                  )}
                </span>
              </div>

              <p className="text-xs text-[#647780] line-clamp-2">{story.description}</p>

              <div className="flex items-center justify-between text-[11px] text-[#647780] pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <span>{story.totalChapters} chương</span>
                <span className="text-[#2E6C7B] dark:text-[#77CBDA] font-medium flex items-center gap-1">
                  Mở chi tiết <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'shared_with_me' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedWithMe.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[#647780]">
              Chưa có tác phẩm nào được chia sẻ với bạn.
            </div>
          ) : (
            sharedWithMe.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  setActiveStoryId(story.id);
                  setCurrentView('story_detail');
                }}
                className="p-5 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] hover:border-[#77CBDA] cursor-pointer transition-all shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#26343B] dark:text-[#ECF7F9]">
                      {story.title}
                    </h3>
                    <p className="text-xs text-[#647780]">Dịch giả: {story.ownerName || 'Cộng đồng'}</p>
                  </div>
                </div>
                <p className="text-xs text-[#647780] line-clamp-2">{story.description}</p>
                <div className="flex items-center justify-between text-[11px] text-[#647780] pt-2 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                  <span>{story.totalChapters} chương</span>
                  <span className="text-[#2E6C7B] dark:text-[#77CBDA] font-medium flex items-center gap-1">
                    Xem truyện <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'translation_memory' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#26343B] dark:text-[#ECF7F9]">
              Bộ Nhớ Dịch Thuật Của Tôi ({myMemories.length} mục)
            </h2>
            <button
              onClick={() => setCurrentView('tm')}
              className="text-xs text-[#2E6C7B] dark:text-[#77CBDA] hover:underline flex items-center gap-1 font-medium"
            >
              Xem giao diện quản lý TM <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44] border border-[#D7EDF2] dark:border-[#1F3A44] rounded-xl overflow-hidden">
            {myMemories.slice(0, 15).map((m) => (
              <div key={m.id} className="p-3 text-xs flex items-center justify-between hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/20">
                <div>
                  <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">{m.original}</span>
                  <span className="mx-2 text-[#647780]">→</span>
                  <span className="text-[#2E6C7B] dark:text-[#77CBDA] font-medium">{m.translation}</span>
                  {m.context && <p className="text-[11px] text-[#647780] mt-0.5">{m.context}</p>}
                </div>
                <div className="text-[11px] text-[#647780]">Dùng {m.frequency || 1} lần</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCharacters.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#26343B] dark:text-[#ECF7F9]">{c.name}</span>
                <span className="text-[10px] text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] px-1.5 py-0.5 rounded">
                  {c.role}
                </span>
              </div>
              <p className="text-[11px] text-[#647780]">Truyện: {c.storyTitle}</p>
              <p className="text-[11px] text-[#647780]">{c.identity || c.notes}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-4">
          <h2 className="text-sm font-bold text-[#26343B] dark:text-[#ECF7F9]">
            Lịch Sử Đóng Góp Tri Thức ({myContributions.length} đề xuất)
          </h2>
          {myContributions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#647780]">
              Bạn chưa gửi đề xuất đóng góp nào vào Kho Tri Thức Cộng Đồng.
            </div>
          ) : (
            <div className="space-y-3">
              {myContributions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#172D35]/30 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                      {c.original} → {c.proposedValue}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        c.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#647780]">{c.reason}</p>
                  <div className="text-[10px] text-[#647780]">Ngày gửi: {new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
