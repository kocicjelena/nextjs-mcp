// reducers/pdfReducer.ts

import actionTypes from '../interfaces/actionTypes';
import { PdfAction } from '../interfaces/ContextType';
import { PdfEntryType, initialPdfEntry } from '../interfaces/PdfEntryType';

interface State {
  pdf: PdfEntryType;
}

export const pdfReducer = (state: State, action: PdfAction): State => {
  switch (action.type) {
    case actionTypes.SET_PDF_LOADING:
      return { ...state, pdf: { ...state.pdf, isLoading: true, error: null } };
    case actionTypes.SET_PDF_ENTRIES:
      return { ...state, pdf: { ...state.pdf, entries: action.payload?.entries ?? [], isLoading: false, error: null } };
    case actionTypes.SET_PDF_ERROR:
      return { ...state, pdf: { ...state.pdf, isLoading: false, error: action.payload?.error ?? 'Unknown error' } };
    case actionTypes.CLEAR_PDF_ENTRIES:
      return { ...state, pdf: { ...initialPdfEntry } };
    default:
      return state;
  }
};

export const initialState = { pdf: initialPdfEntry };