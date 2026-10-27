import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Heart,
  LibraryBig,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';

type Story = {
  title: string;
  author: string;
  genre: string;
  description: string;
  chapter: string;
  updated: string;
  tone: string;
  rank: number;
};

const stories: Story[] = [
  { title: 'Mùa mưa qua phố cũ', author: 'Lan Anh', genre: 'Đô thị', description: 'Một cuộc gặp tình cờ đưa hai người xa lạ trở lại con phố họ từng muốn quên.', chapter: 'Chương 18', updated: '20 phút trước', tone: 'from-[#b9d7cf] to-[#e9d5bc]', rank: 1 },
  { title: 'Khúc hát bên bờ Vị Thủy', author: 'Minh Châu', genre: 'Cổ đại', description: 'Giữa kinh thành nhiều biến động, một khúc đàn hé lộ bí mật của gia tộc.', chapter: 'Chương 42', updated: '1 giờ trước', tone: 'from-[#d9c6ae] to-[#a7bbb1]', rank: 2 },
  { title: 'Người giữ đèn trên núi', author: 'Hạ Vy', genre: 'Huyền huyễn', description: 'Người gác đèn trẻ tuổi phát hiện ngọn lửa mình gìn giữ có thể gọi tên ký ức.', chapter: 'Chương 11', updated: '3 giờ trước', tone: 'from-[#b9c7d2] to-[#e4cba9]', rank: 3 },
  { title: 'Bản nháp gửi ngày mai', author: 'An Nhiên', genre: 'Thanh xuân', description: 'Những lá thư chưa từng gửi nối lại tình bạn của hai người sau nhiều năm.', chapter: 'Chương 27', updated: 'Hôm qua', tone: 'from-[#ecd6c8] to-[#c3d6c6]', rank: 4 },
  { title: 'Mật mã ở ga cuối', author: 'Kha Nguyên', genre: 'Trinh thám', description: 'Một chuyến tàu đêm, ba lời khai và chiếc vé không có ngày trở về.', chapter: 'Chương 9', updated: 'Hôm qua', tone: 'from-[#c5c8bd] to-[#aabac1]', rank: 5 },
  { title: 'Ngày nắng không vội', author: 'Mai Lam', genre: 'Đời thường', description: 'Câu chuyện bình dị về một tiệm sách nhỏ và những vị khách ghé qua.', chapter: 'Chương 15', updated: '2 ngày trước', tone: 'from-[#eddcb3] to-[#bdd8cd]', rank: 6 },
];

const genres = ['Tất cả', 'Đô thị', 'Cổ đại', 'Huyền huyễn', 'Thanh xuân', 'Trinh thám', 'Đời thường'];

const updates = [
  { title: 'Mùa mưa qua phố cũ', chapter: 'Chương 18 · Một cuộc hẹn cũ', time: '20 phút trước', genre: 'Đô thị' },
  { title: 'Khúc hát bên bờ Vị Thủy', chapter: 'Chương 42 · Tiếng đàn trong đêm', time: '1 giờ trước', genre: 'Cổ đại' },
  { title: 'Người giữ đèn trên núi', chapter: 'Chương 11 · Dấu chân dưới tuyết', time: '3 giờ trước', genre: 'Huyền huyễn' },
  { title: 'Bản nháp gửi ngày mai', chapter: 'Chương 27 · Tấm bưu thiếp màu xanh', time: 'Hôm qua', genre: 'Thanh xuân' },
];

