import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  FileSearch,
  Languages,
  Sparkles,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Languages,
    title: 'Dịch trong ngữ cảnh',
    description: 'Đặt nguyên tác cạnh bản dịch, giữ từng đoạn liên kết và tiếp tục đúng chỗ bạn đã dừng.',
  },
  {
    icon: Brain,
    title: 'Bộ nhớ dịch theo truyện',
    description: 'Lưu cách dịch, xưng hô và thuật ngữ cùng ngữ cảnh sử dụng để tra lại nhanh.',
  },
  {
    icon: Users,
    title: 'Nhân vật và quan hệ',
    description: 'Theo dõi cách gọi, vai trò và những thay đổi trong quan hệ nhân vật.',
  },
  {
    icon: BookOpen,
    title: 'Story Bible và dòng truyện',
    description: 'Tập hợp ghi chú, tóm tắt chương, sự kiện và những điều còn bỏ ngỏ.',
  },
  {
    icon: FileSearch,
    title: 'Rà soát trước khi xuất bản',
    description: 'Xem cảnh báo về thuật ngữ, xưng hô và tính nhất quán rồi tự quyết định cách xử lý.',
  },
  {
    icon: CheckCircle2,
    title: 'Bản dịch luôn do bạn kiểm soát',
    description: 'AI có thể phân tích và đề xuất; mọi thay đổi quan trọng đều cần bạn xác nhận.',
  },
];

const steps = [
  ['01', 'Tạo không gian cho truyện', 'Mỗi tác phẩm có thư viện, ghi chú và bộ nhớ riêng.'],
  ['02', 'Dịch và lưu theo chương', 'Làm việc với nguyên tác và bản dịch song song, rồi tiếp tục bất cứ lúc nào.'],
  ['03', 'Tra cứu và rà soát', 'Tìm lại cách dịch cũ, kiểm tra mạch truyện và xuất bản khi bạn sẵn sàng.'],
];

