import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FilePlus2,
  Library,
  Search,
  Users,
  Waypoints,
} from 'lucide-react';

const quickLinks = [
  { title: 'Translation Memory', subtitle: 'Thuật ngữ & bản dịch', view: 'tm', icon: Brain, tint: 'bg-[#fff06b]' },
  { title: 'Characters', subtitle: 'Nhân vật & quan hệ', view: 'characters', icon: Users, tint: 'bg-[#55cabe]' },
  { title: 'Story Bible', subtitle: 'Quy tắc & bối cảnh', view: 'bible', icon: BookOpen, tint: 'bg-[#ff898b]' },
  { title: 'Plot Timeline', subtitle: 'Mốc truyện', view: 'plot_timeline', icon: Waypoints, tint: 'bg-[#a985d8]' },
  { title: 'Import Center', subtitle: 'Nạp tư liệu', view: 'import_center', icon: FilePlus2, tint: 'bg-[#f7b878]' },
  { title: 'Review & Publish', subtitle: 'Soát bản dịch', view: 'review_publish', icon: CheckCircle2, tint: 'bg-[#9dd8a6]' },
];

export const DashboardView: React.FC = () => {
  const {
    stories,
    activeStory,
    openChapterForTranslation,
    setCurrentView,
    warningsCount,
    currentUser,
  } = useApp();

  const name = currentUser?.displayName || 'Translator';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const translated = stories.reduce((sum, story) => sum + (story.translatedChapters || 0), 0);
  const chapters = stories.reduce((sum, story) => sum + (story.totalChapters || 0), 0);
  const averageProgress = stories.length
    ? Math.round(stories.reduce((sum, story) => sum + (story.translatedChapters / Math.max(story.totalChapters || 0, 1)), 0) / stories.length * 100)
    : 0;

  const continueStory = (storyId: string) => {
    if (storyId === '__no_seed_story__') {
      openChapterForTranslation(storyId, '__no_seed_chapter__', true);
    } else {
      setCurrentView('translate');
    }
  };

  const metrics = [
    { label: 'Tác phẩm', value: stories.length.toLocaleString('vi-VN'), note: 'đang trong thư viện', icon: Library, highlight: true },
    { label: 'Chương đã dịch', value: translated.toLocaleString('vi-VN'), note: `trên ${chapters.toLocaleString('vi-VN')} chương`, icon: BookOpen },
    { label: 'Cần rà soát', value: warningsCount.total.toLocaleString('vi-VN'), note: 'cảnh báo nhất quán', icon: AlertTriangle },
    { label: 'Tiến độ trung bình', value: `${averageProgress}%`, note: 'trên các tác phẩm', icon: Waypoints },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-6 text-[#171717] dark:text-[#ECF7F9]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-dashed border-[#171717] dark:border-[#4b646b] pb-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-1 bg-[#fff06b] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#171717]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#171717]" /> LanAnhArtistry · Translation Workspace
          </p>
          <h2 className="font-serif text-3xl font-bold uppercase tracking-tight sm:text-4xl">{greeting}, {name}</h2>
          <p className="mt-1 max-w-2xl text-xs text-[#647780] dark:text-[#9db0b5] sm:text-sm">
            Tiếp tục bản dịch, giữ nhất quán thuật ngữ và nắm toàn bộ tri thức của từng câu chuyện.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentView('stories')} className="inline-flex h-10 items-center gap-2 border-2 border-[#171717] bg-white px-3 text-[10px] font-bold uppercase shadow-[2px_2px_0_#171717] transition hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#171717] dark:bg-[#122228] dark:border-[#ECF7F9]">
            <Library className="h-3.5 w-3.5" /> Thư viện
          </button>
          <button onClick={() => setCurrentView('search')} className="inline-flex h-10 items-center gap-2 border-2 border-[#171717] bg-[#171717] px-3 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_#fff06b] transition hover:translate-x-px hover:translate-y-px dark:border-[#ECF7F9]">
            <Search className="h-3.5 w-3.5" /> Tìm tri thức
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan">
        {metrics.map(({ label, value, note, icon: Icon, highlight }) => (
          <article key={label} className={`relative min-h-[132px] overflow-hidden border-2 border-[#171717] p-4 shadow-[3px_3px_0_#171717] dark:border-[#ECF7F9] dark:shadow-[3px_3px_0_#4b646b] ${highlight ? 'bg-[#fff06b] text-[#171717]' : 'bg-white dark:bg-[#122228]'}`}>
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center bg-[#171717] text-white"><Icon className="h-4 w-4" /></span>
              <span className="border border-[#171717] bg-white px-2 py-1 font-mono text-[9px] uppercase text-[#171717]">Workspace</span>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase underline decoration-1 underline-offset-2">{label}</p>
            <div className="mt-0.5 flex items-baseline gap-2"><strong className="font-mono text-2xl font-medium">{value}</strong><span className="text-[10px] opacity-70">{note}</span></div>
          </article>
        ))}
      </section>

      {activeStory && (
        <section className="flex flex-wrap items-center justify-between gap-4 border-2 border-[#171717] bg-[#fff06b] px-4 py-3 shadow-[3px_3px_0_#171717] dark:text-[#171717]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#171717] bg-white"><BookOpen className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="font-mono text-[9px] uppercase">Tiếp tục phiên dịch</p><p className="truncate font-serif text-base font-bold">{activeStory.title}</p><p className="text-[10px]">Chương {activeStory.translatedChapters + 1} · {activeStory.translatedChapters}/{activeStory.totalChapters} chương</p></div>
          </div>
          <button onClick={() => continueStory(activeStory.id)} className="inline-flex h-9 items-center gap-2 border-2 border-[#171717] bg-[#171717] px-3 text-[10px] font-bold uppercase text-white transition hover:bg-[#353535]">Vào bàn dịch <ArrowRight className="h-3.5 w-3.5" /></button>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <article className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0_#171717] dark:border-[#ECF7F9] dark:bg-[#122228] dark:shadow-[3px_3px_0_#4b646b]">
          <div className="mb-4 flex items-start justify-between border-b-2 border-[#171717] pb-3 dark:border-[#4b646b]">
            <div><h3 className="font-serif text-lg font-bold uppercase">Tác phẩm đang dịch</h3><p className="font-mono text-[10px] text-[#647780] dark:text-[#9db0b5]">Tiến độ theo từng câu chuyện</p></div>
            <button onClick={() => setCurrentView('stories')} className="text-[10px] font-bold uppercase underline underline-offset-2">Xem tất cả ↗</button>
          </div>
          {stories.length ? <div className="space-y-3">
            {stories.slice(0, 4).map((story) => {
              const progress = Math.round(story.translatedChapters / Math.max(story.totalChapters || 0, 1) * 100);
              return <button key={story.id} onClick={() => continueStory(story.id)} className="group block w-full border border-[#171717] p-3 text-left transition hover:bg-[#fffbd0] dark:border-[#4b646b] dark:hover:bg-[#172d35]">
                <div className="mb-2 flex items-center justify-between gap-3"><span className="truncate font-serif text-sm font-bold">{story.title}</span><span className="shrink-0 font-mono text-[10px]">{progress}%</span></div>
                <div className="h-2 border border-[#171717] bg-[#f3f3f3] dark:border-[#8aa4ae]"><div className="h-full border-r border-[#171717] bg-[#55cabe]" style={{ width: `${progress}%` }} /></div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#647780] dark:text-[#9db0b5]"><span>{story.sourceLanguage.toUpperCase()} → VI</span><span>{story.translatedChapters}/{story.totalChapters} chương <ArrowRight className="ml-1 inline h-3 w-3 transition group-hover:translate-x-0.5" /></span></div>
              </button>;
            })}
          </div> : <p className="py-10 text-center text-sm text-[#647780]">Chưa có tác phẩm. Mở thư viện để bắt đầu.</p>}
        </article>

        <article className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0_#171717] dark:border-[#ECF7F9] dark:bg-[#122228] dark:shadow-[3px_3px_0_#4b646b]">
          <div className="mb-4 flex items-start justify-between border-b-2 border-[#171717] pb-3 dark:border-[#4b646b]">
            <div><h3 className="font-serif text-lg font-bold uppercase">Review Center</h3><p className="font-mono text-[10px] text-[#647780] dark:text-[#9db0b5]">Các điểm cần xác nhận</p></div>
            <span className="border border-[#171717] bg-[#ff898b] px-2 py-1 font-mono text-[10px] font-bold">{warningsCount.total} mục</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Bất nhất bản dịch', count: warningsCount.translation, view: 'consistency_warnings', tint: 'bg-[#ff898b]' },
              { label: 'Lệch xưng hô', count: warningsCount.pronoun, view: 'pronoun_warnings', tint: 'bg-[#fff06b]' },
              { label: 'Nhắc nhở Story Bible', count: warningsCount.bible, view: 'bible', tint: 'bg-[#55cabe]' },
            ].map((item) => <button key={item.view} onClick={() => setCurrentView(item.view)} className="flex w-full items-center justify-between gap-3 border border-[#171717] px-3 py-2.5 text-left transition hover:translate-x-0.5 dark:border-[#4b646b]">
              <span className="flex items-center gap-2"><i className={`h-3 w-3 border border-[#171717] ${item.tint}`} /><span className="text-xs font-semibold">{item.label}</span></span><span className="flex items-center gap-2 font-mono text-xs">{item.count}<ArrowRight className="h-3 w-3" /></span>
            </button>)}
          </div>
          <div className="mt-4 border-t border-dashed border-[#171717] pt-3 dark:border-[#4b646b]">
            <p className="font-mono text-[9px] uppercase text-[#647780] dark:text-[#9db0b5]">Lối tắt</p>
            <button onClick={() => setCurrentView('review_publish')} className="mt-2 inline-flex items-center gap-2 text-xs font-bold underline underline-offset-2">Soát trước khi xuất bản <ArrowRight className="h-3 w-3" /></button>
          </div>
        </article>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between"><div><h3 className="font-serif text-lg font-bold uppercase">Không gian tri thức</h3><p className="font-mono text-[10px] text-[#647780] dark:text-[#9db0b5]">Truy cập nhanh các công cụ của LanAnhArtistry</p></div><button onClick={() => setCurrentView('search')} className="text-[10px] font-bold uppercase underline underline-offset-2">Tìm kiếm ↗</button></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ title, subtitle, view, icon: Icon, tint }) => <button key={view} onClick={() => setCurrentView(view)} className="flex min-h-[82px] items-center gap-3 border-2 border-[#171717] bg-white p-3 text-left shadow-[2px_2px_0_#171717] transition hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#171717] dark:border-[#ECF7F9] dark:bg-[#122228] dark:shadow-[2px_2px_0_#4b646b]">
            <span className={`grid h-10 w-10 shrink-0 place-items-center border-2 border-[#171717] text-[#171717] ${tint}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-xs font-bold uppercase">{title}</strong><small className="mt-1 block text-[10px] text-[#647780] dark:text-[#9db0b5]">{subtitle}</small></span><ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>)}
        </div>
      </section>
    </div>
  );
};
