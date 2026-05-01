import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { DocEntry } from "@/types/doc-entry";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "documents.json");
    
    try {
      const data = await readFile(filePath, "utf-8");
      const entries = JSON.parse(data) as DocEntry[];
      return NextResponse.json(entries);
    } catch (err) {
      // File doesn't exist yet, return empty array
      return NextResponse.json([]);
    }
  } catch (err: any) {
    console.error("Get docs error:", err);
    return NextResponse.json(
      { error: String(err.message) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const entries: DocEntry[] = await req.json();

    // Validate shape: must be array of DocEntry with required fields
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "Expected array of DocEntry" }, { status: 400 });
    }

    if (!entries.every((e) => e.id && e.title && e.text)) {
      return NextResponse.json(
        { error: "Each entry must have id, title, and text" },
        { status: 400 }
      );
    }

    // Write to data/documents.json
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "documents.json");

    await writeFile(filePath, JSON.stringify(entries, null, 2));

    return NextResponse.json({
      ok: true,
      count: entries.length,
      message: `Uploaded ${entries.length} documents`,
    });
  } catch (err: any) {
    console.error("Upload docs error:", err);
    return NextResponse.json(
      { error: String(err.message) },
      { status: 500 }
    );
  }
}