export const LandingPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Tất cả');
  const [showAll, setShowAll] = useState(false);

  const filteredStories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return stories.filter((story) => {
      const matchesGenre = genre === 'Tất cả' || story.genre === genre;
      const searchable = [story.title, story.author, story.genre, story.description].join(' ').toLocaleLowerCase('vi');
      return matchesGenre && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [genre, query]);

  const visibleStories = showAll ? filteredStories : filteredStories.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#252d2a]">
      <header className="sticky top-0 z-30 border-b border-[#e8e8df] bg-[#fbfbf8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3.5 sm:px-7 lg:px-10">
          <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="LanAnhArtistry trang chủ">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#315f58] text-white"><BookOpen className="h-5 w-5" /></span>
            <span><span className="block font-serif text-lg font-semibold leading-tight">LanAnhArtistry</span><span className="block text-[9px] uppercase tracking-[.18em] text-[#819087]">Thư viện truyện dịch</span></span>
          </a>

          <nav className="hidden items-center gap-6 pl-5 text-sm text-[#66736c] lg:flex">
            <a href="#truyen-moi" className="transition hover:text-[#315f58]">Truyện mới</a>
            <a href="#the-loai" className="transition hover:text-[#315f58]">Thể loại</a>
            <a href="#xep-hang" className="transition hover:text-[#315f58]">Xếp hạng</a>
            <a href="#gioi-thieu" className="transition hover:text-[#315f58]">Giới thiệu</a>
          </nav>

          <label className="ml-auto flex min-w-0 max-w-xs flex-1 items-center gap-2 rounded-full border border-[#e2e5dd] bg-white px-3.5 py-2 text-[#849087] focus-within:border-[#80a79a]">
            <Search className="h-4 w-4 shrink-0" />
            <input aria-label="Tìm truyện" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') document.getElementById('truyen-moi')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} placeholder="Tìm truyện, tác giả..." className="w-full bg-transparent text-xs text-[#303a35] outline-none placeholder:text-[#a1aaa3]" />
          </label>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-[#e9e6dc] bg-[#eeefe7]">
          <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#dbe6d9] blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#eadcc8] blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_.85fr] lg:px-12 lg:py-24">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7ded4] bg-white/70 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#567267]"><Sparkles className="h-3.5 w-3.5" /> Không gian dành cho người yêu truyện</p>
              <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Tìm một câu chuyện.<br /><span className="italic text-[#527d70]">Ở lại với thế giới ấy.</span></h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#68736d] sm:text-base">Khám phá truyện dịch được tuyển chọn, theo dõi chương mới và tìm thể loại hợp với tâm trạng hôm nay.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#truyen-moi" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#315f58] px-5 text-sm font-semibold text-white transition hover:bg-[#254d47]">Khám phá thư viện <ArrowRight className="h-4 w-4" /></a>
                <a href="#the-loai" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#cfd8cf] bg-white/70 px-5 text-sm font-medium text-[#40574d] transition hover:bg-white">Chọn thể loại <Compass className="h-4 w-4" /></a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute left-8 top-3 h-72 w-52 -rotate-6 rounded-[1.5rem] bg-gradient-to-br from-[#b9d7cf] to-[#e9d5bc] shadow-xl sm:h-80 sm:w-60" />
              <div className="relative ml-auto mr-5 flex h-72 w-52 rotate-3 flex-col justify-between rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-[#d9c6ae] to-[#809b8d] p-6 text-white shadow-[0_28px_70px_-30px_rgba(45,68,57,.55)] sm:mr-12 sm:h-80 sm:w-60">
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[.18em]"><span>LanAnhArtistry</span><BookOpen className="h-4 w-4" /></div>
                <div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-white/75">Tuyển tập minh họa</p><h2 className="font-serif text-3xl leading-tight">Những<br />ngày dịu<br />dàng</h2><p className="mt-4 text-xs text-white/80">Truyện dịch · Tập 01</p></div>
                <div className="h-px bg-white/50" />
              </div>
              <div className="absolute -bottom-2 left-0 rounded-2xl border border-[#e2e4db] bg-white/90 px-4 py-3 shadow-lg backdrop-blur"><p className="text-[9px] uppercase tracking-[.15em] text-[#8a958c]">Gợi ý hôm nay</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#40574d]"><Heart className="h-3.5 w-3.5 text-[#bd756e]" /> Một truyện để đọc chậm</p></div>
            </div>
          </div>
        </section>

        <section id="the-loai" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.16em] text-[#879188]">Thể loại</span><div className="flex gap-2 overflow-x-auto pb-1">{genres.map((item) => <button key={item} type="button" onClick={() => { setGenre(item); document.getElementById('truyen-moi')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={'shrink-0 rounded-full border px-4 py-2 text-xs transition ' + (genre === item ? 'border-[#315f58] bg-[#315f58] text-white' : 'border-[#e0e3dc] bg-white text-[#66736c] hover:border-[#85a497]')}>{item}</button>)}</div></div>
        </section>

        <section id="truyen-moi" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 pt-8 sm:px-8 lg:px-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#71867a]">Thư viện</p><h2 className="mt-2 font-serif text-3xl font-medium">Truyện dành cho bạn</h2></div>
            <p className="text-xs text-[#89928b]">Dữ liệu minh họa giao diện · sẽ thay bằng truyện được đăng</p>
          </div>
          {visibleStories.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visibleStories.map((story) => <article key={story.title} className="group overflow-hidden rounded-2xl border border-[#e4e5dd] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_45px_-32px_rgba(40,70,57,.5)]">
            <div className={'relative flex h-44 items-end overflow-hidden bg-gradient-to-br p-5 ' + story.tone}><div className="absolute -right-6 -top-10 h-36 w-36 rounded-full border border-white/30" /><div className="absolute -right-1 -top-1 h-28 w-28 rounded-full border border-white/25" /><span className="relative z-10 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.13em] text-[#50675c]">Truyện mẫu · {story.genre}</span></div>
            <div className="p-5"><h3 className="font-serif text-xl font-semibold leading-snug group-hover:text-[#47766a]">{story.title}</h3><p className="mt-1 text-[11px] text-[#89938c]">Tác giả: {story.author}</p><p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#737f77]">{story.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#eff0eb] pt-3 text-[10px] text-[#849087]"><span>{story.chapter}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{story.updated}</span></div></div>
          </article>)}</div> : <div className="rounded-2xl border border-dashed border-[#d9dfd8] bg-white p-10 text-center text-sm text-[#78847c]">Không tìm thấy truyện phù hợp. Thử đổi từ khóa hoặc thể loại nhé.</div>}
          {filteredStories.length > 4 && <div className="mt-8 text-center"><button type="button" onClick={() => setShowAll(!showAll)} className="inline-flex items-center gap-2 rounded-full border border-[#d9dfd8] bg-white px-5 py-2.5 text-xs font-semibold text-[#476459] hover:border-[#86a397]">{showAll ? 'Thu gọn' : 'Xem thêm truyện'} <ChevronRight className={'h-4 w-4 transition ' + (showAll ? 'rotate-[-90deg]' : 'rotate-90')} /></button></div>}
        </section>

        <section className="border-y border-[#e7e8e0] bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:px-12">
            <div>
              <div className="mb-6 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#71867a]">Vừa được cập nhật</p><h2 className="mt-2 font-serif text-2xl font-medium">Chương mới</h2></div><a href="#truyen-moi" className="inline-flex items-center gap-1 text-xs font-semibold text-[#56786c] hover:text-[#315f58]">Tất cả <ChevronRight className="h-4 w-4" /></a></div>
              <div className="divide-y divide-[#eceee8] border-y border-[#eceee8]">{updates.map((item) => <article key={item.title} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-serif text-base font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#78847c]">{item.chapter}</p></div><div className="flex items-center gap-3 text-[10px] text-[#929a93]"><span className="rounded-full bg-[#f1f3ed] px-2.5 py-1 text-[#718176]">{item.genre}</span><span>{item.time}</span></div></article>)}</div>
            </div>
            <aside id="xep-hang" className="scroll-mt-24">
              <div className="mb-6"><p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#71867a]"><Flame className="h-3.5 w-3.5 text-[#bb8060]" /> Được quan tâm</p><h2 className="mt-2 font-serif text-2xl font-medium">Truyện nổi bật</h2></div>
              <div className="space-y-1">{stories.slice(0, 5).map((story, index) => <article key={story.title} className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-[#f7f8f3]"><span className={'w-6 text-center font-serif text-xl ' + (index < 3 ? 'text-[#789487]' : 'text-[#a8afa8]')}>0{index + 1}</span><div className={'h-12 w-10 shrink-0 rounded-lg bg-gradient-to-br ' + story.tone} /><div className="min-w-0 flex-1"><p className="truncate font-serif text-sm font-semibold">{story.title}</p><p className="mt-1 text-[10px] text-[#8b958d]">{story.genre} · {story.author}</p></div><Star className="h-4 w-4 shrink-0 text-[#c3a96f]" /></article>)}</div>
            </aside>
          </div>
        </section>

        <section id="gioi-thieu" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="grid gap-8 rounded-[1.75rem] bg-[#e9eee6] px-6 py-10 sm:px-10 md:grid-cols-[1fr_auto] md:items-center">
            <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#648176]">Về thư viện</p><h2 className="mt-3 font-serif text-2xl font-medium sm:text-3xl">Một góc nhỏ dành cho những câu chuyện được kể lại bằng tiếng Việt.</h2><p className="mt-4 text-sm leading-7 text-[#65736a]">LanAnhArtistry hướng đến trải nghiệm đọc truyện dịch chỉn chu, dễ tìm kiếm và dễ theo dõi. Danh mục truyện thật sẽ được bổ sung khi nội dung sẵn sàng.</p></div>
            <a href="#top" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#315f58] px-5 text-sm font-semibold text-white hover:bg-[#254d47]">Lên đầu trang <ArrowRight className="h-4 w-4 -rotate-45" /></a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e4e6de] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div><a href="#top" className="font-serif text-base font-semibold text-[#3e5d58]">LanAnhArtistry</a><p className="mt-1 text-xs text-[#89938c]">Thư viện truyện dịch và nghệ thuật kể chuyện.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#77837b]"><a href="#truyen-moi" className="hover:text-[#315f58]">Truyện mới</a><a href="#the-loai" className="hover:text-[#315f58]">Thể loại</a><a href="#gioi-thieu" className="hover:text-[#315f58]">Giới thiệu</a></div>
          <span className="text-[10px] text-[#9aa39b]">© LanAnhArtistry</span>
        </div>
      </footer>
    </div>
  );
};
