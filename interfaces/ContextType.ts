// interfaces/ContextType.ts

import { PdfEntryType } from './PdfEntryType';
import actionTypes from './actionTypes';

export interface IContextState {
  pdf: PdfEntryType;
}

export interface IContextAction {
  setPdfEntries: (entries: import('@/types/doc-entry').DocEntry[]) => void;
  setPdfLoading: (loading: boolean) => void;
  setPdfError: (error: string | null) => void;
  clearPdfEntries: () => void;
  fetchPdfFromApi: () => Promise<void>;
}

export type PdfAction =
  | { type: typeof actionTypes.SET_PDF_LOADING }
  | { type: typeof actionTypes.SET_PDF_ENTRIES; payload: { entries: import('@/types/doc-entry').DocEntry[] } }
  | { type: typeof actionTypes.SET_PDF_ERROR; payload: { error: string } }
  | { type: typeof actionTypes.CLEAR_PDF_ENTRIES };

export type ContextAction = PdfAction;