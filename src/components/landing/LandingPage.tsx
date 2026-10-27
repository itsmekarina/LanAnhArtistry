import React from 'react';
import { ArrowRight, BookOpen, Feather, Languages, Quote, Sparkles } from 'lucide-react';

const principles = [
  { icon: Languages, title: 'Tôn trọng ngữ cảnh', description: 'Một câu văn luôn nằm trong mạch truyện, bối cảnh và cảm xúc của cả tác phẩm.' },
  { icon: Feather, title: 'Giữ giọng kể riêng', description: 'Mỗi lựa chọn từ ngữ góp phần tạo nên nhịp điệu và sắc thái của câu chuyện.' },
  { icon: BookOpen, title: 'Chăm chút từng chi tiết', description: 'Tên gọi, cách xưng hô và những chi tiết nhỏ cần được cân nhắc nhất quán.' },
];

export const LandingPage: React.FC = () => (
  <div className="min-h-screen overflow-hidden bg-[#f8f8f4] text-[#252d2a]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
      <a href="#top" className="flex items-center gap-3" aria-label="LanAnhArtistry, đầu trang">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#315f58] text-white"><BookOpen className="h-5 w-5" /></span>
        <span className="font-serif text-lg font-semibold tracking-tight">LanAnhArtistry</span>
      </a>
      <nav className="hidden items-center gap-8 text-sm text-[#68736d] md:flex">
        <a className="transition hover:text-[#315f58]" href="#about">Về dự án</a>
        <a className="transition hover:text-[#315f58]" href="#principles">Nguyên tắc biên tập</a>
      </nav>
      <a href="#about" className="inline-flex items-center gap-2 rounded-full border border-[#d9dfd8] px-4 py-2.5 text-sm font-medium transition hover:border-[#315f58] hover:text-[#315f58]">Khám phá <ArrowRight className="h-4 w-4" /></a>
    </header>

    <main id="top">
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:pb-28">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#e3eadc] blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e0e4dc] bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.14em] text-[#62796d]"><Sparkles className="h-3.5 w-3.5" /> Dự án dịch thuật truyện</div>
          <h1 className="max-w-3xl font-serif text-5xl font-medium leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">Mỗi câu chuyện<br /><span className="italic text-[#527d70]">một giọng kể riêng.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#68736d] sm:text-lg">LanAnhArtistry là dự án dành cho việc chuyển ngữ truyện Trung và Anh sang tiếng Việt — với sự chăm chút cho ngữ cảnh, nhịp văn và những chi tiết làm nên thế giới của câu chuyện.</p>
          <a href="#about" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#315f58] px-6 text-sm font-semibold text-white transition hover:bg-[#254d47]">Tìm hiểu dự án <ArrowRight className="h-4 w-4" /></a>
          <p className="mt-5 text-xs text-[#829087]">Website giới thiệu dự án LanAnhArtistry.</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ml-auto">
          <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[#eadfca] blur-2xl" />
          <div className="relative rotate-1 rounded-[2rem] border border-[#e3e3da] bg-white p-7 shadow-[0_28px_90px_-48px_rgba(47,74,63,.45)] sm:p-10">
            <div className="flex items-center justify-between border-b border-[#ecece5] pb-5"><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#879188]">Ghi chép bên lề</span><Quote className="h-5 w-5 text-[#779184]" /></div>
            <p className="mt-7 font-serif text-2xl leading-relaxed text-[#43544c]">“The rain softened, and the old street returned to silence.”</p>
            <div className="my-7 h-px bg-[#ecece5]" />
            <p className="font-serif text-2xl leading-relaxed text-[#315f58]">“Mưa dịu dần, con phố cũ lại chìm vào tĩnh lặng.”</p>
            <div className="mt-8 flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-[#89938b]"><span>Một câu văn</span><span>Hai ngôn ngữ</span></div>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-[#e5e7df] bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#648176]">Về LanAnhArtistry</p><h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">Dịch truyện là lắng nghe trước khi viết lại.</h2></div>
          <div className="space-y-5 text-sm leading-7 text-[#68736d] sm:text-base"><p>Một bản chuyển ngữ không chỉ tìm từ tương đương. Người dịch còn cần lắng nghe giọng nhân vật, hiểu điều chưa nói thành lời và giữ được cảm xúc xuyên suốt tác phẩm.</p><p>LanAnhArtistry ghi lại hành trình ấy qua những suy ngẫm về ngôn ngữ, lựa chọn dịch thuật và nghệ thuật kể chuyện bằng tiếng Việt.</p></div>
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#648176]">Nguyên tắc biên tập</p><h2 className="mt-4 font-serif text-3xl font-medium sm:text-4xl">Đọc kỹ. Cân nhắc. Viết bằng sự thấu hiểu.</h2></div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">{principles.map(({ icon: Icon, title, description }) => <article key={title} className="border-t border-[#dfe4dc] pt-6"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#edf1e9] text-[#52776b]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-[#748078]">{description}</p></article>)}</div>
      </section>
    </main>

    <footer className="border-t border-[#e5e7df] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-xs text-[#7b8780] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span className="font-serif text-sm font-semibold text-[#3e5d58]">LanAnhArtistry</span><span>Dự án dịch thuật và nghệ thuật kể chuyện.</span></div></footer>
  </div>
);
