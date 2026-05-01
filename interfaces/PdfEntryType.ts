// interfaces/PdfEntryType.ts

import { DocEntry } from '@/types/doc-entry';

export interface PdfEntryType {
  entries: DocEntry[];
  isLoading: boolean;
  error: string | null;
}

export const initialPdfEntry: PdfEntryType = {
  entries: [],
  isLoading: false,
  error: null,
};