//import { readFile } from "fs/promises";
import { readFile } from "node:fs/promises";
import path from "path";
import { DocEntry } from "@/types/doc-entry";

export async function loadDocs(): Promise<DocEntry[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "documents.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as DocEntry[];
  } catch (err) {
    // If no data file exists yet, return an empty array so the server still starts
    return [];
  }
}
