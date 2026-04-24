import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function getExtension(file: File): string {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";

  const fileName = file.name.toLowerCase();
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: 'Field "file" is required.' } },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Only image files are allowed." } },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Image is too large. Max size is 8MB.",
          },
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = getExtension(file);
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, fileName);

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filePath, buffer);

    return NextResponse.json({ data: { url: `/uploads/${fileName}` } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to upload image." } },
      { status: 500 },
    );
  }
}