export const LandingPage: React.FC = () => (
  <div className="min-h-screen overflow-hidden bg-[#f7faf9] text-[#1f3034]">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <a href="#" className="flex items-center gap-2.5" aria-label="LanAnhArtistry trang chủ">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d7efeb] text-[#275f59]">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight">LanAnhArtistry</span>
      </a>
      <nav className="hidden items-center gap-8 text-sm text-[#617477] md:flex">
        <a className="transition hover:text-[#1f3034]" href="#features">Tính năng</a>
        <a className="transition hover:text-[#1f3034]" href="#workflow">Cách hoạt động</a>
        <a className="transition hover:text-[#1f3034]" href="#principles">Nguyên tắc</a>
      </nav>
      <a href="#/workspace" className="inline-flex items-center gap-2 rounded-full bg-[#1f3034] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#31545a] sm:text-sm">
        Mở workspace <ArrowRight className="h-4 w-4" />
      </a>
    </header>

    <main>
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28">
        <div className="pointer-events-none absolute -left-28 top-10 h-80 w-80 rounded-full bg-[#e5f2dc] blur-3xl" />
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce8e4] bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#55736e] sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Không gian làm việc cho người dịch truyện
          </div>
          <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Giữ mạch truyện,<br /><span className="text-[#4c827a]">giữ giọng dịch của bạn.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#64777a] sm:text-lg sm:leading-8">
            LanAnhArtistry giúp bạn dịch truyện Trung và Anh sang tiếng Việt với nguyên tác, bộ nhớ dịch và tri thức của từng câu chuyện cùng một nơi.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#/workspace" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#315f5b] px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#244d49]">
              Bắt đầu làm việc <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#features" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#d8e3df] bg-white px-5 text-sm font-semibold text-[#36504f] transition hover:border-[#94b7ae]">
              Khám phá tính năng
            </a>
          </div>
          <p className="mt-5 text-xs text-[#7b8d8e]">Thư viện bắt đầu trống để bạn tự thêm tác phẩm của mình.</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full bg-[#f4e8c7] blur-2xl" />
          <div className="relative rounded-[1.75rem] border border-[#e0e9e5] bg-white p-4 shadow-[0_24px_80px_-40px_rgba(42,76,72,.4)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#edf1ef] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#82908e]">Bàn dịch</p>
                <p className="mt-1 font-serif text-lg font-semibold">Nguyên tác và bản dịch</p>
              </div>
              <span className="rounded-full bg-[#e9f4ed] px-3 py-1 text-[10px] font-medium text-[#47745d]">Đã lưu</span>
            </div>
            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f8f6] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#84908d]">Original</p>
                <p className="font-serif text-sm leading-6 text-[#53615f]">The rain softened, and the old street returned to silence.</p>
              </div>
              <div className="rounded-2xl bg-[#f0f7f4] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#58847b]">Bản dịch</p>
                <p className="font-serif text-sm leading-6 text-[#344c48]">Mưa dịu dần, con phố cũ lại chìm vào tĩnh lặng.</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[#e3ece8] p-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e8f1e2] text-[#587b54]"><Brain className="h-4 w-4" /></span>
              <div><p className="text-xs font-semibold">Gợi ý từ bộ nhớ dịch</p><p className="mt-1 text-[11px] leading-5 text-[#74827f]">Tra lại cách dùng trước đây mà không làm thay đổi bản dịch của bạn.</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between px-1 text-[10px] text-[#86918f]"><span>Nguyên tác ↔ Bản dịch</span><span className="inline-flex items-center gap-1"><Compass className="h-3 w-3" /> Theo ngữ cảnh</span></div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#e7eeeb] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#62847d]">Một câu chuyện, một bộ nhớ riêng</p>
            <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight sm:text-4xl">Ít thao tác hơn. Nhiều ngữ cảnh hơn.</h2>
            <p className="mt-4 text-sm leading-7 text-[#687a78] sm:text-base">Từ cách dịch một cụm từ đến quan hệ giữa các nhân vật, những chi tiết cần nhớ luôn gắn với câu chuyện của bạn.</p>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="border-t border-[#e6eeea] pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#edf5f0] text-[#47736a]"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-serif text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#71817f]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#62847d]">Quy trình gọn nhẹ</p>
            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Quay lại truyện sau vài tuần vẫn bắt được mạch.</h2>
          </div>
          <div className="divide-y divide-[#dfe9e4] border-y border-[#dfe9e4]">
            {steps.map(([number, title, description]) => (
              <div key={number} className="grid gap-3 py-5 sm:grid-cols-[64px_1fr] sm:gap-5">
                <span className="font-mono text-xs text-[#8aa39b]">{number}</span>
                <div><h3 className="font-serif text-lg font-semibold">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#71817f]">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="principles" className="mx-5 mb-16 rounded-[1.75rem] bg-[#eaf3ed] px-6 py-12 sm:mx-8 sm:px-10 lg:mx-auto lg:max-w-7xl lg:px-14 lg:py-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#5c8075]">Nguyên tắc của LanAnhArtistry</p><h2 className="mt-3 font-serif text-2xl font-medium sm:text-3xl">AI hỗ trợ người dịch. Người dịch luôn là người quyết định.</h2><p className="mt-3 text-sm leading-6 text-[#5e7470]">Gợi ý, cảnh báo và phân tích giúp bạn cân nhắc; bản dịch chỉ thay đổi khi bạn chủ động chỉnh sửa.</p></div>
          <a href="#/workspace" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#315f5b] px-6 text-sm font-semibold text-white transition hover:bg-[#244d49]">Vào workspace <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
    </main>

    <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 pb-8 text-xs text-[#7a8986] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
      <span className="font-serif text-sm font-semibold text-[#3e5d58]">LanAnhArtistry</span>
      <span>Không gian dịch truyện và tri thức cho người dịch.</span>
    </footer>
  </div>
);
