import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { Story, Chapter, Character, PronounRule, TranslationMemory, StoryBible } from '../types';

export async function generateStoryDocx(
  story: Story,
  chapters: Chapter[],
  characters: Character[] = [],
  pronounRules: PronounRule[] = [],
  memories: TranslationMemory[] = [],
  storyBible?: StoryBible | null
): Promise<Blob> {
  const sections: any[] = [];

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: story.title,
          bold: true,
          size: 44, // 22pt
          color: '2E6C7B',
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // Subtitle / Author
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Tác giả: ${story.author} | Người dịch: ${story.ownerName || 'Translator'}`,
          italics: true,
          size: 24,
          color: '647780',
          font: 'Times New Roman',
        }),
      ],
    })
  );

  // Story Description / Metadata
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Ngôn ngữ: ${story.sourceLanguage.toUpperCase()} → VIETNAMESE | Tổng số chương: ${chapters.length}`,
          bold: true,
          size: 20,
          color: '2E6C7B',
        }),
      ],
    })
  );

  if (story.description) {
    children.push(
      new Paragraph({
        spacing: { after: 500 },
        children: [
          new TextRun({
            text: `Giới thiệu tóm tắt: ${story.description}`,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // Chapters
  for (const ch of chapters) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: `Chương ${ch.chapterNumber}: ${ch.title}`,
            bold: true,
            size: 32,
            color: '2E6C7B',
            font: 'Times New Roman',
          }),
        ],
      })
    );

    // Translation block
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: '【 BẢN DỊCH TIẾNG VIỆT 】',
            bold: true,
            size: 20,
            color: '77CBDA',
          }),
        ],
      })
    );

    const transParas = (ch.translationText || '(Chưa có bản dịch)').split('\n');
    for (const p of transParas) {
      if (p.trim()) {
        children.push(
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: p.trim(),
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      }
    }

    // Original text block
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: '【 NGUYÊN TÁC ĐỐI CHIẾU 】',
            bold: true,
            size: 20,
            color: '647780',
          }),
        ],
      })
    );

    const origParas = (ch.originalText || '').split('\n');
    for (const p of origParas) {
      if (p.trim()) {
        children.push(
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: p.trim(),
                size: 22,
                color: '445566',
                font: 'SimSun',
              }),
            ],
          })
        );
      }
    }
  }

  // Character Appendix
  if (characters.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 800, after: 300 },
        children: [
          new TextRun({
            text: 'PHỤ LỤC: DANH SÁCH NHÂN VẬT & THÂN PHẬN',
            bold: true,
            size: 28,
            color: '2E6C7B',
          }),
        ],
      })
    );

    for (const char of characters) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `• ${char.name} `, bold: true, size: 22 }),
            new TextRun({ text: `(${char.role} - ${char.status}): `, size: 20, color: '647780' }),
            new TextRun({ text: char.identity || char.notes || '', size: 22 }),
          ],
        })
      );
    }
  }

  // Pronoun Rules Appendix
  if (pronounRules.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: 'PHỤ LỤC: QUY TẮC XƯNG HÔ ĐỐI ỨNG',
            bold: true,
            size: 28,
            color: '2E6C7B',
          }),
        ],
      })
    );

    for (const rule of pronounRules) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `• ${rule.fromCharacter} → ${rule.toCharacter}: `, bold: true, size: 22 }),
            new TextRun({ text: `xưng "${rule.selfPronoun}", gọi "${rule.targetAddress}" `, color: '2E6C7B', size: 22 }),
            new TextRun({ text: rule.context ? `(${rule.context})` : '', size: 20, italics: true }),
          ],
        })
      );
    }
  }

  // Translation Memory & Terminology Appendix
  if (memories.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 300 },
        children: [
          new TextRun({
            text: 'PHỤ LỤC: BỘ NHỚ DỊCH THUẬT & THUẬT NGỮ CHUẨN',
            bold: true,
            size: 28,
            color: '2E6C7B',
          }),
        ],
      })
    );

    for (const mem of memories.slice(0, 50)) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${mem.original} `, bold: true, size: 22, color: '2E6C7B' }),
            new TextRun({ text: `→ ${mem.translation} `, bold: true, size: 22 }),
            new TextRun({ text: mem.context ? `[${mem.context}]` : '', size: 20, color: '647780' }),
          ],
        })
      );
    }
  }

  // Footer metadata
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 200 },
      children: [
        new TextRun({
          text: `✦ LanAnhArtistry Translation Studio — Bản sao lưu DOCX tạo ngày ${new Date().toLocaleDateString('vi-VN')}`,
          size: 18,
          italics: true,
          color: '77CBDA',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
