import { describe, it, expect } from "vitest";
import { validateUploadedFile, MAX_FILE_SIZE_BYTES } from "./file-validation";

function makeFile(content: BlobPart[], name: string, type: string): File {
  return new File(content, name, { type });
}

describe("validateUploadedFile", () => {
  it("accepts a well-formed CSV", async () => {
    const file = makeFile(["a,b,c\n1,2,3\n"], "data.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(true);
  });

  it("rejects an empty file", async () => {
    const file = makeFile([], "empty.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("FILE_EMPTY");
  });

  it("rejects a file over the size limit", async () => {
    const big = "a".repeat(MAX_FILE_SIZE_BYTES + 1);
    const file = makeFile([big], "big.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("FILE_TOO_LARGE");
  });

  it("accepts a file exactly at the size boundary", async () => {
    const exact = "a,b\n".repeat(Math.floor(MAX_FILE_SIZE_BYTES / 4));
    const file = makeFile([exact], "boundary.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(true);
  });

  it("rejects a renamed binary file (PDF renamed to .csv)", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const file = makeFile([pdfBytes], "renamed.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(["INVALID_ENCODING", "STRUCTURAL_MISMATCH"]).toContain(result.error.code);
  });

  it("rejects invalid UTF-8 encoding", async () => {
    const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0x00, 0x01, 0x02]);
    const file = makeFile([invalidUtf8], "bad-encoding.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("INVALID_ENCODING");
  });

  it("rejects malformed JSON", async () => {
    const file = makeFile(["{ invalid json"], "data.json", "application/json");
    const result = await validateUploadedFile(file, { allowedTypes: ["application/json"], structuralKind: "json" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("STRUCTURAL_MISMATCH");
  });

  it("rejects CSV with inconsistent column counts", async () => {
    const file = makeFile(["a,b,c\n1,2\n"], "ragged.csv", "text/csv");
    const result = await validateUploadedFile(file, { allowedTypes: ["text/csv"], structuralKind: "csv" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error.code).toBe("STRUCTURAL_MISMATCH");
  });
});