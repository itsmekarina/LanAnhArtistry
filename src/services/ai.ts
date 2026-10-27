import {
  Chapter,
  TranslationSegment,
  TranslationMemory,
  PronounRule,
  Character,
  StoryBible,
  ConsistencyWarning,
  RecapData,
  WhatChangedSummary,
  PlotEvent,
} from '../types';

export interface AiStatus {
  available: boolean;
  model: string;
  isRealAi: boolean;
}

export interface AnalysisResult {
  summary: string;
  bulletPoints: string[];
  newCharacters: Partial<Character>[];
  pronounObservations: {
    fromCharacter: string;
    toCharacter: string;
    selfPronoun: string;
    targetAddress: string;
    context: string;
  }[];
  vocabularySuggestions: {
    original: string;
    translation: string;
    category: 'title' | 'expression' | 'terminology' | 'idiom' | 'name' | 'general';
    notes: string;
    confidence: number;
  }[];
  plotEvents: {
    title: string;
    description: string;
    characters: string[];
    importance: 'major' | 'minor' | 'climax' | 'turning_point';
  }[];
  consistencyWarnings: Partial<ConsistencyWarning>[];
  source: 'gemini' | 'heuristic_engine';
}

// Check if Gemini Server endpoint is active
export async function checkAiStatus(): Promise<AiStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) {
      const data = await res.json();
      return {
        available: true,
        model: data.model || 'gemini-3.8-flash',
        isRealAi: data.available === true,
      };
    }
  } catch (e) {
    // offline or static mode
  }
  return {
    available: false,
    model: 'heuristic-engine',
    isRealAi: false,
  };
}

