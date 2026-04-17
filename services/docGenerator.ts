import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import ExcelJS from 'exceljs';
import saveAs from 'file-saver';
import type { DocFont, DocumentSection } from '../types';

const DEFAULT_FONT: DocFont = 'Microsoft YaHei';
const FONT_SIZE_BODY = 24;
const FONT_SIZE_TABLE = 21;

const createRunsWithBreaks = (text: string, options: { bold?: boolean; size?: number; font?: string } = {}) => {
  const fontFamily = options.font || DEFAULT_FONT;
  const parts = text.split(/(?:<br\s*\/?>|\\n|\n)/gi);
  const runs: TextRun[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      runs.push(new TextRun({ break: 1 }));
    }

    const subParts = part.split(/(\*\*.*?\*\*)/g);
    subParts.forEach((subPart) => {
      if (!subPart) return;

      let isBold = options.bold;
      let content = subPart;
      if (subPart.startsWith('**') && subPart.endsWith('**') && subPart.length >= 4) {
        isBold = true;
        content = subPart.slice(2, -2);
      }

      runs.push(
        new TextRun({
          text: content,
          font: fontFamily,
          size: options.size || FONT_SIZE_BODY,
          bold: isBold,
          color: '000000',
        }),
      );
    });
  });

  return runs;
};

