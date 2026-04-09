import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, Footer, PageNumber, ShadingType } from "docx";
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import { DocumentSection, DocFont } from "../types";

// 默认字体
const DEFAULT_FONT: DocFont = "微软雅黑";
// docx 用半磅: 24 = 12pt (小四), 21 = 10.5pt (五号)
const FONT_SIZE_BODY = 24;
const FONT_SIZE_TABLE = 21;

// 处理 <br> 标签和加粗的文本生成
const createRunsWithBreaks = (text: string, options: { bold?: boolean; size?: number; font?: string } = {}) => {
  const fontFamily = options.font || DEFAULT_FONT;
  const parts = text.split(/(?:<br\s*\/?>|\\n|\n)/gi);
  const runs: TextRun[] = [];

  parts.forEach((part, index) => {
    if (index > 0) {
      runs.push(new TextRun({ break: 1 }));
    }

    const subParts = part.split(/(\*\*.*?\*\*)/g);

    subParts.forEach(subPart => {
        if (!subPart) return;

        let isBold = options.bold;
        let content = subPart;

        if (subPart.startsWith('**') && subPart.endsWith('**') && subPart.length >= 4) {
            isBold = true;
            content = subPart.substring(2, subPart.length - 2);
        }

        runs.push(
          new TextRun({
            text: content,
            font: fontFamily,
            size: options.size || FONT_SIZE_BODY,
            bold: isBold,
            color: "000000",
          })
        );
    });
  });

  return runs;
};