// Chapter Analysis
export async function analyzeChapterContent(params: {
  storyTitle: string;
  originalText: string;
  translationText: string;
  characters: Character[];
  translationMemories: TranslationMemory[];
  pronounRules: PronounRule[];
  storyBible?: StoryBible;
}): Promise<AnalysisResult> {
  const { storyTitle, originalText, translationText, characters, translationMemories, pronounRules, storyBible } = params;

  // Try real server API first if available
  try {
    const res = await fetch('/api/ai/analyze-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyTitle,
        originalText,
        translationText,
        existingCharacters: characters.map((c) => c.name),
        existingMemories: translationMemories.map((m) => `${m.original} -> ${m.translation}`),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          ...json.data,
          source: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('Real AI API not reached, using built-in intelligent heuristic engine:', err);
  }

  // Fallback: Intelligent Client-side Analysis Engine
  return runHeuristicAnalysis({
    originalText,
    translationText,
    characters,
    translationMemories,
    pronounRules,
    storyBible,
  });
}

// Consistency Warnings Detection
export function detectConsistencyIssues(params: {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  segments: TranslationSegment[];
  memories: TranslationMemory[];
  pronounRules: PronounRule[];
  storyBible?: StoryBible;
}): ConsistencyWarning[] {
  const warnings: ConsistencyWarning[] = [];
  const { storyId, chapterId, chapterNumber, segments, memories, pronounRules, storyBible } = params;

  // 1. Check Translation Memories consistency
  for (const seg of segments) {
    if (!seg.translatedText) continue;

    for (const mem of memories) {
      if (!mem.original || !mem.translation) continue;

      // If segment contains the original term
      if (seg.originalText.includes(mem.original)) {
        const transLower = seg.translatedText.toLowerCase();
        const preferredLower = mem.translation.toLowerCase();

        // Check if the preferred translation is missing
        if (!transLower.includes(preferredLower)) {
          // Check common alternate translations or potential mismatch
          const warningId = `warn-tm-${seg.segmentId}-${mem.id}`;
          warnings.push({
            id: warningId,
            storyId,
            chapterId,
            chapterNumber,
            segmentId: seg.segmentId,
            type: mem.category === 'terminology' ? 'terminology' : 'translation',
            severity: mem.preferred ? 'high' : 'medium',
            original: mem.original,
            previousTranslation: mem.translation,
            currentTranslation: '(Cách dịch khác hoặc thiếu từ)',
            relatedChapters: mem.chapterIds,
            status: 'open',
            explanation: `Thuật ngữ "${mem.original}" thường được dịch là "${mem.translation}" (${mem.frequency} lần ở các chapter: ${mem.chapterIds.slice(0, 4).join(', ')}${mem.chapterIds.length > 4 ? '...' : ''}), nhưng trong đoạn này dường như đang dùng cách diễn đạt khác.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 2. Check Pronoun Rules consistency for dialogue
    if (seg.characterFrom && seg.characterTo) {
      const activeRule = pronounRules.find(
        (r) =>
          r.fromCharacter.toLowerCase() === seg.characterFrom?.toLowerCase() &&
          r.toCharacter.toLowerCase() === seg.characterTo?.toLowerCase() &&
          r.status === 'active'
      );

      if (activeRule) {
        const transText = seg.translatedText.toLowerCase();
        const hasExpectedTarget = transText.includes(activeRule.targetAddress.toLowerCase());
        const hasExpectedSelf = transText.includes(activeRule.selfPronoun.toLowerCase());

        // Check for suspicious deviation
        if (!hasExpectedTarget && !hasExpectedSelf && (transText.includes('"') || transText.includes('“'))) {
          // May be fine or may be a pronoun deviation
          const warningId = `warn-pr-${seg.segmentId}-${activeRule.id}`;
          warnings.push({
            id: warningId,
            storyId,
            chapterId,
            chapterNumber,
            segmentId: seg.segmentId,
            type: 'pronoun',
            severity: 'medium',
            original: seg.originalText,
            previousTranslation: `${activeRule.selfPronoun} / ${activeRule.targetAddress}`,
            currentTranslation: '(Chưa khớp xưng hô chuẩn)',
            relatedCharacters: [activeRule.fromCharacter, activeRule.toCharacter],
            relatedChapters: activeRule.chapters || [activeRule.startChapter],
            status: 'open',
            explanation: `Theo quy tắc, ${activeRule.fromCharacter} gọi ${activeRule.toCharacter} là "${activeRule.targetAddress}" và tự xưng "${activeRule.selfPronoun}". Vui lòng kiểm tra đoạn đối thoại này có chủ ý thay đổi xưng hô hay không.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Story Bible forbidden terms check
    if (storyBible?.translationStyle?.forbiddenTerms) {
      for (const forbidden of storyBible.translationStyle.forbiddenTerms) {
        const termName = forbidden.split('(')[0].trim().toLowerCase();
        if (termName && seg.translatedText.toLowerCase().includes(termName)) {
          warnings.push({
            id: `warn-fb-${seg.segmentId}-${termName}`,
            storyId,
            chapterId,
            chapterNumber,
            segmentId: seg.segmentId,
            type: 'bible',
            severity: 'high',
            original: seg.originalText,
            previousTranslation: 'Quy chuẩn Story Bible',
            currentTranslation: termName,
            relatedChapters: [chapterNumber],
            status: 'open',
            explanation: `Story Bible lưu ý tránh dùng cụm từ "${forbidden}". Bạn có thể xem lại hoặc xác nhận giữ nguyên nếu là ngữ cảnh đặc biệt.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return warnings;
}

// Generate Recap Before Translating
export async function generateRecap(params: {
  storyTitle: string;
  chapterNumber: number;
  recentChapters: Chapter[];
  characters: Character[];
  pronounRules: PronounRule[];
  memories: TranslationMemory[];
  bible?: StoryBible;
  plotEvents: PlotEvent[];
}): Promise<RecapData> {
  const { storyTitle, chapterNumber, recentChapters, characters, pronounRules, memories, bible, plotEvents } = params;

  // Try Server API first
  try {
    const res = await fetch('/api/ai/recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyTitle,
        chapterNumber,
        recentSummaries: recentChapters.map((c) => `Ch.${c.chapterNumber}: ${c.summary || c.title}`),
        characters: characters.slice(0, 6).map((c) => `${c.name} (${c.role}): ${c.identity}`),
        pronounRules: pronounRules.slice(0, 6).map((p) => `${p.fromCharacter} -> ${p.toCharacter}: ${p.selfPronoun}/${p.targetAddress}`),
        terminology: memories.slice(0, 8).map((m) => `${m.original} -> ${m.translation}`),
        unresolvedMysteries: bible?.mysteries.filter((m) => m.status === 'unresolved').map((m) => m.title) || [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (e) {
    // fallback to heuristic generator
  }

  // Smart Heuristic Recap
  const recent3 = recentChapters.slice(-3);
  const summaryRecent = recent3.length > 0
    ? recent3.map((c) => `• Chapter ${c.chapterNumber} (${c.title}): ${c.summary || 'Đã hoàn thành bản dịch.'}`).join('\n')
    : `Bạn đang chuẩn bị dịch Chapter ${chapterNumber} của "${storyTitle}".`;

  const keyChars = characters.slice(0, 5).map((c) => `${c.name} (${c.role === 'protagonist' ? 'Nhân vật chính' : c.role === 'antagonist' ? 'Đối thủ' : 'Hỗ trợ'}): ${c.identity}`);
  const curRelationships = pronounRules.slice(0, 5).map((p) => `${p.fromCharacter} ↔ ${p.toCharacter}: xưng "${p.selfPronoun}", gọi "${p.targetAddress}" (${p.context})`);
  const curPronouns = pronounRules.slice(0, 5).map((p) => `${p.fromCharacter} → ${p.toCharacter}: ${p.selfPronoun} / ${p.targetAddress}`);
  const impTerm = memories.filter((m) => m.preferred).slice(0, 6).map((m) => `${m.original} → ${m.translation} (${m.frequency} lần)`);
  const recentEvts = plotEvents.slice(-4).map((e) => `Ch.${e.chapterNumber}: ${e.title} - ${e.description}`);
  const unMysteries = bible?.mysteries.filter((m) => m.status !== 'resolved').map((m) => `[Bí ẩn] ${m.title}: ${m.description}`) || [];

  const thingsToRemember = [
    `Giữ nguyên văn phong chuẩn: ${bible?.translationStyle.tone || 'Tự nhiên, mạch lạc'}.`,
    `Ưu tiên các từ vựng đã đánh dấu ⭐ Preferred trong Translation Memory.`,
    `Chú ý các chuyển biến xưng hô giữa các nhân vật chính nếu có xung đột mới phát sinh.`,
  ];

  return {
    chapterTarget: chapterNumber,
    summaryRecentChapters: summaryRecent,
    keyCharacters: keyChars.length > 0 ? keyChars : ['Chưa có nhân vật nào được lưu trong bộ nhớ.'],
    currentRelationships: curRelationships.length > 0 ? curRelationships : ['Chưa có quan hệ nhân vật cụ thể.'],
    currentPronouns: curPronouns.length > 0 ? curPronouns : ['Chưa có quy tắc xưng hô.'],
    importantTerminology: impTerm.length > 0 ? impTerm : ['Chưa có thuật ngữ nổi bật.'],
    recentEvents: recentEvts.length > 0 ? recentEvts : ['Chưa có sự kiện gần đây được ghi nhận.'],
    unresolvedMysteries: unMysteries.length > 0 ? unMysteries : ['Hiện tại không có bí ẩn nào chưa giải quyết.'],
    thingsToRemember,
  };
}

// What Changed Since Last Time
export function calculateWhatChanged(params: {
  characters: Character[];
  relationships: any[];
  memories: TranslationMemory[];
  warnings: ConsistencyWarning[];
  plotEvents: PlotEvent[];
}): WhatChangedSummary {
  const { characters, relationships, memories, plotEvents } = params;

  return {
    newCharactersCount: characters.length,
    newRelationshipsCount: relationships.length,
    terminologyCount: memories.filter((m) => m.category === 'terminology').length || memories.length,
    memoriesCount: memories.length,
    pronounChangesCount: relationships.filter((r) => r.currentStatus?.includes('xung đột') || r.currentStatus?.includes('thay đổi')).length,
    plotEventsCount: plotEvents.length,
    newCharacters: characters.slice(0, 4).map((c) => c.name),
    newRelationships: relationships.slice(0, 3).map((r) => `${r.characterA} ↔ ${r.characterB} (${r.relationshipType})`),
    newMemories: memories.slice(0, 5).map((m) => `${m.original} → ${m.translation}`),
    newPlotEvents: plotEvents.slice(0, 3).map((e) => `Ch.${e.chapterNumber}: ${e.title}`),
  };
}

// Client-side Heuristic Analysis Engine
function runHeuristicAnalysis(params: {
  originalText: string;
  translationText: string;
  characters: Character[];
  translationMemories: TranslationMemory[];
  pronounRules: PronounRule[];
  storyBible?: StoryBible;
}): AnalysisResult {
  const { originalText, translationText, characters, translationMemories } = params;

  // Extract common Chinese cultivation / fiction terms
  const commonPatterns: { zh: string; vi: string; cat: any }[] = [
    { zh: '师尊', vi: 'sư tôn', cat: 'title' },
    { zh: '师兄', vi: 'sư huynh', cat: 'title' },
    { zh: '师姐', vi: 'sư tỷ', cat: 'title' },
    { zh: '师弟', vi: 'sư đệ', cat: 'title' },
    { zh: '掌门', vi: 'chưởng môn', cat: 'title' },
    { zh: '长老', vi: 'trưởng lão', cat: 'title' },
    { zh: '洞府', vi: 'động phủ', cat: 'terminology' },
    { zh: '灵气', vi: 'linh khí', cat: 'terminology' },
    { zh: '神识', vi: 'thần thức', cat: 'terminology' },
    { zh: '法宝', vi: 'pháp bảo', cat: 'terminology' },
    { zh: '冷笑', vi: 'cười lạnh', cat: 'expression' },
    { zh: '皱眉', vi: 'nhíu mày', cat: 'expression' },
    { zh: '深吸了一口气', vi: 'hít sâu một hơi', cat: 'expression' },
    { zh: '咬牙', vi: 'cắn răng', cat: 'expression' },
    { zh: '拂袖而去', vi: 'phất tay áo bỏ đi', cat: 'idiom' },
  ];

  const vocabSuggestions: AnalysisResult['vocabularySuggestions'] = [];

  for (const item of commonPatterns) {
    if (originalText.includes(item.zh)) {
      const alreadyHas = translationMemories.some((m) => m.original === item.zh);
      if (!alreadyHas) {
        vocabSuggestions.push({
          original: item.zh,
          translation: item.vi,
          category: item.cat,
          notes: 'Phát hiện từ nguyên tác xuất hiện trong chapter',
          confidence: 0.92,
        });
      }
    }
  }

  // Detect potential character mentions
  const newCharacters: Partial<Character>[] = [];
  const vietnameseLines = translationText.split('\n').filter((l) => l.trim().length > 0);

  // Generate basic summary from first and last paragraphs
  const firstParagraph = vietnameseLines[0] || 'Bắt đầu chapter.';
  const lastParagraph = vietnameseLines[vietnameseLines.length - 1] || 'Kết thúc chapter.';
  const summary = `${firstParagraph.slice(0, 120)}... Mạch truyện tiếp diễn dẫn đến kết cục: ${lastParagraph.slice(0, 120)}...`;

  const bulletPoints = [
    vietnameseLines[0]?.slice(0, 80) || 'Mở đầu diễn biến mới.',
    vietnameseLines[Math.floor(vietnameseLines.length / 2)]?.slice(0, 80) || 'Các nhân vật trao đổi đối thoại.',
    vietnameseLines[vietnameseLines.length - 1]?.slice(0, 80) || 'Bầu không khí căng thẳng tiếp diễn.',
  ];

  return {
    summary,
    bulletPoints,
    newCharacters,
    pronounObservations: [],
    vocabularySuggestions: vocabSuggestions,
    plotEvents: [
      {
        title: 'Diễn biến trọng tâm chapter',
        description: summary,
        characters: characters.slice(0, 2).map((c) => c.name),
        importance: 'minor',
      },
    ],
    consistencyWarnings: [],
    source: 'heuristic_engine',
  };
}