const extractTitle = (markdown: string): string => {
  const headingMatch = markdown.match(/^#{1,3}\s+(.+)$/m);
  if (headingMatch) {
    const cleaned = headingMatch[1].replace(/[\\/:*?"<>|]/g, '').trim();
    if (cleaned) return cleaned.slice(0, 80);
  }

  const firstLine = markdown.split('\n').find((line) => line.trim());
  if (firstLine) {
    const cleaned = firstLine.replace(/[\\/:*?"<>|#]/g, '').trim();
    if (cleaned) return cleaned.slice(0, 80);
  }
  return 'document';
};

const parseMarkdown = (markdown: string): DocumentSection[] => {
  const lines = markdown.split('\n');
  const sections: DocumentSection[] = [];
  let currentTable: string[][] = [];
  let inTable = false;

  const flushTable = () => {
    if (!currentTable.length) return;
    sections.push({ type: 'table', content: [...currentTable] });
    currentTable = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('|')) {
      inTable = true;
      const rowParts = line.split('|');
      if (rowParts[0]?.trim() === '') rowParts.shift();
      if (rowParts[rowParts.length - 1]?.trim() === '') rowParts.pop();
      const row = rowParts.map((cell) => cell.trim());

      if (!row.every((cell) => /^[-:\s]+$/.test(cell))) {
        currentTable.push(row);
      }
      continue;
    }

    if (inTable) {
      inTable = false;
      flushTable();
    }

    if (!line) continue;

    if (line.startsWith('#')) {
      const level = Math.min(line.match(/^#+/)?.[0].length || 1, 3);
      sections.push({ type: 'header', level, content: line.replace(/^#+\s*/, '') });
      continue;
    }

    if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
      sections.push({ type: 'list', content: [line.replace(/^(?:[-*]|\d+\.)\s+/, '')] });
      continue;
    }

    sections.push({ type: 'paragraph', content: line });
  }

  flushTable();
  return sections;
};

const cleanCellText = (text: string): string =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?:<br\s*\/?>|\\n)/gi, '\n')
    .trim();

export const exportDocx = async (markdown: string, font?: DocFont) => {
  const sections = parseMarkdown(markdown);
  const fontFamily = font || DEFAULT_FONT;
  const children: Array<Paragraph | Table> = [];

  sections.forEach((section) => {
    if (section.type === 'header') {
      let headingLevel = HeadingLevel.HEADING_1;
      let fontSize = 32;

      if (section.level === 2) {
        headingLevel = HeadingLevel.HEADING_2;
        fontSize = 28;
      }
      if (section.level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        fontSize = 26;
      }

      children.push(
        new Paragraph({
          heading: headingLevel,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: section.content as string,
              font: fontFamily,
              size: fontSize,
              bold: true,
              color: '000000',
            }),
          ],
        }),
      );
      return;
    }

    if (section.type === 'paragraph') {
      children.push(
        new Paragraph({
          children: createRunsWithBreaks(section.content as string, { font: fontFamily, size: FONT_SIZE_BODY }),
          spacing: { after: 120 },
        }),
      );
      return;
    }

    if (section.type === 'list') {
      (section.content as string[]).forEach((item) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: createRunsWithBreaks(item, { font: fontFamily, size: FONT_SIZE_BODY }),
          }),
        );
      });
      return;
    }

    if (section.type === 'table') {
      const tableData = section.content as string[][];
      const rows = tableData.map((rowContent, rowIndex) => {
        const isHeader = rowIndex === 0;
        const columnCount = Math.max(rowContent.length, 1);
        return new TableRow({
          tableHeader: isHeader,
          children: rowContent.map((cellContent) => (
            new TableCell({
              width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              shading: isHeader ? { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' } : undefined,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: createRunsWithBreaks(cellContent, {
                    font: fontFamily,
                    size: FONT_SIZE_TABLE,
                    bold: isHeader,
                  }),
                }),
              ],
            })
          )),
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        }),
      );
      children.push(new Paragraph({ text: '' }));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '第 ', font: fontFamily, size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: fontFamily, size: 18 }),
                  new TextRun({ text: ' / 共 ', font: fontFamily, size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: fontFamily, size: 18 }),
                  new TextRun({ text: ' 页', font: fontFamily, size: 18 }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${extractTitle(markdown)}.docx`);
};

export const exportXlsx = async (markdown: string) => {
  const sections = parseMarkdown(markdown);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DocuGen Open';

  const tableEntries: { title: string; data: string[][] }[] = [];
  let lastHeading = '';

  sections.forEach((section) => {
    if (section.type === 'header') {
      lastHeading = section.content as string;
      return;
    }

    if (section.type === 'table') {
      tableEntries.push({
        title: lastHeading || `表格 ${tableEntries.length + 1}`,
        data: (section.content as string[][]).map((row) => row.map(cleanCellText)),
      });
    }
  });

  if (tableEntries.length === 0) {
    const sheet = workbook.addWorksheet('内容');
    sections.forEach((section) => {
      if (section.type === 'header') {
        const row = sheet.addRow([cleanCellText(section.content as string)]);
        row.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF333333' } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        return;
      }

      if (section.type === 'list') {
        (section.content as string[]).forEach((item) => {
          sheet.addRow([`- ${cleanCellText(item)}`]);
        });
        return;
      }

      if (section.type === 'paragraph') {
        sheet.addRow([cleanCellText(section.content as string)]);
      }
    });
    sheet.getColumn(1).width = 80;
  } else {
    tableEntries.forEach((entry, index) => {
      let sheetName = entry.title.replace(/[\\/:*?\[\]]/g, '').slice(0, 28);
      if (!sheetName) sheetName = `表格 ${index + 1}`;

      let finalName = sheetName;
      let counter = 2;
      while (workbook.getWorksheet(finalName)) {
        finalName = `${sheetName.slice(0, 25)}_${counter++}`;
      }

      const sheet = workbook.addWorksheet(finalName);
      entry.data.forEach((rowData, rowIndex) => {
        const row = sheet.addRow(rowData);

        if (rowIndex === 0) {
          row.eachCell((cell) => {
            cell.font = { bold: true, size: 11, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });
          return;
        }

        row.eachCell((cell) => {
          cell.font = { size: 11 };
          cell.alignment = { vertical: 'top', wrapText: true };
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E5E5' } } };
        });
      });

      if (entry.data.length > 0) {
        entry.data[0].forEach((_, colIndex) => {
          let maxLen = 8;
          entry.data.forEach((row) => {
            const cell = row[colIndex] || '';
            const longestLine = Math.max(...cell.split('\n').map((line) => line.length), 0);
            if (longestLine > maxLen) maxLen = longestLine;
          });
          sheet.getColumn(colIndex + 1).width = Math.min(maxLen + 4, 60);
        });
      }

      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${extractTitle(markdown)}.xlsx`);
};
