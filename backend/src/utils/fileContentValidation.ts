import { ValidationError } from "./errors";

/**
 * MIME types where file-type can reliably detect a real binary signature.
 * PDF and DOCX both have distinct magic bytes / internal structure.
 */
const SNIFFABLE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Validates that a file's actual content matches its declared MIME type,
 * rather than trusting the client-supplied (and trivially spoofable)
 * multer mimetype header.
 *
 * PDF/DOCX: file-type must detect a matching signature.
 * text/plain: has no magic bytes by definition, so file-type returning
 * undefined is expected and correct. We instead reject if file-type DOES
 * detect a known binary signature (a disguised file), or if the buffer
 * contains null bytes (a standard binary-vs-text heuristic).
 *
 * Throws ValidationError (never succeeds on retry) if content does not
 * match the declared type.
 */
export async function validateFileContent(
  buffer: Buffer,
  declaredMimeType: string,
): Promise<void> {
  const { fileTypeFromBuffer } = await import("file-type");
  const sniffed = await fileTypeFromBuffer(buffer);

  if (SNIFFABLE_MIME_TYPES.has(declaredMimeType)) {
    if (!sniffed || sniffed.mime !== declaredMimeType) {
      throw new ValidationError(
        `File content does not match the declared type (${declaredMimeType}). ` +
          "The file may be corrupted, or its extension may not match its actual content.",
      );
    }
    return;
  }

  if (declaredMimeType === "text/plain") {
    if (sniffed) {
      throw new ValidationError(
        "File content does not match the declared type (text/plain). " +
          "The file appears to be a different, possibly disguised, file type.",
      );
    }
    if (buffer.includes(0)) {
      throw new ValidationError(
        "File content does not appear to be valid plain text.",
      );
    }
    return;
  }

  // Multer's MIME allowlist should prevent reaching here, but fail safe
  // rather than silently accepting an unrecognized declared type.
  throw new ValidationError(`Unsupported MIME type: ${declaredMimeType}`);
}
