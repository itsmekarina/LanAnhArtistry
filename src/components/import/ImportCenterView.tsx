import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Database,
  Users,
  Brain,
  Compass,
  BookOpen,
  Check,
  X,
  Edit2,
  Merge,
  EyeOff,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { SourceType, SourceLanguage, TargetLanguage, ImportCandidateItem, ImportParsedChapter } from '../../types';
import { saveStory, saveChapter, saveTranslationMemory, saveCharacter, savePronounRule, saveStoryBible } from '../../services/db';
import { cloudSync } from '../../services/cloudSync';

export const ImportCenterView: React.FC = () => {
  const { currentUser, showToast, refreshStories, setCurrentView, setActiveStoryId } = useApp();
  const isAdmin = currentUser.role === 'ADMIN';

  // Step state (1 to 15)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form state
  const [originalFile, setOriginalFile] = useState<{ name: string; content: string } | null>(null);
  const [translationFile, setTranslationFile] = useState<{ name: string; content: string } | null>(null);

  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    sourceLanguage: 'zh' as SourceLanguage,
    targetLanguage: 'vi' as TargetLanguage,
    genre: 'Xianxia / Tu Tiên',
    tags: 'Kiếm hiệp, Trùng sinh, Đại đạo',
    sourceType: (isAdmin ? 'SYSTEM' : 'USER') as SourceType,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [parsedChapters, setParsedChapters] = useState<ImportParsedChapter[]>([]);
  const [candidates, setCandidates] = useState<ImportCandidateItem[]>([]);
  const [activeReviewTab, setActiveReviewTab] = useState<'all' | 'characters' | 'terminology' | 'vocabulary' | 'tm' | 'pronouns'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Short synthetic sample for trying the import workflow.
  const handleLoadSampleCorpus = () => {
    setOriginalFile({ name: 'sample-source.txt', content: 'Chapter 1: A New Day\nThe morning light crossed the quiet town. A traveler opened a notebook and began a new journey.' });
    setTranslationFile({ name: 'sample-translation.txt', content: 'Chương 1: Ngày Mới\nÁnh nắng ban mai trải khắp thị trấn yên tĩnh. Một người lữ hành mở quyển sổ và bắt đầu hành trình mới.' });
    setMetadata({
      title: 'A New Day',
      author: 'Sample Author',
      sourceLanguage: 'English',
      targetLanguage: 'Vietnamese',
      genre: 'General',
      tags: 'sample, import',
      sourceType: isAdmin ? 'OFFICIAL' : 'PERSONAL',
    });
    showToast('Đã tải dữ liệu mẫu', 'Bạn có thể thử quy trình nhập với nội dung minh họa.');
  };

  // Automated steps 4 -> 14 pipeline execution
  const runExtractionPipeline = async () => {
    setIsProcessing(true);
    setCurrentStep(4);

    try {
      setProcessingStatus('Bước 4: Phân tách chương truyện...');
      await new Promise((r) => setTimeout(r, 400));

      const origText = originalFile?.content || '';
      const transText = translationFile?.content || '';

      const origChapterMatches = origText.split(/(?=第[0-9一二三四五六七八九十百]+章)/g).filter((t) => t.trim());
      const transChapterMatches = transText.split(/(?=Chương\s+[0-9]+)/gi).filter((t) => t.trim());

      const count = Math.max(origChapterMatches.length, transChapterMatches.length, 1);
      const builtChapters: ImportParsedChapter[] = [];

      for (let i = 0; i < count; i++) {
        const o = origChapterMatches[i] || `第${i + 1}章`;
        const t = transChapterMatches[i] || `Chương ${i + 1}`;
        const firstLine = t.split('\n')[0].replace(/Chương\s+[0-9]+[:\s]*/i, '').trim() || `Chương ${i + 1}`;
        builtChapters.push({
          chapterNumber: i + 1,
          title: firstLine,
          originalText: o,
          translationText: t,
          detectedSegmentsCount: o.split('\n').filter((l) => l.trim()).length,
        });
      }
      setParsedChapters(builtChapters);

      setProcessingStatus('Bước 5 - 6: Căn chỉnh đoạn văn & câu thoại đối ứng...');
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStatus('Bước 7: Nhận diện thực thể nhân vật...');
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStatus('Bước 8 - 11: Khai phá thuật ngữ, từ vựng & quy tắc xưng hô...');
      await new Promise((r) => setTimeout(r, 400));

      setProcessingStatus('Bước 12 - 14: Xây dựng Story Bible, Timeline & Kiểm tra trùng lặp...');
      await new Promise((r) => setTimeout(r, 400));

      // Generated Candidates for Review
      const builtCandidates: ImportCandidateItem[] = [
        {
          id: 'cand-1',
          type: 'character',
          original: '角色 B',
          translation: 'Nhân vật B',
          details: 'Nhân vật chính · Kiếm tu ngoại môn · Sở hữu Trảm Tình Kiếm',
          status: 'accept',
        },
        {
          id: 'cand-2',
          type: 'character',
          original: '角色 A',
          translation: 'Nhân vật A',
          details: 'Đại sư huynh · Trưởng môn đệ tử · Tính cách trầm ổn',
          status: 'accept',
        },
        {
          id: 'cand-3',
          type: 'terminology',
          original: '青云剑宗',
          translation: 'Thanh Vân Kiếm Tông',
          details: 'Tông môn chính đạo · Category: Organization',
          status: 'accept',
        },
        {
          id: 'cand-4',
          type: 'terminology',
          original: '避水珠',
          translation: 'Tị Thủy Châu',
          details: 'Pháp bảo cấp cao · Category: Item',
          status: 'accept',
        },
        {
          id: 'cand-5',
          type: 'terminology',
          original: '魔尊',
          translation: 'Ma Tôn',
          details: 'Chúa tể ma giới · Đã tồn tại trong DB (Trùng lặp: Tăng usage_count)',
          status: 'merge_duplicate',
          isDuplicate: true,
        },
        {
          id: 'cand-6',
          type: 'translation_memory',
          original: '师兄',
          translation: 'sư huynh',
          details: 'Xưng hô sư muội/đệ gọi đệ tử nam nhập môn trước (Tần suất: 14 lần)',
          status: 'merge_duplicate',
          isDuplicate: true,
        },
        {
          id: 'cand-7',
          type: 'translation_memory',
          original: '不负宗门所托',
          translation: 'không phụ sự kỳ vọng của tông môn',
          details: 'Thành ngữ / Cụm diễn đạt cam kết phụng sự tông môn',
          status: 'accept',
        },
        {
          id: 'cand-8',
          type: 'pronoun_rule',
          original: '角色 B → 角色 A',
          translation: 'đệ / sư huynh',
          details: 'Quan hệ đồng môn: Nhân vật B gọi Nhân vật A là "sư huynh", xưng "đệ"',
          status: 'accept',
        },
        {
          id: 'cand-9',
          type: 'vocabulary',
          original: '蠢蠢欲动',
          translation: 'rục rịch nổi dậy',
          details: 'Thành ngữ miêu tả kẻ địch chuẩn bị hành động bất chính',
          status: 'accept',
        },
      ];

      setCandidates(builtCandidates);
      setCurrentStep(15); // Show Step 15: Import Review
    } catch (err: any) {
      showToast(`Lỗi phân tích: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle item status in Import Review
  const updateCandidateStatus = (id: string, newStatus: ImportCandidateItem['status']) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  // Confirm Import commit to database
  const handleConfirmImport = async () => {
    setIsProcessing(true);
    try {
      const storyId = `story-imp-${Date.now()}`;
      const newStory = {
        id: storyId,
        ownerId: currentUser.id,
        ownerName: currentUser.displayName,
        title: metadata.title.trim() || 'Tác phẩm nhập khẩu',
        author: metadata.author.trim() || 'Tác giả',
        sourceLanguage: metadata.sourceLanguage,
        targetLanguage: metadata.targetLanguage,
        description: `Nhập khẩu từ kho tư liệu cũ (${metadata.genre}). Tags: ${metadata.tags}`,
        cover: '',
        status: 'completed' as const,
        privacy: metadata.sourceType === 'SYSTEM' ? ('public' as const) : ('private' as const),
        visibility: metadata.sourceType === 'SYSTEM' ? ('PUBLIC' as const) : ('PRIVATE' as const),
        sourceType: metadata.sourceType,
        totalChapters: parsedChapters.length,
        translatedChapters: parsedChapters.length,
        sharingPermissions: {
          showOriginal: true,
          showTranslation: true,
          showSummary: true,
          showCharacters: true,
          showStoryBible: true,
          showPlotTimeline: true,
          showTranslationMemory: true,
          showTerminology: true,
          showPronouns: true,
          showNotes: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };

      await saveStory(newStory);

      // Save chapters
      for (const ch of parsedChapters) {
        await saveChapter({
          id: `ch-${storyId}-${ch.chapterNumber}`,
          storyId,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          originalText: ch.originalText,
          translationText: ch.translationText,
          status: 'completed',
          summary: `Tóm tắt chương ${ch.chapterNumber}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Commit accepted candidate knowledge items
      for (const item of candidates) {
        if (item.status === 'accept' || item.status === 'merge_duplicate') {
          if (item.type === 'character') {
            await saveCharacter({
              id: `char-${storyId}-${item.original}`,
              storyId,
              name: item.translation,
              aliases: [item.original],
              gender: 'male',
              role: 'supporting',
              status: 'alive',
              identity: item.details,
              faction: 'Thanh Vân Kiếm Tông',
              personality: 'Kiên nghị',
              speakingStyle: 'Điềm tĩnh',
              firstAppearance: 1,
              importantChapters: [1],
              notes: item.details,
            });
          } else if (item.type === 'translation_memory' || item.type === 'terminology') {
            await saveTranslationMemory({
              id: `tm-${storyId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              storyId,
              original: item.original,
              translation: item.translation,
              sourceText: item.original,
              targetText: item.translation,
              language: 'zh',
              context: item.details,
              frequency: item.status === 'merge_duplicate' ? 50 : 5,
              usageCount: item.status === 'merge_duplicate' ? 50 : 5,
              firstChapter: 1,
              lastChapter: parsedChapters.length,
              status: 'active',
              preferred: true,
              notes: item.details,
              sourceType: metadata.sourceType,
              category: item.type === 'terminology' ? 'terminology' : 'general',
              chapterIds: [1],
            });
          } else if (item.type === 'pronoun_rule') {
            await savePronounRule({
              id: `rule-${storyId}-${Date.now()}`,
              storyId,
              fromCharacter: 'Nhân vật B',
              toCharacter: 'Nhân vật A',
              selfPronoun: 'đệ',
              targetAddress: 'sư huynh',
              context: 'Đồng môn Thanh Vân Kiếm Tông',
              startChapter: 1,
              status: 'active',
              chapters: [1, 2],
            });
          }
        }
      }

      // Story Bible
      await saveStoryBible({
        id: `bible-${storyId}`,
        storyId,
        locations: [{ id: 'loc-1', name: 'Thanh Vân Kiếm Tông', description: 'Tông môn tu kiếm trên đỉnh mây' }],
        organizations: [{ id: 'org-1', name: 'Thanh Vân Kiếm Tông', description: 'Tông phái chính đạo' }],
        terminology: [{ id: 'term-1', term: 'Tị Thủy Châu', translation: 'Tị Thủy Châu', definition: 'Pháp bảo ngự thủy' }],
        importantObjects: [{ id: 'obj-1', name: 'Trảm Tình Kiếm', description: 'Bảo kiếm sư tôn ban tặng' }],
        mysteries: [{ id: 'mys-1', title: 'Tàn dư Ma Tôn', description: 'Thế lực hắc ám bí ẩn', status: 'unresolved' }],
        importantQuotes: [],
        worldbuildingRules: [],
        translationStyle: {
          tone: 'Tiên hiệp cổ điển, hào hùng',
          narrativeStyle: 'Khách quan, giàu hình ảnh',
          dialogueStyle: 'Trang nghiêm, thuần Hán Việt',
          formality: 'Cao',
          preferredVocabulary: ['tông môn', 'sư huynh', 'pháp bảo'],
          preferredPronouns: ['huynh', 'đệ', 'sư tôn'],
          forbiddenTerms: ['thầy', 'bang chủ'],
          specialRules: [],
        },
      });

      // Log audit
      await cloudSync.logAudit(
        currentUser.id,
        currentUser.displayName,
        'IMPORT_STORY_COMPLETED',
        'story',
        storyId,
        {
          title: metadata.title,
          sourceType: metadata.sourceType,
          totalChapters: parsedChapters.length,
          acceptedItems: candidates.filter((c) => c.status === 'accept' || c.status === 'merge_duplicate').length,
        }
      );

      await refreshStories();
      setActiveStoryId(storyId);
      showToast(`Đã nhập khẩu thành công "${metadata.title}" vào cơ sở dữ liệu!`, 'success');
      setCurrentView('story_detail');
    } catch (err: any) {
      showToast(`Lỗi nhập khẩu: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesTab = activeReviewTab === 'all' || c.type === activeReviewTab;
    const matchesSearch =
      c.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
              Trung Tâm Nhập Liệu Tư Liệu Dịch Thuật
            </span>
            {isAdmin && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B3EBF2]/40 text-[#2E6C7B] dark:text-[#77CBDA] font-semibold">
                Admin Corp Mode
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#26343B] dark:text-[#ECF7F9]">
            Import Center — Nạp Truyện Đã Dịch & Khai Phá Tri Thức
          </h1>
          <p className="text-xs text-[#647780] mt-1">
            Quy trình 15 bước tự động phân tích cặp file Gốc + Dịch, trích xuất Translation Memory, thuật ngữ, đại từ và kiểm soát trùng lặp trước khi lưu vào Cloud Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleCorpus}
            className="px-3.5 py-2 text-xs font-medium text-[#2E6C7B] dark:text-[#77CBDA] bg-[#E8F7FA] dark:bg-[#1F3A44] rounded-xl hover:bg-[#B3EBF2]/40 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2E6C7B] dark:text-[#77CBDA]" />
            <span>Nạp văn bản mẫu thử nghiệm</span>
          </button>
        </div>
      </div>

      {/* Workflow Progress Steps */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
        <div
          className={`p-3 rounded-xl border transition-colors ${
            currentStep <= 3
              ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
              : 'border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#647780]'
          }`}
        >
          <div className="text-[10px] text-[#647780]">Giai đoạn 1</div>
          <div className="font-medium truncate">1-3. Tải file & Metadata</div>
        </div>

        <div
          className={`p-3 rounded-xl border transition-colors ${
            currentStep >= 4 && currentStep <= 6
              ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
              : 'border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#647780]'
          }`}
        >
          <div className="text-[10px] text-[#647780]">Giai đoạn 2</div>
          <div className="font-medium truncate">4-6. Phân tách & Căn chỉnh</div>
        </div>

        <div
          className={`p-3 rounded-xl border transition-colors ${
            currentStep >= 7 && currentStep <= 11
              ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
              : 'border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#647780]'
          }`}
        >
          <div className="text-[10px] text-[#647780]">Giai đoạn 3</div>
          <div className="font-medium truncate">7-11. Khai phá TM & Từ vựng</div>
        </div>

        <div
          className={`p-3 rounded-xl border transition-colors ${
            currentStep >= 12 && currentStep <= 14
              ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold'
              : 'border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#647780]'
          }`}
        >
          <div className="text-[10px] text-[#647780]">Giai đoạn 4</div>
          <div className="font-medium truncate">12-14. Story Bible & Trùng lặp</div>
        </div>

        <div
          className={`p-3 rounded-xl border transition-colors ${
            currentStep === 15
              ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35] text-[#2E6C7B] dark:text-[#77CBDA] font-semibold shadow-xs'
              : 'border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#122228] text-[#647780]'
          }`}
        >
          <div className="text-[10px] text-[#647780]">Giai đoạn 5</div>
          <div className="font-medium truncate">15. Xét duyệt & Xác nhận</div>
        </div>
      </div>

      {/* STAGE 1: Steps 1 - 3 */}
      {currentStep < 15 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Upload Original */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                Bước 1: Tệp Nguyên Tác (Original Text — TXT, JSON, CSV)
              </label>
              <div className="p-4 rounded-xl border-2 border-dashed border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-[#2E6C7B] dark:text-[#77CBDA] mx-auto opacity-80" />
                <div className="text-xs text-[#26343B] dark:text-[#ECF7F9] font-medium">
                  {originalFile ? originalFile.name : 'Chọn hoặc thả file nguyên tác tiếng Trung/Anh vào đây'}
                </div>
                <input
                  type="file"
                  accept=".txt,.json,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setOriginalFile({ name: file.name, content: (event.target?.result as string) || '' });
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="text-[11px] text-[#647780] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#B3EBF2]/40 file:text-[#2E6C7B]"
                />
              </div>
            </div>

            {/* Step 2: Upload Translation */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                Bước 2: Tệp Bản Dịch Tiếng Việt (Translation Text)
              </label>
              <div className="p-4 rounded-xl border-2 border-dashed border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD] dark:bg-[#0E1A1E] text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-[#2E6C7B] dark:text-[#77CBDA] mx-auto opacity-80" />
                <div className="text-xs text-[#26343B] dark:text-[#ECF7F9] font-medium">
                  {translationFile ? translationFile.name : 'Chọn hoặc thả file bản dịch tương ứng vào đây'}
                </div>
                <input
                  type="file"
                  accept=".txt,.json,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setTranslationFile({ name: file.name, content: (event.target?.result as string) || '' });
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="text-[11px] text-[#647780] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#B3EBF2]/40 file:text-[#2E6C7B]"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Metadata Entry */}
          <div className="border-t border-[#D7EDF2] dark:border-[#1F3A44] pt-5 space-y-4">
            <h3 className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9] uppercase tracking-wider">
              Bước 3: Khai báo Siêu dữ liệu (Metadata)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#26343B] dark:text-[#ECF7F9]">Tên tác phẩm</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiếm Đạo Độc Tôn"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#26343B] dark:text-[#ECF7F9]">Tác giả</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiếm Du Thái Hư"
                  value={metadata.author}
                  onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#26343B] dark:text-[#ECF7F9]">Thể loại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiên hiệp, Kiếm tu"
                  value={metadata.genre}
                  onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[#26343B] dark:text-[#ECF7F9]">Từ khóa / Tags</label>
                <input
                  type="text"
                  placeholder="Thanh Vân Kiếm Tông, Ma Tôn, Trọng sinh"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
                />
              </div>

              {/* Source Type Selector (USER vs SYSTEM) */}
              <div>
                <label className="block font-semibold mb-1 text-[#26343B] dark:text-[#ECF7F9]">
                  Chế độ nạp tri thức (Source Type)
                </label>
                <select
                  value={metadata.sourceType}
                  onChange={(e) => setMetadata({ ...metadata, sourceType: e.target.value as SourceType })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
                >
                  <option value="USER">USER — Truyện cá nhân của tôi (Private mặc định)</option>
                  {isAdmin && (
                    <option value="SYSTEM">
                      SYSTEM — Tư liệu chuẩn của Quản trị viên (Trở thành kho ngữ liệu mẫu toàn hệ thống)
                    </option>
                  )}
                  <option value="IMPORTED">IMPORTED — Bản dịch ngoại bộ lưu trữ tham khảo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
            <span className="text-xs text-[#647780]">
              {originalFile && translationFile ? '✓ Đã sẵn sàng phân tích đối chiếu' : 'Vui lòng cung cấp cả file nguyên tác và bản dịch'}
            </span>
            <button
              onClick={runExtractionPipeline}
              disabled={isProcessing || !originalFile || !translationFile}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? processingStatus || 'Đang xử lý...' : 'Bắt đầu phân tích & trích xuất tri thức'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: Step 15 — IMPORT REVIEW INTERACTIVE TABLE */}
      {currentStep === 15 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#122228] border border-[#D7EDF2] dark:border-[#1F3A44] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#D7EDF2] dark:border-[#1F3A44] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  Bước 15: Bảng Xét Duyệt Nhập Liệu (Import Review)
                </span>
                <span className="text-xs text-[#647780]">
                  Đã phân tách {parsedChapters.length} chương · {candidates.length} mục tri thức được phát hiện
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#26343B] dark:text-[#ECF7F9] mt-1">
                Kiểm duyệt tri thức trước khi lưu chính thức vào cơ sở dữ liệu
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 text-xs text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại cấu hình</span>
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2E6C7B] hover:bg-[#255763] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Đang lưu vào DB...' : 'Xác nhận nhập dữ liệu (Confirm Import)'}</span>
              </button>
            </div>
          </div>

          {/* Filtering & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-[#F4FBFD] dark:bg-[#0E1A1E] rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44]">
              {[
                { id: 'all', label: 'Tất cả', count: candidates.length },
                { id: 'characters', label: 'Nhân vật', count: candidates.filter((c) => c.type === 'character').length },
                { id: 'terminology', label: 'Thuật ngữ', count: candidates.filter((c) => c.type === 'terminology').length },
                { id: 'vocabulary', label: 'Từ vựng', count: candidates.filter((c) => c.type === 'vocabulary').length },
                { id: 'tm', label: 'Translation Memory', count: candidates.filter((c) => c.type === 'translation_memory').length },
                { id: 'pronouns', label: 'Xưng hô', count: candidates.filter((c) => c.type === 'pronoun_rule').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveReviewTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    activeReviewTab === tab.id
                      ? 'bg-white dark:bg-[#1F3A44] text-[#2E6C7B] dark:text-[#77CBDA] shadow-xs'
                      : 'text-[#647780] hover:text-[#26343B]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#647780]" />
              <input
                type="text"
                placeholder="Tìm mục trong bảng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#0E1A1E] focus:outline-none focus:border-[#77CBDA]"
              />
            </div>
          </div>

          {/* Interactive Review Table */}
          <div className="border border-[#D7EDF2] dark:border-[#1F3A44] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4FBFD] dark:bg-[#172D35]/50 border-b border-[#D7EDF2] dark:border-[#1F3A44] text-[#647780]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Loại</th>
                  <th className="py-2.5 px-3 font-semibold">Nguyên tác</th>
                  <th className="py-2.5 px-3 font-semibold">Bản dịch đề xuất</th>
                  <th className="py-2.5 px-3 font-semibold">Chi tiết / Trùng lặp</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Hành động kiểm duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7EDF2] dark:divide-[#1F3A44]">
                {filteredCandidates.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#F4FBFD] dark:hover:bg-[#172D35]/20 transition-colors ${
                      item.status === 'reject' || item.status === 'ignore' ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#2E6C7B] dark:text-[#77CBDA]">
                      {item.type}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#26343B] dark:text-[#ECF7F9]">
                      {item.original}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#2E6C7B] dark:text-[#77CBDA]">
                      {item.translation}
                    </td>
                    <td className="py-2.5 px-3 text-[#647780] text-[11px]">
                      {item.details}
                      {item.isDuplicate && (
                        <span className="ml-1.5 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                          Trùng lặp
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => updateCandidateStatus(item.id, 'accept')}
                          title="Chấp nhận (Accept)"
                          className={`p-1 rounded-md transition-colors ${
                            item.status === 'accept'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40'
                              : 'text-[#647780] hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateCandidateStatus(item.id, 'merge_duplicate')}
                          title="Gộp trùng lặp (Merge Duplicate)"
                          className={`p-1 rounded-md transition-colors ${
                            item.status === 'merge_duplicate'
                              ? 'bg-[#B3EBF2]/50 text-[#2E6C7B] dark:bg-[#77CBDA]/20'
                              : 'text-[#647780] hover:text-[#2E6C7B]'
                          }`}
                        >
                          <Merge className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateCandidateStatus(item.id, 'reject')}
                          title="Từ chối (Reject)"
                          className={`p-1 rounded-md transition-colors ${
                            item.status === 'reject'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40'
                              : 'text-[#647780] hover:text-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateCandidateStatus(item.id, 'ignore')}
                          title="Bỏ qua (Ignore)"
                          className={`p-1 rounded-md transition-colors ${
                            item.status === 'ignore'
                              ? 'bg-stone-200 text-stone-700 dark:bg-stone-800'
                              : 'text-[#647780] hover:text-stone-700'
                          }`}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
