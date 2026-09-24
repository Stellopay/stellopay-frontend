// utils/file-validation.ts
//
// Validates a File by content and size *before* it is handed to a parser.
// Every check returns a specific failure reason so the UI can tell the
// user exactly what went wrong.

export type FileValidationErrorCode =
  | "FILE_TOO_LARGE"
  | "FILE_EMPTY"
  | "UNSUPPORTED_TYPE"
  | "INVALID_ENCODING"
  | "STRUCTURAL_MISMATCH";

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
}

export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: FileValidationError };

// --- Config -----------------------------------------------------------

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB, adjust to your product limit

// Magic-byte signatures for the file types this import flow actually supports.
// Extend this map as you add supported types. Do NOT trust file.type or the
// filename extension — both are attacker/user controlled.
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "text/csv": [], // CSV has no magic bytes; validated structurally instead
  "application/json": [], // same — validated structurally
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
};

// --- Step 1: size ------------------------------------------------------

function checkSize(file: File): FileValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: { code: "FILE_EMPTY", message: "The file is empty." },
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
      },
    };
  }
  return { valid: true };
}

// --- Step 2: content sniffing (renamed-file protection) ---------------

async function readHeaderBytes(file: File, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

function matchesSignature(header: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, i) => header[offset + i] === byte);
}

async function checkContentType(
  file: File,
  allowedTypes: string[]
): Promise<FileValidationResult> {
  const header = await readHeaderBytes(file);

  for (const type of allowedTypes) {
    const signatures = MAGIC_BYTES[type];
    if (!signatures) continue;

    // Types with no binary signature (CSV/JSON) are accepted here and
    // caught later by structural validation instead.
    if (signatures.length === 0) return { valid: true };

    const matches = signatures.some((sig) => matchesSignature(header, sig.bytes, sig.offset));
    if (matches) return { valid: true };
  }

  return {
    valid: false,
    error: {
      code: "UNSUPPORTED_TYPE",
      message: "This file's content doesn't match a supported file type.",
    },
  };
}

// --- Step 3: encoding ---------------------------------------------------

async function checkEncoding(file: File): Promise<FileValidationResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Reject files containing a NUL byte early — a strong signal of a binary
  // file masquerading as text, and something TextDecoder won't flag.
  if (bytes.includes(0)) {
    return {
      valid: false,
      error: { code: "INVALID_ENCODING", message: "File contains binary data, not valid text." },
    };
  }

  try {
    // fatal: true makes TextDecoder throw on invalid UTF-8 sequences
    // instead of silently inserting replacement characters.
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: { code: "INVALID_ENCODING", message: "File is not valid UTF-8 text." },
    };
  }
}

// --- Step 4: structural check --------------------------------------------

async function checkStructure(file: File, kind: "csv" | "json"): Promise<FileValidationResult> {
  const text = await file.text();

  if (kind === "json") {
    try {
      JSON.parse(text);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: { code: "STRUCTURAL_MISMATCH", message: "File is not valid JSON." },
      };
    }
  }

  // Minimal CSV structural check: at least a header row + one data row,
  // and a consistent column count. Swap for Papa.parse's own error list
  // if the project already depends on papaparse.
  const lines = text.split(/\r\n|\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      valid: false,
      error: { code: "STRUCTURAL_MISMATCH", message: "CSV needs a header row and at least one data row." },
    };
  }
  const columnCount = lines[0].split(",").length;
  const inconsistent = lines.some((line) => line.split(",").length !== columnCount);
  if (inconsistent) {
    return {
      valid: false,
      error: { code: "STRUCTURAL_MISMATCH", message: "CSV rows have inconsistent column counts." },
    };
  }
  return { valid: true };
}

// --- Orchestrator --------------------------------------------------------

export async function validateUploadedFile(
  file: File,
  options: { allowedTypes: string[]; structuralKind: "csv" | "json" }
): Promise<FileValidationResult> {
  const sizeResult = checkSize(file);
  if (!sizeResult.valid) return sizeResult;

  const typeResult = await checkContentType(file, options.allowedTypes);
  if (!typeResult.valid) return typeResult;

  const encodingResult = await checkEncoding(file);
  if (!encodingResult.valid) return encodingResult;

  const structureResult = await checkStructure(file, options.structuralKind);
  if (!structureResult.valid) return structureResult;

  return { valid: true };
}