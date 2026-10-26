const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract raw text from uploaded syllabus file
 * Supports PDF, DOCX, TXT
 */
const extractTextFromFile = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('Syllabus file does not exist on disk');
  }

  const fileStats = fs.statSync(filePath);
  if (fileStats.size === 0) {
    throw new Error('Uploaded syllabus file is empty (0 bytes).');
  }

  let extractedText = '';

  switch (fileType.toLowerCase()) {
    case 'pdf': {
      const dataBuffer = fs.readFileSync(filePath);
      try {
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text || '';
      } catch (err) {
        throw new Error(`Failed to parse PDF document: ${err.message}`);
      }
      break;
    }

    case 'docx': {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value || '';
      } catch (err) {
        throw new Error(`Failed to parse DOCX document: ${err.message}`);
      }
      break;
    }

    case 'txt': {
      try {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        throw new Error(`Failed to read TXT file: ${err.message}`);
      }
      break;
    }

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Clean and normalize extracted text
  const cleanedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .trim();

  if (!cleanedText || cleanedText.length < 20) {
    throw new Error('Could not extract meaningful text. The document may be scanned, image-only, or encrypted.');
  }

  return cleanedText;
};

/**
 * Intelligent syllabus parser:
 * Identifies units, chapters, topics, and learning objectives from extracted text
 */
const parseSyllabusStructure = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const units = [];

  // Patterns for unit headers e.g. "UNIT I", "Unit 1", "MODULE 1", "CHAPTER 1", "SECTION 1"
  const unitRegex = /^(?:unit|module|chapter|section)\s*[-:]?\s*([0-9]+|[ivxlcdm]+)\s*[-:–]?\s*(.*)$/i;

  let currentUnit = null;
  let unitIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(unitRegex);

    if (match) {
      if (currentUnit) {
        units.push(finalizeUnit(currentUnit));
      }

      const parsedNum = parseRomanOrDecimal(match[1]) || unitIndex;
      const title = match[2] && match[2].trim().length > 0 ? match[2].trim() : `Unit ${parsedNum}`;

      currentUnit = {
        unitNumber: parsedNum,
        title: title,
        topics: [],
        learningObjectives: [],
        contentLines: [],
      };
      unitIndex++;
    } else if (currentUnit) {
      currentUnit.contentLines.push(line);
    }
  }

  if (currentUnit) {
    units.push(finalizeUnit(currentUnit));
  }

  // Fallback: If no explicit Unit headers were found, divide content into logical units based on headers/paragraphs
  if (units.length === 0) {
    const chunkCount = Math.min(5, Math.max(2, Math.ceil(lines.length / 25)));
    const linesPerChunk = Math.ceil(lines.length / chunkCount);

    for (let c = 0; c < chunkCount; c++) {
      const chunkLines = lines.slice(c * linesPerChunk, (c + 1) * linesPerChunk);
      if (chunkLines.length === 0) continue;

      const firstLine = chunkLines[0];
      const title = firstLine.length < 80 ? firstLine : `Module ${c + 1}: Foundational Concepts`;

      const unitObj = {
        unitNumber: c + 1,
        title: title,
        topics: [],
        learningObjectives: [],
        contentLines: chunkLines,
      };
      units.push(finalizeUnit(unitObj));
    }
  }

  return units;
};

const parseRomanOrDecimal = (str) => {
  const num = parseInt(str, 10);
  if (!isNaN(num)) return num;

  const romanMap = { i: 1, v: 5, x: 10, l: 50, c: 100 };
  const s = str.toLowerCase();
  let val = 0;
  for (let i = 0; i < s.length; i++) {
    const current = romanMap[s[i]] || 0;
    const next = romanMap[s[i + 1]] || 0;
    if (current < next) {
      val -= current;
    } else {
      val += current;
    }
  }
  return val > 0 ? val : null;
};

const finalizeUnit = (unit) => {
  const text = unit.contentLines.join(' ');
  const topics = [];
  const objectives = [];

  // Extract topics using bullet points, semicolons, commas, or numbering
  const topicDelimiters = /(?:[•\-–*]\s*|\d+\.\s*|;\s*)/g;
  const rawSegments = unit.contentLines.join('\n').split(topicDelimiters);

  for (const seg of rawSegments) {
    const cleaned = seg.trim().replace(/^[:,\-–]\s*/, '').replace(/[.;]$/, '');
    if (cleaned.length >= 4 && cleaned.length <= 120 && !cleaned.toLowerCase().startsWith('learning objective')) {
      if (!topics.includes(cleaned)) {
        topics.push(cleaned);
      }
    }
  }

  // Extract learning objectives if present
  for (const line of unit.contentLines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('objective') ||
      lower.includes('able to') ||
      lower.includes('understand') ||
      lower.includes('analyze')
    ) {
      objectives.push(line.replace(/^[•\-–*]\s*/, '').trim());
    }
  }

  // If topics list is small, synthesize from lines
  if (topics.length === 0) {
    unit.contentLines.slice(0, 5).forEach((line) => {
      if (line.length > 5 && line.length < 80) topics.push(line);
    });
  }

  return {
    unitNumber: unit.unitNumber,
    title: unit.title,
    topics: topics.slice(0, 15),
    learningObjectives: objectives.slice(0, 6),
    rawContent: text.substring(0, 4000),
  };
};

module.exports = {
  extractTextFromFile,
  parseSyllabusStructure,
};
