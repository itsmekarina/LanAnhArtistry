import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client if API key is set
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health & Status
app.get('/api/ai/status', (req, res) => {
  res.json({
    available: !!aiClient,
    model: 'gemini-3.8-flash',
  });
});

// AI Chapter Analysis (Extraction & Suggestions)
// IMPORTANT: AI never modifies translation, only extracts & suggests!
app.post('/api/ai/analyze-chapter', async (req, res) => {
  try {
    const { originalText, translationText, storyTitle, existingCharacters, existingMemories } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini API is not configured on server.' });
    }

    const prompt = `
Bạn là AI Trợ lý Dịch thuật và Quản lý Tri thức truyện cho ứng dụng "LanAnhArtistry".
Nhiệm vụ: Phân tích một chapter truyện (nguyên tác & bản dịch tiếng Việt) để hỗ trợ người dịch lưu trữ tri thức.
QUY TẮC BẮT BUỘC: KHÔNG ĐƯỢC TỰ ĐỘNG THAY ĐỔI BẢN DỊCH CỦA NGƯỜI DÙNG. Chỉ phân tích, trích xuất và đề xuất.

Truyện: "${storyTitle || 'Chưa đặt tên'}"
Nhân vật đã biết: ${JSON.stringify(existingCharacters || [])}
Thuật ngữ đã biết: ${JSON.stringify(existingMemories || [])}

NGUYÊN TÁC:
"""
${(originalText || '').slice(0, 8000)}
"""

BẢN DỊCH TIẾNG VIỆT:
"""
${(translationText || '').slice(0, 8000)}
"""

Hãy trả về DUY NHẤT một chuỗi JSON chuẩn (không bọc trong markdown tick nếu có thể, hoặc bọc trong \`\`\`json) với cấu trúc sau:
{
  "summary": "Tóm tắt ngắn gọn 3-4 câu về diễn biến chính của chapter này",
  "bulletPoints": ["Diễn biến 1", "Diễn biến 2", "Diễn biến 3"],
  "newCharacters": [
    {
      "name": "Tên tiếng Việt",
      "aliases": ["biệt danh", "tên gọi khác"],
      "gender": "male|female|other|unknown",
      "role": "supporting|protagonist|antagonist|minor",
      "identity": "Thân phận/vị trí",
      "confidence": 0.9
    }
  ],
  "pronounObservations": [
    {
      "fromCharacter": "Người nói",
      "toCharacter": "Người nghe",
      "selfPronoun": "xưng hô bản thân",
      "targetAddress": "cách gọi đối phương",
      "context": "hoàn cảnh đoạn hội thoại"
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "từ/cụm từ gốc",
      "translation": "bản dịch tiếng Việt",
      "category": "title|expression|terminology|idiom|general",
      "notes": "ngữ cảnh hoặc lý do lưu",
      "confidence": 0.95
    }
  ],
  "plotEvents": [
    {
      "title": "Tên sự kiện quan trọng",
      "description": "Chi tiết sự kiện",
      "characters": ["Tên nhân vật tham gia"],
      "importance": "major|minor|turning_point|climax"
    }
  ],
  "consistencyWarnings": [
    {
      "type": "translation|pronoun|character|terminology",
      "severity": "low|medium|high",
      "original": "từ hoặc câu gốc",
      "previousTranslation": "cách dùng thường thấy",
      "currentTranslation": "cách dịch trong chapter này",
      "explanation": "Lý do phát hiện nghi vấn không nhất quán"
    }
  ]
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Clean code block fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ error: err.message || 'Lỗi phân tích AI' });
  }
});

// AI Generate Recap Before Translating
app.post('/api/ai/recap', async (req, res) => {
  try {
    const { storyTitle, chapterNumber, recentSummaries, characters, pronounRules, terminology, unresolvedMysteries } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini API is not configured on server.' });
    }

    const prompt = `
Bạn là AI Story Memory của "LanAnhArtistry". Người dịch chuẩn bị dịch Chapter ${chapterNumber} của bộ truyện "${storyTitle}".
Họ có thể đã nghỉ dịch nhiều tuần/tháng và cần một "Recap Before You Continue" súc tích, chính xác để nhớ lại mọi bối cảnh cốt truyện, nhân vật, xưng hô và các bí mật chưa giải quyết.

Thông tin cốt truyện gần đây:
${JSON.stringify(recentSummaries || [])}

Nhân vật quan trọng:
${JSON.stringify(characters || [])}

Quy tắc xưng hô hiện tại:
${JSON.stringify(pronounRules || [])}

Thuật ngữ / Translation Memory quan trọng:
${JSON.stringify(terminology || [])}

Bí mật chưa giải quyết:
${JSON.stringify(unresolvedMysteries || [])}

Hãy xuất ra định dạng JSON:
{
  "chapterTarget": ${chapterNumber},
  "summaryRecentChapters": "Đoạn văn tóm tắt mạch truyện 3-5 chapter gần nhất",
  "keyCharacters": ["Nhân vật 1: vị thế, tâm lý hiện tại", "Nhân vật 2: ..."],
  "currentRelationships": ["Quan hệ giữa A và B hiện tại..."],
  "currentPronouns": ["A gọi B: ...", "B gọi A: ..."],
  "importantTerminology": ["Thuật ngữ 1: ..."],
  "recentEvents": ["Sự kiện 1", "Sự kiện 2"],
  "unresolvedMysteries": ["Bí ẩn 1", "Bí ẩn 2"],
  "thingsToRemember": ["Lưu ý quan trọng cho người dịch khi dịch chapter này (tone giọng, điểm mấu chốt...)"]
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('AI Recap Error:', err);
    res.status(500).json({ error: err.message || 'Lỗi tạo recap' });
  }
});

