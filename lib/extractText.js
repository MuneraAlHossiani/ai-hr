import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_CV_LENGTH = 6000;

export async function extractTextFromFile(buffer, filename) {
  const lower = filename.toLowerCase();

  let text;
  if (lower.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = result.text;
  } else if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error("Unsupported file type. Only .pdf and .docx are accepted.");
  }

  text = (text || "").trim();
  if (text.length > MAX_CV_LENGTH) {
    text = text.slice(0, MAX_CV_LENGTH);
  }
  return text;
}

export function guessNameFromText(text, fallbackFileName) {
  const firstLine = (text || "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  const looksLikeName =
    firstLine &&
    firstLine.length < 60 &&
    /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){1,3}$/.test(firstLine);

  if (looksLikeName) {
    return firstLine;
  }

  return fallbackFileName.replace(/\.(pdf|docx)$/i, "");
}
