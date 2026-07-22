import mammoth from "mammoth";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

/**
 * Thrown for extraction failures that will never succeed on retry
 * (wrong password, corrupted/malformed file, unsupported format).
 * The caller should mark the document failed and NOT let BullMQ retry.
 */
export class PermanentExtractionError extends Error {}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    const { PDFParse, PasswordException, InvalidPDFException } =
      await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return { text: result.text, pageCount: result.total };
    } catch (err) {
      if (err instanceof PasswordException) {
        throw new PermanentExtractionError(
          "This PDF is password-protected. Please remove password protection and re-upload.",
        );
      }
      if (err instanceof InvalidPDFException) {
        throw new PermanentExtractionError(
          "This file could not be read as a valid PDF. It may be corrupted.",
        );
      }
      throw err;
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    } catch {
      throw new PermanentExtractionError(
        "This file could not be read as a valid Word document. It may be corrupted.",
      );
    }
  }

  if (mimeType === "text/plain") {
    return { text: buffer.toString("utf-8") };
  }

  throw new PermanentExtractionError(
    `Unsupported MIME type for extraction: ${mimeType}`,
  );
}