/** 从 markdown 提取第一个标题作为文件名 */
const extractTitle = (md: string): string => {
  const match = md.match(/^#{1,3}\s+(.+)$/m);
  if (match) return match[1].replace(/[\\/:*?"<>|]/g, '').trim();
  const firstLine = md.split('\n').find(l => l.trim().length > 0);
  if (firstLine) return firstLine.replace(/[\\/:*?"<>|#]/g, '').trim().slice(0, 50);
  return '文档';
};

// 解析 Markdown 为文档段落
const parseMarkdown = (md: string): DocumentSection[] => {
  const lines = md.split('\n');
  const sections: DocumentSection[] = [];
  let currentTable: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      inTable = true;
      const rowParts = line.split('|');
      if (rowParts.length > 0 && rowParts[0].trim() === '') rowParts.shift();
      if (rowParts.length > 0 && rowParts[rowParts.length - 1].trim() === '') rowParts.pop();

      const row = rowParts.map(c => c.trim());

      if (!row.every(c => c.match(/^[-:\s]+$/))) {
        currentTable.push(row);
      }
      continue;
    } else if (inTable) {
      inTable = false;
      if (currentTable.length > 0) {
        sections.push({ type: 'table', content: [...currentTable] });
        currentTable = [];
      }
    }

    if (!line) continue;

    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      sections.push({ type: 'header', level, content: line.replace(/^#+\s*/, '') });
    }
    else if (line.match(/^[-*]\s/)) {
        sections.push({ type: 'list', content: [line.replace(/^[-*]\s*/, '')] });
    }
    else {
        sections.push({ type: 'paragraph', content: line });
    }
  }

  if (inTable && currentTable.length > 0) {
      sections.push({ type: 'table', content: [...currentTable] });
  }

  return sections;
};

export const exportDocx = async (markdown: string, font?: DocFont) => {
  const sections = parseMarkdown(markdown);
  const fontFamily = font || DEFAULT_FONT;

  const docChildren: any[] = [];

  // 不再添加 "INTERNAL DOCUMENT" 标题
  // 不再添加页眉日期

  sections.forEach(section => {
    if (section.type === 'header') {
      let hLevel: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;
      let fontSize = 32;
      if (section.level === 2) { hLevel = HeadingLevel.HEADING_2; fontSize = 28; }
      if (section.level === 3) { hLevel = HeadingLevel.HEADING_3; fontSize = 26; }

      docChildren.push(new Paragraph({
        heading: hLevel,
        spacing: { before: 240, after: 120 },
        children: [
            new TextRun({
                text: section.content as string,
                font: fontFamily,
                bold: true,
                size: fontSize,
                color: "000000",
            })
        ]
      }));
    } else if (section.type === 'paragraph') {
      docChildren.push(new Paragraph({
        children: createRunsWithBreaks(section.content as string, { size: FONT_SIZE_BODY, font: fontFamily }),
        spacing: { after: 120 }
      }));
    } else if (section.type === 'list') {
        (section.content as string[]).forEach(item => {
            docChildren.push(new Paragraph({
                children: createRunsWithBreaks(item, { size: FONT_SIZE_BODY, font: fontFamily }),
                bullet: { level: 0 }
            }));
        });
    } else if (section.type === 'table') {
        const tableData = section.content as string[][];
        const rows = tableData.map((rowContent, rowIndex) => {
            const isHeader = rowIndex === 0;
            return new TableRow({
                tableHeader: isHeader,
                children: rowContent.map(cellContent =>
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: createRunsWithBreaks(cellContent, {
                                    size: FONT_SIZE_TABLE,
                                    bold: isHeader,
                                    font: fontFamily
                                }),
                                alignment: AlignmentType.LEFT
                            })
                        ],
                        width: { size: 100 / rowContent.length, type: WidthType.PERCENTAGE },
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        shading: isHeader ? { fill: "F2F2F2", type: ShadingType.CLEAR, color: "auto" } : undefined,
                    })
                )
            });
        });

        docChildren.push(new Table({
            rows: rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200 }
        }));
        docChildren.push(new Paragraph({ text: "" }));
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      // 不再设置页眉
      footers: {
          default: new Footer({
              children: [
                  new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                          new TextRun({ text: "第 ", font: fontFamily, size: 18, color: "000000" }),
                          new TextRun({ children: [PageNumber.CURRENT], font: fontFamily, size: 18, color: "000000" }),
                          new TextRun({ text: " 页 / 共 ", font: fontFamily, size: 18, color: "000000" }),
                          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: fontFamily, size: 18, color: "000000" }),
                          new TextRun({ text: " 页", font: fontFamily, size: 18, color: "000000" }),
                      ],
                  }),
              ],
          }),
      },
      children: docChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${extractTitle(markdown)}.docx`);
};

/** 清理 markdown 标记，返回纯文本 */
const cleanCellText = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold** → bold
    .replace(/(?:<br\s*\/?>|\\n)/gi, '\n')  // <br> → newline
    .trim();
};

export const exportXlsx = async (markdown: string) => {
  const sections = parseMarkdown(markdown);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'DocuGen AI';

  // 策略：把表格和上下文放到各自的 sheet
  // 收集表格及其前面最近的标题
  const tableEntries: { title: string; data: string[][] }[] = [];
  let lastHeading = '';

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.type === 'header') {
      lastHeading = s.content as string;
    } else if (s.type === 'table') {
      const data = (s.content as string[][]).map(row => row.map(cleanCellText));
      tableEntries.push({ title: lastHeading || `表格 ${tableEntries.length + 1}`, data });
    }
  }

  if (tableEntries.length === 0) {
    // 没有任何表格 — 把全部文本内容放到一个 sheet 中
    const ws = wb.addWorksheet('内容');
    sections.forEach(section => {
      if (section.type === 'header') {
        const row = ws.addRow([cleanCellText(section.content as string)]);
        row.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF333333' } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      } else if (section.type === 'list') {
        const items = section.content as string[];
        items.forEach(item => {
          ws.addRow(['  - ' + cleanCellText(item)]);
        });
      } else if (section.type === 'paragraph') {
        ws.addRow([cleanCellText(section.content as string)]);
      }
    });
    ws.getColumn(1).width = 80;
  } else {
    // 每个表格一个 sheet，sheet 名取标题
    tableEntries.forEach((entry, index) => {
      // sheet 名最长 31 字符且不能含特殊字符
      let sheetName = entry.title.replace(/[\\/:*?\[\]]/g, '').slice(0, 28);
      if (!sheetName) sheetName = `表格 ${index + 1}`;
      // 避免重名
      let finalName = sheetName;
      let counter = 2;
      while (wb.getWorksheet(finalName)) {
        finalName = `${sheetName.slice(0, 25)}_${counter++}`;
      }

      const ws = wb.addWorksheet(finalName);
      const tableData = entry.data;

      tableData.forEach((rowData, rowIdx) => {
        const row = ws.addRow(rowData);

        if (rowIdx === 0) {
          row.eachCell((cell) => {
            cell.font = { bold: true, size: 11, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            cell.border = {
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });
        } else {
          row.eachCell((cell) => {
            cell.font = { size: 11 };
            cell.alignment = { vertical: 'top', wrapText: true };
            cell.border = {
              bottom: { style: 'hair', color: { argb: 'FFE5E5E5' } },
            };
          });
        }
      });

      // 自动列宽
      if (tableData.length > 0) {
        tableData[0].forEach((_, colIdx) => {
          let maxLen = 8;
          tableData.forEach(row => {
            const cell = row[colIdx] || '';
            const lines = cell.split('\n');
            const longest = Math.max(...lines.map(l => l.length));
            if (longest > maxLen) maxLen = longest;
          });
          ws.getColumn(colIdx + 1).width = Math.min(maxLen + 4, 60);
        });
      }

      // 冻结表头行
      ws.views = [{ state: 'frozen', ySplit: 1 }];
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${extractTitle(markdown)}.xlsx`);
};