// AI Search Grounding with Google Search Data (gemini-3.5-flash)
app.post('/api/ai/search-grounding', async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!aiClient) {
      return res.status(503).json({ error: 'Gemini API is not configured on server.' });
    }

    const prompt = `Bạn là trợ lý tra cứu điển tích, thuật ngữ và thông tin bối cảnh văn học chuyên sâu của LanAnhArtistry.
Sử dụng dữ liệu tìm kiếm thời gian thực của Google Search để cung cấp thông tin chính xác, cập nhật nhất về:
Từ khóa/Nội dung: "${query}"
${context ? `Bối cảnh văn bản: "${context}"` : ''}

Hãy cung cấp:
1. Ý nghĩa chuẩn xác, nguồn gốc và xuất xứ.
2. Gợi ý bản dịch tiếng Việt mượt mà, phù hợp với giọng văn tiểu thuyết.
3. Các từ vựng/thành ngữ liên quan và lưu ý dịch thuật.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({
      success: true,
      text,
      groundingMetadata,
    });
  } catch (err: any) {
    console.error('AI Search Grounding Error:', err);
    res.status(500).json({ error: err.message || 'Lỗi tra cứu Google Search' });
  }
});

// ==========================================
// CLOUD DATABASE & DATA SYNC API ROUTES
// ==========================================
import { cloudStore } from './server/cloudStore.ts';

// Sync Pull: Retrieve user-accessible cloud state
app.get('/api/sync/pull', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'user-lananh-01';
    const isAdmin = req.query.isAdmin === 'true';
    const stories = cloudStore.getStoriesForUser(userId, isAdmin);
    const data = cloudStore.getData();

    res.json({
      success: true,
      lastUpdated: data.lastUpdated,
      stories,
      translationMemory: Object.values(data.translationMemory),
      vocabulary: Object.values(data.vocabulary),
      terminology: Object.values(data.terminology),
      contributions: Object.values(data.contributions),
      auditLogs: data.auditLogs.slice(0, 50),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sync Push: Push local changes (stories, chapters, TM, etc.) to cloud
app.post('/api/sync/push', (req, res) => {
  try {
    const { userId, userName, stories, chapters, translationMemory, vocabulary, terminology } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Thiếu userId' });
    }

    if (stories && Array.isArray(stories)) {
      cloudStore.saveStories(stories, userId, userName);
    }
    if (chapters && Array.isArray(chapters)) {
      cloudStore.saveChapters(chapters, userId);
    }
    if (translationMemory && Array.isArray(translationMemory)) {
      cloudStore.saveTranslationMemory(translationMemory, userId);
    }
    if (vocabulary && Array.isArray(vocabulary)) {
      cloudStore.saveVocabulary(vocabulary, userId);
    }
    if (terminology && Array.isArray(terminology)) {
      cloudStore.saveTerminology(terminology, userId);
    }

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      message: 'Đã đồng bộ thành công với máy chủ đám mây!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search Shared Knowledge Base
app.get('/api/knowledge/search', (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const category = req.query.category as string;
    const source = req.query.source as string;

    const results = cloudStore.searchKnowledge(query, category, source);
    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Community Contributions
app.get('/api/contributions', (req, res) => {
  try {
    const data = cloudStore.getData();
    res.json({ success: true, contributions: Object.values(data.contributions) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/contributions', (req, res) => {
  try {
    const { contribution, userId, userName } = req.body;
    if (!contribution || !userId) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin đóng góp' });
    }
    const created = cloudStore.addContribution(contribution, userId, userName || 'Translator');
    res.json({ success: true, contribution: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/contributions/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reviewerId, reviewerName, notes } = req.body;
    if (!decision || !['APPROVED', 'REJECTED', 'MERGE'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Quyết định không hợp lệ' });
    }
    const updated = cloudStore.reviewContribution(id, decision, reviewerId, reviewerName, notes);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đóng góp' });
    }
    res.json({ success: true, contribution: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Audit Logs
app.get('/api/audit', (req, res) => {
  try {
    const data = cloudStore.getData();
    res.json({ success: true, logs: data.auditLogs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/audit', (req, res) => {
  try {
    const { userId, userName, action, entityType, entityId, details } = req.body;
    const entry = cloudStore.logAudit(userId || 'system', userName || 'System', action, entityType, entityId, details);
    res.json({ success: true, entry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = cloudStore.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite middleware mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LanAnhArtistry server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
