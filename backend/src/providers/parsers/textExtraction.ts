import mammoth from "mammoth";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return { text: result.text, pageCount: result.total };
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value };
  }

  if (mimeType === "text/plain") {
    return { text: buffer.toString("utf-8") };
  }

  throw new Error(`Unsupported MIME type for extraction: ${mimeType}`);
}
